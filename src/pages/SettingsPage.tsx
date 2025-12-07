import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, User, LogOut } from 'lucide-react';
import { TeamSettings } from '../components/TeamSettings';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import { TeamSwitcher } from '../components/TeamSwitcher';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
            {user && (
              <>
                {currentTeam && !teamLoading && (
                  <TeamSwitcher />
                )}
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                {(user.role === 'admin' || user.role === 'god') && (
                  <Button 
                    onClick={() => navigate('/admin')} 
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {user.role === 'god' ? 'God Admin' : 'Admin'}
                  </Button>
                )}
                <Button variant="outline" onClick={handleSignOut} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Team Settings</h1>
        </div>
        <TeamSettings 
          isOpen={true} 
          onClose={() => navigate('/')} 
        />
      </main>
    </div>
  );
};

