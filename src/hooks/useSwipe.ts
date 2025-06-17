import { useEffect, useRef } from "react";

export const useSwipe = (onSwipeRight?: () => void) => {
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    if (!onSwipeRight) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX.current;
      const deltaY = endY - startY.current;

      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 80) {
        onSwipeRight();
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeRight]);
};