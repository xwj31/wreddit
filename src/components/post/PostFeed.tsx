import { RefreshCw } from "lucide-react";
import { PostCard } from "./PostCard";
import { Button } from "../ui/Button";
import type { RedditPost } from "../../types";

type PostFeedProps = {
  posts: RedditPost[];
  loading: boolean;
  hasMore: boolean;
  onPostClick: (post: RedditPost) => void;
  onSubredditClick?: (subreddit: string) => void;
  onBookmarkToggle?: (post: RedditPost) => void;
  onLoadMore?: () => void;
  error?: string;
};

export const PostFeed = ({
  posts,
  loading,
  hasMore,
  onPostClick,
  onSubredditClick,
  onBookmarkToggle,
  onLoadMore,
  error,
}: PostFeedProps) => {
  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700/40 text-red-400 mx-3 mt-4 rounded-xl">
        <div className="font-medium">Error</div>
        <div className="text-sm mt-1">{error}</div>
      </div>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-gray-400 text-lg mb-2">No posts found</div>
        <div className="text-gray-500 text-sm">
          Try adjusting your filters or check your connection
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPostClick={onPostClick}
          onSubredditClick={onSubredditClick}
          onBookmarkToggle={onBookmarkToggle}
        />
      ))}

      {hasMore && !loading && (
        <div className="p-4">
          <Button
            onClick={onLoadMore}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 font-medium"
          >
            Load More Posts
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-8">
          <RefreshCw size={24} className="animate-spin text-orange-500" />
        </div>
      )}
    </div>
  );
};