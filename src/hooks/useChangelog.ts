import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';
import { ChangelogPost } from '../types';
import { useTeam } from './useTeam';

export const useChangelog = () => {
  const { currentTeam } = useTeam();
  const [posts, setPosts] = useState<ChangelogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      if (!currentTeam) {
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.getChangelogPosts(currentTeam.id);
        setPosts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [currentTeam]);

  return { posts, loading, error };
};