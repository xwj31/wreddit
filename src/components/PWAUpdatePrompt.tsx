import { useState, useEffect } from "react";
import { X, Download, RefreshCw } from "lucide-react";

interface PWAUpdatePromptProps {
  onClose?: () => void;
}

export default function PWAUpdatePrompt({ onClose }: PWAUpdatePromptProps) {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const registerSW = async () => {
      if ("serviceWorker" in navigator) {
        try {
          // Dynamic import with proper error handling
          const { registerSW } = await import("virtual:pwa-register");
          const updateServiceWorker = registerSW({
            onNeedRefresh() {
              setNeedRefresh(true);
            },
            onOfflineReady() {
              setOfflineReady(true);
            },
          });
          setUpdateSW(() => updateServiceWorker);
        } catch (error) {
          console.log(
            "PWA not available or service worker registration failed"
          );
          console.error(error);
          // Gracefully handle when PWA is not available
        }
      }
    };

    registerSW();
  }, []);

  const handleUpdate = async () => {
    if (updateSW) {
      await updateSW();
    }
  };

  const handleClose = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
    onClose?.();
  };

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-96">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {needRefresh ? (
              <RefreshCw size={20} className="text-orange-500" />
            ) : (
              <Download size={20} className="text-green-500" />
            )}
            <h3 className="text-white font-medium text-sm">
              {needRefresh ? "Update Available" : "App Ready"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-gray-300 text-sm mb-4">
          {needRefresh
            ? "A new version of WReddit is available. Update now for the latest features and improvements."
            : "WReddit is now available offline! You can use the app even without an internet connection."}
        </p>

        <div className="flex gap-2">
          {needRefresh && (
            <button
              onClick={handleUpdate}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Update Now
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            {needRefresh ? "Later" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
