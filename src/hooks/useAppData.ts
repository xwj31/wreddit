import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/reddit';
import { storage } from '../utils/storage';
import type { RedditPost, BookmarkedPost } from '../types';

export const useAppData = (userId: string | null) => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('all');

  useEffect(() => {
    setBookmarks(storage.getBookmarks());
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`[${userId}] Fetching posts from API...`);
      const fetchedPosts = await api.getUserPosts(userId);
      console.log(`[${userId}] API returned ${fetchedPosts.length} posts`);
      
      // Filter posts by selected subreddit if not 'all'
      const filteredPosts = selectedSubreddit === 'all' 
        ? fetchedPosts 
        : fetchedPosts.filter(p => p.subreddit.toLowerCase() === selectedSubreddit.toLowerCase());
      
      console.log(`[${userId}] After filtering by '${selectedSubreddit}': ${filteredPosts.length} posts`);
      setPosts(filteredPosts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[${userId}] Error fetching posts:`, errorMessage);
      setError(errorMessage);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedSubreddit]);

  const fetchSubreddits = useCallback(async () => {
    if (!userId) return;
    
    try {
      const userSubreddits = await api.getUserSubreddits(userId);
      setSubreddits(userSubreddits);
    } catch (err) {
      console.error('Failed to fetch subreddits:', err);
      setSubreddits([]);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPosts();
      fetchSubreddits();
    }
  }, [userId, fetchPosts, fetchSubreddits]);

  // Refetch posts when subreddits list changes
  useEffect(() => {
    if (userId && subreddits.length >= 0) {
      fetchPosts();
    }
  }, [subreddits.length, fetchPosts, userId]);

  const refreshPosts = useCallback(() => {
    return fetchPosts();
  }, [fetchPosts]);

  const handleBookmarkToggle = useCallback((post: RedditPost) => {
    if (storage.isBookmarked(post.id)) {
      storage.removeBookmark(post.id);
    } else {
      storage.addBookmark(post);
    }
    setBookmarks(storage.getBookmarks());
  }, []);

  const handleFavoriteToggle = useCallback(async (subredditName: string) => {
    if (!userId) return;
    
    try {
      const isCurrentlyFavorite = subreddits.includes(subredditName.toLowerCase());
      
      console.log(`[${userId}] Toggling subreddit: ${subredditName}, currently favorite: ${isCurrentlyFavorite}`);
      
      if (isCurrentlyFavorite) {
        console.log(`[${userId}] Removing subreddit: ${subredditName}`);
        await api.removeUserSubreddit(userId, subredditName);
        setSubreddits(prev => prev.filter(s => s !== subredditName.toLowerCase()));
      } else {
        console.log(`[${userId}] Adding subreddit: ${subredditName}`);
        await api.addUserSubreddit(userId, subredditName);
        console.log(`[${userId}] Successfully added subreddit to database`);
        setSubreddits(prev => [...prev, subredditName.toLowerCase()]);
      }
      
      console.log(`[${userId}] Refreshing posts after subreddit toggle`);
      // Refresh posts to get updated list
      await fetchPosts();
      console.log(`[${userId}] Posts refresh completed`);
    } catch (err) {
      console.error(`[${userId}] Failed to toggle favorite:`, err);
    }
  }, [userId, subreddits, fetchPosts]);

  const isFavorite = useCallback((subredditName: string): boolean => {
    return subreddits.includes(subredditName.toLowerCase());
  }, [subreddits]);

  return {
    posts,
    loading,
    error,
    bookmarks,
    subreddits,
    selectedSubreddit,
    setSelectedSubreddit,
    refreshPosts,
    handleBookmarkToggle,
    handleFavoriteToggle,
    isFavorite,
  };
};