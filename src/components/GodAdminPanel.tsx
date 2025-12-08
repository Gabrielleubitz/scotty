import React, { useState, useEffect } from 'react';
import { Crown, Search, User, Building2, Shield, UserCheck, UserX, ArrowUp, ArrowDown, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User as UserType, Team } from '../types';
import { godAdminService } from '../lib/god-admin';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { formatDate } from '../lib/utils';

export const GodAdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'users' | 'teams'>('users');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newRole, setNewRole] = useState<'god' | 'admin' | 'user'>('user');
  const [newPlan, setNewPlan] = useState<'basic' | 'pro' | 'trial' | 'legacy'>('basic');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedTeams] = await Promise.all([
        godAdminService.getAllUsers(),
        godAdminService.getAllTeams(),
      ]);
      setUsers(fetchedUsers);
      setTeams(fetchedTeams);
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async () => {
    if (!editingUser) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await godAdminService.updateUserRole(editingUser.id, newRole);
      setMessage({ type: 'success', text: `User role updated to ${newRole}` });
      setEditingUser(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update user role:', error);
      setMessage({ type: 'error', text: 'Failed to update user role. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeamPlan = async () => {
    if (!editingTeam) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await godAdminService.updateTeamPlan(editingTeam.id, newPlan);
      setMessage({ type: 'success', text: `Team plan updated to ${newPlan}` });
      setEditingTeam(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update team plan:', error);
      setMessage({ type: 'error', text: 'Failed to update team plan. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'god':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'admin':
        return 'bg-accent/20 text-accent border-accent/30';
      default:
        return 'bg-bg-cardAlt text-text-muted border-border';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-status-success/20 text-status-success border-status-success/30';
      case 'trial':
        return 'bg-status-warning/20 text-status-warning border-status-warning/30';
      default:
        return 'bg-bg-cardAlt text-text-muted border-border';
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-accent/20 rounded-card">
              <Crown size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-h1 text-text-primary">God Admin Panel</h1>
              <p className="text-body text-text-muted">Manage users, roles, and team plans</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-card border flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-status-success/10 border-status-success/30 text-status-success' 
              : 'bg-status-error/10 border-status-error/30 text-status-error'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 size={20} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0" />
            )}
            <span className="font-medium text-body">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-text-muted hover:text-text-primary transition-colors"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => {
                setSelectedTab('users');
                setSearchTerm('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-body transition-colors ${
                selectedTab === 'users'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User size={18} />
                <span>Users ({users.length})</span>
              </div>
            </button>
            <button
              onClick={() => {
                setSelectedTab('teams');
                setSearchTerm('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-body transition-colors ${
                selectedTab === 'teams'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 size={18} />
                <span>Teams ({teams.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Search */}
        <div>
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${selectedTab}...`}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border bg-bg-cardAlt">
              <div className="flex items-center justify-between">
                <h2 className="text-h3 text-text-primary font-semibold">All Users</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadData}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-bg-card">
                  <tr>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-card divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#111827] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-bg-cardAlt border border-border flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full" />
                            ) : (
                              <User size={20} className="text-text-muted" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-body font-medium text-text-primary">{user.displayName || user.name}</div>
                            <div className="text-caption text-text-muted">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-body text-text-primary">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-caption font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {user.role === 'god' && <Crown size={12} className="mr-1" />}
                          {user.role === 'admin' && <Shield size={12} className="mr-1" />}
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-body text-text-muted">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setNewRole(user.role as 'god' | 'admin' | 'user');
                          }}
                        >
                          <Shield size={14} className="mr-1.5" />
                          Change Role
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Teams Tab */}
        {selectedTab === 'teams' && (
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border bg-bg-cardAlt">
              <div className="flex items-center justify-between">
                <h2 className="text-h3 text-text-primary font-semibold">All Teams</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadData}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-bg-card">
                  <tr>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Team Name
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-bold text-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-card divide-y divide-border">
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-[#111827] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-body font-medium text-text-primary">{team.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-body text-text-muted font-mono">{team.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-caption font-medium border ${getPlanBadgeColor(team.subscriptionPlan || team.plan)}`}>
                          {(team.subscriptionPlan || team.plan).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-body text-text-muted capitalize">
                          {team.subscriptionStatus || 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-body text-text-muted">
                        {formatDate(team.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingTeam(team);
                            setNewPlan((team.subscriptionPlan || team.plan) as 'basic' | 'pro' | 'trial' | 'legacy');
                          }}
                        >
                          <ArrowUp size={14} className="mr-1.5" />
                          Change Plan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Edit User Role Modal */}
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title="Change User Role"
        >
          {editingUser && (
            <div className="space-y-4">
              <div className="bg-bg-cardAlt rounded-card p-4 border border-border">
                <div className="text-caption text-text-muted mb-1">User</div>
                <div className="font-semibold text-text-primary text-body">{editingUser.displayName || editingUser.name}</div>
                <div className="text-caption text-text-muted">{editingUser.email}</div>
              </div>

              <div>
                <label className="block text-body font-semibold text-text-primary mb-2">
                  New Role
                </label>
                <div className="space-y-2">
                  {(['god', 'admin', 'user'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewRole(role)}
                      className={`w-full p-3 rounded-card border-2 text-left transition-all ${
                        newRole === role
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {role === 'god' && <Crown size={18} className="text-accent" />}
                          {role === 'admin' && <Shield size={18} className="text-accent" />}
                          {role === 'user' && <User size={18} className="text-text-muted" />}
                          <span className="font-semibold text-text-primary capitalize text-body">{role}</span>
                        </div>
                        {newRole === role && (
                          <CheckCircle2 size={18} className="text-accent" />
                        )}
                      </div>
                      <div className="text-caption text-text-muted mt-1 ml-7">
                        {role === 'god' && 'Full access to all features and user management'}
                        {role === 'admin' && 'Admin access to team features'}
                        {role === 'user' && 'Standard user access'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setEditingUser(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUserRole}
                  loading={loading}
                  className="flex-1"
                >
                  Update Role
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Team Plan Modal */}
        <Modal
          isOpen={!!editingTeam}
          onClose={() => setEditingTeam(null)}
          title="Change Team Plan"
        >
          {editingTeam && (
            <div className="space-y-4">
              <div className="bg-bg-cardAlt rounded-card p-4 border border-border">
                <div className="text-caption text-text-muted mb-1">Team</div>
                <div className="font-semibold text-text-primary text-body">{editingTeam.name}</div>
                <div className="text-caption text-text-muted font-mono">{editingTeam.slug}</div>
              </div>

              <div>
                <label className="block text-body font-semibold text-text-primary mb-2">
                  New Plan
                </label>
                <div className="space-y-2">
                  {(['pro', 'basic', 'trial', 'legacy'] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setNewPlan(plan)}
                      className={`w-full p-3 rounded-card border-2 text-left transition-all ${
                        newPlan === plan
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {plan === 'pro' && <ArrowUp size={18} className="text-status-success" />}
                          {plan === 'basic' && <Building2 size={18} className="text-text-muted" />}
                          {plan === 'trial' && <ArrowDown size={18} className="text-status-warning" />}
                          {plan === 'legacy' && <Building2 size={18} className="text-text-muted" />}
                          <span className="font-semibold text-text-primary capitalize text-body">{plan}</span>
                        </div>
                        {newPlan === plan && (
                          <CheckCircle2 size={18} className="text-accent" />
                        )}
                      </div>
                      <div className="text-caption text-text-muted mt-1 ml-7">
                        {plan === 'pro' && '10 contributors, all features enabled'}
                        {plan === 'basic' && '2 contributors, basic features'}
                        {plan === 'trial' && '2 contributors, trial period'}
                        {plan === 'legacy' && '2 contributors, legacy plan'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setEditingTeam(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTeamPlan}
                  loading={loading}
                  className="flex-1"
                >
                  Update Plan
                </Button>
              </div>
            </div>
          )}
        </Modal>
    </div>
  );
};

