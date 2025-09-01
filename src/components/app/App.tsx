// src/components/app/App.tsx - Updated with authentication
import { useState } from "react";
import { useSwipe } from "../../hooks/useSwipe";
import { useNavigation } from "../../hooks/useNavigation";
import { useAppData } from "../../hooks/useAppData";
import { useAuth } from "../../hooks/useAuth";
import { useReadPosts } from "../../hooks/useReadPosts";
import { storage } from "../../utils/storage";
import { PostFeed } from "../post/PostFeed";
import { PostDetail } from "../post/PostDetail";
import { Sidebar } from "../sidebar/Sidebar";
import { SettingsModal } from "../settings/SettingsModal";
import { BookmarksModal } from "../bookmarks/BookmarksModal";
import type { RedditPost, BookmarkedPost } from "../../types";

type Page = "feed" | "post" | "bookmarks";

const LoginScreen = ({
  onLogin,
}: {
  onLogin: (uuid?: string) => Promise<string>;
}) => {
  const [existingUuid, setExistingUuid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNewUser = async () => {
    setLoading(true);
    setError("");
    try {
      await onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleExistingUser = async () => {
    const uuid = existingUuid.trim();
    if (!uuid) return;

    setError("");

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      setError(
        "Please enter a valid UUID format (e.g., 550e8400-e29b-41d4-a716-446655440000)"
      );
      return;
    }

    setLoading(true);
    try {
      await onLogin(uuid);
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("Invalid user ID") ||
          err.message.includes("UUID format")
        ) {
          setError(
            "Invalid UUID format. Please check your UUID and try again."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to WReddit</h1>
          <p className="text-gray-400">A minimal Reddit client</p>
        </div>

        {error && (
          <div className="bg-red-600 rounded-lg p-4 text-center">
            <p className="text-white">{error}</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">New User</h2>
            <button
              onClick={handleNewUser}
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create New Account"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-500">OR</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Existing User</h2>
            <input
              type="text"
              placeholder="Enter your UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)"
              value={existingUuid}
              onChange={(e) => setExistingUuid(e.target.value)}
              className="w-full px-4 py-2 bg-black rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none mb-2"
            />
            <button
              onClick={handleExistingUser}
              disabled={loading || !existingUuid.trim()}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login with UUID"}
            </button>
          </div>

          <div className="text-sm text-gray-500 mt-4">
            <p>Note: Save your UUID to login again later</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>("feed");
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [searchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const {
    userId,
    loading: authLoading,
    isAuthenticated,
    login,
    logout,
  } = useAuth();

  const {
    posts,
    loading,
    refreshing,
    error,
    bookmarks,
    subreddits,
    selectedSubreddit,
    setSelectedSubreddit,
    refreshPosts,
    handleBookmarkToggle,
    handleFavoriteToggle,
    isFavorite,
  } = useAppData(userId);

  const { markAsRead, isRead } = useReadPosts();

  const navigateBack = () => {
    if (currentPage === "post" || currentPage === "bookmarks") {
      setCurrentPage("feed");
      setSelectedPost(null);
      setShowBookmarks(false);
    }
  };

  const { pushState } = useNavigation(navigateBack);

  const navigateToPost = (post: RedditPost) => {
    setCurrentPage("post");
    setSelectedPost(post);
    setShowBookmarks(false);
    pushState({ page: "post", postId: post.id });
    markAsRead(post.id);
  };

  const navigateToBookmarks = () => {
    setCurrentPage("bookmarks");
    setShowBookmarks(true);
    setShowSidebar(false);
    pushState({ page: "bookmarks" });
  };

  const handleBookmarkPostClick = (bookmark: BookmarkedPost) => {
    const post: RedditPost = {
      id: bookmark.id,
      title: bookmark.title,
      subreddit: bookmark.subreddit,
      permalink: bookmark.permalink,
      author: "unknown",
      url: `https://reddit.com${bookmark.permalink}`,
      score: 0,
      num_comments: 0,
      created_utc: Math.floor(bookmark.bookmarkedAt / 1000),
      is_video: false,
    };
    navigateToPost(post);
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;
    return (
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.subreddit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useSwipe(() => {
    if (currentPage !== "feed") {
      navigateBack();
    } else if (!showSidebar) {
      setShowSidebar(true);
    }
  });

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  // PostDetail page - no header, full screen
  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={navigateBack}
        onSubredditClick={(subredditName) => {
          setSelectedSubreddit(subredditName);
          setShowSidebar(false);
          setShowBookmarks(false);
        }}
        onBookmarkToggle={handleBookmarkToggle}
      />
    );
  }

  // Bookmarks page - full screen modal
  if (showBookmarks) {
    return (
      <BookmarksModal
        isOpen={showBookmarks}
        onClose={navigateBack}
        bookmarks={bookmarks}
        onPostClick={handleBookmarkPostClick}
        onBookmarkRemove={(postId) => {
          storage.removeBookmark(postId);
        }}
      />
    );
  }

  // Main feed page - with header
  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        currentSubreddit={selectedSubreddit}
        onSubredditSelect={(subredditName) => {
          setSelectedSubreddit(subredditName);
          setShowSidebar(false);
          setShowBookmarks(false);
        }}
        favoriteSubreddits={subreddits}
        onFavoriteToggle={handleFavoriteToggle}
        onNavigateToBookmarks={navigateToBookmarks}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        filters={{
          favoriteSubreddits: subreddits,
          blockedSubreddits: [],
          keywords: [],
          blockedKeywords: [],
        }}
        onFiltersChange={() => {}}
        userId={userId || undefined}
      />

      <div className="sticky top-0 z-40 bg-black">
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (userId) {
                    await navigator.clipboard.writeText(userId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Click to copy full UUID"
              >
                {copied ? "Copied!" : `ID: ${userId?.substring(0, 8)}...`}
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>

              <button
                onClick={refreshPosts}
                disabled={loading || refreshing}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
                title={
                  refreshing
                    ? "Refreshing posts from Reddit..."
                    : "Refresh posts"
                }
              >
                <svg
                  className={`w-5 h-5 ${
                    loading || refreshing ? "animate-spin" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              <button
                onClick={navigateToBookmarks}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubreddit}
              onChange={(e) => setSelectedSubreddit(e.target.value)}
              className="bg-gray-900 text-white px-3 py-1 rounded-lg flex-1"
            >
              <option value="all">All Posts</option>
              {subreddits.map((sub) => (
                <option key={sub} value={sub}>
                  r/{sub}
                </option>
              ))}
            </select>

            {selectedSubreddit !== "all" && (
              <button
                onClick={() => handleFavoriteToggle(selectedSubreddit)}
                className={`p-2 ${
                  isFavorite(selectedSubreddit)
                    ? "text-yellow-500"
                    : "text-gray-400"
                } hover:text-yellow-400`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isFavorite(selectedSubreddit) ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="pt-2">
        <PostFeed
          posts={filteredPosts}
          loading={loading || authLoading}
          hasMore={false}
          onPostClick={navigateToPost}
          onSubredditClick={(subredditName) => {
            setSelectedSubreddit(subredditName);
            setShowSidebar(false);
            setShowBookmarks(false);
          }}
          onBookmarkToggle={handleBookmarkToggle}
          onLoadMore={() => {}}
          error={error || undefined}
          isHomeFeed={selectedSubreddit === "home"}
          isRead={isRead}
        />
      </main>
    </div>
  );
};
