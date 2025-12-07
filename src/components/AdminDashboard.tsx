import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BarChart3, Users, Eye, BookOpen, Code, Globe, Bot, Languages, TrendingUp, Tag, Lock, Settings, HelpCircle, Layout, Bell, Crown } from 'lucide-react';
import { ChangelogPost, Analytics, AIAgentConfig, LanguageSettings, Segment } from '../types';
import { apiService } from '../lib/api';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { isFeatureEnabledForTeam } from '../lib/features';
import { featureOverrideService } from '../lib/feature-overrides';
import { billingService } from '../lib/billing';
import { GodAdminPanel } from './GodAdminPanel';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { FileUpload } from './ui/FileUpload';
import { EmbedCodeGenerator } from './EmbedCodeGenerator';
import { PreviewChangelogWidget } from './PreviewChangelogWidget';
import { AIAgentSettings } from './AIAgentSettings';
import { PostAnalyticsModal } from './PostAnalyticsModal';
import { SegmentManager } from './SegmentManager';
import { formatDate } from '../lib/utils';
import { LanguageSettings as LanguageSettingsModal } from './LanguageSettings';
import { MultiLanguageEditor } from './MultiLanguageEditor';
import { AnalyticsChart } from './AnalyticsChart';
import { AIChatAnalytics } from './AIChatAnalytics';
import { DEFAULT_LANGUAGE_SETTINGS } from '../lib/languages';

