// src/components/settings/VideoSettings.tsx - Video-specific settings
import { Play, Video, Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/Button";

type VideoSettingsProps = {
  settings: {
    autoplayVideos: boolean;
    muteByDefault: boolean;
    showVideoIndicators: boolean;
    preferHighQuality: boolean;
  };
  onSettingsChange: (settings: VideoSettingsProps["settings"]) => void;
};

export const VideoSettings = ({
  settings,
  onSettingsChange,
}: VideoSettingsProps) => {
  const toggleSetting = (key: keyof VideoSettingsProps["settings"]) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const settingsItems = [
    {
      key: "autoplayVideos" as const,
      icon: Play,
      title: "Autoplay Videos",
      description: "Automatically play videos when they come into view",
      color: "text-green-500",
    },
    {
      key: "muteByDefault" as const,
      icon: settings.muteByDefault ? VolumeX : Volume2,
      title: "Mute by Default",
      description: "Start all videos muted",
      color: "text-blue-500",
    },
    {
      key: "showVideoIndicators" as const,
      icon: Video,
      title: "Show Video Indicators",
      description: "Display play icons on video posts",
      color: "text-purple-500",
    },
    {
      key: "preferHighQuality" as const,
      icon: Video,
      title: "Prefer High Quality",
      description: "Use higher quality video sources when available",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Video Settings</h3>

      {settingsItems.map((item) => {
        const Icon = item.icon;
        const isEnabled = settings[item.key];

        return (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-700 ${item.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-white font-medium">{item.title}</div>
                <div className="text-gray-400 text-sm">{item.description}</div>
              </div>
            </div>

            <Button
              onClick={() => toggleSetting(item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isEnabled ? "bg-orange-600" : "bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isEnabled ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </Button>
          </div>
        );
      })}
    </div>
  );
};
