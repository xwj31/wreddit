import { ArrowUp, MessageCircle, ExternalLink } from "lucide-react";
import { formatTimeAgo, formatScore, getHighQualityImage } from "../utils";
import type { RedditPost } from "../types";

interface PostFeedProps {
  posts: RedditPost[];
  onPostClick: (post: RedditPost) => void;
}

export default function PostFeed({ posts, onPostClick }: PostFeedProps) {
  return (
    <div className="space-y-0">
      {posts.map((post) => {
        // Use the same image logic as PostDetail
        const imageUrl = getHighQualityImage(post);

        return (
          <article
            key={post.id}
            className="bg-black border-b border-gray-900 cursor-pointer"
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

              {/* Image/Media - Fixed to use getHighQualityImage */}
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
