import { useState, useEffect, useCallback, useRef } from "react";
import { Search, RefreshCw, Settings } from "lucide-react";

import {
  getFilters,
  saveFilters,
  getSubreddit,
  saveSubreddit,
  getSort,
  saveSort,
} from "../utils/storage";

import PostDetail from "./PostDetail";
import SettingsModal from "./SettingsModal";
import PostFeed from "./PostFeed";
import type { FilterOptions, PostsApiResponse, RedditPost } from "../types";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

export default function WReddit() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [subreddit, setSubreddit] = useState(() => getSubreddit());
  const [sort, setSort] = useState(() => getSort());
  const [filters, setFilters] = useState<FilterOptions>(() => getFilters());

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  useEffect(() => {
    saveSubreddit(subreddit);
  }, [subreddit]);

  useEffect(() => {
    saveSort(sort);
  }, [sort]);

  // Remove 'after' from the dependency array to prevent infinite loops
  const fetchPosts = useCallback(
    async (reset = false, afterToken?: string) => {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`${WORKER_URL}/api/posts`);
        url.searchParams.append("subreddit", subreddit);
        url.searchParams.append("sort", sort);
        url.searchParams.append("limit", "25");

        // Use the passed afterToken or current after state
        const currentAfter = afterToken !== undefined ? afterToken : after;
        if (!reset && currentAfter) {
          url.searchParams.append("after", currentAfter);
        }

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filters),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data: PostsApiResponse = await response.json();

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setAfter(data.after || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [subreddit, sort, filters] // Removed 'after' from dependencies
  );

  // Separate effect for initial load and when core parameters change
  useEffect(() => {
    fetchPosts(true);
    setAfter(null); // Reset pagination when core parameters change
  }, [subreddit, sort, filters]);

  // Function to load more posts
  const loadMorePosts = useCallback(() => {
    if (after && !loading) {
      fetchPosts(false, after);
    }
  }, [after, loading, fetchPosts]);

  // Function to handle post selection and save scroll position
  const handlePostClick = useCallback((post: RedditPost) => {
    setScrollPosition(window.scrollY);
    setSelectedPost(post);
  }, []);

  // Function to handle going back and restore scroll position
  const handleBackFromPost = useCallback(() => {
    setSelectedPost(null);
    // Restore scroll position after the component re-renders
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0);
  }, [scrollPosition]);

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;
    return (
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.subreddit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // If a post is selected, show the detail view
  if (selectedPost) {
    return <PostDetail post={selectedPost} onBack={handleBackFromPost} />;
  }

  return (
    <div className="min-h-screen bg-black text-white" ref={scrollContainerRef}>
      {/* Header */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="flex items-center justify-between p-3">
          <h1 className="text-2xl font-bold text-orange-500">WReddit</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
            >
              <Settings size={22} />
            </button>
            <button
              onClick={() => fetchPosts(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
              disabled={loading}
            >
              <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="px-3 pb-3 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          {/* Subreddit and Sort Controls */}
          <div className="flex gap-2">
            <select
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-sm"
            >
              <option value="all">All</option>
              <option value="popular">Popular</option>
              {filters.favoriteSubreddits.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-sm"
            >
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top">Top</option>
              <option value="rising">Rising</option>
            </select>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Posts Feed */}
      <main className="pb-4">
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700/40 text-red-400 mx-3 mt-4 rounded-xl">
            {error}
          </div>
        )}

        <PostFeed posts={filteredPosts} onPostClick={handlePostClick} />

        {/* Load More Button */}
        {after && !loading && (
          <div className="p-4">
            <button
              onClick={loadMorePosts}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-medium"
            >
              Load More Posts
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center p-8">
            <RefreshCw size={24} className="animate-spin text-orange-500" />
          </div>
        )}
      </main>
    </div>
  );
}
