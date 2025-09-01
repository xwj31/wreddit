import { Flame, TrendingUp, Clock } from "lucide-react";
import { Button } from "../ui/Button";

export type RedditFilterOption = "hot" | "top" | "new";

type RedditFilterSettingsProps = {
  settings: {
    redditFilter: RedditFilterOption;
  };
  onSettingsChange: (settings: RedditFilterSettingsProps["settings"]) => void;
  loading?: boolean;
};

export const RedditFilterSettings = ({
  settings,
  onSettingsChange,
  loading = false,
}: RedditFilterSettingsProps) => {
  const setRedditFilter = (redditFilter: RedditFilterOption) => {
    onSettingsChange({
      ...settings,
      redditFilter,
    });
  };

  const filterOptions = [
    {
      key: "hot" as const,
      icon: Flame,
      title: "Hot Posts",
      description: "Posts that are currently trending and popular",
      color: "text-orange-500",
    },
    {
      key: "top" as const,
      icon: TrendingUp,
      title: "Top Posts",
      description: "Highest scoring posts from today",
      color: "text-green-500",
    },
    {
      key: "new" as const,
      icon: Clock,
      title: "New Posts",
      description: "Most recently posted content",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        <Flame size={20} className="text-orange-500" />
        Reddit Post Filter
      </h3>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Daily Post Fetch Filter</h4>
        <p className="text-xs text-gray-400">
          Choose which type of posts to fetch from your subreddits during the daily update at 1am.
        </p>

        {filterOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = settings.redditFilter === option.key;

          return (
            <Button
              key={option.key}
              onClick={() => !loading && setRedditFilter(option.key)}
              disabled={loading}
              className={`w-full p-4 rounded-lg border transition-all ${
                isSelected
                  ? "bg-gray-700/50 border-orange-500 text-white"
                  : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? "bg-orange-600" : "bg-gray-700"
                  } ${option.color}`}
                >
                  <Icon size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">{option.title}</div>
                  <div className="text-sm text-gray-400">
                    {option.description}
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    isSelected
                      ? "bg-orange-500 border-orange-500"
                      : "border-gray-600"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-800/30">
        <div className="text-orange-400 text-sm mb-1 font-medium">
          About Reddit Filters
        </div>
        <div className="text-orange-300 text-xs">
          This setting determines which posts are fetched from Reddit for your subscribed subreddits.
          Changes take effect during the next daily update at 1am.
        </div>
      </div>
    </div>
  );
};