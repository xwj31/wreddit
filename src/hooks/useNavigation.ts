import { useEffect } from "react";

export const useNavigation = (onBack: () => void) => {
  useEffect(() => {
    const handlePopState = () => onBack();
    
    if (window.history.state === null) {
      window.history.replaceState({ page: "feed" }, "", window.location.href);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onBack]);

  const pushState = (data: Record<string, unknown>) => {
    window.history.pushState(data, "", window.location.href);
  };

  return { pushState };
};