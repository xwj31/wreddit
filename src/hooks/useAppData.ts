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
  const [filters, setFilters] = useState<FilterOptions>(() =>
    storage.getFilters()
  );

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

  // Helper function to determine if we should use multi-subreddit feed
  const shouldUseFavoritesFeed = useCallback(() => {
    return subreddit === "home" && filters.favoriteSubreddits.length > 0;
  }, [subreddit, filters.favoriteSubreddits]);

  // Function to fetch from multiple subreddits and combine results
  const fetchMultipleSubreddits = useCallback(
    async (subreddits: string[], reset = false, afterToken?: string) => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from each subreddit concurrently
        const promises = subreddits.map(async (sub) => {
          try {
            const data = await api.fetchPosts({
              subreddit: sub,
              sort,
              after: !reset && afterToken ? afterToken : undefined,
              filters: { ...filters, favoriteSubreddits: [] }, // Don't filter by favorites when fetching individual subs
            });
            return data.posts;
          } catch (err) {
            console.warn(`Failed to fetch from r/${sub}:`, err);
            return [];
          }
        });

        const results = await Promise.all(promises);
        const allPosts = results.flat();

        // Sort by created_utc (newest first) and remove duplicates
        const uniquePosts = allPosts
          .filter(
            (post, index, self) =>
              index === self.findIndex((p) => p.id === post.id)
          )
          .sort((a, b) => b.created_utc - a.created_utc);

        // Limit to reasonable number of posts
        const limitedPosts = uniquePosts.slice(0, reset ? 25 : 50);

        if (reset) {
          setPosts(limitedPosts);
        } else {
          setPosts((prev) => {
            const combined = [...prev, ...limitedPosts];
            // Remove duplicates again after combining
            return combined.filter(
              (post, index, self) =>
                index === self.findIndex((p) => p.id === post.id)
            );
          });
        }

        // For multi-subreddit feeds, we don't have a reliable "after" token
        // so we'll disable infinite scroll for now
        setAfter(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [sort, filters]
  );

  const fetchPosts = useCallback(
    async (reset = false, afterToken?: string) => {
      // Check if we should use the favorites feed
      if (shouldUseFavoritesFeed()) {
        return fetchMultipleSubreddits(
          filters.favoriteSubreddits,
          reset,
          afterToken
        );
      }

      // Original single subreddit logic
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
    [
      subreddit,
      sort,
      filters,
      after,
      shouldUseFavoritesFeed,
      fetchMultipleSubreddits,
    ]
  );

  useEffect(() => {
    fetchPosts(true);
    setAfter(null);
  }, [subreddit, sort, filters]);

  const loadMorePosts = useCallback(() => {
    // Don't allow load more for multi-subreddit feeds for now
    if (shouldUseFavoritesFeed()) {
      return;
    }

    if (after && !loading) {
      fetchPosts(false, after);
    }
  }, [after, loading, fetchPosts, shouldUseFavoritesFeed]);

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
      const isCurrentlyFavorite = currentFavorites.includes(
        subredditName.toLowerCase()
      );

      const newFavorites = isCurrentlyFavorite
        ? currentFavorites.filter((fav) => fav !== subredditName.toLowerCase())
        : [...currentFavorites, subredditName.toLowerCase()];

      setFilters({ ...filters, favoriteSubreddits: newFavorites });
    },
    [filters]
  );

  return {
    posts,
    loading,
    error,
    after: shouldUseFavoritesFeed() ? null : after, // Disable infinite scroll for multi-subreddit
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
