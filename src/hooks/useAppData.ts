import { useState, useEffect, useCallback } from "react";
import { api } from "../api/reddit";
import { storage } from "../utils/storage";
import type { RedditPost, FilterOptions, BookmarkedPost } from "../types";

export const useAppData = () => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);

  const [subreddit, setSubreddit] = useState(() => storage.getSubreddit());
  const [sort, setSort] = useState(() => storage.getSort());
  const [filters, setFilters] = useState<FilterOptions>(() => storage.getFilters());

  useEffect(() => {
    setBookmarks(storage.getBookmarks());
  }, []);

  useEffect(() => {
    storage.saveFilters(filters);
  }, [filters]);

  useEffect(() => {
    storage.saveSubreddit(subreddit);
  }, [subreddit]);

  useEffect(() => {
    storage.saveSort(sort);
  }, [sort]);

  const fetchPosts = useCallback(
    async (reset = false, afterToken?: string) => {
      try {
        setLoading(true);
        setError(null);

        const currentAfter = afterToken !== undefined ? afterToken : after;
        const data = await api.fetchPosts({
          subreddit,
          sort,
          after: !reset ? currentAfter || undefined : undefined,
          filters,
        });

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setAfter(data.after || null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [subreddit, sort, filters, after]
  );

  useEffect(() => {
    fetchPosts(true);
    setAfter(null);
  }, [subreddit, sort, filters]);

  const loadMorePosts = useCallback(() => {
    if (after && !loading) {
      fetchPosts(false, after);
    }
  }, [after, loading, fetchPosts]);

  const handleBookmarkToggle = useCallback((post: RedditPost) => {
    if (storage.isBookmarked(post.id)) {
      storage.removeBookmark(post.id);
    } else {
      storage.addBookmark(post);
    }
    setBookmarks(storage.getBookmarks());
  }, []);

  const handleFavoriteToggle = useCallback(
    (subredditName: string) => {
      const currentFavorites = filters.favoriteSubreddits;
      const isCurrentlyFavorite = currentFavorites.includes(subredditName.toLowerCase());

      const newFavorites = isCurrentlyFavorite
        ? currentFavorites.filter(fav => fav !== subredditName.toLowerCase())
        : [...currentFavorites, subredditName.toLowerCase()];

      setFilters({ ...filters, favoriteSubreddits: newFavorites });
    },
    [filters]
  );

  return {
    posts,
    loading,
    error,
    after,
    bookmarks,
    subreddit,
    sort,
    filters,
    setSubreddit,
    setSort,
    setFilters,
    fetchPosts,
    loadMorePosts,
    handleBookmarkToggle,
    handleFavoriteToggle,
  };
};