import { useState } from "react";
import {
  X,
  Heart,
  Plus,
  Star,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";
import type { FilterOptions } from "../types";

interface SubredditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubreddit: string;
  onSubredditSelect: (subreddit: string) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export default function SubredditSidebar({
  isOpen,
  onClose,
  currentSubreddit,
  onSubredditSelect,
  filters,
  onFiltersChange,
}: SubredditSidebarProps) {
  const [newSubreddit, setNewSubreddit] = useState("");

  const defaultSubreddits = [
    { name: "all", icon: BarChart3, label: "All" },
    { name: "popular", icon: TrendingUp, label: "Popular" },
    { name: "AskReddit", icon: Clock, label: "AskReddit" },
    { name: "worldnews", icon: Clock, label: "World News" },
    { name: "technology", icon: Clock, label: "Technology" },
    { name: "gaming", icon: Clock, label: "Gaming" },
    { name: "movies", icon: Clock, label: "Movies" },
    { name: "music", icon: Clock, label: "Music" },
  ];

  const handleAddFavorite = () => {
    if (newSubreddit.trim()) {
      const cleanSubreddit = newSubreddit
        .replace(/^r\//, "")
        .toLowerCase()
        .trim();
      const newFavorites = [...filters.favoriteSubreddits];

      if (!newFavorites.includes(cleanSubreddit)) {
        newFavorites.push(cleanSubreddit);
        onFiltersChange({
          ...filters,
          favoriteSubreddits: newFavorites,
        });
      }

      setNewSubreddit("");
    }
  };

  const handleRemoveFavorite = (subreddit: string) => {
    const newFavorites = filters.favoriteSubreddits.filter(
      (sub) => sub !== subreddit
    );
    onFiltersChange({
      ...filters,
      favoriteSubreddits: newFavorites,
    });
  };

  const handleSubredditClick = (subreddit: string) => {
    onSubredditSelect(subreddit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900 z-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Browse Subreddits
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Default/Popular Subreddits */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              Popular
            </h3>
            <div className="space-y-1">
              {defaultSubreddits.map((sub) => {
                const Icon = sub.icon;
                const isActive = currentSubreddit === sub.name;

                return (
                  <button
                    key={sub.name}
                    onClick={() => handleSubredditClick(sub.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-orange-600/20 text-orange-400 border border-orange-600/40"
                        : "hover:bg-gray-800 text-gray-300"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorite Subreddits */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Heart size={16} className="text-red-500" />
              Favorites
            </h3>

            {/* Add new favorite */}
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add subreddit..."
                  value={newSubreddit}
                  onChange={(e) => setNewSubreddit(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddFavorite()}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                />
                <button
                  onClick={handleAddFavorite}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Favorite subreddits list */}
            <div className="space-y-1">
              {filters.favoriteSubreddits.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">
                  No favorite subreddits yet
                </div>
              ) : (
                filters.favoriteSubreddits.map((sub) => {
                  const isActive = currentSubreddit === sub;

                  return (
                    <div
                      key={sub}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-orange-600/20 border border-orange-600/40"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <button
                        onClick={() => handleSubredditClick(sub)}
                        className={`flex-1 text-left ${
                          isActive ? "text-orange-400" : "text-gray-300"
                        }`}
                      >
                        r/{sub}
                      </button>
                      <button
                        onClick={() => handleRemoveFavorite(sub)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
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
}
