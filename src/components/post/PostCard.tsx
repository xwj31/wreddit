// src/components/post/PostCard.tsx - Updated with smaller dots and no fullscreen video
import { useState } from "react";
import {
  ArrowUp,
  MessageCircle,
  ExternalLink,
  Bookmark,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatTimeAgo, formatScore, getImageUrl } from "../../utils";
import { getVideoInfo, hasVideoContent } from "../../utils/video";
import { LinkifiedText } from "../../utils/linkParser";
import { Button } from "../ui/Button";
import { VideoPlayer } from "../ui/VideoPlayer";
import type { RedditPost } from "../../types";
import { storage } from "../../utils/storage";

type PostCardProps = {
  post: RedditPost;
  onPostClick: (post: RedditPost) => void;
  onSubredditClick?: (subreddit: string) => void;
  onBookmarkToggle?: (post: RedditPost) => void;
  isRead?: boolean;
};

// Define the media metadata item type based on your types.ts
type MediaMetadataItem = {
  status: string;
  e: string;
  m: string;
  s: {
    y: number;
    x: number;
    u?: string;
    gif?: string;
  };
  id?: string;
};

// Helper function to extract all images from a post
const getPostImages = (
  post: RedditPost
): Array<{ url: string; width?: number; height?: number }> => {
  const images: Array<{ url: string; width?: number; height?: number }> = [];

  // Check for gallery/multiple images in preview
  if (post.preview?.images && post.preview.images.length > 1) {
    post.preview.images.forEach((img) => {
      if (img.source?.url) {
        images.push({
          url: img.source.url.replace(/&amp;/g, "&"),
          width: img.source.width,
          height: img.source.height,
        });
      }
    });
  }

  // Check for Reddit gallery
  if (post.is_gallery && post.media_metadata) {
    Object.values(post.media_metadata).forEach((item: MediaMetadataItem) => {
      const imageUrl = item.s?.u || item.s?.gif;
      if (imageUrl) {
        images.push({
          url: imageUrl.replace(/&amp;/g, "&"),
          width: item.s.x,
          height: item.s.y,
        });
      }
    });
  }
  // Fallback to single image
  if (images.length === 0) {
    const singleImage = getImageUrl(post);
    if (singleImage) {
      images.push({ url: singleImage });
    }
  }

  return images;
};

export const PostCard = ({
  post,
  onPostClick,
  onSubredditClick,
  onBookmarkToggle,
  isRead = false,
}: PostCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = getPostImages(post);
  const videoInfo = getVideoInfo(post);
  const isBookmarked = storage.isBookmarked(post.id);
  const hasVideo = hasVideoContent(post);
  const hasMultipleImages = images.length > 1;

  // Handle clicking on the post (but not on interactive elements)
  const handlePostClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons, links, or video controls
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, a, video, [role="button"]');

    if (!isInteractive) {
      onPostClick(post);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <article
      className={`border-b border-gray-900 ${
        isRead ? "bg-gray-900/50" : "bg-black"
      }`}
    >
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
            <div
              className={`font-medium text-sm hover:text-orange-400 transition-colors ${
                isRead ? "text-gray-400" : "text-white"
              }`}
            >
              r/{post.subreddit}
            </div>
            <div
              className={`text-xs ${
                isRead ? "text-gray-600" : "text-gray-500"
              }`}
            >
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
          {hasMultipleImages && (
            <div className="flex items-center text-blue-400">
              <span className="text-xs bg-blue-600/20 px-2 py-1 rounded">
                {images.length} pics
              </span>
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

      <div className="px-0 cursor-pointer" onClick={handlePostClick}>
        <div className="px-3 mb-2">
          <h2
            className={`font-medium leading-tight text-sm ${
              isRead ? "text-gray-400" : "text-white"
            }`}
          >
            {post.title}
          </h2>
        </div>

        {/* Video content with inline player (no fullscreen button) */}
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

        {/* Multiple images carousel */}
        {!videoInfo && images.length > 0 && (
          <div className="w-full relative">
            <img
              src={images[currentImageIndex].url}
              alt={`Post content ${currentImageIndex + 1} of ${images.length}`}
              className="w-full object-cover max-h-96"
              loading="eager"
            />

            {/* Image navigation for multiple images */}
            {hasMultipleImages && (
              <>
                {/* Navigation buttons */}
                <Button
                  onClick={(e?: React.MouseEvent<Element>) => {
                    e?.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2"
                  title="Previous image"
                >
                  <ChevronLeft size={16} />
                </Button>

                <Button
                  onClick={(e?: React.MouseEvent<Element>) => {
                    e?.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2"
                  title="Next image"
                >
                  <ChevronRight size={16} />
                </Button>

                {/* Image counter */}
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1}/{images.length}
                </div>

                {/* Dots indicator - Tiny dots */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-0.5 h-0.5 rounded-full transition-colors ${
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-white/50 hover:bg-white/70"
                      }`}
                      type="button"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Text content */}
        {post.selftext && (
          <div className="px-3 mt-2">
            <p className="text-gray-300 text-sm leading-relaxed break-words overflow-wrap-anywhere">
              <LinkifiedText
                text={post.selftext.length > 200
                  ? `${post.selftext.slice(0, 200)}...`
                  : post.selftext}
                linkClassName="text-blue-400 hover:text-blue-300 underline"
              />
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
              <span className="text-sm break-all max-w-[200px] inline-block overflow-hidden text-ellipsis">
                {(() => {
                  try {
                    const url = new URL(post.url);
                    return url.hostname;
                  } catch {
                    return hasVideo ? "Video" : "Link";
                  }
                })()}
              </span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
