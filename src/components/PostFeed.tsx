import { ArrowUp, MessageCircle, ExternalLink, Bookmark } from "lucide-react";
import { formatTimeAgo, formatScore, getHighQualityImage } from "../utils";
import { isBookmarked } from "../utils/storage";
import type { RedditPost, BookmarkedPost } from "../types";

interface PostFeedProps {
  posts: RedditPost[];
  onPostClick: (post: RedditPost) => void;
  onSubredditClick?: (subreddit: string) => void;
  onBookmarkToggle?: (post: RedditPost) => void;
  bookmarks?: BookmarkedPost[];
}

export default function PostFeed({
  posts,
  onPostClick,
  onSubredditClick,
  onBookmarkToggle,
}: PostFeedProps) {
  return (
    <div className="space-y-0">
      {posts.map((post) => {
        // Use the same image logic as PostDetail
        const imageUrl = getHighQualityImage(post);
        const postIsBookmarked = isBookmarked(post.id);

        return (
          <article key={post.id} className="bg-black border-b border-gray-900">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3">
              <button
                onClick={() => onSubredditClick?.(post.subreddit)}
                className="flex items-center gap-3 hover:bg-gray-900/50 rounded-lg p-1 -m-1 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {post.subreddit.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-white font-medium text-sm hover:text-orange-400 transition-colors">
                    r/{post.subreddit}
                  </div>
                  <div className="text-gray-500 text-xs">
                    u/{post.author} • {formatTimeAgo(post.created_utc)}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-gray-400">
                  <ArrowUp size={16} className="text-gray-500" />
                  <span className="text-xs font-medium ml-1">
                    {formatScore(post.score)}
                  </span>
                </div>
                {onBookmarkToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmarkToggle(post);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                      postIsBookmarked
                        ? "text-orange-500 hover:text-orange-400"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                    title={
                      postIsBookmarked ? "Remove bookmark" : "Add bookmark"
                    }
                  >
                    <Bookmark
                      size={16}
                      fill={postIsBookmarked ? "currentColor" : "none"}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Post Content - Clickable area for post details */}
            <div
              className="px-0 cursor-pointer"
              onClick={() => onPostClick(post)}
            >
              {/* Title */}
              <div className="px-3 mb-2">
                <h2 className="text-white font-medium leading-tight text-sm">
                  {post.title}
                </h2>
              </div>

              {/* Image/Media */}
              {imageUrl && (
                <div className="w-full">
                  <img
                    src={imageUrl}
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
            </div>

            {/* Action Bar - Larger touch targets */}
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-1">
                {/* Comments button with larger touch area */}
                <button
                  onClick={() => onPostClick(post)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg hover:bg-gray-800/50"
                >
                  <MessageCircle size={20} />
                  <span className="text-sm font-medium">
                    {post.num_comments} comments
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <a
                  href={`https://reddit.com${post.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg hover:bg-gray-800/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={18} />
                  <span className="text-sm">Reddit</span>
                </a>
                {post.url !== `https://reddit.com${post.permalink}` && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg hover:bg-gray-800/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={18} />
                    <span className="text-sm">Link</span>
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
