import { Heart, X, Plus } from "lucide-react";
import { addToFilterList, removeFromFilterList } from "../utils/storage";
import type { FilterOptions } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleAddToList = (
    listType: keyof FilterOptions,
    value: string,
    inputElement: HTMLInputElement
  ) => {
    const currentList = filters[listType] as string[];
    const newList = addToFilterList(currentList, value);

    if (newList !== currentList) {
      onFiltersChange({
        ...filters,
        [listType]: newList,
      });
      inputElement.value = "";
    }
  };

  const handleRemoveFromList = (
    listType: keyof FilterOptions,
    item: string
  ) => {
    const currentList = filters[listType] as string[];
    const newList = removeFromFilterList(currentList, item);

    onFiltersChange({
      ...filters,
      [listType]: newList,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Favorite Subreddits */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2 text-orange-400">
              <Heart size={16} className="text-red-500" />
              Favorite Subreddits
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add subreddit..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddToList(
                        "favoriteSubreddits",
                        e.currentTarget.value,
                        e.currentTarget
                      );
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    handleAddToList("favoriteSubreddits", input.value, input);
                  }}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.favoriteSubreddits.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 border border-red-600/40 text-red-400 rounded-lg text-sm"
                  >
                    r/{sub}
                    <button
                      onClick={() =>
                        handleRemoveFromList("favoriteSubreddits", sub)
                      }
                      className="hover:text-red-300 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Blocked Subreddits */}
          <div>
            <h3 className="font-medium mb-3 text-gray-300">
              Blocked Subreddits
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Block subreddit..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddToList(
                        "blockedSubreddits",
                        e.currentTarget.value,
                        e.currentTarget
                      );
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    handleAddToList("blockedSubreddits", input.value, input);
                  }}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.blockedSubreddits.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg text-sm"
                  >
                    r/{sub}
                    <button
                      onClick={() =>
                        handleRemoveFromList("blockedSubreddits", sub)
                      }
                      className="hover:text-gray-200 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Keyword Filters */}
          <div>
            <h3 className="font-medium mb-3 text-gray-300">Keyword Filters</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Block keyword..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddToList(
                        "blockedKeywords",
                        e.currentTarget.value,
                        e.currentTarget
                      );
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    handleAddToList("blockedKeywords", input.value, input);
                  }}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.blockedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() =>
                        handleRemoveFromList("blockedKeywords", keyword)
                      }
                      className="hover:text-gray-200 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
