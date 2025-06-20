import { Home, Calendar, TrendingUp, MessageCircle } from "lucide-react";
import { Button } from "../ui/Button";

export type HomeFeedSortOption = "new" | "score" | "comments";

type HomeFeedSettingsProps = {
  settings: {
    sortBy: HomeFeedSortOption;
  };
  onSettingsChange: (settings: HomeFeedSettingsProps["settings"]) => void;
};

export const HomeFeedSettings = ({
  settings,
  onSettingsChange,
}: HomeFeedSettingsProps) => {
  const setSortBy = (sortBy: HomeFeedSortOption) => {
    onSettingsChange({
      ...settings,
      sortBy,
    });
  };

  const sortOptions = [
    {
      key: "new" as const,
      icon: Calendar,
      title: "Newest First",
      description: "Sort posts by creation time (newest first)",
      color: "text-blue-500",
    },
    {
      key: "score" as const,
      icon: TrendingUp,
      title: "Most Upvoted",
      description: "Sort posts by upvote score",
      color: "text-green-500",
    },
    {
      key: "comments" as const,
      icon: MessageCircle,
      title: "Most Comments",
      description: "Sort posts by number of comments",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        <Home size={20} className="text-blue-500" />
        Home Feed Settings
      </h3>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Sort Posts By</h4>

        {sortOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = settings.sortBy === option.key;

          return (
            <Button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`w-full p-4 rounded-lg border transition-all ${
                isSelected
                  ? "bg-gray-700/50 border-orange-500 text-white"
                  : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600"
              }`}
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

      <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
        <div className="text-blue-400 text-sm mb-1 font-medium">
          About Home Feed
        </div>
        <div className="text-blue-300 text-xs">
          Your Home Feed combines posts from all your favorite subreddits into a
          single timeline. Choose how you want these posts to be sorted.
        </div>
      </div>
    </div>
  );
};
