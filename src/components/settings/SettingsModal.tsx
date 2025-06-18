// src/components/settings/SettingsModal.tsx - Enhanced with video settings
import { useState } from "react";
import { Plus, X, Settings, Video } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { VideoSettings } from "./VideoSettings";
import type { FilterOptions } from "../../types";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
};

type FilterListProps = {
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder: string;
  color?: "red" | "gray";
};

type VideoSettingsType = {
  autoplayVideos: boolean;
  muteByDefault: boolean;
  showVideoIndicators: boolean;
  preferHighQuality: boolean;
};

const FilterList = ({
  title,
  items,
  onAdd,
  onRemove,
  placeholder,
  color = "gray",
}: FilterListProps) => {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.toLowerCase().trim())) {
      onAdd(newItem.toLowerCase().trim());
      setNewItem("");
    }
  };

  const colorClasses = {
    red: "bg-red-600/20 border-red-600/40 text-red-400",
    gray: "bg-gray-700/50 border-gray-600 text-gray-300",
  };

  return (
    <div>
      <h3 className="font-medium mb-3 text-gray-300">{title}</h3>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={setNewItem}
            onEnter={handleAdd}
            className="flex-1"
          />
          <Button
            onClick={handleAdd}
            className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            <Plus size={16} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${colorClasses[color]}`}
            >
              {item}
              <Button
                onClick={() => onRemove(item)}
                className="hover:text-gray-200"
              >
                <X size={12} />
              </Button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SettingsModal = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<"filters" | "video">("filters");

  // Load video settings from localStorage or use defaults
  const [videoSettings, setVideoSettings] = useState<VideoSettingsType>(() => {
    try {
      const saved = localStorage.getItem("wreddit-video-settings");
      return saved
        ? JSON.parse(saved)
        : {
            autoplayVideos: false,
            muteByDefault: true,
            showVideoIndicators: true,
            preferHighQuality: false,
          };
    } catch {
      return {
        autoplayVideos: false,
        muteByDefault: true,
        showVideoIndicators: true,
        preferHighQuality: false,
      };
    }
  });

  const updateFilter = (key: keyof FilterOptions, items: string[]) => {
    onFiltersChange({ ...filters, [key]: items });
  };

  const handleVideoSettingsChange = (newSettings: VideoSettingsType) => {
    setVideoSettings(newSettings);
    try {
      localStorage.setItem(
        "wreddit-video-settings",
        JSON.stringify(newSettings)
      );
    } catch {
      // Fail silently
    }
  };

  const tabs = [
    { id: "filters" as const, label: "Filters", icon: Settings },
    { id: "video" as const, label: "Video", icon: Video },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="border-b border-gray-800">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {activeTab === "filters" && (
          <div className="space-y-6">
            <FilterList
              title="Favorite Subreddits"
              items={filters.favoriteSubreddits}
              onAdd={(item) =>
                updateFilter("favoriteSubreddits", [
                  ...filters.favoriteSubreddits,
                  item,
                ])
              }
              onRemove={(item) =>
                updateFilter(
                  "favoriteSubreddits",
                  filters.favoriteSubreddits.filter((i) => i !== item)
                )
              }
              placeholder="Add subreddit..."
              color="red"
            />

            <FilterList
              title="Blocked Subreddits"
              items={filters.blockedSubreddits}
              onAdd={(item) =>
                updateFilter("blockedSubreddits", [
                  ...filters.blockedSubreddits,
                  item,
                ])
              }
              onRemove={(item) =>
                updateFilter(
                  "blockedSubreddits",
                  filters.blockedSubreddits.filter((i) => i !== item)
                )
              }
              placeholder="Block subreddit..."
            />

            <FilterList
              title="Blocked Keywords"
              items={filters.blockedKeywords}
              onAdd={(item) =>
                updateFilter("blockedKeywords", [
                  ...filters.blockedKeywords,
                  item,
                ])
              }
              onRemove={(item) =>
                updateFilter(
                  "blockedKeywords",
                  filters.blockedKeywords.filter((i) => i !== item)
                )
              }
              placeholder="Block keyword..."
            />
          </div>
        )}

        {activeTab === "video" && (
          <VideoSettings
            settings={videoSettings}
            onSettingsChange={handleVideoSettingsChange}
          />
        )}
      </div>
    </Modal>
  );
};
