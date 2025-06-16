// src/components/WReddit.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Heart,
  X,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  ArrowUp,
  Settings,
  Plus,
} from "lucide-react";

interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  thumbnail?: string;
  preview?: {
    images?: Array<{
      source: { url: string; width: number; height: number };
    }>;
  };
  selftext?: string;
  is_video: boolean;
}

interface FilterOptions {
  blockedSubreddits: string[];
  favoriteSubreddits: string[];
  keywords: string[];
  blockedKeywords: string[];
}

const WORKER_URL = "http://localhost:8787"; // Replace with your worker URL

export default function WReddit() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subreddit, setSubreddit] = useState("all");
  const [sort, setSort] = useState("hot");
  const [after, setAfter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter options stored in localStorage
  const [filters, setFilters] = useState<FilterOptions>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wreddit-filters");
      return saved
        ? JSON.parse(saved)
        : {
            blockedSubreddits: [],
            favoriteSubreddits: [],
            keywords: [],
            blockedKeywords: [],
          };
    }
    return {
      blockedSubreddits: [],
      favoriteSubreddits: [],
      keywords: [],
      blockedKeywords: [],
    };
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wreddit-filters", JSON.stringify(filters));
    }
  }, [filters]);

  const fetchPosts = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`${WORKER_URL}/api/posts`);
        url.searchParams.append("subreddit", subreddit);
        url.searchParams.append("sort", sort);
        url.searchParams.append("limit", "25");
        if (!reset && after) {
          url.searchParams.append("after", after);
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

        const data = await response.json();

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setAfter(data.after);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [subreddit, sort, after, filters]
  );

  useEffect(() => {
    fetchPosts(true);
  }, [subreddit, sort, filters, fetchPosts]);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const formatScore = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const addToList = (
    list: string[],
    item: string,
    setList: (list: string[]) => void
  ) => {
    if (item.trim() && !list.includes(item.toLowerCase().trim())) {
      setList([...list, item.toLowerCase().trim()]);
    }
  };

  const removeFromList = (
    list: string[],
    item: string,
    setList: (list: string[]) => void
  ) => {
    setList(list.filter((i) => i !== item));
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;
    return (
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.subreddit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-gray-800 border-b border-gray-700 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-orange-500">WReddit</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => fetchPosts(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Subreddit and Sort Controls */}
        <div className="px-4 pb-4 flex gap-2">
          <select
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
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
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
          >
            <option value="hot">Hot</option>
            <option value="new">New</option>
            <option value="top">Top</option>
            <option value="rising">Rising</option>
          </select>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button onClick={() => setShowSettings(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Favorite Subreddits */}
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Heart size={16} className="text-red-500" />
                  Favorite Subreddits
                </h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add subreddit..."
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addToList(
                            filters.favoriteSubreddits,
                            e.currentTarget.value,
                            (list) =>
                              setFilters({
                                ...filters,
                                favoriteSubreddits: list,
                              })
                          );
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        addToList(
                          filters.favoriteSubreddits,
                          input.value,
                          (list) =>
                            setFilters({ ...filters, favoriteSubreddits: list })
                        );
                        input.value = "";
                      }}
                      className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.favoriteSubreddits.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-sm"
                      >
                        r/{sub}
                        <button
                          onClick={() =>
                            removeFromList(
                              filters.favoriteSubreddits,
                              sub,
                              (list) =>
                                setFilters({
                                  ...filters,
                                  favoriteSubreddits: list,
                                })
                            )
                          }
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blocked Subreddits */}
              <div>
                <h3 className="font-medium mb-2">Blocked Subreddits</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Block subreddit..."
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addToList(
                            filters.blockedSubreddits,
                            e.currentTarget.value,
                            (list) =>
                              setFilters({
                                ...filters,
                                blockedSubreddits: list,
                              })
                          );
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        addToList(
                          filters.blockedSubreddits,
                          input.value,
                          (list) =>
                            setFilters({ ...filters, blockedSubreddits: list })
                        );
                        input.value = "";
                      }}
                      className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.blockedSubreddits.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-sm"
                      >
                        r/{sub}
                        <button
                          onClick={() =>
                            removeFromList(
                              filters.blockedSubreddits,
                              sub,
                              (list) =>
                                setFilters({
                                  ...filters,
                                  blockedSubreddits: list,
                                })
                            )
                          }
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keyword Filters */}
              <div>
                <h3 className="font-medium mb-2">Keyword Filters</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Block keyword..."
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addToList(
                            filters.blockedKeywords,
                            e.currentTarget.value,
                            (list) =>
                              setFilters({ ...filters, blockedKeywords: list })
                          );
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        addToList(
                          filters.blockedKeywords,
                          input.value,
                          (list) =>
                            setFilters({ ...filters, blockedKeywords: list })
                        );
                        input.value = "";
                      }}
                      className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.blockedKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-sm"
                      >
                        {keyword}
                        <button
                          onClick={() =>
                            removeFromList(
                              filters.blockedKeywords,
                              keyword,
                              (list) =>
                                setFilters({
                                  ...filters,
                                  blockedKeywords: list,
                                })
                            )
                          }
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <main className="pb-4">
        {error && (
          <div className="p-4 bg-red-900 border border-red-700 text-red-100 mx-4 mt-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-gray-800 border-b border-gray-700 p-4 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Vote Score */}
                <div className="flex flex-col items-center text-gray-400 min-w-[40px]">
                  <ArrowUp size={16} className="text-gray-500" />
                  <span className="text-xs font-medium">
                    {formatScore(post.score)}
                  </span>
                </div>

                {/* Post Content */}
                <div className="flex-1 min-w-0">
                  {/* Subreddit and metadata */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <span className="text-orange-500 font-medium">
                      r/{post.subreddit}
                    </span>
                    <span>•</span>
                    <span>u/{post.author}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(post.created_utc)}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-white font-medium mb-2 leading-tight">
                    {post.title}
                  </h2>

                  {/* Self text preview */}
                  {post.selftext && (
                    <p className="text-gray-300 text-sm mb-2 line-clamp-3">
                      {post.selftext.slice(0, 150)}...
                    </p>
                  )}

                  {/* Thumbnail */}
                  {post.thumbnail &&
                    post.thumbnail !== "self" &&
                    post.thumbnail !== "default" && (
                      <img
                        src={post.thumbnail}
                        alt="Thumbnail"
                        className="w-16 h-16 object-cover rounded mb-2"
                      />
                    )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <button className="flex items-center gap-1 hover:text-white transition-colors">
                      <MessageCircle size={16} />
                      {post.num_comments}
                    </button>
                    <a
                      href={`https://reddit.com${post.permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                      Reddit
                    </a>
                    {post.url !== `https://reddit.com${post.permalink}` && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <ExternalLink size={16} />
                        Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More Button */}
        {after && !loading && (
          <div className="p-4">
            <button
              onClick={() => fetchPosts(false)}
              className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Load More
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
