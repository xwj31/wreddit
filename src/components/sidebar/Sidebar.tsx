import { useState } from "react";
import {
  X,
  Heart,
  Plus,
  Bookmark,
  Home,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  currentSubreddit: string;
  onSubredditSelect: (subreddit: string) => void;
  favoriteSubreddits: string[];
  onFavoriteToggle: (subreddit: string) => Promise<void>;
  onNavigateToBookmarks?: () => void;
};

export const Sidebar = ({
  isOpen,
  onClose,
  currentSubreddit,
  onSubredditSelect,
  favoriteSubreddits,
  onFavoriteToggle,
  onNavigateToBookmarks,
}: SidebarProps) => {
  const [newSubreddit, setNewSubreddit] = useState("");

  const handleAddFavorite = async () => {
    if (newSubreddit.trim()) {
      const cleanSubreddit = newSubreddit
        .replace(/^r\//, "")
        .toLowerCase()
        .trim();
      if (!favoriteSubreddits.includes(cleanSubreddit)) {
        await onFavoriteToggle(cleanSubreddit);
      }
      setNewSubreddit("");
    }
  };

  const handleRemoveFavorite = async (subreddit: string) => {
    await onFavoriteToggle(subreddit);
  };

  const handleSubredditClick = (subreddit: string) => {
    onSubredditSelect(subreddit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900 z-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Browse</h2>
          <Button onClick={onClose} className="text-gray-400">
            <X size={20} />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Quick Access
            </h3>

            {/* Home option - only show if user has favorites */}
            {favoriteSubreddits.length > 0 && (
              <Button
                onClick={() => handleSubredditClick("home")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left mb-2 ${
                  currentSubreddit === "home"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/40"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Home size={18} className="text-blue-500" />
                <span>Home Feed</span>
              </Button>
            )}

            <Button
              onClick={() => handleSubredditClick("all")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left mb-2 ${
                currentSubreddit === "all"
                  ? "bg-orange-600/20 text-orange-400 border border-orange-600/40"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <div className="w-[18px] h-[18px] rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span>All</span>
            </Button>

            <Button
              onClick={() => handleSubredditClick("popular")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left mb-2 ${
                currentSubreddit === "popular"
                  ? "bg-purple-600/20 text-purple-400 border border-purple-600/40"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <div className="w-[18px] h-[18px] rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span>Popular</span>
            </Button>

            <Button
              onClick={() => {
                onNavigateToBookmarks?.();
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-300 hover:bg-gray-800"
            >
              <Bookmark size={18} className="text-orange-500" />
              <span>Bookmarks</span>
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Heart size={16} className="text-red-500" />
              Favorites
            </h3>

            <div className="mb-3 flex gap-2">
              <Input
                placeholder="Add subreddit..."
                value={newSubreddit}
                onChange={setNewSubreddit}
                onEnter={handleAddFavorite}
                className="flex-1"
              />
              <Button
                onClick={handleAddFavorite}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus size={16} />
              </Button>
            </div>

            <div className="space-y-1">
              {favoriteSubreddits.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">
                  No favorite subreddits yet
                </div>
              ) : (
                favoriteSubreddits.map((sub) => {
                  const isActive = currentSubreddit === sub;

                  return (
                    <div
                      key={sub}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isActive
                          ? "bg-orange-600/20 border border-orange-600/40"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <Button
                        onClick={() => handleSubredditClick(sub)}
                        className={`flex-1 text-left flex items-center gap-2 ${
                          isActive ? "text-orange-400" : "text-gray-300"
                        }`}
                      >
                        <Heart
                          size={14}
                          className="text-red-500"
                          fill="currentColor"
                        />
                        <span>r/{sub}</span>
                      </Button>
                      <Button
                        onClick={() => handleRemoveFavorite(sub)}
                        className="p-1 text-gray-500 hover:text-red-400"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};