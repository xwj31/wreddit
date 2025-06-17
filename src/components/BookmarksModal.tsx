import { X, Bookmark, Trash2, ExternalLink } from "lucide-react";
import { formatTimeAgo } from "../utils";
import type { BookmarkedPost } from "../types";

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkedPost[];
  onPostClick: (post: BookmarkedPost) => void;
  onBookmarkRemove: (postId: string) => void;
}

export default function BookmarksModal({
  isOpen,
  onClose,
  bookmarks,
  onPostClick,
  onBookmarkRemove,
}: BookmarksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 modal-safe">
      {/* Header with Safe Area */}
      <div className="sticky top-0 bg-black border-b border-gray-800 z-10 safe-area-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={20} className="text-gray-400" />
            </button>
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

      {/* Content */}
      <div className="overflow-y-auto bottom-bar-safe">
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
                {/* Post Header */}
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
                        {formatTimeAgo(
                          Math.floor(bookmark.bookmarkedAt / 1000)
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onBookmarkRemove(bookmark.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-full hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Remove bookmark"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Post Title - Clickable */}
                <div
                  className="cursor-pointer mb-3 min-h-[44px] flex items-center"
                  onClick={() => onPostClick(bookmark)}
                >
                  <h3 className="text-white font-medium leading-tight text-sm hover:text-orange-400 transition-colors">
                    {bookmark.title}
                  </h3>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onPostClick(bookmark)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm min-h-[44px] py-2"
                  >
                    <span>View Post</span>
                  </button>
                  <a
                    href={`https://reddit.com${bookmark.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm min-h-[44px] py-2"
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
}
