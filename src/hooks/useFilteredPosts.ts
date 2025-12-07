import { useMemo } from 'react';
import { ChangelogPost } from '../types';

export const useFilteredPosts = (posts: ChangelogPost[], search: string) => {
  const filteredPosts = useMemo(() => {
    if (!search.trim()) {
      return posts;
    }

    const searchLower = search.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower)
    );
  }, [posts, search]);

  return { filteredPosts };
};