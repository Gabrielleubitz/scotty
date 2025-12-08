import React, { useState, useEffect } from 'react';
import { Zap, User, Settings, BookOpen, Bot, BarChart3, ArrowRight, Check, FileText, Sparkles, Users, MessageSquare, ChevronRight } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import { apiService } from '../lib/api';
import { trackingService } from '../lib/tracking';
import { AppShell } from '../components/layout/AppShell';
import ChangelogWidget from '../components/ChangelogWidget';
import { AuthModal } from '../components/AuthModal';
import { ChangelogPost } from '../types';
import { formatRelativeTime } from '../lib/utils';
import { AnimatedText } from '../components/AnimatedText';
import { WebsiteWidgetDemo } from '../components/WebsiteWidgetDemo';
import { InlineChangelogDemo } from '../components/InlineChangelogDemo';
import { MultiLanguageDemo } from '../components/MultiLanguageDemo';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [samplePosts, setSamplePosts] = useState<ChangelogPost[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const { user, signOut } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  // Initialize tracking when app loads
  useEffect(() => {
    if (user) {
      trackingService.identifyUser(user.email, user.name);
    }
  }, [user]);

  // Check for new updates and load sample posts
  useEffect(() => {
    const loadData = async () => {
      if (currentTeam) {
        try {
          const posts = await apiService.getChangelogPosts(currentTeam.id);
          setHasNewUpdates(posts.length > 0);
          setSamplePosts(posts.slice(0, 6)); // Get up to 6 posts for preview
        } catch (error) {
          console.error('Failed to load posts:', error);
        }
      } else if (!user) {
        // For logged out users, try to load some public posts if available
        try {
          const posts = await apiService.getChangelogPosts(undefined, true);
          setSamplePosts(posts.slice(0, 6)); // Get up to 6 posts for preview
        } catch (error) {
          console.error('Failed to load public posts:', error);
          // Silently fail for public posts - it's okay if there are none
        }
      }
    };

    loadData();
  }, [user, currentTeam]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleMarkAsRead = () => {
    setHasNewUpdates(false);
  };

  const filteredPosts = filter === 'all' 
    ? samplePosts 
    : samplePosts.filter(post => post.category?.toLowerCase() === filter.toLowerCase());

  // If user is logged in, show the app shell with dashboard
  if (user) {
    return (
      <AppShell>
        <div className="space-y-8">
          <div>
            <h1 className="text-h1 text-text-primary mb-2">
              {(user.role === 'admin' || user.role === 'god') ? 'Admin Dashboard' : 'Product Dashboard'}
            </h1>
            <p className="text-body text-text-muted max-w-2xl">
              {(user.role === 'admin' || user.role === 'god') 
                ? 'Manage your product updates and track user engagement with your changelog posts.'
                : 'Stay updated with the latest product improvements, new features, and announcements.'
              }
            </p>
          </div>

          {/* Quick Actions for Admins */}
          {(user.role === 'admin' || user.role === 'god') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="cursor-pointer hover:border-accent/30 transition-colors"
                onClick={() => navigate('/admin/posts/new')}
              >
                <CardHeader>
                  <CardTitle className="text-h3">Create Update</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body text-text-muted">Add new product updates</p>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:border-accent/30 transition-colors"
                onClick={() => navigate('/admin')}
              >
                <CardHeader>
                  <CardTitle className="text-h3">Track Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body text-text-muted">View analytics & metrics</p>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:border-accent/30 transition-colors"
                onClick={() => navigate('/admin')}
              >
                <CardHeader>
                  <CardTitle className="text-h3">Manage Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body text-text-muted">Edit or delete updates</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* CTA for logged in users */}
          <Card className="border-accent/30">
            <div className="text-center py-8">
              <h3 className="text-h2 text-text-primary mb-2">Ready to explore what's new?</h3>
              <p className="text-body text-text-muted mb-6 max-w-2xl mx-auto">
                Check out our latest updates and chat with our AI assistant to get the most out of your experience.
              </p>
              <Button onClick={() => setIsWidgetOpen(true)}>
                What's New
                {hasNewUpdates && (
                  <span className="ml-2 w-2 h-2 bg-status-error rounded-full"></span>
                )}
              </Button>
            </div>
          </Card>
        </div>

        <ChangelogWidget 
          isOpen={isWidgetOpen} 
          onClose={() => setIsWidgetOpen(false)} 
          onMarkAsRead={handleMarkAsRead}
        />
      </AppShell>
    );
  }

  // Public landing page (when not logged in)
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Global Navigation */}
      <header className="sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2">
            <Logo size={24} />
            <span className="text-h3 text-text-primary font-semibold">Scotty</span>
          </button>
          
          <nav className="hidden md:flex items-center space-x-6">
            <button onClick={() => navigate('/#product')} className="text-body text-text-muted hover:text-text-primary transition-colors">Product</button>
            <button onClick={() => navigate('/#use-cases')} className="text-body text-text-muted hover:text-text-primary transition-colors">Use cases</button>
            <button onClick={() => navigate('/pricing')} className="text-body text-text-muted hover:text-text-primary transition-colors">Pricing</button>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={() => setIsAuthModalOpen(true)}>
              Log in
            </Button>
            <Button onClick={() => setIsAuthModalOpen(true)}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <Tag variant="accent">Product changelog + AI assistant</Tag>
            
            <h1 className="text-h1 text-text-primary">
              Scotty keeps your product updates clear, searchable, and shareable.
            </h1>
            
            <div className="text-h2 text-accent font-semibold min-h-[3rem] flex items-center">
              <AnimatedText 
                phrases={[
                  'AI-powered product updates',
                  'Automatic multi-language changelogs',
                  'Targeted updates by domain and segment',
                  'Changelog analytics and engagement tracking',
                  'Integrated AI assistant for help and guidance',
                  'Role-based access for admins and users'
                ]}
                className="text-h2 text-accent font-semibold"
                interval={3000}
              />
            </div>
            
            <p className="text-body text-text-muted max-w-xl">
              Create and publish changelogs, use AI to clean up your release notes, translate updates for every market, and see who actually reads them.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => setIsAuthModalOpen(true)}>
                Start your changelog
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setIsWidgetOpen(true)}>
                View live demo
              </Button>
            </div>
            
            <p className="text-caption text-text-muted">
              Built for teams that want one place for product updates, AI assistance, and multi-language support.
            </p>
          </div>

          {/* Right Column - Website Widget Demo */}
          <div className="relative">
            <WebsiteWidgetDemo />
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-h2 text-text-primary text-center mb-12">Everything you need for product updates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
              <FileText size={24} className="text-accent" />
            </div>
            <CardHeader>
              <CardTitle>Changelog management that fits your workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">Create, edit, and schedule product updates, organize them by category and tags, and keep everything in one place.</p>
            </CardContent>
          </Card>
          
          <Card>
            <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
              <Bot size={24} className="text-accent" />
            </div>
            <CardHeader>
              <CardTitle>AI assistant built into your updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">Use an integrated chat agent to draft release notes, discover features, and guide users through your product changes.</p>
            </CardContent>
          </Card>
          
          <Card>
            <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-accent" />
            </div>
            <CardHeader>
              <CardTitle>Multi-language changelogs out of the box</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">Translate your posts automatically using OpenAI, Google, or DeepL, and control which languages your users see.</p>
            </CardContent>
          </Card>
          
          <Card>
            <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
              <BarChart3 size={24} className="text-accent" />
            </div>
            <CardHeader>
              <CardTitle>Analytics, audiences, and targeting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">Track views and engagement, group users by domain, and deliver the right updates to the right people.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-h2 text-text-primary text-center mb-12">Where Scotty helps you</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Product teams</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <Check size={16} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Announce new features in one place.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={16} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Share what shipped across teams.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={16} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Reduce confusion around what is live.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Customer-facing teams</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <Check size={16} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Give sales and support a clear source of truth.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={16} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Point customers to a single changelog page.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={16} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Keep scripts and answers up to date.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Live changelog preview */}
      {samplePosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-8">
            <h2 className="text-h2 text-text-primary mb-2">Live changelog preview</h2>
            <p className="text-body text-text-muted">See how your updates will look to your team.</p>
          </div>
          
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'feature', 'improvement', 'bugfix', 'notification'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f 
                  ? 'px-4 py-2 rounded-pill bg-accent text-text-primary text-caption font-medium'
                  : 'px-4 py-2 rounded-pill bg-bg-card border border-border text-text-muted text-caption font-medium hover:border-accent/30 transition-colors'
                }
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          
          <Card>
            <div className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <div key={post.id} className="p-4 rounded-input bg-bg-cardAlt border border-border hover:border-accent/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Tag size="sm" variant="accent">{post.category || 'Update'}</Tag>
                        <span className="text-caption text-text-muted">{formatRelativeTime(post.createdAt)}</span>
                      </div>
                    </div>
                    <h3 className="text-body text-text-primary font-semibold mb-1">{post.title}</h3>
                    <p className="text-caption text-text-muted line-clamp-2">
                      {post.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-body text-text-muted text-center py-8">No posts found for this filter.</p>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Demo widgets section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InlineChangelogDemo />
          <MultiLanguageDemo />
        </div>
      </section>

      {/* CTA Footer */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Card className="border-accent/50 bg-gradient-to-br from-bg-card to-bg-cardAlt">
          <div className="text-center py-12">
            <h2 className="text-h2 text-text-primary mb-4">Ready to make your changelog useful?</h2>
            <p className="text-body text-text-muted mb-8 max-w-2xl mx-auto">
              Create your workspace, invite your team, and publish your next update in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setIsAuthModalOpen(true)}>
                Start for free
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/support')}>
                Talk to us
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer Navigation */}
      <footer className="border-t border-border bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Logo size={20} />
                <span className="text-h3 text-text-primary font-semibold">Scotty</span>
              </div>
              <p className="text-body text-text-muted">Changelogs, AI assistance, and multi-language product updates in one place.</p>
            </div>
            <div className="flex flex-wrap gap-6">
              <button onClick={() => navigate('/docs')} className="text-body text-text-muted hover:text-text-primary transition-colors">Docs</button>
              <button onClick={() => navigate('/support')} className="text-body text-text-muted hover:text-text-primary transition-colors">Support</button>
              <button onClick={() => navigate('/status')} className="text-body text-text-muted hover:text-text-primary transition-colors">Status</button>
              <button onClick={() => navigate('/privacy')} className="text-body text-text-muted hover:text-text-primary transition-colors">Privacy</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ChangelogWidget 
        isOpen={isWidgetOpen} 
        onClose={() => setIsWidgetOpen(false)} 
        onMarkAsRead={handleMarkAsRead}
      />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};
