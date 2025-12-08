import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit2, Save, X, Crown, Shield, User, Eye, CreditCard, AlertCircle, Flag, Key, Copy, Trash } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { teamService } from '../lib/teams';
import { billingService } from '../lib/billing';
import { getPlan, countContributors, getContributorLimitMessage } from '../lib/plans';
import { 
  FeatureKey, 
  PLAN_FEATURES, 
  isFeatureEnabledForTeam, 
  getFeatureDisplayName, 
  getFeatureDescription 
} from '../lib/features';
import { featureOverrideService } from '../lib/feature-overrides';
import { apiKeyService } from '../lib/api-keys';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { TeamMember, APIKey } from '../types';

export const TeamSettings: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentTeam, userRole, refreshTeam, canManageTeam } = useTeam();
  const { user } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [members, setMembers] = useState<(TeamMember & { user?: any })[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('contributor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isStripeConfigured, setIsStripeConfigured] = useState<boolean | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [featureOverrides, setFeatureOverrides] = useState<any[]>([]);
  const [showFeatureFlags, setShowFeatureFlags] = useState(false);
  const [featureFlagsLoading, setFeatureFlagsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showAPIKeys, setShowAPIKeys] = useState(false);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentTeam) {
      loadTeamData();
      checkStripeConfig();
      loadFeatureOverrides();
      loadAPIKeys();
    }
  }, [isOpen, currentTeam]);

  const loadFeatureOverrides = async () => {
    if (!currentTeam) return;
    try {
      const overrides = await featureOverrideService.getTeamOverrides(currentTeam.id);
      setFeatureOverrides(overrides);
    } catch (error) {
      console.error('Failed to load feature overrides:', error);
    }
  };

  const handleToggleFeature = async (featureKey: FeatureKey, enabled: boolean) => {
    if (!currentTeam) return;
    
    setFeatureFlagsLoading(true);
    try {
      await featureOverrideService.setFeatureOverride(currentTeam.id, featureKey, enabled);
      await loadFeatureOverrides();
    } catch (error) {
      console.error('Failed to toggle feature:', error);
      alert('Failed to update feature flag. Please try again.');
    } finally {
      setFeatureFlagsLoading(false);
    }
  };

  const loadAPIKeys = async () => {
    if (!currentTeam) return;
    try {
      const keys = await apiKeyService.getTeamAPIKeys(currentTeam.id);
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleCreateAPIKey = async () => {
    if (!currentTeam || !newKeyName.trim()) return;

    setApiKeysLoading(true);
    try {
      const { key, apiKey } = await apiKeyService.createAPIKey(currentTeam.id, newKeyName.trim());
      setNewKeyValue(key);
      await loadAPIKeys();
      setNewKeyName('');
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key. Please try again.');
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleRevokeAPIKey = async (apiKeyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? It will stop working immediately.')) return;

    setApiKeysLoading(true);
    try {
      await apiKeyService.revokeAPIKey(apiKeyId);
      await loadAPIKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Failed to revoke API key. Please try again.');
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('API key copied to clipboard!');
  };

  const checkStripeConfig = async () => {
    try {
      const configured = await billingService.isStripeConfigured();
      setIsStripeConfigured(configured);
    } catch {
      setIsStripeConfigured(false);
    }
  };

  const loadTeamData = async () => {
    if (!currentTeam) return;

    setTeamName(currentTeam.name);
    setLoading(true);
    try {
      const teamMembers = await teamService.getTeamMembers(currentTeam.id);
      setMembers(teamMembers);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!currentTeam || !canManageTeam) return;

    setLoading(true);
    try {
      await teamService.updateTeam(currentTeam.id, { name: teamName });
      await refreshTeam();
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update team name:', error);
      alert('Failed to update team name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!currentTeam || !canManageTeam || !inviteEmail) return;

    setLoading(true);
    try {
      // Find user by email
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', inviteEmail.toLowerCase().trim()));
      const userSnapshot = await getDocs(q);
      
      if (userSnapshot.empty) {
        // User doesn't exist - in production, you'd send an invite email
        // For now, we'll show a message and create a placeholder
        alert(
          'User not found. In production, this would send an email invite. ' +
          'For now, the user needs to sign up first, then you can add them to the team.'
        );
        setIsInviteModalOpen(false);
        setInviteEmail('');
        return;
      }
      
      // User exists, add them to the team
      const userDoc = userSnapshot.docs[0];
      const userId = userDoc.id;
      
      // Check if user is already a member
      const existingRole = await teamService.getUserTeamRole(userId, currentTeam.id);
      if (existingRole) {
        alert('User is already a member of this team.');
        setIsInviteModalOpen(false);
        setInviteEmail('');
        return;
      }
      
      // Add user to team (this will check contributor limits)
      await teamService.addTeamMember(currentTeam.id, userId, inviteRole);
      
      // Reload team data
      await loadTeamData();
      
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteError(null);
      alert('Member added successfully!');
    } catch (error) {
      console.error('Failed to invite member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite member. Please try again.';
      setInviteError(errorMessage);
      // Don't close modal if it's a contributor limit error
      if (!errorMessage.includes('allows') || !errorMessage.includes('contributor')) {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (membershipId: string, newRole: TeamMember['role']) => {
    if (!canManageTeam || !currentTeam) return;

    setLoading(true);
    try {
      await teamService.updateTeamMemberRole(membershipId, newRole, currentTeam.id);
      await loadTeamData();
    } catch (error) {
      console.error('Failed to update role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (membershipId: string, memberUserId: string) => {
    if (!canManageTeam) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    // Don't allow removing the owner
    const member = members.find(m => m.id === membershipId);
    if (member?.role === 'owner') {
      alert('Cannot remove the team owner');
      return;
    }

    setLoading(true);
    try {
      await teamService.removeTeamMember(membershipId);
      await loadTeamData();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-600" />;
      case 'admin':
        return <Shield size={16} className="text-blue-600" />;
      case 'contributor':
        return <User size={16} className="text-green-600" />;
      case 'viewer':
        return <Eye size={16} className="text-gray-600" />;
    }
  };

  const getRoleLabel = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'contributor':
        return 'Contributor';
      case 'viewer':
        return 'Viewer';
    }
  };

  const handleUpgradeToPro = async () => {
    if (!currentTeam) return;

    setBillingLoading(true);
    try {
      const redirectUrl = await billingService.createCheckoutSession(currentTeam.id, 'pro');
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      alert(errorMessage);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!currentTeam) return;

    const targetPlan = currentTeam.subscriptionPlan === 'pro' ? 'basic' : 'pro';
    setBillingLoading(true);
    try {
      const redirectUrl = await billingService.createCheckoutSession(currentTeam.id, targetPlan);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      alert(errorMessage);
    } finally {
      setBillingLoading(false);
    }
  };

  if (!currentTeam) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Team Settings" size="lg">
        <div className="space-y-6">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            {isEditingName && canManageTeam ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Team name"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={loading || !teamName.trim()}
                  size="sm"
                >
                  <Save size={16} />
                </Button>
                <Button
                  onClick={() => {
                    setTeamName(currentTeam.name);
                    setIsEditingName(false);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">{currentTeam.name}</span>
                {canManageTeam && (
                  <Button
                    onClick={() => setIsEditingName(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 size={16} className="mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Team slug: <code className="bg-gray-100 px-1 rounded">{currentTeam.slug}</code>
            </p>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Members</h3>
              {canManageTeam && (
                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  size="sm"
                >
                  <UserPlus size={16} className="mr-2" />
                  Invite Member
                </Button>
              )}
            </div>

            {loading && members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No members yet</div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getRoleIcon(member.role)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.user?.name || member.user?.displayName || member.user?.email || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canManageTeam && member.role !== 'owner' ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value as TeamMember['role'])}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            disabled={loading}
                          >
                            <option value="admin">Admin</option>
                            <option value="contributor">Contributor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.id, member.userId)}
                            className="text-red-600 hover:text-red-800"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {getRoleLabel(member.role)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Section */}
          {canManageTeam && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard size={20} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Billing</h3>
              </div>
              
              {isStripeConfigured === false ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">Billing not configured</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Contact support to manage billing and upgrade your plan.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Current Plan</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {currentTeam.subscriptionPlan || currentTeam.plan}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-sm font-medium capitalize">
                          {currentTeam.subscriptionStatus || 'inactive'}
                        </p>
                      </div>
                    </div>
                    
                    {currentTeam.subscriptionRenewsAt && (
                      <div>
                        <p className="text-sm text-gray-600">Renews on</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(currentTeam.subscriptionRenewsAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">Contributors</p>
                      <p className="text-sm text-gray-600">
                        {countContributors(members)} / {getPlan(currentTeam, user).maxContributors}
                      </p>
                    </div>
                    {countContributors(members) >= getPlan(currentTeam, user).maxContributors && (
                      <p className="text-sm text-blue-800 mt-2">
                        {getContributorLimitMessage(currentTeam)}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {/* Don't show upgrade button for god users - they already have pro access */}
                    {user?.role !== 'god' && getPlan(currentTeam, user).name !== 'Pro' && (
                      <Button
                        onClick={handleUpgradeToPro}
                        disabled={billingLoading}
                        className="flex-1"
                      >
                        {billingLoading ? 'Loading...' : 'Upgrade to Pro'}
                      </Button>
                    )}
                    {/* Show change plan button for pro users or god users */}
                    {(user?.role === 'god' || getPlan(currentTeam, user).name === 'Pro') && (
                      <Button
                        onClick={handleChangePlan}
                        variant="outline"
                        disabled={billingLoading}
                        className="flex-1"
                      >
                        Change Plan
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feature Flags Section - Only visible to owner/admin and when env flag is set */}
          {canManageTeam && import.meta.env.VITE_ENABLE_FEATURE_FLAGS === 'true' && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Flag size={20} className="text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Feature Flags</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFeatureFlags(!showFeatureFlags)}
                >
                  {showFeatureFlags ? 'Hide' : 'Show'}
                </Button>
              </div>

              {showFeatureFlags && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Override feature availability for this team. Changes take effect immediately.
                  </p>
                  {Object.keys(PLAN_FEATURES.pro).map((featureKey) => {
                    const key = featureKey as FeatureKey;
                    const planType = (currentTeam.subscriptionPlan || currentTeam.plan || 'basic') as keyof typeof PLAN_FEATURES;
                    const isInPlan = (PLAN_FEATURES[planType] || []).includes(key);
                    const override = featureOverrides.find(o => o.featureKey === key);
                    const isEnabled = isFeatureEnabledForTeam(currentTeam, featureOverrides, key, user);
                    
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {getFeatureDisplayName(key)}
                              </h4>
                              {isInPlan && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  In Plan
                                </span>
                              )}
                              {override && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  Override
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {getFeatureDescription(key)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Status: {isEnabled ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => handleToggleFeature(key, e.target.checked)}
                              disabled={featureFlagsLoading}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* API Keys Section */}
          {canManageTeam && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Key size={20} className="text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAPIKeys(!showAPIKeys)}
                  >
                    {showAPIKeys ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateKeyModalOpen(true)}
                  >
                    <Key size={16} className="mr-2" />
                    Create Key
                  </Button>
                </div>
              </div>

              {showAPIKeys && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    API keys allow external systems to access your team's data programmatically. Keep them secure and never share them publicly.
                  </p>
                  
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Key size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No API keys yet. Create one to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-900">{key.name}</h4>
                                {key.lastUsedAt && (
                                  <span className="text-xs text-gray-500">
                                    Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                Created: {new Date(key.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRevokeAPIKey(key.id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={apiKeysLoading}
                              title="Revoke key"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Team Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p>Plan: <span className="font-medium text-gray-700 capitalize">{currentTeam.subscriptionPlan || currentTeam.plan}</span></p>
              <p className="mt-1">Your role: <span className="font-medium text-gray-700 capitalize">{userRole}</span></p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create API Key Modal */}
      <Modal
        isOpen={isCreateKeyModalOpen}
        onClose={() => {
          setIsCreateKeyModalOpen(false);
          setNewKeyName('');
          setNewKeyValue(null);
        }}
        title="Create API Key"
      >
        <div className="space-y-4">
          {newKeyValue ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-2">
                  API Key Created Successfully!
                </p>
                <p className="text-xs text-green-700 mb-3">
                  Copy this key now. You won't be able to see it again.
                </p>
                <div className="bg-white rounded border border-green-300 p-3 flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-900 break-all flex-1 mr-2">{newKeyValue}</code>
                  <button
                    onClick={() => handleCopyKey(newKeyValue)}
                    className="text-green-600 hover:text-green-800"
                    title="Copy key"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setIsCreateKeyModalOpen(false);
                    setNewKeyName('');
                    setNewKeyValue(null);
                  }}
                >
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                label="Key Name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
              />
              <p className="text-sm text-gray-600">
                Give this key a descriptive name to help you identify it later.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateKeyModalOpen(false);
                    setNewKeyName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAPIKey}
                  disabled={!newKeyName.trim() || apiKeysLoading}
                >
                  {apiKeysLoading ? 'Creating...' : 'Create Key'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="user@example.com"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => {
                setInviteRole(e.target.value as TeamMember['role']);
                setInviteError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="admin">Admin</option>
              <option value="contributor">Contributor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {inviteError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{inviteError}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={!inviteEmail.trim() || loading}>
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

