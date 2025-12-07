import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileUpload } from '../components/ui/FileUpload';
import { MultiLanguageEditor } from '../components/MultiLanguageEditor';
import { LanguageSettings as LanguageSettingsModal } from '../components/LanguageSettings';
import { DEFAULT_LANGUAGE_SETTINGS } from '../lib/languages';
import { LanguageSettings, Segment, ChangelogPost } from '../types';

export const EditPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [post, setPost] = useState<ChangelogPost | null>(null);
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
    if (!currentTeam || !id) {
      navigate('/admin');
      return;
    }

    loadPost();
    loadSegments();
    loadLanguageSettings();
  }, [currentTeam, id, navigate]);

  const loadPost = async () => {
    if (!currentTeam?.id || !id) return;
    try {
      const posts = await apiService.getChangelogPosts(currentTeam.id);
      const foundPost = posts.find(p => p.id === id);
      if (foundPost) {
        setPost(foundPost);
        setFormData({
          title: foundPost.title,
          content: foundPost.content,
          translations: foundPost.translations || {},
          videoUrl: foundPost.videoUrl || '',
          imageUrl: foundPost.imageUrl || '',
          category: foundPost.category || 'NOTIFICATION',
          segmentId: foundPost.segmentId || null,
          enableComments: foundPost.enableComments || false,
          enableReactions: foundPost.enableReactions || false,
          openLinksInNewTab: foundPost.openLinksInNewTab ?? true,
          enableSocialSharing: foundPost.enableSocialSharing ?? true,
          pinToTop: foundPost.pinToTop || false,
          autoOpenWidget: foundPost.autoOpenWidget || false,
          expirationDate: foundPost.expirationDate ? new Date(foundPost.expirationDate).toISOString().split('T')[0] : '',
        });
      } else {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Failed to load post:', error);
      navigate('/admin');
    }
  };

  const loadSegments = async () => {
    if (!currentTeam?.id) return;
    try {
      const fetchedSegments = await apiService.getSegments(currentTeam.id);
      setSegments(fetchedSegments);
    } catch (error) {
      console.error('Failed to load segments:', error);
    }
  };

  const loadLanguageSettings = async () => {
    if (!currentTeam?.id) return;
    try {
      const settings = await apiService.getLanguageSettings(currentTeam.id);
      if (settings) {
        setLanguageSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load language settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingFile || !currentTeam || !id) return;

    setLoading(true);

    try {
      await apiService.updateChangelogPost(id, {
        ...formData,
        category: formData.category
      }, currentTeam.id);
      navigate('/admin');
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post. Please try again.');
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

  if (!currentTeam || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Admin Dashboard
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Post</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter post title"
              required
              className="block w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
            <MultiLanguageEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              translations={formData.translations}
              onTranslationsChange={(translations) => setFormData({ ...formData, translations })}
              currentTeamId={currentTeam.id}
              languageSettings={languageSettings}
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
            <Input
              id="imageUrl"
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="Optional image URL"
              className="block w-full"
            />
            <FileUpload 
              onFileUpload={handleFileUpload} 
              onFileRemove={handleFileRemove} 
              currentImageUrl={formData.imageUrl} 
              uploading={uploadingFile} 
            />
          </div>

          <div>
            <label htmlFor="videoUrl" className="block text-sm font-semibold text-gray-700 mb-1">Video URL (YouTube or MP4)</label>
            <Input
              id="videoUrl"
              type="text"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="Optional video URL"
              className="block w-full"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            >
              <option value="NOTIFICATION">Notification</option>
              <option value="FEATURE">Feature</option>
              <option value="IMPROVEMENT">Improvement</option>
              <option value="BUGFIX">Bugfix</option>
            </select>
          </div>

          <div>
            <label htmlFor="segmentId" className="block text-sm font-semibold text-gray-700 mb-1">Target Segment (Optional)</label>
            <select
              id="segmentId"
              value={formData.segmentId || ''}
              onChange={(e) => setFormData({ ...formData, segmentId: e.target.value || null })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            >
              <option value="">No Segment (All Users)</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name} ({segment.domain})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="expirationDate" className="block text-sm font-semibold text-gray-700 mb-1">Expiration Date (Optional)</label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="block w-full"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                id="enableComments"
                type="checkbox"
                checked={formData.enableComments}
                onChange={(e) => setFormData({ ...formData, enableComments: e.target.checked })}
                className="h-4 w-4 text-gray-600 border-gray-300 rounded"
              />
              <label htmlFor="enableComments" className="ml-2 block text-sm text-gray-900">Enable Comments</label>
            </div>
            <div className="flex items-center">
              <input
                id="enableReactions"
                type="checkbox"
                checked={formData.enableReactions}
                onChange={(e) => setFormData({ ...formData, enableReactions: e.target.checked })}
                className="h-4 w-4 text-gray-600 border-gray-300 rounded"
              />
              <label htmlFor="enableReactions" className="ml-2 block text-sm text-gray-900">Enable Reactions</label>
            </div>
            <div className="flex items-center">
              <input
                id="openLinksInNewTab"
                type="checkbox"
                checked={formData.openLinksInNewTab}
                onChange={(e) => setFormData({ ...formData, openLinksInNewTab: e.target.checked })}
                className="h-4 w-4 text-gray-600 border-gray-300 rounded"
              />
              <label htmlFor="openLinksInNewTab" className="ml-2 block text-sm text-gray-900">Open Links in New Tab</label>
            </div>
            <div className="flex items-center">
              <input
                id="enableSocialSharing"
                type="checkbox"
                checked={formData.enableSocialSharing}
                onChange={(e) => setFormData({ ...formData, enableSocialSharing: e.target.checked })}
                className="h-4 w-4 text-gray-600 border-gray-300 rounded"
              />
              <label htmlFor="enableSocialSharing" className="ml-2 block text-sm text-gray-900">Enable Social Sharing</label>
            </div>
            <div className="flex items-center">
              <input
                id="pinToTop"
                type="checkbox"
                checked={formData.pinToTop}
                onChange={(e) => setFormData({ ...formData, pinToTop: e.target.checked })}
                className="h-4 w-4 text-gray-600 border-gray-300 rounded"
              />
              <label htmlFor="pinToTop" className="ml-2 block text-sm text-gray-900">Pin to Top</label>
            </div>
            <div className="flex items-center">
              <input
                id="autoOpenWidget"
                type="checkbox"
                checked={formData.autoOpenWidget}
                onChange={(e) => setFormData({ ...formData, autoOpenWidget: e.target.checked })}
                className="h-4 w-4 text-gray-600 border-gray-300 rounded"
              />
              <label htmlFor="autoOpenWidget" className="ml-2 block text-sm text-gray-900">Auto-open Widget</label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
              className="bg-gray-900 hover:bg-gray-800 text-white" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
    </div>
  );
};

