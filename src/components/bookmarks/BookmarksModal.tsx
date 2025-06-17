import { X, Bookmark, Trash2, ExternalLink } from "lucide-react";
import { formatTimeAgo } from "../../utils";
import { Button } from "../ui/Button";
import type { BookmarkedPost } from "../../types";

type BookmarksModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkedPost[];
  onPostClick: (post: BookmarkedPost) => void;
  onBookmarkRemove: (postId: string) => void;
};

export const BookmarksModal = ({
  isOpen,
  onClose,
  bookmarks,
  onPostClick,
  onBookmarkRemove,
}: BookmarksModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="sticky top-0 bg-black border-b border-gray-800 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button onClick={onClose} className="text-gray-400">
              <X size={20} />
            </Button>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bookmark size={20} className="text-orange-500" />
              Bookmarks
            </h2>
          </div>
          <div className="text-sm text-gray-400">
            {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Bookmark size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              No bookmarks yet
            </h3>
            <p className="text-gray-500 text-center text-sm">
              Bookmark posts to save them for later reading
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {bookmarks.map((bookmark) => (
              <article
                key={bookmark.id}
                className="bg-black border-b border-gray-900 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {bookmark.subreddit.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        r/{bookmark.subreddit}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Bookmarked{" "}
                        {formatTimeAgo(Math.floor(bookmark.bookmarkedAt / 1000))}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => onBookmarkRemove(bookmark.id)}
                    className="text-gray-500 hover:text-red-400"
                    title="Remove bookmark"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div
                  className="cursor-pointer mb-3 flex items-center"
                  onClick={() => onPostClick(bookmark)}
                >
                  <h3 className="text-white font-medium leading-tight text-sm hover:text-orange-400 transition-colors">
                    {bookmark.title}
                  </h3>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => onPostClick(bookmark)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                  >
                    <span>View Post</span>
                  </Button>
                  <a
                    href={`https://reddit.com${bookmark.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={16} />
                    <span>Reddit</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};