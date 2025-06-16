import {
  ArrowUp,
  MessageCircle,
  ExternalLink,
  Share,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import {
  formatTimeAgo,
  formatScore,
  getHighQualityImage,
  parseTextWithLinks,
  sharePost,
} from "../utils";
import { addBookmark, removeBookmark, isBookmarked } from "../utils/storage";
import { useState } from "react";
import type { RedditPost } from "../types";

interface PostFeedProps {
  posts: RedditPost[];
  onPostClick: (post: RedditPost) => void;
}

export default function PostFeed({ posts, onPostClick }: PostFeedProps) {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(
    new Set(
      posts.filter((post) => isBookmarked(post.id)).map((post) => post.id)
    )
  );
  const [shareLoading, setShareLoading] = useState<Set<string>>(new Set());

  const handleBookmark = (post: RedditPost, event: React.MouseEvent) => {
    event.stopPropagation();

    if (bookmarkedPosts.has(post.id)) {
      removeBookmark(post.id);
      setBookmarkedPosts((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    } else {
      addBookmark({
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        permalink: post.permalink,
      });
      setBookmarkedPosts((prev) => new Set(prev).add(post.id));
    }
  };

  const handleShare = async (post: RedditPost, event: React.MouseEvent) => {
    event.stopPropagation();

    setShareLoading((prev) => new Set(prev).add(post.id));
    try {
      await sharePost(post);
    } catch (error) {
      console.error("Share error:", error);
    } finally {
      setShareLoading((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const renderTextWithLinks = (text: string, maxLength?: number) => {
    const displayText =
      maxLength && text.length > maxLength
        ? text.slice(0, maxLength) + "..."
        : text;

    const parts = parseTextWithLinks(displayText);

    return (
      <span className="break-words">
        {parts.map((part, index) => {
          switch (part.type) {
            case "link":
              return (
                <a
                  key={index}
                  href={part.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline break-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part.content}
                </a>
              );
            case "subreddit":
              return (
                <span
                  key={index}
                  className="text-orange-400 hover:text-orange-300 underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // This would need to be passed down from parent to navigate to subreddit
                    console.log(
                      "Navigate to subreddit:",
                      part.content.replace("r/", "")
                    );
                  }}
                >
                  {part.content}
                </span>
              );
            case "user":
              return (
                <a
                  key={index}
                  href={`https://reddit.com/${part.href}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part.content}
                </a>
              );
            default:
              return <span key={index}>{part.content}</span>;
          }
        })}
      </span>
    );
  };

  return (
    <div className="space-y-0">
      {posts.map((post) => {
        // Use the same image logic as PostDetail
        const imageUrl = getHighQualityImage(post);
        const isPostBookmarked = bookmarkedPosts.has(post.id);
        const isPostShareLoading = shareLoading.has(post.id);

        return (
          <article
            key={post.id}
            className="bg-black border-b border-gray-900 cursor-pointer hover:bg-gray-900/20 transition-colors"
            onClick={() => onPostClick(post)}
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
              <div className="flex items-center gap-2">
                <div className="flex items-center text-gray-400">
                  <ArrowUp size={16} className="text-gray-500" />
                  <span className="text-xs font-medium ml-1">
                    {formatScore(post.score)}
                  </span>
                </div>

                {/* Action buttons */}
                <button
                  onClick={(e) => handleShare(post, e)}
                  disabled={isPostShareLoading}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
                  title="Share"
                >
                  {isPostShareLoading ? (
                    <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Share size={16} />
                  )}
                </button>

                <button
                  onClick={(e) => handleBookmark(post, e)}
                  className={`p-1.5 transition-colors rounded-full hover:bg-gray-800 ${
                    isPostBookmarked
                      ? "text-orange-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title={isPostBookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  {isPostBookmarked ? (
                    <BookmarkCheck size={16} />
                  ) : (
                    <Bookmark size={16} />
                  )}
                </button>
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
                  <div className="text-gray-300 text-sm leading-relaxed">
                    {renderTextWithLinks(post.selftext, 200)}
                  </div>
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
        );
      })}
    </div>
  );
}
