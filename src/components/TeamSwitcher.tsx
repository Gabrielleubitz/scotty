import React, { useState } from 'react';
import { ChevronDown, Users, Plus } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { Button } from './ui/Button';

export const TeamSwitcher: React.FC = () => {
  const { currentTeam, userTeams, switchTeam, loading } = useTeam();
  const [isOpen, setIsOpen] = useState(false);

  if (loading || !currentTeam) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-bg-card border border-border rounded-input">
        <div className="animate-pulse bg-border h-4 w-24 rounded"></div>
      </div>
    );
  }

  const handleTeamSelect = async (teamId: string) => {
    if (teamId === currentTeam.id) {
      setIsOpen(false);
      return;
    }

    try {
      await switchTeam(teamId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch team:', error);
      alert('Failed to switch team. Please try again.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-bg-card border border-border rounded-input hover:border-accent/50 transition-colors"
      >
        <Users size={16} className="text-accent" />
        <span className="font-medium text-text-primary max-w-[150px] truncate text-body">
          {currentTeam.name}
        </span>
        <ChevronDown size={16} className="text-text-muted" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-bg-card border border-border rounded-card shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-caption font-semibold text-text-muted uppercase">
                Teams
              </div>
              {userTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                  className={`w-full text-left px-3 py-2 rounded-input transition-colors text-body ${
                    team.id === currentTeam.id
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-text-primary hover:bg-[#111827]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{team.name}</span>
                    {team.id === currentTeam.id && (
                      <span className="text-accent text-caption">Current</span>
                    )}
                  </div>
                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Open create team modal
                    alert('Create team feature coming soon');
                  }}
                  className="w-full text-left px-3 py-2 text-text-muted hover:bg-[#111827] rounded-input flex items-center space-x-2 text-body"
                >
                  <Plus size={16} />
                  <span>Create new team</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

