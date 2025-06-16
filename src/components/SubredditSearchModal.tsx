import { useState, useEffect, useCallback } from "react";
import { X, Search, Users, TrendingUp, Loader2 } from "lucide-react";
import type { SearchSubredditsResponse } from "../types";

interface SubredditSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubredditSelect: (subreddit: string) => void;
  workerUrl: string;
}

interface SubredditResult {
  name: string;
  display_name: string;
  subscribers: number;
  public_description: string;
}

const POPULAR_SUBREDDITS = [
  "popular",
  "all",
  "AskReddit",
  "funny",
  "todayilearned",
  "worldnews",
  "pics",
  "gaming",
  "aww",
  "Music",
  "movies",
  "videos",
  "news",
  "mildlyinteresting",
  "explainlikeimfive",
  "gifs",
  "technology",
  "science",
  "IAmA",
  "askscience",
];

export default function SubredditSearchModal({
  isOpen,
  onClose,
  onSubredditSelect,
  workerUrl,
}: SubredditSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SubredditResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSubreddits = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = new URL(`${workerUrl}/api/search-subreddits`);
        url.searchParams.append("q", query);
        url.searchParams.append("limit", "20");

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data: SearchSubredditsResponse = await response.json();
        setSearchResults(data.subreddits || []);
      } catch (err) {
        console.error("Subreddit search error:", err);
        setError(err instanceof Error ? err.message : "Search failed");
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [workerUrl]
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchSubreddits(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchSubreddits]);

  const handleSubredditClick = (subredditName: string) => {
    onSubredditSelect(subredditName);
  };

  const formatSubscriberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 pt-16">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold">Browse Subreddits</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search subreddits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
              autoFocus
            />
            {loading && (
              <Loader2
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 animate-spin"
                size={16}
              />
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          {/* Popular Subreddits (shown when no search term) */}
          {!searchTerm && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <TrendingUp size={16} />
                Popular Subreddits
              </h3>
              <div className="space-y-2">
                {POPULAR_SUBREDDITS.map((subreddit) => (
                  <button
                    key={subreddit}
                    onClick={() => handleSubredditClick(subreddit)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="font-medium text-white">
                      {subreddit === "all" || subreddit === "popular"
                        ? subreddit.charAt(0).toUpperCase() + subreddit.slice(1)
                        : `r/${subreddit}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchTerm && searchResults.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Search size={16} />
                Search Results
              </h3>
              <div className="space-y-2">
                {searchResults.map((subreddit) => (
                  <button
                    key={subreddit.name}
                    onClick={() => handleSubredditClick(subreddit.display_name)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-white">
                        r/{subreddit.display_name}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Users size={12} />
                        {formatSubscriberCount(subreddit.subscribers)}
                      </div>
                    </div>
                    {subreddit.public_description && (
                      <div className="text-gray-400 text-sm line-clamp-2">
                        {subreddit.public_description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchTerm && !loading && searchResults.length === 0 && !error && (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-sm">
                No subreddits found for "{searchTerm}"
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Try a different search term
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4">
              <div className="bg-red-900/20 border border-red-700/40 text-red-400 p-3 rounded-lg text-sm">
                <div className="font-medium">Search Error</div>
                <div className="mt-1">{error}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
