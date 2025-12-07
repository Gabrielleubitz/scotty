import React, { useState, useEffect } from 'react';
import { Zap, User, LogOut, Settings, BarChart3 } from 'lucide-react';
import { Button } from './components/ui/Button';
import { useAuth } from './hooks/useAuth';
import { useTeam } from './hooks/useTeam';
import { apiService } from './lib/api';
import { trackingService } from './lib/tracking';
import { TeamSwitcher } from './components/TeamSwitcher';
import { TeamSettings } from './components/TeamSettings';

// Lazy load components that aren't immediately needed
const ChangelogWidget = React.lazy(() => import('./components/ChangelogWidget'));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(module => ({ default: module.AuthModal })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

function App() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  // Initialize tracking when app loads
  useEffect(() => {
    // Track initial page visit
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
        // In a real app, you'd track which posts the user has seen
        // For now, we'll show notification if there are any posts
        setHasNewUpdates(posts.length > 0);
      } catch (error) {
        console.error('Failed to check for updates:', error);
        // Don't show error to user for permissions issues, just log it
        if (!(error instanceof Error && error.message.includes('Missing or insufficient permissions'))) {
          // Only show non-permission errors to user
          console.error('Unexpected error loading updates:', error);
        }
      }
    };

    checkForNewUpdates();
  }, [user, currentTeam]);
  const handleSignOut = async () => {
    await signOut();
    setShowAdmin(false);
  };

  const handleMarkAsRead = () => {
    setHasNewUpdates(false);
  };

  // Show loading state while auth or team is loading
  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show team required message if user is logged in but has no team
  if (user && !currentTeam && !teamLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Team Found</h2>
          <p className="text-gray-600 mb-4">You need to be part of a team to use Scotty.</p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  if (showAdmin && user?.role === 'admin') {
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        <div>
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setShowAdmin(false)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <Zap size={24} className="text-blue-600" />
              <span className="text-lg font-semibold">ProductFlow</span>
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
        <AdminDashboard />
      </div>
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap size={28} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Scotty</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {currentTeam && !teamLoading && (
                  <TeamSwitcher />
                )}
                <div className="flex items-center space-x-3">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                {currentTeam && (
                  <Button variant="outline" onClick={() => setIsTeamSettingsOpen(true)}>
                    <Settings size={16} className="mr-2" />
                    Team Settings
                  </Button>
                )}
                {user.role === 'admin' && (
                  <Button variant="outline" onClick={() => setShowAdmin(true)}>
                    <Settings size={16} className="mr-2" />
                    Admin
                  </Button>
                )}
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsAuthModalOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {user?.role === 'admin' ? 'Admin Dashboard' : 'Welcome to Your Product Dashboard'}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {user?.role === 'admin' 
              ? 'Manage your product updates and track user engagement with your changelog posts.'
              : 'Stay updated with the latest product improvements, new features, and announcements. Get instant help from our AI assistant whenever you need it.'
            }
          </p>
        </div>

        {/* Admin Quick Actions */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <Button onClick={() => setShowAdmin(true)}>
                <Settings size={16} className="mr-2" />
                Full Admin Panel
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setShowAdmin(true)}
                className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border-none w-full"
              >
                <h4 className="font-medium text-blue-900 mb-1">Create Update</h4>
                <p className="text-sm text-blue-700">Add new product updates</p>
              </button>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">Track Engagement</h4>
                <p className="text-sm text-green-700">View analytics & metrics</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-1">Manage Posts</h4>
                <p className="text-sm text-purple-700">Edit or delete updates</p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Latest Updates</h3>
            <p className="text-gray-600">Get notified about new features, improvements, and bug fixes as soon as they're released.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50 hover:shadow-md transition-shadow">
            <div className="bg-green-100 rounded-lg p-3 w-fit mb-4">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-gray-600">Ask questions about features, get help with troubleshooting, and discover new ways to use our product.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50 hover:shadow-md transition-shadow">
            <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600">Track your usage, understand performance metrics, and optimize your workflows.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white mb-8">
          <h3 className="text-2xl font-bold mb-4">Ready to explore what's new?</h3>
          <p className="text-blue-100 mb-6">
            Check out our latest updates and chat with our AI assistant to get the most out of your experience.
          </p>
          <Button
            onClick={() => setIsWidgetOpen(true)}
            variant="outline"
            className="bg-white text-blue-600 hover:bg-blue-50 border-white relative"
          >
            {hasNewUpdates && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
            What's New
          </Button>
        </div>

        {/* Demo Instructions */}
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          {!user ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Started</h3>
              <p className="text-gray-600 mb-4">
                Sign up to create an account or sign in to access the admin panel
              </p>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsAuthModalOpen(true)}>
                  Sign Up / Sign In
                </Button>
              </div>
            </>
          ) : user.role !== 'admin' ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome!</h3>
              <p className="text-gray-600 mb-4">
                You're signed in as a regular user. Contact an admin to get admin access.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access</h3>
              <p className="text-gray-600 mb-4">
                You have admin privileges. Create and manage product updates from the admin panel.
              </p>
              <Button onClick={() => setShowAdmin(true)}>
                Go to Admin Panel
              </Button>
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button for Admins */}
      {user?.role === 'admin' && !showAdmin && (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
          <button
            onClick={() => setShowAdmin(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
          >
            <Settings size={24} />
          </button>
        </div>
      )}

      {/* Demo Instructions for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm max-w-sm z-50">
          <h4 className="font-semibold text-yellow-800 mb-1">Development Mode</h4>
            <p className="text-gray-600 mb-4">
            Firebase is now connected! Sign up for a new account or sign in with existing credentials.
            </p>
          </div>
      )}

      {/* Changelog Widget */}
      <React.Suspense fallback={null}>
        <ChangelogWidget 
          isOpen={isWidgetOpen} 
          onClose={() => setIsWidgetOpen(false)} 
          onMarkAsRead={handleMarkAsRead}
        />
      </React.Suspense>

      {/* Auth Modal */}
      <React.Suspense fallback={null}>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </React.Suspense>

      {/* Team Settings Modal */}
      {currentTeam && (
        <TeamSettings 
          isOpen={isTeamSettingsOpen} 
          onClose={() => setIsTeamSettingsOpen(false)} 
        />
      )}
    </div>
  );
}

export default App;