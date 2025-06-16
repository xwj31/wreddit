import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Menu,
} from "lucide-react";

import {
  getFilters,
  saveFilters,
  getSubreddit,
  saveSubreddit,
  getSort,
  saveSort,
} from "../utils/storage";

// Import the new components
import PostDetail from "./PostDetail";
import SettingsModal from "./SettingsModal";
import PostFeed from "./PostFeed";
import type { FilterOptions, PostsApiResponse, RedditPost } from "../types";
import SwipeHandler from "./SwipeHandler";
import SubredditSidebar from "./SubredditSidebar";
import NavigationManager from "./NavigationManager";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

// Debug utilities
interface ApiDebugInfo {
  timestamp: string;
  url: string;
  method: string;
  status?: number;
  error?: string;
  responseTime?: number;
  success: boolean;
}

// Navigation history type
interface NavigationState {
  page: "feed" | "post";
  scrollPosition?: number;
}

export default function WReddit() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);

  // Navigation state
  const [navigationHistory, setNavigationHistory] = useState<NavigationState[]>(
    [{ page: "feed" }]
  );

  // Debug states
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<ApiDebugInfo[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "error"
  >("unknown");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [subreddit, setSubreddit] = useState(() => getSubreddit());
  const [sort, setSort] = useState(() => getSort());
  const [filters, setFilters] = useState<FilterOptions>(() => getFilters());

  // Navigation functions
  const navigateToPost = useCallback((post: RedditPost) => {
    const currentScrollPosition = window.scrollY;
    setNavigationHistory((prev) => [
      ...prev,
      {
        page: "post",
        data: post,
        scrollPosition: currentScrollPosition,
      },
    ]);
    setSelectedPost(post);

    // Push browser history state for back button support
    window.history.pushState(
      { page: "post", postId: post.id },
      "",
      window.location.href
    );
  }, []);

  const navigateToSubreddit = useCallback((subredditName: string) => {
    setSubreddit(subredditName);
    setShowSidebar(false);
    // Reset posts when changing subreddit
    setPosts([]);
    setAfter(null);
    // Scroll to top when changing subreddit
    window.scrollTo(0, 0);
  }, []);

  const navigateBack = useCallback(() => {
    setNavigationHistory((prev) => {
      if (prev.length <= 1) return prev;

      const newHistory = prev.slice(0, -1);
      const previousState = newHistory[newHistory.length - 1];

      if (previousState.page === "feed") {
        setSelectedPost(null);
        // Restore scroll position
        setTimeout(() => {
          if (previousState.scrollPosition !== undefined) {
            window.scrollTo(0, previousState.scrollPosition);
          }
        }, 0);
      }

      return newHistory;
    });
  }, []);

  // Add debug log function
  const addDebugLog = useCallback((info: Omit<ApiDebugInfo, "timestamp">) => {
    const debugEntry: ApiDebugInfo = {
      ...info,
      timestamp: new Date().toISOString(),
    };
    setDebugInfo((prev) => [debugEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
    console.log("API Debug:", debugEntry);
  }, []);

  // Test API connection
  const testConnection = useCallback(async () => {
    const startTime = Date.now();
    try {
      console.log("Testing connection to:", `${WORKER_URL}/api/health`);

      const response = await fetch(`${WORKER_URL}/api/health`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus("connected");
        addDebugLog({
          url: `${WORKER_URL}/api/health`,
          method: "GET",
          status: response.status,
          responseTime,
          success: true,
        });
        console.log("Health check response:", data);
        return true;
      } else {
        const errorText = await response.text();
        setConnectionStatus("error");
        addDebugLog({
          url: `${WORKER_URL}/api/health`,
          method: "GET",
          status: response.status,
          error: `${response.status}: ${errorText}`,
          responseTime,
          success: false,
        });
        console.error("Health check failed:", response.status, errorText);
        return false;
      }
    } catch (err) {
      const responseTime = Date.now() - startTime;
      setConnectionStatus("error");
      const errorMessage = err instanceof Error ? err.message : String(err);
      addDebugLog({
        url: `${WORKER_URL}/api/health`,
        method: "GET",
        error: errorMessage,
        responseTime,
        success: false,
      });
      console.error("Connection test failed:", err);
      return false;
    }
  }, [WORKER_URL, addDebugLog]);

  // Test on mount
  useEffect(() => {
    testConnection();
  }, [testConnection]);

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  useEffect(() => {
    saveSubreddit(subreddit);
  }, [subreddit]);

  useEffect(() => {
    saveSort(sort);
  }, [sort]);

  const fetchPosts = useCallback(
    async (reset = false, afterToken?: string) => {
      const startTime = Date.now();
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`${WORKER_URL}/api/posts`);
        url.searchParams.append("subreddit", subreddit);
        url.searchParams.append("sort", sort);
        url.searchParams.append("limit", "25");

        const currentAfter = afterToken !== undefined ? afterToken : after;
        if (!reset && currentAfter) {
          url.searchParams.append("after", currentAfter);
        }

        console.log("Fetching posts from:", url.toString());
        console.log("Request body:", filters);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(filters),
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);

          addDebugLog({
            url: url.toString(),
            method: "POST",
            status: response.status,
            error: `${response.status}: ${errorText}`,
            responseTime,
            success: false,
          });

          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data: PostsApiResponse = await response.json();
        console.log("Posts fetched successfully:", data);

        addDebugLog({
          url: url.toString(),
          method: "POST",
          status: response.status,
          responseTime,
          success: true,
        });

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setAfter(data.after || null);
        setConnectionStatus("connected");
      } catch (err) {
        const responseTime = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Fetch posts error:", err);

        addDebugLog({
          url: `${WORKER_URL}/api/posts`,
          method: "POST",
          error: errorMessage,
          responseTime,
          success: false,
        });

        setError(errorMessage);
        setConnectionStatus("error");
      } finally {
        setLoading(false);
      }
    },
    [subreddit, sort, filters, WORKER_URL, addDebugLog, after]
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

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;
    return (
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.subreddit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get current page from navigation history
  const currentPage = navigationHistory[navigationHistory.length - 1];
  const isOnFeedPage = currentPage.page === "feed";

  return (
    <div className="min-h-screen bg-black text-white" ref={scrollContainerRef}>
      <NavigationManager onNavigateBack={navigateBack} />

      <SwipeHandler onSwipeRight={navigateBack} disabled={isOnFeedPage}>
        <SubredditSidebar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          currentSubreddit={subreddit}
          onSubredditSelect={navigateToSubreddit}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {selectedPost ? (
          <PostDetail
            post={selectedPost}
            onBack={navigateBack}
            onSubredditClick={navigateToSubreddit}
          />
        ) : (
          <>
            {/* Header */}
            <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
                  >
                    <Menu size={22} />
                  </button>
                  <h1 className="text-xl font-bold text-orange-500">WReddit</h1>
                  {/* Connection Status Indicator */}
                  <div className="flex items-center gap-1">
                    {connectionStatus === "connected" && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    {connectionStatus === "error" && (
                      <XCircle size={16} className="text-red-500" />
                    )}
                    {connectionStatus === "unknown" && (
                      <RefreshCw
                        size={16}
                        className="text-yellow-500 animate-spin"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDebugMode(!debugMode)}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
                    title="Toggle Debug Mode"
                  >
                    <AlertTriangle
                      size={22}
                      className={debugMode ? "text-yellow-500" : ""}
                    />
                  </button>
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
                    <RefreshCw
                      size={22}
                      className={loading ? "animate-spin" : ""}
                    />
                  </button>
                </div>
              </div>

              {/* Debug Panel */}
              {debugMode && (
                <div className="p-3 border-t border-gray-800 bg-gray-900">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white">
                        Debug Information
                      </h3>
                      <button
                        onClick={testConnection}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Test Connection
                      </button>
                    </div>

                    <div className="text-xs text-gray-400">
                      <div>Worker URL: {WORKER_URL}</div>
                      <div>
                        Status:{" "}
                        <span
                          className={`${
                            connectionStatus === "connected"
                              ? "text-green-400"
                              : connectionStatus === "error"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {connectionStatus}
                        </span>
                      </div>
                    </div>

                    {debugInfo.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {debugInfo.map((info, index) => (
                          <div
                            key={index}
                            className={`text-xs p-2 rounded ${
                              info.success
                                ? "bg-green-900/20 text-green-400"
                                : "bg-red-900/20 text-red-400"
                            }`}
                          >
                            <div className="flex justify-between">
                              <span>
                                {info.method} {info.url.split("/").pop()}
                              </span>
                              <span>{info.responseTime}ms</span>
                            </div>
                            {info.error && (
                              <div className="text-red-300">{info.error}</div>
                            )}
                            {info.status && <div>Status: {info.status}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Search and Controls */}
              <div className="px-3 pb-3 space-y-3">
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

                <div className="flex gap-2">
                  <select
                    value={subreddit}
                    onChange={(e) => navigateToSubreddit(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="popular">Popular</option>
                    {filters.favoriteSubreddits.map((sub) => (
                      <option key={sub} value={sub}>
                        r/{sub}
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

            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              filters={filters}
              onFiltersChange={setFilters}
            />

            <main className="pb-4">
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-700/40 text-red-400 mx-3 mt-4 rounded-xl">
                  <div className="flex items-start gap-2">
                    <XCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">API Error</div>
                      <div className="text-sm mt-1">{error}</div>
                      {connectionStatus === "error" && (
                        <div className="text-xs mt-2 text-red-300">
                          Check if the worker URL is correct: {WORKER_URL}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <PostFeed
                posts={filteredPosts}
                onPostClick={navigateToPost}
                onSubredditClick={navigateToSubreddit}
              />

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

              {loading && (
                <div className="flex justify-center p-8">
                  <RefreshCw
                    size={24}
                    className="animate-spin text-orange-500"
                  />
                </div>
              )}

              {posts.length === 0 && !loading && !error && (
                <div className="text-center py-12 px-4">
                  <div className="text-gray-400 text-lg mb-2">
                    No posts found
                  </div>
                  <div className="text-gray-500 text-sm">
                    Try adjusting your filters or check your connection
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </SwipeHandler>
    </div>
  );
}
