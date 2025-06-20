import { RefreshCw, Settings, Bookmark, Heart, Home } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

type HeaderProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  subreddit: string;
  onSubredditChange: (subreddit: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  favoriteSubreddits: string[];
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onRefresh: () => void;
  onShowSettings: () => void;
  onShowBookmarks: () => void;
  onShowSidebar: () => void;
  loading: boolean;
};

const SORT_OPTIONS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
  { value: "rising", label: "Rising" },
];

export const Header = ({
  searchTerm,
  onSearchChange,
  subreddit,
  onSubredditChange,
  sort,
  onSortChange,
  favoriteSubreddits,
  isFavorite,
  onFavoriteToggle,
  onRefresh,
  onShowSettings,
  onShowBookmarks,
  onShowSidebar,
  loading,
}: HeaderProps) => {
  const subredditOptions = [
    // Add Home option when user has favorites
    ...(favoriteSubreddits.length > 0 ? [{ value: "home", label: "🏠 Home" }] : []),
    { value: "all", label: "All" },
    { value: "popular", label: "Popular" },
    ...favoriteSubreddits.map((sub) => ({ value: sub, label: `r/${sub}` })),
  ];

  // Show different icon based on current selection
  const getSubredditIcon = () => {
    if (subreddit === "home") return <Home size={16} className="text-blue-500" />;
    if (isFavorite) return <Heart size={16} className="text-red-500" fill="currentColor" />;
    return null;
  };

  return (
    <header className="sticky-header-safe bg-black border-b border-gray-800">
      <div className="flex items-center justify-between p-3">
        <Button
          onClick={onShowSidebar}
          className="text-orange-500 hover:text-orange-400 font-bold text-lg"
          title="Open sidebar"
        >
          W
        </Button>

        <div className="flex items-center gap-1">
          <Button
            onClick={onShowBookmarks}
            className="text-gray-400 hover:text-white"
            title="View bookmarks"
          >
            <Bookmark size={22} />
          </Button>
          <Button
            onClick={onShowSettings}
            className="text-gray-400 hover:text-white"
          >
            <Settings size={22} />
          </Button>
          <Button
            onClick={onRefresh}
            disabled={loading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-3">
        <Input
          placeholder="Search posts..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full"
        />

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Select
              value={subreddit}
              onChange={onSubredditChange}
              options={subredditOptions}
              className="w-full"
            />
            {getSubredditIcon() && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {getSubredditIcon()}
              </div>
            )}
          </div>
          
          {/* Only show favorite toggle for actual subreddits, not for home/all/popular */}
          {!["home", "all", "popular"].includes(subreddit) && (
            <Button
              onClick={onFavoriteToggle}
              className={`rounded-xl border transition-colors ${
                isFavorite
                  ? "bg-red-600 border-red-500 text-white"
                  : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
              }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </Button>
          )}
          
          <Select value={sort} onChange={onSortChange} options={SORT_OPTIONS} />
        </div>
      </div>
    </header>
  );
};