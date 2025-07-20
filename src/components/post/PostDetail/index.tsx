// src/components/post/PostDetail/index.tsx - Updated with hidden header
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Share,
  Bookmark,
  ArrowUp,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Play,
} from "lucide-react";
import {
  formatTimeAgo,
  formatScore,
  getImageUrl,
  sharePost,
} from "../../../utils";
import {
  getVideoInfo,
  hasVideoContent,
  formatDuration,
} from "../../../utils/video";
import { storage } from "../../../utils/storage";
import { api } from "../../../api/reddit";
import { Button } from "../../ui/Button";
import { VideoPlayer } from "../../ui/VideoPlayer";
import { CommentsList } from "./CommentsList";
import type { RedditPost, RedditComment } from "../../../types";

type PostDetailProps = {
  post: RedditPost;
  onBack: () => void;
  onSubredditClick?: (subreddit: string) => void;
  onBookmarkToggle?: (post: RedditPost) => void;
};

export const PostDetail = ({
  post,
  onBack,
  onSubredditClick,
  onBookmarkToggle,
}: PostDetailProps) => {
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showFullText, setShowFullText] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const isBookmarked = storage.isBookmarked(post.id);
  const imageUrl = getImageUrl(post);
  const videoInfo = getVideoInfo(post);
  const hasVideo = hasVideoContent(post);

  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      const fetchedComments = await api.fetchComments(post.permalink);
      setComments(fetchedComments);
      setLoadingComments(false);
    };

    fetchComments();
  }, [post.permalink]);

  const handleShare = async () => {
    const success = await sharePost(post);
    if (success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Simple header without the main app header complexity */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="flex items-center justify-between p-3">
          <Button onClick={onBack} className="text-gray-400 hover:text-white">
            <ArrowLeft size={22} />
          </Button>

          <Button
            onClick={() => onSubredditClick?.(post.subreddit)}
            className="text-lg font-medium text-white flex-1 text-center mx-4 truncate hover:text-orange-400"
          >
            r/{post.subreddit}
          </Button>

          <div className="flex items-center gap-1">
            <Button
              onClick={handleShare}
              className={
                shareSuccess
                  ? "text-green-400"
                  : "text-gray-400 hover:text-white"
              }
              title="Share post"
            >
              <Share size={20} />
            </Button>

            {onBookmarkToggle && (
              <Button
                onClick={() => onBookmarkToggle(post)}
                className={
                  isBookmarked
                    ? "text-orange-500 hover:text-orange-400"
                    : "text-gray-400 hover:text-white"
                }
                title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <Bookmark
                  size={20}
                  fill={isBookmarked ? "currentColor" : "none"}
                />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="pb-6">
        <div className="flex items-center justify-between p-3 border-b border-gray-900">
          <Button
            onClick={() => onSubredditClick?.(post.subreddit)}
            className="flex items-center gap-3 hover:bg-gray-900/50 rounded-lg p-1 -m-1"
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
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex items-center text-gray-400">
              <ArrowUp size={16} className="text-gray-500" />
              <span className="text-xs font-medium ml-1">
                {formatScore(post.score)}
              </span>
            </div>
            <div className="flex items-center text-gray-400">
              <MessageCircle size={16} className="text-gray-500" />
              <span className="text-xs font-medium ml-1">
                {post.num_comments}
              </span>
            </div>
            {hasVideo && (
              <div
                className="flex items-center text-red-400"
                title="Video content"
              >
                <Play size={16} fill="currentColor" />
              </div>
            )}
          </div>
        </div>

        <div className="p-3">
          <h1 className="text-xl font-medium text-white mb-3">{post.title}</h1>

          {/* Video content */}
          {videoInfo && (
            <div className="mb-3">
              <VideoPlayer
                videoInfo={videoInfo}
                autoplay={false}
                muted={true}
                controls={true}
                className="w-full max-h-[70vh]"
              />
              {videoInfo.duration && (
                <div className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                  <Play size={14} />
                  <span>Duration: {formatDuration(videoInfo.duration)}</span>
                  {videoInfo.isGif && (
                    <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                      GIF
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Image content (only if no video) */}
          {!videoInfo && imageUrl && (
            <div className="mb-3">
              <img
                src={imageUrl}
                alt="Post content"
                className="w-full object-contain max-h-[70vh] rounded-lg"
                loading="eager"
              />
            </div>
          )}

          {/* Text content */}
          {post.selftext && (
            <div className="mb-3">
              <div
                className={`text-gray-300 whitespace-pre-line ${
                  !showFullText && post.selftext.length > 500
                    ? "max-h-60 overflow-hidden relative"
                    : ""
                }`}
              >
                {!showFullText && post.selftext.length > 500
                  ? post.selftext.slice(0, 500) + "..."
                  : post.selftext}

                {!showFullText && post.selftext.length > 500 && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent"></div>
                )}
              </div>

              {post.selftext.length > 500 && (
                <Button
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-orange-500 hover:text-orange-400 mt-2"
                >
                  {showFullText ? "Show less" : "Read more"}
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <a
              href={`https://reddit.com${post.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ExternalLink size={18} />
              <span>Open on Reddit</span>
            </a>

            {post.url && post.url !== `https://reddit.com${post.permalink}` && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink size={18} />
                <span className="break-all">
                  {(() => {
                    try {
                      const url = new URL(post.url);
                      return `Open ${url.hostname}`;
                    } catch {
                      return hasVideo ? "Open Video" : "Open Link";
                    }
                  })()}
                </span>
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-gray-900 mt-4">
          <div className="p-3 border-b border-gray-900">
            <h2 className="text-lg font-medium">Comments</h2>
          </div>

          {loadingComments ? (
            <div className="flex justify-center p-8">
              <RefreshCw size={24} className="animate-spin text-orange-500" />
            </div>
          ) : (
            <CommentsList comments={comments} loading={loadingComments} />
          )}
        </div>
      </div>
    </div>
  );
};
