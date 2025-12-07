import { useState, useEffect, useCallback } from 'react';
import { Team, TeamMember } from '../types';
import { teamService } from '../lib/teams';
import { useAuth } from './useAuth';

export interface TeamContext {
  currentTeam: Team | null;
  userTeams: Team[];
  userRole: TeamMember['role'] | null;
  loading: boolean;
  switchTeam: (teamId: string) => Promise<void>;
  refreshTeam: () => Promise<void>;
  canManageTeam: boolean;
}

/**
 * Hook to manage team context
 * Stores current team in localStorage and syncs with URL if needed
 */
export const useTeam = (): TeamContext => {
  const { user } = useAuth();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [userRole, setUserRole] = useState<TeamMember['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [canManageTeam, setCanManageTeam] = useState(false);

  // Load team from localStorage or create default
  const loadTeam = useCallback(async () => {
    if (!user) {
      setCurrentTeam(null);
      setUserTeams([]);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user's teams
      const teams = await teamService.getUserTeams(user.id);
      setUserTeams(teams);

      if (teams.length === 0) {
        // Create default team for user
        const defaultTeam = await teamService.getOrCreateDefaultTeam(user.id, user.name);
        setUserTeams([defaultTeam]);
        setCurrentTeam(defaultTeam);
        localStorage.setItem('currentTeamId', defaultTeam.id);
      } else {
        // Get current team from localStorage or use first team
        const storedTeamId = localStorage.getItem('currentTeamId');
        let team: Team | null = null;

        if (storedTeamId) {
          team = teams.find(t => t.id === storedTeamId) || null;
        }

        if (!team) {
          team = teams[0];
          localStorage.setItem('currentTeamId', team.id);
        }

        setCurrentTeam(team);

        // Get user's role in current team
        const role = await teamService.getUserTeamRole(user.id, team.id);
        setUserRole(role);
        setCanManageTeam(role === 'owner' || role === 'admin');
      }
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const switchTeam = useCallback(async (teamId: string) => {
    const team = userTeams.find(t => t.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Verify user has access
    const hasAccess = await teamService.userHasAccessToTeam(user!.id, teamId);
    if (!hasAccess) {
      throw new Error('You do not have access to this team');
    }

    setCurrentTeam(team);
    localStorage.setItem('currentTeamId', teamId);

    // Update role
    const role = await teamService.getUserTeamRole(user!.id, teamId);
    setUserRole(role);
    setCanManageTeam(role === 'owner' || role === 'admin');
  }, [user, userTeams]);

  const refreshTeam = useCallback(async () => {
    if (currentTeam) {
      const updatedTeam = await teamService.getTeam(currentTeam.id);
      if (updatedTeam) {
        setCurrentTeam(updatedTeam);
      }
    }
    await loadTeam();
  }, [currentTeam, loadTeam]);

  return {
    currentTeam,
    userTeams,
    userRole,
    loading,
    switchTeam,
    refreshTeam,
    canManageTeam,
  };
};

