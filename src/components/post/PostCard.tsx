// src/components/post/PostCard.tsx - Updated with video support
import {
  ArrowUp,
  MessageCircle,
  ExternalLink,
  Bookmark,
  Play,
} from "lucide-react";
import { formatTimeAgo, formatScore, getImageUrl } from "../../utils";
import { getVideoInfo, hasVideoContent } from "../../utils/video";
import { Button } from "../ui/Button";
import { VideoPlayer } from "../ui/VideoPlayer";
import type { RedditPost } from "../../types";
import { storage } from "../../utils/storage";

type PostCardProps = {
  post: RedditPost;
  onPostClick: (post: RedditPost) => void;
  onSubredditClick?: (subreddit: string) => void;
  onBookmarkToggle?: (post: RedditPost) => void;
};

export const PostCard = ({
  post,
  onPostClick,
  onSubredditClick,
  onBookmarkToggle,
}: PostCardProps) => {
  const imageUrl = getImageUrl(post);
  const videoInfo = getVideoInfo(post);
  const isBookmarked = storage.isBookmarked(post.id);
  const hasVideo = hasVideoContent(post);

  return (
    <article className="bg-black border-b border-gray-900">
      <div className="flex items-center justify-between p-3">
        <Button
          onClick={() => onSubredditClick?.(post.subreddit)}
          className="flex items-center gap-3 hover:bg-gray-900/50 rounded-lg p-1 -m-1"
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
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex items-center text-gray-400">
            <ArrowUp size={16} className="text-gray-500" />
            <span className="text-xs font-medium ml-1">
              {formatScore(post.score)}
            </span>
          </div>
          {hasVideo && (
            <div className="flex items-center text-red-400">
              <Play size={16} fill="currentColor" />
            </div>
          )}
          {onBookmarkToggle && (
            <Button
              onClick={(e) => {
                e?.stopPropagation();
                onBookmarkToggle(post);
              }}
              className={`p-1.5 rounded-full ${
                isBookmarked
                  ? "text-orange-500 hover:text-orange-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <Bookmark
                size={16}
                fill={isBookmarked ? "currentColor" : "none"}
              />
            </Button>
          )}
        </div>
      </div>

      <div className="px-0 cursor-pointer" onClick={() => onPostClick(post)}>
        <div className="px-3 mb-2">
          <h2 className="text-white font-medium leading-tight text-sm">
            {post.title}
          </h2>
        </div>

        {/* Video content */}
        {videoInfo && (
          <div className="w-full mb-2">
            <VideoPlayer
              videoInfo={videoInfo}
              autoplay={false}
              muted={true}
              controls={true}
              className="max-h-96"
            />
          </div>
        )}

        {/* Image content (only if no video) */}
        {!videoInfo && imageUrl && (
          <div className="w-full">
            <img
              src={imageUrl}
              alt="Post content"
              className="w-full object-cover max-h-96"
            />
          </div>
        )}

        {/* Text content */}
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

      <div className="flex items-center justify-between px-3 py-3">
        <Button
          onClick={() => onPostClick(post)}
          className="flex items-center gap-2 text-gray-400 hover:text-white p-2 -m-2 rounded-lg hover:bg-gray-800/50"
        >
          <MessageCircle size={20} />
          <span className="text-sm font-medium">
            {post.num_comments} comments
          </span>
        </Button>

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
              <span className="text-sm">{hasVideo ? "Video" : "Link"}</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
