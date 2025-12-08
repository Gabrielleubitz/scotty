import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Video, Tag, Calendar, Settings, Save, LayoutList } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { FileUpload } from '../components/ui/FileUpload';
import { MultiLanguageEditor } from '../components/MultiLanguageEditor';
import { LanguageSettings as LanguageSettingsModal } from '../components/LanguageSettings';
import { DEFAULT_LANGUAGE_SETTINGS } from '../lib/languages';
import { LanguageSettings, Segment } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Label } from '../components/ui/Label';

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
    status: 'published' as 'draft' | 'published' | 'scheduled',
    enableComments: false,
    enableReactions: false,
    openLinksInNewTab: true,
    enableSocialSharing: true,
    pinToTop: false,
    autoOpenWidget: false,
    expirationDate: '',
  });

  useEffect(() => {
    if (authLoading || teamLoading) {
      return;
    }

    if (!currentTeam && user?.role !== 'god') {
      navigate('/admin');
      return;
    }

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

    let teamId = currentTeam?.id;
    if (!teamId && user?.role === 'god') {
      try {
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

  if (authLoading || teamLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-body text-text-muted">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!currentTeam && user?.role !== 'god') {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-body text-text-muted">Loading team...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="text-text-muted hover:text-text-primary"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-h1 text-text-primary mb-2">Create New Update</h1>
          <p className="text-body text-text-muted">Share product updates with your users</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LayoutList size={20} className="mr-2 text-accent" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiLanguageEditor
                title={formData.title}
                content={formData.content}
                onTitleChange={(title) => setFormData({ ...formData, title })}
                onContentChange={(content) => setFormData({ ...formData, content })}
                translations={formData.translations}
                onTranslationsChange={(translations) => setFormData({ ...formData, translations })}
                languageSettings={languageSettings}
              />
            </CardContent>
          </Card>

          {/* Media Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image size={20} className="mr-2 text-accent" />
                Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">Image</Label>
                <Input
                  id="imageUrl"
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Paste image URL or upload below"
                  className="mt-1"
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
                <Label htmlFor="videoUrl" className="flex items-center">
                  <Video size={16} className="mr-2" />
                  Video URL
                </Label>
                <Input
                  id="videoUrl"
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="YouTube or MP4 video URL"
                  className="mt-1"
                />
                <p className="mt-1 text-caption text-text-muted">Supports YouTube links and direct MP4 URLs</p>
              </div>
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings size={20} className="mr-2 text-accent" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTIFICATION">📢 Notification</SelectItem>
                    <SelectItem value="FEATURE">✨ Feature</SelectItem>
                    <SelectItem value="IMPROVEMENT">🚀 Improvement</SelectItem>
                    <SelectItem value="BUGFIX">🐛 Bug Fix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="segmentId" className="flex items-center">
                  <Tag size={16} className="mr-2" />
                  Target Segment
                </Label>
                <Select
                  value={formData.segmentId || ''}
                  onValueChange={(value) => setFormData({ ...formData, segmentId: value || null })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Users</SelectItem>
                    {segments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.domain})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-caption text-text-muted">Optional: Target specific domains</p>
              </div>

              <div>
                <Label htmlFor="expirationDate" className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  Expiration Date
                </Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="mt-1"
                />
                <p className="mt-1 text-caption text-text-muted">Optional: Auto-hide after this date</p>
              </div>
            </CardContent>
          </Card>

          {/* Options Section */}
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="enableComments"
                    checked={formData.enableComments}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableComments: !!checked })}
                  />
                  <Label htmlFor="enableComments" className="cursor-pointer">Enable Comments</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="enableReactions"
                    checked={formData.enableReactions}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableReactions: !!checked })}
                  />
                  <Label htmlFor="enableReactions" className="cursor-pointer">Enable Reactions</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="openLinksInNewTab"
                    checked={formData.openLinksInNewTab}
                    onCheckedChange={(checked) => setFormData({ ...formData, openLinksInNewTab: !!checked })}
                  />
                  <Label htmlFor="openLinksInNewTab" className="cursor-pointer">Open Links in New Tab</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="enableSocialSharing"
                    checked={formData.enableSocialSharing}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableSocialSharing: !!checked })}
                  />
                  <Label htmlFor="enableSocialSharing" className="cursor-pointer">Enable Social Sharing</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="pinToTop"
                    checked={formData.pinToTop}
                    onCheckedChange={(checked) => setFormData({ ...formData, pinToTop: !!checked })}
                  />
                  <Label htmlFor="pinToTop" className="cursor-pointer">Pin to Top</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="autoOpenWidget"
                    checked={formData.autoOpenWidget}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoOpenWidget: !!checked })}
                  />
                  <Label htmlFor="autoOpenWidget" className="cursor-pointer">Auto-open Widget</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate('/admin')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-text-primary border-t-transparent rounded-full animate-spin mr-2" />
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
    </AppShell>
  );
};
