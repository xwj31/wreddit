import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Share,
  Bookmark,
  ArrowUp,
  MessageCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  formatTimeAgo,
  formatScore,
  getHighQualityImage,
  sharePost,
} from "../utils";
import type { Child, RedditComment, RedditPost } from "../types";

interface PostDetailProps {
  post: RedditPost;
  onBack: () => void;
  onSubredditClick?: (subreddit: string) => void;
  onBookmarkToggle?: (post: RedditPost) => void;
  isBookmarked?: boolean;
}

export default function PostDetail({
  post,
  onBack,
  onSubredditClick,
  onBookmarkToggle,
  isBookmarked = false,
}: PostDetailProps) {
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showFullText, setShowFullText] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

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
              .filter((child: Child) => child.kind === "t1")
              .map((child: Child) => child.data);
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

  const handleShare = async () => {
    try {
      const success = await sharePost(post);
      if (success) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const imageUrl = getHighQualityImage(post);

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
          <button
            onClick={() => onSubredditClick?.(post.subreddit)}
            className="text-lg font-medium text-white flex-1 text-center mx-4 truncate hover:text-orange-400 transition-colors"
          >
            r/{post.subreddit}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className={`p-2 transition-colors rounded-full hover:bg-gray-800 ${
                shareSuccess
                  ? "text-green-400"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Share post"
            >
              <Share size={20} />
            </button>
            {onBookmarkToggle && (
              <button
                onClick={() => onBookmarkToggle(post)}
                className={`p-2 transition-colors rounded-full hover:bg-gray-800 ${
                  isBookmarked
                    ? "text-orange-500 hover:text-orange-400"
                    : "text-gray-400 hover:text-white"
                }`}
                title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <Bookmark
                  size={20}
                  fill={isBookmarked ? "currentColor" : "none"}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="pb-6">
        {/* Post Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-900">
          <button
            onClick={() => onSubredditClick?.(post.subreddit)}
            className="flex items-center gap-3 hover:bg-gray-900/50 rounded-lg p-1 -m-1 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {post.subreddit.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left">
              <div className="text-white font-medium hover:text-orange-400 transition-colors">
                r/{post.subreddit}
              </div>
              <div className="text-gray-500 text-sm">
                u/{post.author} • {formatTimeAgo(post.created_utc)}
              </div>
            </div>
          </button>
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
