import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  query, 
  increment,
  getDoc,
  setDoc,
  where,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { ChangelogPost, ChatMessage, Analytics, AIAgentConfig, ChatResponse, LanguageSettings, Segment, User } from '../types';
import { DEFAULT_LANGUAGE_SETTINGS } from './languages';
import { FirestoreRetryUtil, FirestoreRateLimit, FirestoreBatchUtil } from './firestore-utils';
import { isFeatureEnabledForTeam, FeatureKey } from './features';
import { featureOverrideService } from './feature-overrides';
import { teamService } from './teams';

/**
 * Get current teamId from localStorage
 * This is a helper to get the team context in API calls
 */
function getCurrentTeamId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('currentTeamId');
}

/**
 * Get current user document from Firestore
 * Used for checking god role and other user-specific permissions
 */
async function getCurrentUserDoc(): Promise<User | null> {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: userData.name || firebaseUser.displayName || 'User',
      displayName: userData.displayName || userData.name || firebaseUser.displayName || 'User',
      avatarUrl: firebaseUser.photoURL || userData.avatarUrl || undefined,
      role: userData.role || 'user',
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    } as User;
  } catch (error) {
    console.error('Error fetching current user document:', error);
    return null;
  }
}

/**
 * Assert that teamId is available, throw if not
 */
function requireTeamId(): string {
  const teamId = getCurrentTeamId();
  if (!teamId) {
    throw new Error('No team context available. Please select a team.');
  }
  return teamId;
}

