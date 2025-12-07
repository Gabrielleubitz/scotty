import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BarChart3, Users, Eye, BookOpen, Code, Globe, Bot, Languages, TrendingUp, Tag, Lock } from 'lucide-react';
import { ChangelogPost, Analytics, AIAgentConfig, LanguageSettings, Segment } from '../types';
import { apiService } from '../lib/api';
import { useTeam } from '../hooks/useTeam';
import { isFeatureEnabledForTeam } from '../lib/features';
import { featureOverrideService } from '../lib/feature-overrides';
import { billingService } from '../lib/billing';
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
  const [aiConfig, setAiConfig] = useState<AIAgentConfig>({ apiToken: '', apiUrl: 'https://aiagent.net2phone.com', enabled: false });
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
      setHasAdminAnalytics(isFeatureEnabledForTeam(currentTeam, overrides, 'admin_analytics'));
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Settings Group */}
            <div className="flex flex-wrap gap-3">
              <div className="group relative">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEmbedModalOpen(true)} 
                  className="bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                      <Code size={14} className="text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-blue-700">Widget Code</span>
                  </div>
                </Button>
              </div>
              
              <div className="group relative">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAISettingsOpen(true)}
                  className="bg-white hover:bg-purple-50 border-gray-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors">
                      <Bot size={14} className="text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-purple-700">AI Settings</span>
                  </div>
                </Button>
              </div>
              
              <div className="group relative">
                <Button 
                  variant="outline" 
                  onClick={() => setIsLanguageSettingsOpen(true)}
                  className="bg-white hover:bg-green-50 border-gray-200 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors">
                      <Languages size={14} className="text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-green-700">Languages</span>
                  </div>
                </Button>
              </div>
              
              <div className="group relative">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSegmentManagerOpen(true)}
                  className="bg-white hover:bg-orange-50 border-gray-200 hover:border-orange-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-orange-100 rounded-md group-hover:bg-orange-200 transition-colors">
                      <Tag size={14} className="text-orange-600" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-orange-700">Segments</span>
                  </div>
                </Button>
              </div>
            </div>
            
            {/* Primary Action */}
            <div className="flex-shrink-0">
              <Button 
                onClick={handleCreatePost} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-white/20 rounded-md">
                    <Plus size={16} className="text-white" />
                  </div>
                  <span className="font-semibold">Create New Update</span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Content Overview</h2>
            <div className="flex items-center space-x-2">
              <Bot size={16} />
              <span className="text-sm">
                AI Agent: {aiConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-blue-100">Total Posts</p>
              <p className="text-2xl font-bold">{posts.length}</p>
            </div>
            <div>
              <p className="text-blue-100">Total Views</p>
              <p className="text-2xl font-bold">{analytics?.totalViews.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-blue-100">Unique Users</p>
              <p className="text-2xl font-bold">{analytics?.uniqueUsers.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Views</h3>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-lg p-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Unique Users</h3>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.uniqueUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-lg p-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Avg. Daily Views</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(analytics.viewsOverTime.reduce((sum, day) => sum + day.views, 0) / analytics.viewsOverTime.length)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-lg p-3">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Domains</h3>
                  <p className="text-2xl font-semibold text-gray-900">
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
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Domain Analytics</h3>
              </div>
              <div className="p-6">
                {visitorAnalytics.domainStats?.length > 0 ? (
                  <div className="space-y-4">
                    {visitorAnalytics.domainStats.slice(0, 5).map((domain: any, index: number) => (
                      <div key={domain.domain} className="flex items-center justify-between">
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
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Visitor Insights</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Top Countries</h4>
                    <div className="space-y-2">
                      {visitorAnalytics.topCountries?.slice(0, 3).map((country: any) => (
                        <div key={country.country} className="flex justify-between">
                          <span className="text-sm text-gray-600">{country.country}</span>
                          <span className="text-sm font-medium">{country.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Top Browsers</h4>
                    <div className="space-y-2">
                      {visitorAnalytics.topBrowsers?.slice(0, 3).map((browser: any) => (
                        <div key={browser.browser} className="flex justify-between">
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Published Updates</h2>
              <span className="text-sm text-gray-500">{posts.length} total posts</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                <p className="text-gray-500 mb-4">Create your first product update to get started</p>
                <Button onClick={handleCreatePost}>
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
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500">{post.content.replace(/<[^>]*>/g, '').substring(0, 60)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium text-gray-900">
                        {post.views.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreviewPost(post.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Preview in widget"
                        >
                          <Eye size={16} />
                        </button>
                        {hasAdminAnalytics ? (
                          <button
                            onClick={() => handleViewPostAnalytics(post)}
                            className="text-purple-600 hover:text-purple-900"
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
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:text-red-900"
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