import { useState, useEffect, useCallback } from "react";
import { api } from "../api/reddit";
import { storage } from "../utils/storage";
import type { RedditPost, FilterOptions, BookmarkedPost } from "../types";

type HomeFeedSortOption = "new" | "score" | "comments";

export const useAppData = () => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [homeFeedPage, setHomeFeedPage] = useState(0);

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

  // Get home feed settings
  const getHomeFeedSettings = useCallback((): {
    sortBy: HomeFeedSortOption;
  } => {
    try {
      const saved = localStorage.getItem("wreddit-home-feed-settings");
      return saved
        ? JSON.parse(saved)
        : { sortBy: "new" as HomeFeedSortOption };
    } catch {
      return { sortBy: "new" as HomeFeedSortOption };
    }
  }, []);

  // Helper function to determine if we should use multi-subreddit feed
  const shouldUseFavoritesFeed = useCallback(() => {
    return subreddit === "home" && filters.favoriteSubreddits.length > 0;
  }, [subreddit, filters.favoriteSubreddits]);

  // Sort posts according to home feed settings
  const sortPostsForHomeFeed = useCallback(
    (posts: RedditPost[]): RedditPost[] => {
      const settings = getHomeFeedSettings();

      return [...posts].sort((a, b) => {
        switch (settings.sortBy) {
          case "score":
            return b.score - a.score;
          case "comments":
            return b.num_comments - a.num_comments;
          case "new":
          default:
            return b.created_utc - a.created_utc;
        }
      });
    },
    [getHomeFeedSettings]
  );

  // Function to fetch from multiple subreddits and combine results
  const fetchMultipleSubreddits = useCallback(
    async (subreddits: string[], reset = false, page?: number) => {
      try {
        setLoading(true);
        setError(null);

        const currentPage = page !== undefined ? page : homeFeedPage;
        
        // Fetch from each subreddit with built-in spacing via the RequestQueue
        // The API client already handles request spacing and caching
        const promises = subreddits.map(async (sub) => {
          try {
            const data = await api.fetchPosts({
              subreddit: sub,
              sort,
              after: !reset && currentPage > 0 ? `t3_page${currentPage}` : undefined,
              filters: { ...filters, favoriteSubreddits: [] }, // Don't filter by favorites when fetching individual subs
            });
            return data.posts;
          } catch (err) {
            console.warn(`Failed to fetch from r/${sub}:`, err);
            return [];
          }
        });

        // Wait for all requests to complete
        // The RequestQueue will handle spacing them appropriately
        const results = await Promise.all(promises);
        const allPosts = results.flat();

        // Remove duplicates
        const uniquePosts = allPosts.filter(
          (post, index, self) =>
            index === self.findIndex((p) => p.id === post.id)
        );

        // Sort according to home feed settings
        const sortedPosts = sortPostsForHomeFeed(uniquePosts);

        // Limit to reasonable number of posts
        const limitedPosts = sortedPosts.slice(0, 25);

        if (reset) {
          setPosts(limitedPosts);
          setHomeFeedPage(0);
        } else {
          setPosts((prev) => {
            const combined = [...prev, ...limitedPosts];
            // Remove duplicates again after combining
            const uniqueCombined = combined.filter(
              (post, index, self) =>
                index === self.findIndex((p) => p.id === post.id)
            );
            return uniqueCombined;
          });
          setHomeFeedPage(currentPage + 1);
        }

        // Set a fake after token to enable Load More button
        setAfter(limitedPosts.length > 0 ? "has_more" : null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [sort, filters, sortPostsForHomeFeed, homeFeedPage]
  );

  const fetchPosts = useCallback(
    async (reset = false, afterToken?: string) => {
      // Check if we should use the favorites feed
      if (shouldUseFavoritesFeed()) {
        return fetchMultipleSubreddits(
          filters.favoriteSubreddits,
          reset,
          reset ? 0 : undefined
        );
      }

      // Original single subreddit logic
      try {
        setLoading(true);
        setError(null);

        const currentAfter = afterToken !== undefined ? afterToken : after;
        // Don't filter by favorites when viewing all/popular/specific subreddits
        const filtersForRequest = { ...filters, favoriteSubreddits: [] };
        const data = await api.fetchPosts({
          subreddit,
          sort,
          after: !reset ? currentAfter || undefined : undefined,
          filters: filtersForRequest,
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
      shouldUseFavoritesFeed,
      fetchMultipleSubreddits,
    ]
  );

  useEffect(() => {
    fetchPosts(true);
    setAfter(null);
  }, [subreddit, sort, filters, fetchPosts]);

  const loadMorePosts = useCallback(() => {
    if (shouldUseFavoritesFeed()) {
      if (!loading) {
        fetchMultipleSubreddits(filters.favoriteSubreddits, false, homeFeedPage + 1);
      }
      return;
    }

    if (after && !loading) {
      fetchPosts(false, after);
    }
  }, [after, loading, fetchPosts, shouldUseFavoritesFeed, filters.favoriteSubreddits, homeFeedPage, fetchMultipleSubreddits]);

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