export const apiService = {
  // Changelog API
  async getChangelogPosts(teamId?: string): Promise<ChangelogPost[]> {
    try {
      if (!FirestoreRateLimit.canPerformOperation('getChangelogPosts')) {
        console.warn('Rate limit reached for getChangelogPosts, using cached data if available');
        return [];
      }

      const currentTeamId = teamId || getCurrentTeamId();
      if (!currentTeamId) {
        return []; // No team context, return empty
      }

      // Get current domain for filtering
      const currentDomain = window.location.hostname;
      
      const allPosts = await FirestoreRetryUtil.withRetry(async () => {
        const changelogRef = collection(db, 'changelog');
        // Filter by teamId and order by createdAt
        const q = query(
          changelogRef,
          where('teamId', '==', currentTeamId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const now = new Date();
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Auto-publish scheduled posts that are due
          if (data.status === 'scheduled' && data.scheduledFor && data.scheduledFor.toDate() <= now) {
            // Update status to published in background (non-blocking)
            this.publishScheduledPost(doc.id).catch(error => 
              console.error('Failed to auto-publish scheduled post:', error)
            );
            data.status = 'published';
            data.publishedAt = data.scheduledFor;
          }
          
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            translations: data.translations || {},
            videoUrl: data.videoUrl,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            publishedAt: data.publishedAt?.toDate(),
            scheduledFor: data.scheduledFor?.toDate(),
            status: data.status || 'published',
            views: data.views || 0,
            segmentId: data.segmentId,
            teamId: data.teamId || currentTeamId,
          };
        }).filter(post => {
          // Filter for published posts or scheduled posts that are ready (in JavaScript to avoid index)
          const isPublished = post.status === 'published';
          const isScheduledAndReady = post.status === 'scheduled' && post.scheduledFor && post.scheduledFor <= now;
          
          return isPublished || isScheduledAndReady;
        });
      });
      
      // Filter posts by domain segment with retry logic
      const filteredPosts = await FirestoreRetryUtil.withRetry(async () => {
        return await this.filterPostsByDomain(allPosts, currentDomain);
      });
      
      FirestoreRateLimit.recordOperation('getChangelogPosts');
      return filteredPosts;
    } catch (error) {
      console.error('Error fetching changelogs:', error);
      
      // If it's a permissions error, return empty array instead of throwing
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.warn('Firestore permissions not configured. Returning empty changelog.');
        return [];
      }
      
      // For other errors, still throw
      throw error;
    }
  },

  // Helper method to publish scheduled posts
  async publishScheduledPost(postId: string): Promise<void> {
    try {
      const docRef = doc(db, 'changelog', postId);
      await updateDoc(docRef, {
        status: 'published',
        publishedAt: Timestamp.fromDate(new Date()),
        scheduledFor: null,
      });
    } catch (error) {
      console.error('Failed to publish scheduled post:', error);
    }
  },

  // Helper method to filter posts by domain
  async filterPostsByDomain(posts: ChangelogPost[], currentDomain: string): Promise<ChangelogPost[]> {
    try {
      if (!posts || posts.length === 0) {
        return [];
      }

      // Get all segments
      const segments = await this.getSegments();
      
      if (!segments || segments.length === 0) {
        // No segments configured, return all posts
        return posts;
      }

      // Find segment for current domain
      const currentSegment = segments.find(segment => 
        segment && segment.domain && (
          segment.domain === currentDomain || 
          segment.domain === `www.${currentDomain}` ||
          `www.${segment.domain}` === currentDomain
        )
      );
      
      // If no segment found for this domain, show all posts without segments
      if (!currentSegment) {
        return posts.filter(post => !post.segmentId || post.segmentId === null || post.segmentId === undefined);
      }
      
      // Show posts for this segment + posts without segments
      return posts.filter(post => 
        !post.segmentId || 
        post.segmentId === null || 
        post.segmentId === undefined || 
        post.segmentId === currentSegment.id
      );
    } catch (error) {
      console.error('Error filtering posts by domain:', error);
      // On error, return all posts
      return posts;
    }
  },

  // Get all posts including drafts and scheduled (for admin)
  async getAllChangelogPosts(teamId?: string): Promise<ChangelogPost[]> {
    try {
      if (!FirestoreRateLimit.canPerformOperation('getAllChangelogPosts')) {
        console.warn('Rate limit reached for getAllChangelogPosts');
        return [];
      }

      const currentTeamId = teamId || requireTeamId();

      const posts = await FirestoreRetryUtil.withRetry(async () => {
        const changelogRef = collection(db, 'changelog');
        const q = query(
          changelogRef,
          where('teamId', '==', currentTeamId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            translations: data.translations || {},
            videoUrl: data.videoUrl,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            publishedAt: data.publishedAt?.toDate(),
            scheduledFor: data.scheduledFor?.toDate(),
            status: data.status || 'published',
            views: data.views || 0,
            segmentId: data.segmentId,
            teamId: data.teamId || currentTeamId,
          };
        });
      });

      FirestoreRateLimit.recordOperation('getAllChangelogPosts');
      return posts;
    } catch (error) {
      console.error('Error fetching all posts:', error);
      throw error;
    }
  },

  async createChangelogPost(post: Omit<ChangelogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>, teamId?: string): Promise<ChangelogPost> {
    const currentTeamId = teamId || requireTeamId();
    const now = new Date();
    
    const newPost = await FirestoreRetryUtil.withRetry(async () => {
      // Determine status and publish time
      let status = post.status || 'published';
      let publishedAt = null;
      let scheduledFor = null;
      
      if (post.scheduledFor && post.scheduledFor > now) {
        status = 'scheduled';
        scheduledFor = Timestamp.fromDate(post.scheduledFor);
      } else {
        status = 'published';
        publishedAt = Timestamp.fromDate(now);
      }
      
      const postData: any = {
        title: post.title,
        content: post.content,
        translations: post.translations || {},
        status,
        teamId: currentTeamId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        views: 0,
      };
      
      // Only include optional fields if they exist (Firestore doesn't allow undefined)
      if (post.videoUrl) {
        postData.videoUrl = post.videoUrl;
      }
      if (post.imageUrl) {
        postData.imageUrl = post.imageUrl;
      }
      if (post.segmentId) {
        postData.segmentId = post.segmentId;
      }
      if (post.category) {
        postData.category = post.category;
      }
      if (publishedAt) {
        postData.publishedAt = publishedAt;
      }
      if (scheduledFor) {
        postData.scheduledFor = scheduledFor;
      }
      
      const docRef = await addDoc(collection(db, 'changelog'), postData);

      return {
        id: docRef.id,
        title: post.title,
        content: post.content,
        translations: post.translations || {},
        videoUrl: post.videoUrl,
        imageUrl: post.imageUrl,
        status,
        publishedAt: publishedAt?.toDate(),
        scheduledFor: scheduledFor?.toDate(),
        createdAt: now,
        updatedAt: now,
        views: 0,
        segmentId: post.segmentId,
        teamId: currentTeamId,
      };
    });

    return newPost;
  },

  async updateChangelogPost(id: string, updates: Partial<ChangelogPost>, teamId?: string): Promise<ChangelogPost> {
    const currentTeamId = teamId || requireTeamId();
    
    return await FirestoreRetryUtil.withRetry(async () => {
      const docRef = doc(db, 'changelog', id);
      
      // Verify post belongs to team
      const postDoc = await getDoc(docRef);
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      const postData = postDoc.data();
      if (postData.teamId !== currentTeamId) {
        throw new Error('Post does not belong to current team');
      }
      
      const now = new Date();
      
      // Handle status changes for scheduling
      let updateData: any = {
        updatedAt: Timestamp.fromDate(now),
      };
      
      // Only include fields that are actually provided and not undefined
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.translations !== undefined) updateData.translations = updates.translations;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.status !== undefined) updateData.status = updates.status;
      
      // Handle scheduling logic
      if (updates.scheduledFor !== undefined) {
        if (updates.scheduledFor && updates.scheduledFor > now) {
          updateData.status = 'scheduled';
          updateData.scheduledFor = Timestamp.fromDate(updates.scheduledFor);
          updateData.publishedAt = null;
        } else if (updates.scheduledFor === null) {
          updateData.scheduledFor = null;
        } else {
          updateData.status = 'published';
          updateData.publishedAt = Timestamp.fromDate(now);
          updateData.scheduledFor = null;
        }
      } else if (updates.status === 'published' && postData.status !== 'published') {
        updateData.publishedAt = Timestamp.fromDate(now);
        updateData.scheduledFor = null;
      }
      
      // Handle optional fields - only include if they're not undefined
      if (updates.videoUrl !== undefined) {
        updateData.videoUrl = updates.videoUrl || null;
      }
      if (updates.imageUrl !== undefined) {
        updateData.imageUrl = updates.imageUrl || null;
      }
      if (updates.segmentId !== undefined) {
        updateData.segmentId = updates.segmentId || null;
      }
      
      // Convert Date objects to Timestamps for Firestore (if they exist)
      if (updateData.publishedAt && updateData.publishedAt instanceof Date) {
        updateData.publishedAt = Timestamp.fromDate(updateData.publishedAt);
      }
      if (updateData.scheduledFor && updateData.scheduledFor instanceof Date) {
        updateData.scheduledFor = Timestamp.fromDate(updateData.scheduledFor);
      }
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data()!;
      
      return {
        id,
        title: data.title,
        content: data.content,
        translations: data.translations || {},
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        category: data.category || 'NOTIFICATION',
        status: data.status || 'published',
        publishedAt: data.publishedAt?.toDate(),
        scheduledFor: data.scheduledFor?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        views: data.views || 0,
        segmentId: data.segmentId,
        teamId: data.teamId || currentTeamId,
      };
    });
  },

  async deleteChangelogPost(id: string, teamId?: string): Promise<void> {
    const currentTeamId = teamId || requireTeamId();
    
    await FirestoreRetryUtil.withRetry(async () => {
      const docRef = doc(db, 'changelog', id);
      
      // Verify post belongs to team
      const postDoc = await getDoc(docRef);
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      const postData = postDoc.data();
      if (postData.teamId !== currentTeamId) {
        throw new Error('Post does not belong to current team');
      }
      
      await deleteDoc(docRef);
    });
  },

  async incrementPostViews(id: string, incrementBy: number = 1): Promise<void> {
    try {
      if (!FirestoreRateLimit.canPerformOperation('incrementPostViews')) {
        // Queue for batch processing instead
        FirestoreBatchUtil.queueViewIncrement(id, incrementBy);
        return;
      }

      console.log('🔄 Attempting to increment views for post:', id, 'by', incrementBy);
      const docRef = doc(db, 'changelog', id);
      
      await FirestoreRetryUtil.withRetry(async () => {
        // First, get the current document to ensure it exists
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          console.error('❌ Post document does not exist:', id);
          return;
        }
        
        const currentViews = docSnap.data().views || 0;
        console.log('📊 Current views for post:', id, '=', currentViews);
        
        // Update with increment
        await updateDoc(docRef, {
          views: increment(incrementBy)
        });
        
        console.log('✅ Successfully incremented views for post:', id, 'from', currentViews, 'to', currentViews + incrementBy);
      });
      
      FirestoreRateLimit.recordOperation('incrementPostViews');
      
    } catch (error) {
      console.error('❌ Failed to increment views for post:', id, error);
      
      // Queue for batch processing on failure
      FirestoreBatchUtil.queueViewIncrement(id, incrementBy);
    }
  },

  // File upload API
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  async deleteFile(url: string): Promise<void> {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  },

  // Chat API (Enhanced with context)
  async sendChatMessage(message: string, sessionId?: string): Promise<ChatMessage> {
    // Check if AI agent is configured
    const aiConfig = await this.getAIAgentConfig();
    
    if (!aiConfig.enabled || !aiConfig.apiToken) {
      throw new Error('AI agent is not configured. Please configure the AI agent in settings to use the chat feature.');
    }
    
    return this.sendAIAgentMessage(message, sessionId, aiConfig);
  },

  async sendAIAgentMessage(message: string, sessionId: string | undefined, config: AIAgentConfig, teamId?: string): Promise<ChatMessage> {
    try {
      // Get recent changelog posts for context
      const currentTeamId = teamId || getCurrentTeamId();
      const recentPosts = currentTeamId ? await this.getChangelogPosts(currentTeamId) : [];
      const contextData = {
        recent_updates: recentPosts.slice(0, 5).map(post => ({
          title: post.title,
          content: post.content.substring(0, 200),
          date: post.createdAt.toISOString(),
        })),
        domain: window.location.hostname,
        timestamp: new Date().toISOString(),
      };

      const requestBody = {
        message,
        session_id: sessionId,
        stored_values: contextData,
        stream: false,
      };

      // Use our Netlify Edge Function proxy instead of direct API call
      const response = await fetch(`${window.location.origin}/api/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-URL': config.apiUrl, // Send the base URL to the edge function
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('AI agent authentication failed. Please check server configuration.');
        } else if (response.status === 403) {
          throw new Error('AI agent usage limits exceeded.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        } else if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'AI agent server configuration error.');
        }
        throw new Error(`AI agent error: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      
      return {
        id: Date.now().toString(),
        content: data.message || 'I apologize, but I encountered an issue processing your request.',
        // isUser is handled by trackingService.trackChatMessage
        isUser: false,
        timestamp: new Date(),
        sessionId: data.session_id,
      };
    } catch (error) {
      console.error('AI agent error:', error);
      throw new Error(`AI agent connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },


  // AI Agent Configuration
  async getAIAgentConfig(): Promise<AIAgentConfig> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { apiToken: '', apiUrl: '', enabled: false };
      }

      const configDoc = await getDoc(doc(db, 'ai_config', user.uid));
      
      if (configDoc.exists()) {
        return configDoc.data() as AIAgentConfig;
      }
      
      return { apiToken: '', apiUrl: 'https://api.openai.com/v1', enabled: false };
    } catch (error) {
      console.error('Failed to get AI config:', error);
      
      // If it's a permissions error, return empty config instead of throwing
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.warn('Firestore permissions not configured for AI config. Returning default config.');
        return { apiToken: '', apiUrl: '', enabled: false };
      }
      
      // For other errors, still return default config to prevent app crashes
      return { apiToken: '', apiUrl: 'https://api.openai.com/v1', enabled: false };
    }
  },

  async saveAIAgentConfig(config: AIAgentConfig): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to save AI configuration');
    }

    try {
      await setDoc(doc(db, 'ai_config', user.uid), config);
    } catch (error) {
      console.error('Failed to save AI config:', error);
      
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        throw new Error('Unable to save AI configuration. Please check your permissions.');
      }
      
      throw error;
    }
  },

  async testAIAgentConnection(config: AIAgentConfig): Promise<boolean> {
    try {
      console.log('Testing AI connection with config:', { apiUrl: config.apiUrl, hasToken: !!config.apiToken });
      
      const proxyUrl = `${window.location.origin}/api/ai-proxy`;
      console.log('Using proxy URL:', proxyUrl);
      
      const testPayload = {
        message: 'Test connection',
        stream: false,
      };
      
      console.log('Sending test payload:', testPayload);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-URL': config.apiUrl, // Send the base URL to the edge function
        },
        body: JSON.stringify(testPayload),
      });

      console.log('Test response status:', response.status);
      
      if (!response.ok) {
        try {
          const errorText = await response.text();
          console.error('Test response error:', errorText || 'Response body was empty.');
        } catch (textError) {
          console.error('Failed to read error response:', textError);
        }
        return false;
      }

      try {
        const responseData = await response.text();
        console.log('Test response data:', responseData);
      } catch (textError) {
        console.error('Failed to read success response:', textError);
        // Still return true since the response was ok
      }
      
      return response.ok;
    } catch (error) {
      console.error('AI agent connection test failed:', error);
      return false;
    }
  },

  // Analytics API
  async getAnalytics(teamId?: string): Promise<Analytics> {
    try {
      const currentTeamId = teamId || getCurrentTeamId();
      if (!currentTeamId) {
        return {
          totalViews: 0,
          uniqueUsers: 0,
          viewsOverTime: [],
        };
      }

      // Get team's posts first to filter analytics
      const teamPosts = await this.getChangelogPosts(currentTeamId);
      const teamPostIds = new Set(teamPosts.map(p => p.id));

      // Get real analytics from Firebase collections, filtered by team posts
      const [visitorsSnapshot, postViewsSnapshot] = await Promise.all([
        getDocs(collection(db, 'visitors')),
        getDocs(collection(db, 'post_views'))
      ]);

      const visitors = visitorsSnapshot.docs.map(doc => doc.data());
      const postViews = postViewsSnapshot.docs
        .map(doc => doc.data())
        .filter(view => teamPostIds.has(view.postId));

      const totalViews = postViews.length;
      const uniqueUsers = new Set(visitors.map(v => v.userId)).size;

      // Generate real views over time (last 15 days)
      const viewsOverTime = [];
      const now = new Date();
      
      for (let i = 14; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayViews = postViews.filter(view => {
          const viewDate = new Date(view.timestamp?.toDate?.() || view.timestamp);
          return viewDate.toISOString().split('T')[0] === dateStr;
        }).length;
        
        viewsOverTime.push({
          date: dateStr,
          views: dayViews,
        });
      }
      
      return {
        totalViews,
        uniqueUsers,
        viewsOverTime,
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalViews: 0,
        uniqueUsers: 0,
        viewsOverTime: [],
      };
    }
  },

  // Analytics and tracking API
  async trackVisitor(visitorData: any): Promise<void> {
    try {
      const docData = {
        ...visitorData,
        timestamp: Timestamp.fromDate(new Date())
      };
      
      console.log('📊 Tracking visitor:', docData);
      await addDoc(collection(db, 'visitors'), docData);
      console.log('✅ Visitor tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track visitor:', error);
    }
  },

  async trackPostView(postViewData: any): Promise<void> {
    try {
      const docData = {
        ...postViewData,
        timeSpent: postViewData.timeSpent || 0,
        timestamp: Timestamp.fromDate(new Date())
      };
      
      console.log('📊 Tracking post view:', docData);
      await addDoc(collection(db, 'post_views'), docData);
      console.log('✅ Post view tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track post view:', error);
    }
  },

  async trackWidgetEvent(eventData: any): Promise<void> {
    try {
      const docData = {
        ...eventData,
        timestamp: Timestamp.fromDate(new Date())
      };
      
      console.log('📊 Tracking widget event:', docData);
      await addDoc(collection(db, 'widget_events'), docData);
      console.log('✅ Widget event tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track widget event:', error);
    }
  },

  async getVisitorAnalytics(teamId?: string): Promise<any> {
    try {
      const currentTeamId = teamId || getCurrentTeamId();
      if (!currentTeamId) {
        return {
          totalVisitors: 0,
          totalViews: 0,
          topCountries: [],
          topBrowsers: [],
          domainStats: []
        };
      }

      // Check if admin_analytics feature is enabled
      const team = await teamService.getTeam(currentTeamId);
      if (!team) {
        return {
          totalVisitors: 0,
          totalViews: 0,
          domainStats: [],
          recentVisitors: [],
          topCountries: [],
          topBrowsers: []
        };
      }
      const overrides = await featureOverrideService.getTeamOverrides(currentTeamId);
      const currentUser = await getCurrentUserDoc();
      if (!isFeatureEnabledForTeam(team, overrides, 'admin_analytics', currentUser)) {
        // Return empty analytics instead of throwing error
        console.warn(`Admin Analytics feature is not enabled for team ${currentTeamId}. Returning empty analytics.`);
        return {
          totalVisitors: 0,
          totalViews: 0,
          domainStats: [],
          recentVisitors: [],
          topCountries: [],
          topBrowsers: []
        };
      }

      // Get team's posts first to filter analytics
      const teamPosts = await this.getChangelogPosts(currentTeamId);
      const teamPostIds = new Set(teamPosts.map(p => p.id));

      const visitorsRef = collection(db, 'visitors');
      const postViewsRef = collection(db, 'post_views');
      
      const [visitorsSnapshot, viewsSnapshot] = await Promise.all([
        getDocs(visitorsRef),
        getDocs(postViewsRef)
      ]);

      const visitors = visitorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const postViews = viewsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(view => teamPostIds.has(view.postId));

      // Aggregate data by domain
      const domainStats = {};
      visitors.forEach(visitor => {
        const domain = visitor.domain;
        if (!domainStats[domain]) {
          domainStats[domain] = {
            domain,
            uniqueVisitors: 0,
            totalViews: 0,
            countries: new Set(),
            browsers: new Set()
          };
        }
        domainStats[domain].uniqueVisitors++;
        if (visitor.country) domainStats[domain].countries.add(visitor.country);
        if (visitor.browser) domainStats[domain].browsers.add(visitor.browser);
      });

      postViews.forEach(view => {
        const domain = view.domain;
        if (domainStats[domain]) {
          domainStats[domain].totalViews++;
        }
      });

      // Convert sets to arrays for JSON serialization
      Object.values(domainStats).forEach((stats: any) => {
        stats.countries = Array.from(stats.countries);
        stats.browsers = Array.from(stats.browsers);
      });

      return {
        totalVisitors: visitors.length,
        totalViews: postViews.length,
        domainStats: Object.values(domainStats),
        recentVisitors: visitors.slice(-10),
        topCountries: this.getTopCountries(visitors),
        topBrowsers: this.getTopBrowsers(visitors)
      };
    } catch (error) {
      console.error('Failed to get visitor analytics:', error);
      
      // If it's a permissions error, return empty analytics instead of throwing
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.warn('Firestore permissions not configured for analytics. Returning empty analytics.');
        return {
          totalVisitors: 0,
          totalViews: 0,
          domainStats: [],
          recentVisitors: [],
          topCountries: [],
          topBrowsers: []
        };
      }
      
      // For other errors, return empty analytics to prevent app crashes
      return {
        totalVisitors: 0,
        totalViews: 0,
        domainStats: [],
        recentVisitors: [],
        topCountries: [],
        topBrowsers: []
      };
    }
  },

  // Get analytics for a specific post
  async getPostAnalytics(postId: string, teamId?: string): Promise<any> {
    try {
      const currentTeamId = teamId || getCurrentTeamId();
      if (!currentTeamId) {
        throw new Error('Team context required');
      }

      // Check if admin_analytics feature is enabled
      const team = await teamService.getTeam(currentTeamId);
      if (!team) {
        return {
          totalViews: 0,
          uniqueUsers: 0,
          viewsChange: 0,
          uniqueChange: 0,
          timeChange: 0,
          last7Days: [],
          topDomains: [],
          avgTimeSpent: 0
        };
      }
      const overrides = await featureOverrideService.getTeamOverrides(currentTeamId);
      const currentUser = await getCurrentUserDoc();
      if (!isFeatureEnabledForTeam(team, overrides, 'admin_analytics', currentUser)) {
        // Return empty analytics instead of throwing error
        console.warn(`Post Analytics feature is not enabled for team ${team.id}. Returning empty analytics.`);
        return {
          totalViews: 0,
          uniqueUsers: 0,
          viewsChange: 0,
          uniqueChange: 0,
          timeChange: 0,
          last7Days: [],
          topDomains: [],
          avgTimeSpent: 0
        };
      }

      const postViewsRef = collection(db, 'post_views');
      const q = query(postViewsRef, where('postId', '==', postId));
      const querySnapshot = await getDocs(q);
      
      const views = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp || new Date())
      }));
      
      // Calculate metrics
      const totalViews = views.length;
      const uniqueUsers = new Set(views.map(view => view.userId)).size;
      
      // Group views by day for the last 7 days
      const last7Days = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayViews = views.filter(view => {
          const viewDate = view.timestamp.toISOString().split('T')[0];
          return viewDate === dateStr;
        }).length;
        
        last7Days.push({
          date: dateStr,
          views: dayViews
        });
      }
      
      // Calculate real percentage changes based on previous week data
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const previousWeekViews = views.filter(view => 
        view.timestamp >= twoWeeksAgo && view.timestamp < oneWeekAgo
      ).length;
      
      const previousWeekUnique = new Set(
        views.filter(view => 
          view.timestamp >= twoWeeksAgo && view.timestamp < oneWeekAgo
        ).map(view => view.userId)
      ).size;
      
      const currentWeekViews = views.filter(view => 
        view.timestamp >= oneWeekAgo
      ).length;
      
      const currentWeekUnique = new Set(
        views.filter(view => 
          view.timestamp >= oneWeekAgo
        ).map(view => view.userId)
      ).size;
      
      const viewsChange = previousWeekViews > 0 
        ? Math.round(((currentWeekViews - previousWeekViews) / previousWeekViews) * 100)
        : 0;
      
      const uniqueChange = previousWeekUnique > 0 
        ? Math.round(((currentWeekUnique - previousWeekUnique) / previousWeekUnique) * 100)
        : 0;
      
      // Top domains - ONLY from real Firebase data, no fallbacks
      const topDomains = [];
      if (views.length > 0) {
        const domainCounts = {};
        views.forEach(view => {
          // Only count domains that exist, are strings, and are not empty
          if (view.domain && 
              typeof view.domain === 'string' && 
              view.domain.trim() !== '' &&
              !view.domain.includes('example.com') && // Exclude any example domains
              !view.domain.includes('localhost')) {   // Exclude localhost
            domainCounts[view.domain] = (domainCounts[view.domain] || 0) + 1;
          }
        });
        
        // Only create topDomains array if we have real domain data
        if (Object.keys(domainCounts).length > 0) {
          topDomains.push(...Object.entries(domainCounts)
            .map(([domain, count]) => ({ domain, views: count }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5));
        }
      }
      
      // Calculate average time spent (only from views that have timeSpent data)
      const viewsWithTime = views.filter(view => view.timeSpent && view.timeSpent > 0);
      const avgTimeSpent = viewsWithTime.length > 0 
        ? Math.round(viewsWithTime.reduce((sum, view) => sum + view.timeSpent, 0) / viewsWithTime.length)
        : 0;
      
      // Calculate time change
      const previousWeekTimeViews = views.filter(view => 
        view.timestamp >= twoWeeksAgo && 
        view.timestamp < oneWeekAgo && 
        view.timeSpent && view.timeSpent > 0
      );
      
      const currentWeekTimeViews = views.filter(view => 
        view.timestamp >= oneWeekAgo && 
        view.timeSpent && view.timeSpent > 0
      );
      
      const previousAvgTime = previousWeekTimeViews.length > 0
        ? previousWeekTimeViews.reduce((sum, view) => sum + view.timeSpent, 0) / previousWeekTimeViews.length
        : 0;
      
      const currentAvgTime = currentWeekTimeViews.length > 0
        ? currentWeekTimeViews.reduce((sum, view) => sum + view.timeSpent, 0) / currentWeekTimeViews.length
        : 0;
      
      const timeChange = previousAvgTime > 0 
        ? Math.round(((currentAvgTime - previousAvgTime) / previousAvgTime) * 100)
        : 0;
      
      return {
        totalViews: currentWeekViews,
        uniqueUsers: currentWeekUnique,
        viewsChange,
        uniqueChange,
        timeChange,
        last7Days,
        topDomains,
        avgTimeSpent
      };
    } catch (error) {
      console.error('Failed to get post analytics:', error);
      return {
        totalViews: 0,
        uniqueUsers: 0,
        viewsChange: 0,
        uniqueChange: 0,
        timeChange: 0,
        last7Days: [],
        topDomains: [], // Always empty array on error - NO MOCK DATA
        avgTimeSpent: 0
      };
    }
  },
  getTopCountries(visitors: any[]): any[] {
    const countryCount = {};
    visitors.forEach(visitor => {
      if (visitor.country) {
        countryCount[visitor.country] = (countryCount[visitor.country] || 0) + 1;
      }
    });
    
    return Object.entries(countryCount)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  },

  getTopBrowsers(visitors: any[]): any[] {
    const browserCount = {};
    visitors.forEach(visitor => {
      if (visitor.browser) {
        browserCount[visitor.browser] = (browserCount[visitor.browser] || 0) + 1;
      }
    });
    
    return Object.entries(browserCount)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  },

  // Segments API
  async getSegments(teamId?: string): Promise<Segment[]> {
    try {
      if (!FirestoreRateLimit.canPerformOperation('getSegments')) {
        console.warn('Rate limit reached for getSegments');
        return [];
      }

      const currentTeamId = teamId || requireTeamId();

      const segments = await FirestoreRetryUtil.withRetry(async () => {
        const segmentsRef = collection(db, 'segments');
        const q = query(
          segmentsRef,
          where('teamId', '==', currentTeamId),
          orderBy('name', 'asc')
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            domain: data.domain || '',
            description: data.description || '',
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
            teamId: data.teamId || currentTeamId,
          };
        }).filter(segment => segment.name && segment.domain); // Filter out invalid segments
      });

      FirestoreRateLimit.recordOperation('getSegments');
      return segments;
    } catch (error) {
      console.error('Error fetching segments:', error);
      
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.warn('Firestore permissions not configured for segments. Returning empty segments.');
        return [];
      }
      
      return [];
    }
  },

  async createSegment(segment: Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>, teamId?: string): Promise<Segment> {
    const currentTeamId = teamId || requireTeamId();
    const now = new Date();
    
    const newSegment = await FirestoreRetryUtil.withRetry(async () => {
      const docRef = await addDoc(collection(db, 'segments'), {
        name: segment.name || '',
        domain: segment.domain || '',
        description: segment.description || '',
        teamId: currentTeamId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      return {
        id: docRef.id,
        name: segment.name || '',
        domain: segment.domain || '',
        description: segment.description || '',
        teamId: currentTeamId,
        createdAt: now,
        updatedAt: now,
      };
    });

    return newSegment;
  },

  async updateSegment(id: string, updates: Partial<Segment>, teamId?: string): Promise<Segment> {
    const currentTeamId = teamId || requireTeamId();
    
    return await FirestoreRetryUtil.withRetry(async () => {
      const docRef = doc(db, 'segments', id);
      
      // Verify segment belongs to team
      const segmentDoc = await getDoc(docRef);
      if (!segmentDoc.exists()) {
        throw new Error('Segment not found');
      }
      const segmentData = segmentDoc.data();
      if (segmentData.teamId !== currentTeamId) {
        throw new Error('Segment does not belong to current team');
      }
      
      const now = new Date();
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(now),
      };
      
      // Remove React-specific fields
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.teamId; // Don't allow changing teamId
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data()!;
      
      return {
        id,
        name: data.name || '',
        domain: data.domain || '',
        description: data.description || '',
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
        teamId: data.teamId || currentTeamId,
      };
    });
  },

  async deleteSegment(id: string, teamId?: string): Promise<void> {
    const currentTeamId = teamId || requireTeamId();
    
    await FirestoreRetryUtil.withRetry(async () => {
      const docRef = doc(db, 'segments', id);
      
      // Verify segment belongs to team
      const segmentDoc = await getDoc(docRef);
      if (!segmentDoc.exists()) {
        throw new Error('Segment not found');
      }
      const segmentData = segmentDoc.data();
      if (segmentData.teamId !== currentTeamId) {
        throw new Error('Segment does not belong to current team');
      }
      
      await deleteDoc(docRef);
    });
  },

  // User management
  async getUsers(): Promise<any[]> {
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { role });
  },

  // AI Chat Messages API
  async getAIChatMessages(): Promise<ChatMessage[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('User not authenticated for AI chat messages');
        return [];
      }

      const widgetEventsRef = collection(db, 'widget_events');
      // Simplified query to avoid index requirements - filter and sort in JavaScript
      const q = query(widgetEventsRef, where('eventType', '==', 'chat_message'));
      
      const querySnapshot = await getDocs(q);
      
      const messages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.message || data.data?.message || '',
          isUser: data.isUser !== undefined ? data.isUser : (data.data?.isUser || false),
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || new Date()),
          sessionId: data.sessionId || data.data?.sessionId || 'unknown',
        };
      }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort by timestamp in JavaScript
      
      return messages;
    } catch (error) {
      console.error('Failed to get AI chat messages:', error);
      
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.warn('Firestore permissions not configured for AI chat messages. Returning empty array.');
        return [];
      }
      
      return [];
    }
  },

  // Language Settings API
  async getLanguageSettings(): Promise<LanguageSettings> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return DEFAULT_LANGUAGE_SETTINGS;
      }

      const settingsDoc = await getDoc(doc(db, 'language_settings', user.uid));
      
      if (settingsDoc.exists()) {
        return { ...DEFAULT_LANGUAGE_SETTINGS, ...settingsDoc.data() } as LanguageSettings;
      }
      
      return DEFAULT_LANGUAGE_SETTINGS;
    } catch (error) {
      console.error('Failed to get language settings:', error);
      return DEFAULT_LANGUAGE_SETTINGS;
    }
  },

  async saveLanguageSettings(settings: LanguageSettings): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to save language settings');
    }

    try {
      await setDoc(doc(db, 'language_settings', user.uid), settings);
    } catch (error) {
      console.error('Failed to save language settings:', error);
      throw error;
    }
  },
};

// Set the increment function to avoid circular dependency
FirestoreBatchUtil.setIncrementPostViewsFunction(apiService.incrementPostViews.bind(apiService));