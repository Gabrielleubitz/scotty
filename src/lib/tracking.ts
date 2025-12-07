// User tracking service for embed widget
import { apiService } from './api';

export interface VisitorData {
  userId: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  language: string;
  filter?: string;
  firstSeen: string;
  lastSeen: string;
  ip?: string;
  browser: string;
  os: string;
  city?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  domain: string;
  userAgent: string;
  referrer: string;
  sessionId: string;
}

export interface PostView {
  postId: string;
  userId: string;
  domain: string;
  timestamp: string;
  timeSpent?: number;
}

class TrackingService {
  private userId: string;
  private sessionId: string;
  private domain: string;
  private startTime: number;

  constructor() {
    this.domain = window.location.hostname;
    this.sessionId = this.generateSessionId();
    this.userId = this.getOrCreateUserId();
    this.startTime = Date.now();
    
    // Track initial visit
    this.trackVisitor();
    
    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.updateLastSeen();
    });
  }

  private generateSessionId(): string {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('productflow_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('productflow_user_id', userId);
    }
    return userId;
  }

  private getBrowserInfo(): { browser: string; os: string } {
    const userAgent = navigator.userAgent;
    
    // Detect browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    // Detect OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'Mac OS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { browser, os };
  }

  private getLanguage(): string {
    return navigator.language || navigator.languages?.[0] || 'EN';
  }

  private async getLocationData(): Promise<{ city?: string; country?: string; latitude?: string; longitude?: string; ip?: string }> {
    try {
      // Using a free IP geolocation service with fallback
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      // Validate the response
      if (data.error) {
        console.warn('IP geolocation error:', data.error);
        return {};
      }
      
      return {
        city: data.city,
        country: data.country_name,
        latitude: data.latitude?.toString(),
        longitude: data.longitude?.toString(),
        ip: data.ip
      };
    } catch (error) {
      console.warn('Could not fetch location data:', error);
      // Fallback to basic browser language detection
      const language = navigator.language || 'en-US';
      const countryCode = language.split('-')[1];
      const countryMap: { [key: string]: string } = {
        'US': 'United States',
        'GB': 'United Kingdom', 
        'CA': 'Canada',
        'AU': 'Australia',
        'DE': 'Germany',
        'FR': 'France',
        'JP': 'Japan',
        'BR': 'Brazil',
        'IN': 'India'
      };
      
      return {
        country: countryMap[countryCode] || 'Unknown'
      };
    }
  }

  async trackVisitor(): Promise<void> {
    const { browser, os } = this.getBrowserInfo();
    const locationData = await this.getLocationData();
    const now = new Date().toISOString();
    
    // Check if this is a returning visitor
    const firstSeen = localStorage.getItem('productflow_first_seen') || now;
    if (!localStorage.getItem('productflow_first_seen')) {
      localStorage.setItem('productflow_first_seen', now);
    }

    const visitorData: VisitorData = {
      userId: this.userId,
      language: this.getLanguage(),
      firstSeen,
      lastSeen: now,
      browser,
      os,
      domain: this.domain,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      sessionId: this.sessionId,
      ...locationData
    };

    // Send to your analytics endpoint
    this.sendTrackingData('visitor', visitorData);
  }

  trackPostView(postId: string, timeSpent?: number): void {
    const postView: PostView = {
      postId,
      userId: this.userId,
      domain: this.domain,
      timestamp: new Date().toISOString(),
      timeSpent
    };

    this.sendTrackingData('post_view', postView);
  }

  trackWidgetOpen(): void {
    this.sendTrackingData('widget_open', {
      userId: this.userId,
      domain: this.domain,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    });
  }

  trackWidgetClose(timeSpent: number): void {
    this.sendTrackingData('widget_close', {
      userId: this.userId,
      domain: this.domain,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      timeSpent
    });
  }

  trackChatMessage(message: string, isUser: boolean): void {
    this.sendTrackingData('chat_message', {
      userId: this.userId,
      domain: this.domain,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      message: message.substring(0, 100), // Truncate for privacy
      isUser: isUser,
    });
  }

  private updateLastSeen(): void {
    const now = new Date().toISOString();
    this.sendTrackingData('visitor_update', {
      userId: this.userId,
      lastSeen: now,
      sessionDuration: Date.now() - this.startTime
    });
  }

  private async sendTrackingData(eventType: string, data: any): Promise<void> {
    try {
      if (eventType === 'visitor' || eventType === 'visitor_update') {
        await apiService.trackVisitor(data);
      } else if (eventType === 'post_view') {
        await apiService.trackPostView(data);
      } else if (eventType === 'widget_open' || eventType === 'widget_close' || eventType === 'chat_message') {
        await apiService.trackWidgetEvent({
          ...data,
          eventType
        });
      }
      
      console.log('✅ Tracking data sent successfully:', eventType, data);
    } catch (error) {
      console.warn('⚠️ Could not send tracking data:', error);
      
      // Fallback: try direct API call
      try {
        const response = await fetch(`${window.location.origin}/api/track-view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType,
            data,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          console.warn('Tracking request failed:', response.status);
        }
      } catch (fallbackError) {
        console.warn('Fallback tracking also failed:', fallbackError);
      }
    }
  }

  // Public method to identify users (for when they sign in)
  identifyUser(email: string, firstName?: string, lastName?: string): void {
    const userData = {
      userId: this.userId,
      userEmail: email,
      userFirstName: firstName,
      userLastName: lastName,
      domain: this.domain,
      timestamp: new Date().toISOString()
    };

    this.sendTrackingData('user_identify', userData);
  }
}

export const trackingService = new TrackingService();