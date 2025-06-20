import { useState } from "react";
import { useSwipe } from "../../hooks/useSwipe";
import { useNavigation } from "../../hooks/useNavigation";
import { useAppData } from "../../hooks/useAppData";
import { storage } from "../../utils/storage";
import { Header } from "./Header";
import { PostFeed } from "../post/PostFeed";
import { PostDetail } from "../post/PostDetail";
import { Sidebar } from "../sidebar/Sidebar";
import { SettingsModal } from "../settings/SettingsModal";
import { BookmarksModal } from "../bookmarks/BookmarksModal";
import type { RedditPost, BookmarkedPost } from "../../types";

type Page = "feed" | "post" | "bookmarks";

export const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>("feed");
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
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
  } = useAppData();

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

  const isFavorite = filters.favoriteSubreddits.includes(
    subreddit.toLowerCase()
  );
  const isHomeFeed = subreddit === "home";

  useSwipe(() => {
    if (currentPage !== "feed") {
      navigateBack();
    } else if (!showSidebar) {
      setShowSidebar(true);
    }
  });

  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={navigateBack}
        onSubredditClick={(subredditName) => {
          setSubreddit(subredditName);
          setShowSidebar(false);
          setShowBookmarks(false);
        }}
        onBookmarkToggle={handleBookmarkToggle}
      />
    );
  }

  if (showBookmarks) {
    return (
      <BookmarksModal
        isOpen={showBookmarks}
        onClose={navigateBack}
        bookmarks={bookmarks}
        onPostClick={handleBookmarkPostClick}
        onBookmarkRemove={(postId) => {
          storage.removeBookmark(postId);
          // No need to call setBookmarks as it's handled by useAppData
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        currentSubreddit={subreddit}
        onSubredditSelect={(subredditName) => {
          setSubreddit(subredditName);
          setShowSidebar(false);
          setShowBookmarks(false);
        }}
        filters={filters}
        onFiltersChange={setFilters}
        onNavigateToBookmarks={navigateToBookmarks}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        subreddit={subreddit}
        onSubredditChange={setSubreddit}
        sort={sort}
        onSortChange={setSort}
        favoriteSubreddits={filters.favoriteSubreddits}
        isFavorite={isFavorite}
        onFavoriteToggle={() => handleFavoriteToggle(subreddit)}
        onRefresh={() => fetchPosts(true)}
        onShowSettings={() => setShowSettings(true)}
        onShowBookmarks={navigateToBookmarks}
        onShowSidebar={() => setShowSidebar(true)}
        loading={loading}
      />

      <main>
        <PostFeed
          posts={filteredPosts}
          loading={loading}
          hasMore={!!after}
          onPostClick={navigateToPost}
          onSubredditClick={(subredditName) => {
            setSubreddit(subredditName);
            setShowSidebar(false);
            setShowBookmarks(false);
          }}
          onBookmarkToggle={handleBookmarkToggle}
          onLoadMore={loadMorePosts}
          error={error || undefined}
          isHomeFeed={isHomeFeed}
        />
      </main>
    </div>
  );
};
