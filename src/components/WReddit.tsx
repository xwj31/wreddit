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
  ArrowLeft,
  Share,
  Bookmark,
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

interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  replies?: {
    data: {
      children: Array<{
        kind: string;
        data: RedditComment;
      }>;
    };
  };
}

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

// PostDetail Component
function PostDetail({
  post,
  onBack,
}: {
  post: RedditPost;
  onBack: () => void;
}) {
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showFullText, setShowFullText] = useState(false);

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

  // Get higher quality image from preview if available
  const getHighQualityImage = () => {
    if (post.preview?.images?.[0]?.source) {
      return post.preview.images[0].source.url.replace(/&amp;/g, "&");
    }
    if (
      post.thumbnail &&
      post.thumbnail !== "self" &&
      post.thumbnail !== "default" &&
      post.thumbnail !== "nsfw" &&
      post.thumbnail !== "spoiler"
    ) {
      return post.thumbnail;
    }
    return null;
  };

  // Fetch comments from Reddit API
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const response = await fetch(
          `https://www.reddit.com${post.permalink}.json`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data[1] && data[1].data && data[1].data.children) {
            const commentData = data[1].data.children
              .filter((child: any) => child.kind === "t1")
              .map((child: any) => child.data);
            setComments(commentData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [post.permalink]);

  const imageUrl = getHighQualityImage();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="flex items-center justify-between p-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-medium text-white flex-1 text-center mx-4 truncate">
            r/{post.subreddit}
          </h1>
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
              <Share size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
              <Bookmark size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="pb-6">
        {/* Post Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {post.subreddit.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-white font-medium">r/{post.subreddit}</div>
              <div className="text-gray-500 text-sm">
                u/{post.author} • {formatTimeAgo(post.created_utc)}
              </div>
            </div>
          </div>
          <div className="flex items-center text-orange-400">
            <ArrowUp size={18} />
            <span className="text-sm font-medium ml-1">
              {formatScore(post.score)}
            </span>
          </div>
        </div>

        {/* Post Title */}
        <div className="p-3">
          <h1 className="text-white font-medium text-lg leading-tight">
            {post.title}
          </h1>
        </div>

        {/* Post Image */}
        {imageUrl && (
          <div className="w-full">
            <img
              src={imageUrl}
              alt="Post content"
              className="w-full object-contain max-h-screen"
            />
          </div>
        )}

        {/* Post Text */}
        {post.selftext && (
          <div className="p-3 border-b border-gray-900">
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {showFullText || post.selftext.length <= 300
                ? post.selftext
                : `${post.selftext.slice(0, 300)}...`}
            </div>
            {post.selftext.length > 300 && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="text-orange-500 text-sm mt-2 hover:text-orange-400"
              >
                {showFullText ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between p-3 border-b border-gray-900">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-400">
              <MessageCircle size={22} />
              <span className="text-sm">{post.num_comments} comments</span>
            </div>
            <a
              href={`https://reddit.com${post.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ExternalLink size={20} />
              <span className="text-sm">Reddit</span>
            </a>
            {post.url !== `https://reddit.com${post.permalink}` && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink size={20} />
                <span className="text-sm">Source</span>
              </a>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="p-3">
          <h2 className="text-white font-medium text-lg mb-4">
            Comments ({post.num_comments})
          </h2>

          {loadingComments ? (
            <div className="flex justify-center py-8">
              <RefreshCw size={24} className="animate-spin text-orange-500" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.slice(0, 10).map((comment) => (
                <div
                  key={comment.id}
                  className="border-l-2 border-gray-800 pl-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-500 font-medium text-sm">
                      u/{comment.author}
                    </span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-500 text-xs">
                      {formatTimeAgo(comment.created_utc)}
                    </span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-500 text-xs">
                      {formatScore(comment.score)} points
                    </span>
                  </div>
                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.body}
                  </div>
                </div>
              ))}
              {comments.length > 10 && (
                <div className="text-center py-4">
                  <a
                    href={`https://reddit.com${post.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-400 text-sm"
                  >
                    View all {post.num_comments} comments on Reddit
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No comments yet. Be the first to comment on Reddit!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WReddit() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);

  // Load subreddit and sort preferences from localStorage
  const [subreddit, setSubreddit] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wreddit-subreddit") || "all";
    }
    return "all";
  });

  const [sort, setSort] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wreddit-sort") || "hot";
    }
    return "hot";
  });

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

  // Save all preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wreddit-filters", JSON.stringify(filters));
    }
  }, [filters]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wreddit-subreddit", subreddit);
    }
  }, [subreddit]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wreddit-sort", sort);
    }
  }, [sort]);

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

  // If a post is selected, show the detail view
  if (selectedPost) {
    return (
      <PostDetail post={selectedPost} onBack={() => setSelectedPost(null)} />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="flex items-center justify-between p-3">
          <h1 className="text-2xl font-bold text-orange-500">WReddit</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
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
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Favorite Subreddits */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2 text-orange-400">
                  <Heart size={16} className="text-red-500" />
                  Favorite Subreddits
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add subreddit..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
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
                      className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.favoriteSubreddits.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 border border-red-600/40 text-red-400 rounded-lg text-sm"
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
                          className="hover:text-red-300 transition-colors"
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
                <h3 className="font-medium mb-3 text-gray-300">
                  Blocked Subreddits
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Block subreddit..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
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
                      className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.blockedSubreddits.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg text-sm"
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
                          className="hover:text-gray-200 transition-colors"
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
                <h3 className="font-medium mb-3 text-gray-300">
                  Keyword Filters
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Block keyword..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
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
                      className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.blockedKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg text-sm"
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
                          className="hover:text-gray-200 transition-colors"
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
          <div className="p-4 bg-red-900/20 border border-red-700/40 text-red-400 mx-3 mt-4 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-0">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-black border-b border-gray-900 cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              {/* Post Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {post.subreddit.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">
                      r/{post.subreddit}
                    </div>
                    <div className="text-gray-500 text-xs">
                      u/{post.author} • {formatTimeAgo(post.created_utc)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-gray-400">
                  <ArrowUp size={16} className="text-gray-500" />
                  <span className="text-xs font-medium ml-1">
                    {formatScore(post.score)}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-0">
                {/* Title */}
                <div className="px-3 mb-2">
                  <h2 className="text-white font-medium leading-tight text-sm">
                    {post.title}
                  </h2>
                </div>

                {/* Image/Media */}
                {post.thumbnail &&
                  post.thumbnail !== "self" &&
                  post.thumbnail !== "default" &&
                  post.thumbnail !== "nsfw" &&
                  post.thumbnail !== "spoiler" && (
                    <div className="w-full">
                      <img
                        src={post.thumbnail}
                        alt="Post content"
                        className="w-full object-cover max-h-96"
                        style={{
                          aspectRatio: "auto",
                        }}
                      />
                    </div>
                  )}

                {/* Self text */}
                {post.selftext && (
                  <div className="px-3 mt-2">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {post.selftext.length > 200
                        ? `${post.selftext.slice(0, 200)}...`
                        : post.selftext}
                    </p>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                      <MessageCircle size={20} />
                      <span className="text-sm">{post.num_comments}</span>
                    </button>
                    <a
                      href={`https://reddit.com${post.permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={20} />
                      <span className="text-sm">Reddit</span>
                    </a>
                    {post.url !== `https://reddit.com${post.permalink}` && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={20} />
                        <span className="text-sm">Link</span>
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