export const AdminDashboard: React.FC = () => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [showGodAdmin, setShowGodAdmin] = useState(false);
  const [posts, setPosts] = useState<ChangelogPost[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [visitorAnalytics, setVisitorAnalytics] = useState<any>(null);
  const [featureOverrides, setFeatureOverrides] = useState<any[]>([]);
  const [hasAdminAnalytics, setHasAdminAnalytics] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isPreviewWidgetOpen, setIsPreviewWidgetOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isSegmentManagerOpen, setIsSegmentManagerOpen] = useState(false);
  const [isLanguageSettingsOpen, setIsLanguageSettingsOpen] = useState(false);
  const [isPostAnalyticsOpen, setIsPostAnalyticsOpen] = useState(false);
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState<ChangelogPost | null>(null);
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<ChangelogPost | null>(null);
  const [aiConfig, setAiConfig] = useState<AIAgentConfig>({ apiToken: '', apiUrl: '', enabled: false });
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>(DEFAULT_LANGUAGE_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    translations: {} as { [key: string]: { title: string; content: string; isAIGenerated?: boolean } },
    videoUrl: '',
    imageUrl: '',
    category: 'NOTIFICATION',
    segmentId: null as string | null,
    enableComments: false,
    enableReactions: false,
    openLinksInNewTab: true,
    enableSocialSharing: true,
    pinToTop: false,
    autoOpenWidget: false,
    expirationDate: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (!currentTeam) return;
    
    loadData();
    loadAIConfig();
    loadLanguageSettings();
    loadSegments(); // Load segments on component mount
    loadFeatureOverrides();
    
    // Refresh data every 10 seconds to show updated view counts
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing admin dashboard data...');
      loadData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentTeam]);

  const loadFeatureOverrides = async () => {
    if (!currentTeam) return;
    try {
      const overrides = await featureOverrideService.getTeamOverrides(currentTeam.id);
      setFeatureOverrides(overrides);
      setHasAdminAnalytics(isFeatureEnabledForTeam(currentTeam, overrides, 'admin_analytics', user));
    } catch (error) {
      console.error('Failed to load feature overrides:', error);
    }
  };

  const loadSegments = async () => {
    if (!currentTeam) return;
    
    try {
      const data = await apiService.getSegments(currentTeam.id);
      setSegments(data);
    } catch (error) {
      console.error('Failed to load segments:', error);
      setSegments([]); // Set empty array on error
    }
  };
  const loadData = async () => {
    if (!currentTeam) return;
    
    try {
      setLoading(true);
      const [postsData, analyticsData, visitorData] = await Promise.all([
        apiService.getAllChangelogPosts(currentTeam.id), // Use getAllChangelogPosts for admin to see all posts
        apiService.getAnalytics(currentTeam.id),
        apiService.getVisitorAnalytics(currentTeam.id),
      ]);
      setPosts(postsData);
      setAnalytics(analyticsData);
      setVisitorAnalytics(visitorData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIConfig = async () => {
    try {
      const config = await apiService.getAIAgentConfig();
      setAiConfig(config);
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
  };

  const loadLanguageSettings = async () => {
    try {
      const settings = await apiService.getLanguageSettings();
      setLanguageSettings(settings);
    } catch (error) {
      console.error('Failed to load language settings:', error);
    }
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setFormData({ 
      title: '', 
      content: '', 
      translations: {},
      videoUrl: '', 
      imageUrl: '',
      category: 'NOTIFICATION',
      segmentId: null,
      enableComments: false,
      enableReactions: false,
      openLinksInNewTab: true,
      enableSocialSharing: true,
      pinToTop: false,
      autoOpenWidget: false,
      expirationDate: '',
    });
    setIsModalOpen(true);
  };

  const handleEditPost = (post: ChangelogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      translations: post.translations || {},
      videoUrl: post.videoUrl || '',
      imageUrl: post.imageUrl || '',
      category: post.category || 'NOTIFICATION',
      segmentId: post.segmentId || null,
      enableComments: false,
      enableReactions: false,
      openLinksInNewTab: true,
      enableSocialSharing: true,
      pinToTop: false,
      autoOpenWidget: false,
      expirationDate: '',
    });
    setIsModalOpen(true);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?') || !currentTeam) return;

    try {
      await apiService.deleteChangelogPost(id, currentTeam.id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingFile || !currentTeam) return; // Prevent submission while uploading

    setLoading(true);

    try {
      if (editingPost) {
        const updatedPost = await apiService.updateChangelogPost(editingPost.id, {
          ...formData,
          category: formData.category
        }, currentTeam.id);
        setPosts(posts.map(post => post.id === editingPost.id ? updatedPost : post));
      } else {
        const newPost = await apiService.createChangelogPost({
          ...formData,
          category: formData.category
        }, currentTeam.id);
        setPosts([newPost, ...posts]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    try {
      const fileName = `changelog/${Date.now()}-${file.name}`;
      const downloadURL = await apiService.uploadFile(file, fileName);
      setFormData({ ...formData, imageUrl: downloadURL });
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileRemove = () => {
    setFormData({ ...formData, imageUrl: '' });
  };

  const handlePreviewPost = (postId: string) => {
    setPreviewPostId(postId);
    setIsPreviewWidgetOpen(true);
  };

  const handleViewPostAnalytics = (post: ChangelogPost) => {
    setSelectedPostForAnalytics(post);
    setIsPostAnalyticsOpen(true);
  };
  
  // Show God Admin Panel if user is god and requested
  if (user?.role === 'god' && showGodAdmin) {
    return <GodAdminPanel />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Manage your product updates and track engagement
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* God Admin Button */}
            {user?.role === 'god' && (
              <Button
                variant="outline"
                onClick={() => setShowGodAdmin(true)}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                title="Access God Admin Panel to manage users and teams"
              >
                <Crown size={16} className="mr-2" />
                <span className="hidden sm:inline">God Admin</span>
                <span className="sm:hidden">God</span>
              </Button>
            )}
            {/* Settings Group - Organized with clear labels */}
            <div className="flex flex-wrap gap-2">
              <div className="relative group">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEmbedModalOpen(true)} 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  title="Get the embed code to add the widget to your website"
                >
                  <Code size={16} className="mr-2" />
                  <span className="hidden sm:inline">Widget Code</span>
                  <span className="sm:hidden">Code</span>
                </Button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    Get embed code for your website
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAISettingsOpen(true)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  title="Configure AI assistant for your widget"
                >
                  <Bot size={16} className="mr-2" />
                  <span className="hidden sm:inline">AI Assistant</span>
                  <span className="sm:hidden">AI</span>
                </Button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    Configure AI chat assistant
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <Button 
                  variant="outline" 
                  onClick={() => setIsLanguageSettingsOpen(true)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  title="Set up multi-language support"
                >
                  <Languages size={16} className="mr-2" />
                  <span className="hidden sm:inline">Languages</span>
                  <span className="sm:hidden">Lang</span>
                </Button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    Configure multi-language support
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSegmentManagerOpen(true)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  title="Manage user segments and targeting"
                >
                  <Tag size={16} className="mr-2" />
                  <span className="hidden sm:inline">Segments</span>
                  <span className="sm:hidden">Tags</span>
                </Button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    Manage user segments & targeting
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Primary Action - More prominent */}
            <Button 
              onClick={handleCreatePost} 
              className="bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} className="mr-2" />
              <span className="font-semibold">Create New Update</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-gray-900 rounded-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Content Overview</h2>
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-md">
              <Bot size={16} />
              <span className="text-sm">
                AI Agent: {aiConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Posts</p>
              <p className="text-3xl font-semibold">{posts.length}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Views</p>
              <p className="text-3xl font-semibold">{analytics?.totalViews.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Unique Users</p>
              <p className="text-3xl font-semibold">{analytics?.uniqueUsers.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-gray-700" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Total Views</h3>
                  <p className="text-xl font-semibold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-700" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Unique Users</h3>
                  <p className="text-xl font-semibold text-gray-900">{analytics.uniqueUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-gray-700" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Avg. Daily Views</h3>
                  <p className="text-xl font-semibold text-gray-900">
                    {Math.round(analytics.viewsOverTime.reduce((sum, day) => sum + day.views, 0) / analytics.viewsOverTime.length)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Globe className="h-5 w-5 text-gray-700" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xs font-medium text-gray-500">Domains</h3>
                  <p className="text-xl font-semibold text-gray-900">
                    {visitorAnalytics?.domainStats?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Chart */}
        {analytics && (
          <div className="mb-8">
            <AnalyticsChart 
              data={analytics.viewsOverTime.map(item => ({
                date: item.date,
                views: item.views,
                uniqueViews: Math.round(item.views * 0.7), // Simulate unique views as 70% of total views
              }))}
              totalUniqueViews={analytics.uniqueUsers}
              totalViews={analytics.totalViews}
            />
          </div>
        )}

        {/* Visitor Analytics - Show upgrade prompt if feature not enabled */}
        {!hasAdminAnalytics && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Lock size={20} className="text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Admin Analytics</h3>
                <p className="text-sm text-yellow-800 mb-4">
                  Detailed analytics and reporting are available on the Pro plan. Upgrade to unlock visitor analytics, domain stats, and advanced reporting.
                </p>
                <Button
                  onClick={async () => {
                    if (!currentTeam) return;
                    try {
                      const redirectUrl = await billingService.createCheckoutSession(currentTeam.id, 'pro');
                      window.location.href = redirectUrl;
                    } catch (error) {
                      console.error('Failed to create checkout session:', error);
                      alert('Failed to start checkout. Please try again.');
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Visitor Analytics */}
        {hasAdminAnalytics && visitorAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Domain Stats */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Domain Analytics</h3>
              </div>
              <div className="p-6">
                {visitorAnalytics.domainStats?.length > 0 ? (
                  <div className="space-y-4">
                    {visitorAnalytics.domainStats.slice(0, 5).map((domain: any, index: number) => (
                      <div key={`domain-${domain.domain}-${index}`} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 rounded-lg p-2">
                            <Globe size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{domain.domain}</p>
                            <p className="text-sm text-gray-500">
                              {domain.countries.slice(0, 2).join(', ')}
                              {domain.countries.length > 2 && ` +${domain.countries.length - 2} more`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{domain.uniqueVisitors}</p>
                          <p className="text-sm text-gray-500">{domain.totalViews} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No domain data yet</p>
                )}
              </div>
            </div>

            {/* Top Countries & Browsers */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Visitor Insights</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Top Countries</h4>
                    <div className="space-y-2">
                      {visitorAnalytics.topCountries?.slice(0, 3).map((country: any, idx: number) => (
                        <div key={`country-${country.country}-${idx}`} className="flex justify-between">
                          <span className="text-sm text-gray-600">{country.country}</span>
                          <span className="text-sm font-medium">{country.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Top Browsers</h4>
                    <div className="space-y-2">
                      {visitorAnalytics.topBrowsers?.slice(0, 3).map((browser: any, idx: number) => (
                        <div key={`browser-${browser.browser}-${idx}`} className="flex justify-between">
                          <span className="text-sm text-gray-600">{browser.browser}</span>
                          <span className="text-sm font-medium">{browser.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Analytics */}
        <div className="mb-8">
          <AIChatAnalytics />
        </div>

        {/* Posts Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Published Updates</h2>
              <span className="text-sm text-gray-600">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No updates yet</h3>
                <p className="text-gray-600 mb-4 text-sm">Create your first product update to get started</p>
                <Button 
                  onClick={handleCreatePost}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Plus size={16} className="mr-2" />
                  Create First Update
                </Button>
              </div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500 mt-1">{post.content.replace(/<[^>]*>/g, '').substring(0, 60)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {post.views.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreviewPost(post.id)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="Preview in widget"
                        >
                          <Eye size={16} />
                        </button>
                        {hasAdminAnalytics ? (
                          <button
                            onClick={() => handleViewPostAnalytics(post)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="View analytics"
                          >
                            <TrendingUp size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              alert('Post analytics are available on the Pro plan. Upgrade to unlock detailed post analytics.');
                            }}
                            className="text-gray-400 cursor-not-allowed"
                            title="Upgrade to Pro to view analytics"
                          >
                            <Lock size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditPost(post)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPost ? 'Edit Post' : 'Create New Post'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              <MultiLanguageEditor
                title={formData.title}
                content={formData.content}
                translations={formData.translations}
                languageSettings={languageSettings}
                onTitleChange={(title) => setFormData({ ...formData, title })}
                onContentChange={(content) => setFormData({ ...formData, content })}
                onTranslationsChange={(translations) => setFormData({ ...formData, translations })}
              />
              
              <Input
                label="Video URL (optional)"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
              />

              <FileUpload
                label="Upload Image or Video (optional)"
                onFileSelect={handleFileUpload}
                onFileRemove={handleFileRemove}
                currentFile={formData.imageUrl}
                accept="image/*,video/*"
                maxSize={50}
              />

              {uploadingFile && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Uploading file...</span>
                </div>
              )}
            </div>

            {/* Settings Panel - Right Side */}
            <div className="space-y-6">
            {/* Publish Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Publish</h3>
              <div className="text-sm text-gray-600 mb-2">
                {new Date().toLocaleDateString('en-US', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Expiration Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Expiration Date <span className="text-gray-500 font-normal">OPTIONAL</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                placeholder="Expiration date"
              />
            </div>

            {/* Categories */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Categories
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="NOTIFICATION">🔔 NOTIFICATION</option>
                <option value="FEATURE">✨ FEATURE</option>
                <option value="IMPROVEMENT">🚀 IMPROVEMENT</option>
                <option value="BUG_FIX">🐛 BUG FIX</option>
                <option value="ANNOUNCEMENT">📢 ANNOUNCEMENT</option>
              </select>
            </div>

            {/* Segment Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Assign to Segment (optional)
              </label>
              <select
                value={formData.segmentId || ''}
                onChange={(e) => setFormData({ ...formData, segmentId: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">None (visible on all domains)</option>
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name} ({segment.domain})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Posts assigned to a segment will only appear on the specified domain.
              </p>
            </div>
            {/* Post Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Post settings</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enableComments}
                    onChange={(e) => setFormData({ ...formData, enableComments: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable comments</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enableReactions}
                    onChange={(e) => setFormData({ ...formData, enableReactions: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable reactions</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.openLinksInNewTab}
                    onChange={(e) => setFormData({ ...formData, openLinksInNewTab: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Open links in new tab</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enableSocialSharing}
                    onChange={(e) => setFormData({ ...formData, enableSocialSharing: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable social media sharing</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.pinToTop}
                    onChange={(e) => setFormData({ ...formData, pinToTop: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Pin to top of feed</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoOpenWidget}
                    onChange={(e) => setFormData({ ...formData, autoOpenWidget: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto open widget</span>
                </label>
              </div>
            </div>
          </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading || uploadingFile} 
              disabled={uploadingFile}
            >
              {!formData.publishNow && formData.scheduledFor 
                ? (editingPost ? 'Update Schedule' : 'Schedule Post')
                : (editingPost ? 'Update Post' : 'Publish Now')
              }
            </Button>
          </div>
        </form>
      </Modal>

      {/* Embed Code Generator Modal */}
      <EmbedCodeGenerator 
        isOpen={isEmbedModalOpen} 
        onClose={() => setIsEmbedModalOpen(false)} 
        aiConfig={aiConfig}
      />

      {/* AI Agent Settings Modal */}
      <AIAgentSettings
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        config={aiConfig}
        onConfigChange={setAiConfig}
      />

      {/* Language Settings Modal */}
      <LanguageSettingsModal
        isOpen={isLanguageSettingsOpen}
        onClose={() => setIsLanguageSettingsOpen(false)}
        settings={languageSettings}
        onSettingsChange={(settings) => {
          setLanguageSettings(settings);
          loadData(); // Reload data to apply language changes
        }}
      />

      {/* Segment Manager */}
      <SegmentManager
        isOpen={isSegmentManagerOpen}
        onClose={() => setIsSegmentManagerOpen(false)}
        onSegmentChange={loadData}
      />

      {/* Preview Widget */}
      <PreviewChangelogWidget 
        isOpen={isPreviewWidgetOpen} 
        onClose={() => setIsPreviewWidgetOpen(false)}
        posts={posts}
        focusPostId={previewPostId}
      />

      {/* Post Analytics Modal */}
      {selectedPostForAnalytics && (
        <PostAnalyticsModal
          isOpen={isPostAnalyticsOpen}
          onClose={() => {
            setIsPostAnalyticsOpen(false);
            setSelectedPostForAnalytics(null);
          }}
          post={selectedPostForAnalytics}
        />
      )}
    </div>
  );
};