import { useEffect } from "react";

interface NavigationManagerProps {
  onNavigateBack: () => void;
}

export default function NavigationManager({
  onNavigateBack,
}: NavigationManagerProps) {
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();

      // Add a small delay to prevent zoom issues in PWA mode
      setTimeout(() => {
        onNavigateBack();
      }, 10);
    };

    // Add a dummy state to enable back button functionality
    if (window.history.state === null) {
      window.history.replaceState({ page: "feed" }, "", window.location.href);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onNavigateBack]);

  // Push state when navigating forward
  useEffect(() => {
    // Prevent zoom issues by setting viewport meta tag for PWA
    const setViewportMeta = () => {
      let viewport = document.querySelector("meta[name=viewport]");
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.setAttribute("name", "viewport");
        document.head.appendChild(viewport);
      }
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      );
    };

    // Apply viewport settings for PWA
    setViewportMeta();

    // Handle orientation changes to prevent zoom issues
    const handleOrientationChange = () => {
      setTimeout(() => {
        setViewportMeta();
        // Force a repaint to fix any zoom issues
        document.body.style.zoom = "1";
        setTimeout(() => {
          document.body.style.zoom = "";
        }, 50);
      }, 100);
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  return null; // This component doesn't render anything
}
