import React, { useState } from 'react';
import { ChevronDown, Users, Plus } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { Button } from './ui/Button';

export const TeamSwitcher: React.FC = () => {
  const { currentTeam, userTeams, switchTeam, loading } = useTeam();
  const [isOpen, setIsOpen] = useState(false);

  if (loading || !currentTeam) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="animate-pulse bg-gray-300 h-4 w-24 rounded"></div>
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
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Users size={16} className="text-gray-600" />
        <span className="font-medium text-gray-900 max-w-[150px] truncate">
          {currentTeam.name}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Teams
              </div>
              {userTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    team.id === currentTeam.id
                      ? 'bg-blue-50 text-blue-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{team.name}</span>
                    {team.id === currentTeam.id && (
                      <span className="text-blue-600 text-xs">Current</span>
                    )}
                  </div>
                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Open create team modal
                    alert('Create team feature coming soon');
                  }}
                  className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md flex items-center space-x-2"
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

