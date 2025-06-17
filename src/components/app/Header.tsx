import { RefreshCw, Settings, Bookmark, Heart } from "lucide-react";
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
    { value: "all", label: "All" },
    { value: "popular", label: "Popular" },
    ...favoriteSubreddits.map((sub) => ({ value: sub, label: `r/${sub}` })),
  ];

  return (
    <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800">
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
            {isFavorite && (
              <Heart
                size={16}
                className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none"
                fill="currentColor"
              />
            )}
          </div>
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
          <Select value={sort} onChange={onSortChange} options={SORT_OPTIONS} />
        </div>
      </div>
    </header>
  );
};
