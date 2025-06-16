import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Share,
  Bookmark,
  BookmarkCheck,
  ArrowUp,
  MessageCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  formatTimeAgo,
  formatScore,
  getHighQualityImage,
  parseTextWithLinks,
  sharePost,
} from "../utils";
import { addBookmark, removeBookmark, isBookmarked } from "../utils/storage";
import type { Child, RedditComment, RedditPost } from "../types";

interface PostDetailProps {
  post: RedditPost;
  onBack: () => void;
}

interface ProcessedComment extends RedditComment {
  depth: number;
  children: ProcessedComment[];
}

export default function PostDetail({ post, onBack }: PostDetailProps) {
  const [comments, setComments] = useState<ProcessedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showFullText, setShowFullText] = useState(false);
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(post.id));
  const [shareLoading, setShareLoading] = useState(false);

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
            const processedComments = processCommentTree(
              data[1].data.children,
              0
            );
            setComments(processedComments);
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

  // Process comment tree to maintain hierarchy
  const processCommentTree = (
    children: Child[],
    depth: number
  ): ProcessedComment[] => {
    return children
      .filter((child: Child) => child.kind === "t1" && child.data)
      .map((child: Child) => {
        const comment = child.data as RedditComment;
        const processedComment: ProcessedComment = {
          ...comment,
          depth,
          children: [],
        };

        // Process replies if they exist
        if (
          comment.replies &&
          typeof comment.replies === "object" &&
          comment.replies.data
        ) {
          processedComment.children = processCommentTree(
            comment.replies.data.children as Child[],
            depth + 1
          );
        }

        return processedComment;
      });
  };

  const handleBookmark = () => {
    if (bookmarked) {
      removeBookmark(post.id);
      setBookmarked(false);
    } else {
      addBookmark({
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        permalink: post.permalink,
      });
      setBookmarked(true);
    }
  };

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const success = await sharePost(post);
      if (!success) {
        // Show some feedback that share failed
        console.error("Share failed");
      }
    } catch (error) {
      console.error("Share error:", error);
    } finally {
      setShareLoading(false);
    }
  };

  const handleSubredditClick = (subredditName: string) => {
    // This would need to be passed down from parent to navigate to subreddit
    // For now, we'll just go back and let the parent handle it
    console.log("Navigate to subreddit:", subredditName);
    onBack();
  };

  const renderTextWithLinks = (text: string) => {
    const parts = parseTextWithLinks(text);

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
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    const subredditName = part.content.replace("r/", "");
                    handleSubredditClick(subredditName);
                  }}
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  {part.content}
                </button>
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

  const renderComment = (
    comment: ProcessedComment,
    isLast: boolean = false
  ) => {
    const marginLeft = Math.min(comment.depth * 16, 80); // Max depth of 5 levels visually

    console.log("is last:", isLast);

    return (
      <div key={comment.id} className="relative">
        {/* Thread line for nested comments */}
        {comment.depth > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
            style={{ left: `${marginLeft - 8}px` }}
          />
        )}

        <div
          className={`border-l-2 border-gray-800 pl-3 ${
            comment.depth === 0 ? "mb-4" : "mb-2"
          }`}
          style={{ marginLeft: `${marginLeft}px` }}
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
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-3">
            {renderTextWithLinks(comment.body)}
          </div>
        </div>

        {/* Render child comments */}
        {comment.children.map((childComment, index) =>
          renderComment(childComment, index === comment.children.length - 1)
        )}
      </div>
    );
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
          <h1 className="text-lg font-medium text-white flex-1 text-center mx-4 truncate">
            r/{post.subreddit}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
            >
              {shareLoading ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Share size={20} />
              )}
            </button>
            <button
              onClick={handleBookmark}
              className={`p-2 transition-colors rounded-full hover:bg-gray-800 ${
                bookmarked
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {bookmarked ? (
                <BookmarkCheck size={20} />
              ) : (
                <Bookmark size={20} />
              )}
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
              <button
                onClick={() => handleSubredditClick(post.subreddit)}
                className="text-white font-medium hover:text-orange-400 transition-colors"
              >
                r/{post.subreddit}
              </button>
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
            <div className="text-gray-300 text-sm leading-relaxed">
              {showFullText || post.selftext.length <= 300 ? (
                renderTextWithLinks(post.selftext)
              ) : (
                <>
                  {renderTextWithLinks(post.selftext.slice(0, 300))}
                  <span className="text-gray-500">...</span>
                </>
              )}
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
            <div className="space-y-2">
              {comments.slice(0, 50).map((comment) => renderComment(comment))}
              {comments.length > 50 && (
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
