import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, BarChart3, Users, Eye, BookOpen, Code, Globe, Bot, Languages, TrendingUp, Tag as TagIcon, Lock, Settings, HelpCircle, Layout, Bell, Crown } from 'lucide-react';
import { ChangelogPost, Analytics, AIAgentConfig, LanguageSettings, Segment } from '../types';
import { apiService } from '../lib/api';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { isFeatureEnabledForTeam } from '../lib/features';
import { featureOverrideService } from '../lib/feature-overrides';
import { billingService } from '../lib/billing';
import { GodAdminPanel } from './GodAdminPanel';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Tag } from './ui/Tag';
import { EmbedCodeGenerator } from './EmbedCodeGenerator';
import { PreviewChangelogWidget } from './PreviewChangelogWidget';
import { AIAgentSettings } from './AIAgentSettings';
import { PostAnalyticsModal } from './PostAnalyticsModal';
import { SegmentManager } from './SegmentManager';
import { formatDate } from '../lib/utils';
import { LanguageSettings as LanguageSettingsModal } from './LanguageSettings';
import { AnalyticsChart } from './AnalyticsChart';
import { AIChatAnalytics } from './AIChatAnalytics';
import { DEFAULT_LANGUAGE_SETTINGS } from '../lib/languages';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [posts, setPosts] = useState<ChangelogPost[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [visitorAnalytics, setVisitorAnalytics] = useState<any>(null);
  const [featureOverrides, setFeatureOverrides] = useState<any[]>([]);
  const [hasAdminAnalytics, setHasAdminAnalytics] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isPreviewWidgetOpen, setIsPreviewWidgetOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isSegmentManagerOpen, setIsSegmentManagerOpen] = useState(false);
  const [isLanguageSettingsOpen, setIsLanguageSettingsOpen] = useState(false);
  const [isPostAnalyticsOpen, setIsPostAnalyticsOpen] = useState(false);
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState<ChangelogPost | null>(null);
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState<AIAgentConfig>({ apiToken: '', apiUrl: '', enabled: false });
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>(DEFAULT_LANGUAGE_SETTINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Always load feature overrides (handles god users without team)
    loadFeatureOverrides();
    
    // For god users without a team, they can still use the dashboard
    // but won't have team-specific data
    if (!currentTeam && user?.role !== 'god') {
      return;
    }
    
    // Load team-specific data if team exists
    if (currentTeam) {
      loadData();
      loadAIConfig();
      loadLanguageSettings();
      loadSegments(); // Load segments on component mount
      
      // Refresh data every 10 seconds to show updated view counts
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing admin dashboard data...');
        loadData();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [currentTeam, user]);

  const loadFeatureOverrides = async () => {
    // For god users, always enable analytics (they have all features)
    if (user?.role === 'god') {
      setHasAdminAnalytics(true);
      return;
    }
    
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
    navigate('/admin/posts/new');
  };

  const handleEditPost = (post: ChangelogPost) => {
    try {
      if (!post || !post.id) {
        console.error('Invalid post data:', post);
        alert('Cannot edit post: Invalid post data');
        return;
      }
      console.log('Navigating to edit post:', post.id);
      navigate(`/admin/posts/${post.id}/edit`);
    } catch (error) {
      console.error('Error navigating to edit post:', error);
      alert('Failed to open edit page. Please try again.');
    }
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


  const handlePreviewPost = (postId: string) => {
    setPreviewPostId(postId);
    setIsPreviewWidgetOpen(true);
  };

  const handleViewPostAnalytics = (post: ChangelogPost) => {
    setSelectedPostForAnalytics(post);
    setIsPostAnalyticsOpen(true);
  };
  

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-h1 text-text-primary mb-2">
              Admin Dashboard
            </h1>
            <p className="text-body text-text-muted">
              Manage your product updates and track engagement
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* God Admin Button */}
            {user?.role === 'god' && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin/god')}
                className="border-accent/30 text-accent hover:bg-accent/10"
                title="Access God Admin Panel to manage users and teams"
              >
                <Crown size={16} className="mr-2" />
                <span className="hidden sm:inline">God Admin</span>
                <span className="sm:hidden">God</span>
              </Button>
            )}
            {/* Settings Group */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setIsEmbedModalOpen(true)} 
                title="Get the embed code to add the widget to your website"
              >
                <Code size={16} className="mr-2" />
                <span className="hidden sm:inline">Widget Code</span>
                <span className="sm:hidden">Code</span>
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={() => setIsAISettingsOpen(true)}
                title="Configure AI assistant for your widget"
              >
                <Bot size={16} className="mr-2" />
                <span className="hidden sm:inline">AI Assistant</span>
                <span className="sm:hidden">AI</span>
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={() => setIsLanguageSettingsOpen(true)}
                title="Set up multi-language support"
              >
                <Languages size={16} className="mr-2" />
                <span className="hidden sm:inline">Languages</span>
                <span className="sm:hidden">Lang</span>
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={() => setIsSegmentManagerOpen(true)}
                title="Manage user segments and targeting"
              >
                <TagIcon size={16} className="mr-2" />
                <span className="hidden sm:inline">Segments</span>
                <span className="sm:hidden">Tags</span>
              </Button>
            </div>
            
            {/* Primary Action */}
            <Button 
              onClick={handleCreatePost}
              size="lg"
            >
              <Plus size={18} className="mr-2" />
              <span className="font-semibold">Create New Update</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <Card className="border-accent/30 bg-gradient-to-br from-bg-card to-bg-cardAlt">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 text-text-primary">Content Overview</h2>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-bg-card border border-border rounded-pill">
              <Bot size={16} className="text-accent" />
              <span className="text-caption text-text-muted">
                AI Agent: {aiConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-caption text-text-muted mb-2">Total Posts</p>
              <p className="text-h1 text-text-primary">{posts.length}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted mb-2">Total Views</p>
              <p className="text-h1 text-text-primary">{analytics?.totalViews.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted mb-2">Unique Users</p>
              <p className="text-h1 text-text-primary">{analytics?.uniqueUsers.toLocaleString() || '0'}</p>
            </div>
          </div>
        </Card>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:border-accent/30 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent/20 rounded-card flex items-center justify-center">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
                <div className="ml-3">
                  <h3 className="text-caption text-text-muted mb-1">Total Views</h3>
                  <p className="text-h3 text-text-primary font-semibold">{analytics.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="hover:border-accent/30 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent/20 rounded-card flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div className="ml-3">
                  <h3 className="text-caption text-text-muted mb-1">Unique Users</h3>
                  <p className="text-h3 text-text-primary font-semibold">{analytics.uniqueUsers.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="hover:border-accent/30 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent/20 rounded-card flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <div className="ml-3">
                  <h3 className="text-caption text-text-muted mb-1">Avg. Daily Views</h3>
                  <p className="text-h3 text-text-primary font-semibold">
                    {analytics.viewsOverTime.length > 0
                      ? Math.round(analytics.viewsOverTime.reduce((sum, day) => sum + day.views, 0) / analytics.viewsOverTime.length).toLocaleString()
                      : '0'
                    }
                  </p>
                </div>
              </div>
            </Card>
            <Card className="hover:border-accent/30 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent/20 rounded-card flex items-center justify-center">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <div className="ml-3">
                  <h3 className="text-caption text-text-muted">Domains</h3>
                  <p className="text-h3 text-text-primary font-semibold">
                    {visitorAnalytics?.domainStats?.length || 0}
                  </p>
                </div>
              </div>
            </Card>
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

        {/* Visitor Analytics - Show upgrade prompt if feature not enabled (but not for god users) */}
        {!hasAdminAnalytics && user?.role !== 'god' && (
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
                <p className="text-xs text-gray-500 mt-1">Shows domains and product IDs from your embedded widgets</p>
              </div>
              <div className="p-6">
                {visitorAnalytics.domainStats?.length > 0 ? (
                  <div className="space-y-4">
                    {visitorAnalytics.domainStats.slice(0, 5).map((domain: any, index: number) => (
                      <div key={`domain-${domain.domain}-${domain.productId}-${index}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="bg-blue-100 rounded-lg p-2">
                            <Globe size={16} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{domain.domain || 'Unknown Domain'}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                {domain.productId || 'unknown'}
                              </span>
                              {domain.countries && domain.countries.length > 0 && (
                                <p className="text-xs text-gray-500 truncate">
                                  {domain.countries.slice(0, 2).join(', ')}
                                  {domain.countries.length > 2 && ` +${domain.countries.length - 2}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-gray-900">{domain.uniqueVisitors || 0}</p>
                          <p className="text-xs text-gray-500">{domain.totalViews || 0} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No domain data yet</p>
                    <p className="text-xs text-gray-400 mt-1">Data will appear when users interact with your embedded widgets</p>
                  </div>
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
        <div className="mb-8" data-section="analytics">
          <AIChatAnalytics />
        </div>

        {/* Posts Table */}
        <Card className="overflow-hidden p-0" data-section="posts">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-h3 text-text-primary font-semibold">Published Updates</h2>
              <span className="text-body text-text-muted">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-bg-cardAlt rounded-card flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={32} className="text-text-muted" />
                </div>
                <h3 className="text-h3 text-text-primary mb-2">No updates yet</h3>
                <p className="text-body text-text-muted mb-4">Create your first product update to get started</p>
                <Button 
                  onClick={handleCreatePost}
                >
                  <Plus size={16} className="mr-2" />
                  Create First Update
                </Button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-bg-card">
                  <tr>
                    <th className="px-6 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-card divide-y divide-border">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-[#111827] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-body font-medium text-text-primary">{post.title}</div>
                        <div className="text-caption text-text-muted mt-1">{post.content.replace(/<[^>]*>/g, '').substring(0, 60)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-body text-text-muted">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Tag 
                          variant={
                            post.status === 'published' ? 'success' :
                            post.status === 'draft' ? 'default' : 'warning'
                          }
                          size="sm"
                        >
                          {post.status === 'published' && 'Published'}
                          {post.status === 'draft' && 'Draft'}
                          {post.status === 'scheduled' && 'Scheduled'}
                        </Tag>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-body font-medium text-text-primary">
                          {post.views.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePreviewPost(post.id)}
                            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-input hover:bg-[#111827]"
                            title="Preview in widget"
                          >
                            <Eye size={16} />
                          </button>
                        {hasAdminAnalytics ? (
                          <button
                            onClick={() => handleViewPostAnalytics(post)}
                            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-input hover:bg-[#111827]"
                            title="View analytics"
                            type="button"
                          >
                            <TrendingUp size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              alert('Post analytics are available on the Pro plan. Upgrade to unlock detailed post analytics.');
                            }}
                            className="text-text-muted/50 cursor-not-allowed p-1"
                            title="Upgrade to Pro to view analytics"
                            type="button"
                          >
                            <Lock size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditPost(post);
                          }}
                          className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-input hover:bg-[#111827]"
                          title="Edit post"
                          type="button"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-status-error hover:text-status-error/80 transition-colors p-1 rounded-input hover:bg-status-error/10"
                          title="Delete post"
                          type="button"
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
        </Card>

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