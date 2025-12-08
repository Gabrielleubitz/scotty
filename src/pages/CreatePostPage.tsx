import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Video, Tag, Calendar, Settings, Save } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileUpload } from '../components/ui/FileUpload';
import { MultiLanguageEditor } from '../components/MultiLanguageEditor';
import { LanguageSettings as LanguageSettingsModal } from '../components/LanguageSettings';
import { DEFAULT_LANGUAGE_SETTINGS } from '../lib/languages';
import { LanguageSettings, Segment } from '../types';

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTeam, loading: teamLoading } = useTeam();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>(DEFAULT_LANGUAGE_SETTINGS);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    translations: {} as { [key: string]: { title: string; content: string; isAIGenerated?: boolean } },
    videoUrl: '',
    imageUrl: '',
    category: 'NOTIFICATION',
    segmentId: null as string | null,
    enableComments: false,
    enableReactions: false,
    openLinksInNewTab: true,
    enableSocialSharing: true,
    pinToTop: false,
    autoOpenWidget: false,
    expirationDate: '',
  });

  useEffect(() => {
    // Wait for auth and team to finish loading before making redirect decisions
    if (authLoading || teamLoading) {
      return;
    }

    // God users can create posts even without a currentTeam
    // They'll need to select a team or we'll use the first available team
    if (!currentTeam && user?.role !== 'god') {
      navigate('/admin');
      return;
    }

    // For god users without a team, we'll still allow them to proceed
    // They can create posts but may need to select a team
    if (currentTeam) {
      loadSegments();
      loadLanguageSettings();
    }
  }, [currentTeam, navigate, user, authLoading, teamLoading]);

  const loadSegments = async () => {
    if (!currentTeam?.id) return;
    try {
      const fetchedSegments = await apiService.getSegments(currentTeam!.id);
      setSegments(fetchedSegments);
    } catch (error) {
      console.error('Failed to load segments:', error);
    }
  };

  const loadLanguageSettings = async () => {
    if (!currentTeam?.id) return;
    try {
      const settings = await apiService.getLanguageSettings(currentTeam!.id);
      if (settings) {
        setLanguageSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load language settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingFile) return;

    // For god users without a team, try to get or create a default team
    let teamId = currentTeam?.id;
    if (!teamId && user?.role === 'god') {
      try {
        // Try to get user's teams or create a default one
        const { teamService } = await import('../lib/teams');
        const teams = await teamService.getUserTeams(user.id);
        if (teams.length > 0) {
          teamId = teams[0].id;
        } else {
          const defaultTeam = await teamService.getOrCreateDefaultTeam(user.id, user.name);
          teamId = defaultTeam.id;
        }
      } catch (error) {
        console.error('Failed to get/create team for god user:', error);
        alert('Failed to create post: No team available. Please create a team first.');
        return;
      }
    }

    if (!teamId) {
      alert('Please select a team first.');
      return;
    }

    setLoading(true);

    try {
      await apiService.createChangelogPost({
        ...formData,
        category: formData.category
      }, teamId);
      navigate('/admin');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    try {
      const fileName = `changelog/${Date.now()}-${file.name}`;
      const downloadURL = await apiService.uploadFile(file, fileName);
      setFormData({ ...formData, imageUrl: downloadURL });
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileRemove = () => {
    setFormData({ ...formData, imageUrl: '' });
  };

  // Show loading state while auth or team is loading
  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For non-god users without a team, redirect
  if (!currentTeam && user?.role !== 'god') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Update</h1>
              <p className="text-sm text-gray-500 mt-1">Share product updates with your users</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Content Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
            <MultiLanguageEditor
              title={formData.title}
              content={formData.content}
              onTitleChange={(title) => setFormData({ ...formData, title })}
              onContentChange={(content) => setFormData({ ...formData, content })}
              translations={formData.translations}
              onTranslationsChange={(translations) => setFormData({ ...formData, translations })}
              languageSettings={languageSettings}
            />
          </div>

          {/* Media Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Image size={20} className="mr-2" />
              Media
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                <Input
                  id="imageUrl"
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Paste image URL or upload below"
                  className="block w-full"
                />
                <div className="mt-2">
                  <FileUpload 
                    onFileUpload={handleFileUpload} 
                    onFileRemove={handleFileRemove} 
                    currentImageUrl={formData.imageUrl} 
                    uploading={uploadingFile} 
                  />
                </div>
              </div>

              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Video size={16} className="mr-2" />
                  Video URL
                </label>
                <Input
                  id="videoUrl"
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="YouTube or MP4 video URL"
                  className="block w-full"
                />
                <p className="mt-1 text-xs text-gray-500">Supports YouTube links and direct MP4 URLs</p>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings size={20} className="mr-2" />
              Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                >
                  <option value="NOTIFICATION">📢 Notification</option>
                  <option value="FEATURE">✨ Feature</option>
                  <option value="IMPROVEMENT">🚀 Improvement</option>
                  <option value="BUGFIX">🐛 Bug Fix</option>
                </select>
              </div>

              <div>
                <label htmlFor="segmentId" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Tag size={16} className="mr-2" />
                  Target Segment
                </label>
                <select
                  id="segmentId"
                  value={formData.segmentId || ''}
                  onChange={(e) => setFormData({ ...formData, segmentId: e.target.value || null })}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                >
                  <option value="">All Users</option>
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name} ({segment.domain})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Optional: Target specific domains</p>
              </div>

              <div>
                <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar size={16} className="mr-2" />
                  Expiration Date
                </label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="block w-full"
                />
                <p className="mt-1 text-xs text-gray-500">Optional: Auto-hide after this date</p>
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  id="enableComments"
                  type="checkbox"
                  checked={formData.enableComments}
                  onChange={(e) => setFormData({ ...formData, enableComments: e.target.checked })}
                  className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <label htmlFor="enableComments" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Enable Comments
                </label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  id="enableReactions"
                  type="checkbox"
                  checked={formData.enableReactions}
                  onChange={(e) => setFormData({ ...formData, enableReactions: e.target.checked })}
                  className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <label htmlFor="enableReactions" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Enable Reactions
                </label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  id="openLinksInNewTab"
                  type="checkbox"
                  checked={formData.openLinksInNewTab}
                  onChange={(e) => setFormData({ ...formData, openLinksInNewTab: e.target.checked })}
                  className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <label htmlFor="openLinksInNewTab" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Open Links in New Tab
                </label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  id="enableSocialSharing"
                  type="checkbox"
                  checked={formData.enableSocialSharing}
                  onChange={(e) => setFormData({ ...formData, enableSocialSharing: e.target.checked })}
                  className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <label htmlFor="enableSocialSharing" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Enable Social Sharing
                </label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  id="pinToTop"
                  type="checkbox"
                  checked={formData.pinToTop}
                  onChange={(e) => setFormData({ ...formData, pinToTop: e.target.checked })}
                  className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <label htmlFor="pinToTop" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Pin to Top
                </label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  id="autoOpenWidget"
                  type="checkbox"
                  checked={formData.autoOpenWidget}
                  onChange={(e) => setFormData({ ...formData, autoOpenWidget: e.target.checked })}
                  className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <label htmlFor="autoOpenWidget" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Auto-open Widget
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin')} 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gray-900 hover:bg-gray-800 text-white flex items-center" 
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
