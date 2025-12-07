import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Zap, User, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 transition-colors"
          >
            <Zap size={20} className="text-gray-900" />
            <span className="text-lg font-semibold text-gray-900">Scotty Admin</span>
          </button>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
              <User size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <Button variant="outline" onClick={() => navigate('/')} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Home
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      {children || <Outlet />}
    </div>
  );
};

