import React, { useState, useEffect } from 'react';
import { Zap, User, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import { apiService } from '../lib/api';
import { trackingService } from '../lib/tracking';
import { TeamSwitcher } from '../components/TeamSwitcher';
import ChangelogWidget from '../components/ChangelogWidget';
import { AuthModal } from '../components/AuthModal';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const { user, signOut } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  // Initialize tracking when app loads
  useEffect(() => {
    if (user) {
      trackingService.identifyUser(user.email, user.name);
    }
  }, [user]);

  // Check for new updates when user or team changes
  useEffect(() => {
    const checkForNewUpdates = async () => {
      if (!currentTeam) return;
      
      try {
        const posts = await apiService.getChangelogPosts(currentTeam.id);
        setHasNewUpdates(posts.length > 0);
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    checkForNewUpdates();
  }, [user, currentTeam]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleMarkAsRead = () => {
    setHasNewUpdates(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap size={20} className="text-gray-900" />
            <h1 className="text-lg font-semibold text-gray-900">Scotty</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {currentTeam && !teamLoading && (
                  <TeamSwitcher />
                )}
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                {currentTeam && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/settings')} 
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Settings size={16} className="mr-2" />
                    Team Settings
                  </Button>
                )}
                {(user.role === 'admin' || user.role === 'god') && (
                  <Button 
                    onClick={() => navigate('/admin')} 
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {user.role === 'god' ? 'God Admin' : 'Admin'}
                  </Button>
                )}
                <Button variant="outline" onClick={handleSignOut} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsAuthModalOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">
            {(user?.role === 'admin' || user?.role === 'god') ? 'Admin Dashboard' : 'Product Dashboard'}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm">
            {(user?.role === 'admin' || user?.role === 'god') 
              ? 'Manage your product updates and track user engagement with your changelog posts.'
              : 'Stay updated with the latest product improvements, new features, and announcements.'
            }
          </p>
        </div>

        {/* Admin Quick Actions */}
        {(user?.role === 'admin' || user?.role === 'god') && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <Button 
                onClick={() => navigate('/admin')} 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Settings size={16} className="mr-2" />
                Full Admin Panel
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/admin/posts/new')}
                className="text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 mb-1">Create Update</h4>
                <p className="text-sm text-gray-600">Add new product updates</p>
              </button>
              <button
                onClick={() => {
                  navigate('/admin');
                  // Scroll to analytics section after navigation
                  setTimeout(() => {
                    const analyticsSection = document.querySelector('[data-section="analytics"]');
                    if (analyticsSection) {
                      analyticsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 mb-1">Track Engagement</h4>
                <p className="text-sm text-gray-600">View analytics & metrics</p>
              </button>
              <button
                onClick={() => {
                  navigate('/admin');
                  // Scroll to posts table after navigation
                  setTimeout(() => {
                    const postsSection = document.querySelector('[data-section="posts"]');
                    if (postsSection) {
                      postsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 mb-1">Manage Posts</h4>
                <p className="text-sm text-gray-600">Edit or delete updates</p>
              </button>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Latest Updates</h3>
            <p className="text-sm text-gray-600">Get notified about new features, improvements, and bug fixes as soon as they're released.</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <User className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-600">Ask questions about features, get help with troubleshooting, and discover new ways to use our product.</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600">Track your usage, understand performance metrics, and optimize your workflows.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 rounded-lg p-8 text-center text-white mb-8">
          <h3 className="text-xl font-semibold mb-2">Ready to explore what's new?</h3>
          <p className="text-gray-400 mb-6 text-sm max-w-2xl mx-auto">
            Check out our latest updates and chat with our AI assistant to get the most out of your experience.
          </p>
          <Button
            onClick={() => setIsWidgetOpen(true)}
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            {hasNewUpdates && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
            What's New
          </Button>
        </div>

        {/* Demo Instructions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          {!user ? (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Started</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Sign up to create an account or sign in to access the admin panel
              </p>
              <Button onClick={() => setIsAuthModalOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white">
                Sign Up / Sign In
              </Button>
            </>
          ) : (user.role !== 'admin' && user.role !== 'god') ? (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome!</h3>
              <p className="text-gray-600 text-sm">
                You're signed in as a regular user. Contact an admin to get admin access.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access</h3>
              <p className="text-gray-600 mb-4 text-sm">
                You have admin privileges. Create and manage product updates from the admin panel.
              </p>
              <Button onClick={() => navigate('/admin')} className="bg-gray-900 hover:bg-gray-800 text-white">
                Go to Admin Panel
              </Button>
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button for Admins */}
      {(user?.role === 'admin' || user?.role === 'god') && (
        <button
          onClick={() => navigate('/admin')}
          className="fixed bottom-6 right-6 bg-gray-900 text-white p-3 rounded-lg shadow-lg z-40 hover:bg-gray-800 transition-colors"
        >
          <Settings size={20} />
        </button>
      )}

      {/* Changelog Widget */}
      <ChangelogWidget 
        isOpen={isWidgetOpen} 
        onClose={() => setIsWidgetOpen(false)} 
        onMarkAsRead={handleMarkAsRead}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

