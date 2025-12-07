import React, { useState, useEffect } from 'react';
import { Crown, Search, User, Building2, Shield, UserCheck, UserX, ArrowUp, ArrowDown, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User as UserType, Team } from '../types';
import { godAdminService } from '../lib/god-admin';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
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
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown size={24} className="text-purple-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">God Admin Panel</h1>
              <p className="text-sm text-gray-600">Manage users, roles, and team plans</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 size={20} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => {
                setSelectedTab('users');
                setSearchTerm('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'users'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'teams'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full" />
                            ) : (
                              <User size={20} className="text-gray-500" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.displayName || user.name}</div>
                            <div className="text-sm text-gray-500">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {user.role === 'god' && <Crown size={12} className="mr-1" />}
                          {user.role === 'admin' && <Shield size={12} className="mr-1" />}
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setNewRole(user.role as 'god' | 'admin' | 'user');
                          }}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
          </div>
        )}

        {/* Teams Tab */}
        {selectedTab === 'teams' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Teams</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Team Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono">{team.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPlanBadgeColor(team.subscriptionPlan || team.plan)}`}>
                          {(team.subscriptionPlan || team.plan).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 capitalize">
                          {team.subscriptionStatus || 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(team.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTeam(team);
                            setNewPlan((team.subscriptionPlan || team.plan) as 'basic' | 'pro' | 'trial' | 'legacy');
                          }}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
          </div>
        )}

        {/* Edit User Role Modal */}
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title="Change User Role"
        >
          {editingUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">User</div>
                <div className="font-semibold text-gray-900">{editingUser.displayName || editingUser.name}</div>
                <div className="text-sm text-gray-500">{editingUser.email}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Role
                </label>
                <div className="space-y-2">
                  {(['god', 'admin', 'user'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewRole(role)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        newRole === role
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {role === 'god' && <Crown size={18} className="text-purple-600" />}
                          {role === 'admin' && <Shield size={18} className="text-blue-600" />}
                          {role === 'user' && <User size={18} className="text-gray-600" />}
                          <span className="font-semibold text-gray-900 capitalize">{role}</span>
                        </div>
                        {newRole === role && (
                          <CheckCircle2 size={18} className="text-gray-900" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-7">
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
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUserRole}
                  loading={loading}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
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
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Team</div>
                <div className="font-semibold text-gray-900">{editingTeam.name}</div>
                <div className="text-sm text-gray-500 font-mono">{editingTeam.slug}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Plan
                </label>
                <div className="space-y-2">
                  {(['pro', 'basic', 'trial', 'legacy'] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setNewPlan(plan)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        newPlan === plan
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {plan === 'pro' && <ArrowUp size={18} className="text-green-600" />}
                          {plan === 'basic' && <Building2 size={18} className="text-gray-600" />}
                          {plan === 'trial' && <ArrowDown size={18} className="text-yellow-600" />}
                          {plan === 'legacy' && <Building2 size={18} className="text-gray-600" />}
                          <span className="font-semibold text-gray-900 capitalize">{plan}</span>
                        </div>
                        {newPlan === plan && (
                          <CheckCircle2 size={18} className="text-gray-900" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-7">
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
                  variant="outline"
                  onClick={() => setEditingTeam(null)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTeamPlan}
                  loading={loading}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Update Plan
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

