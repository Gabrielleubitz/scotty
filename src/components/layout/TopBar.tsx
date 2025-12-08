import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTeam } from '../../hooks/useTeam';
import { TeamSwitcher } from '../TeamSwitcher';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface TopBarProps {
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentTeam } = useTeam();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <div className={cn('flex items-center justify-between px-6 py-4 bg-bg-surface border-b border-border', className)}>
      {/* Left: Workspace selector */}
      <div className="flex items-center space-x-4">
        {currentTeam && <TeamSwitcher />}
      </div>

      {/* Right: User menu */}
      <div className="flex items-center space-x-4">
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-input hover:bg-[#111827] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <User size={16} className="text-accent" />
              </div>
              <span className="text-body text-text-primary">{user.name}</span>
              <ChevronDown size={16} className="text-text-muted" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-bg-card border border-border rounded-card shadow-lg z-20">
                  <div className="p-2">
                    <div className="px-3 py-2 text-caption text-text-muted border-b border-border mb-2">
                      {user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-body text-text-primary hover:bg-[#111827] rounded-input transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

