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
      onNavigateBack();
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
    window.history.pushState({ page: "current" }, "", window.location.href);

    // This component doesn't directly trigger navigation,
    // but we can expose this functionality if needed
    return () => {};
  }, []);

  return null; // This component doesn't render anything
}
