import { useEffect, useRef, type ReactNode } from "react";

interface SwipeHandlerProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  disabled?: boolean;
  threshold?: number;
  velocityThreshold?: number;
}

export default function SwipeHandler({
  children,
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
  threshold = 80,
  velocityThreshold = 0.3,
}: SwipeHandlerProps) {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const currentX = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isSwipeInProgress = useRef<boolean>(false);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      currentX.current = touch.clientX;
      currentY.current = touch.clientY;
      startTime.current = Date.now();
      isSwipeInProgress.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeInProgress.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      currentX.current = touch.clientX;
      currentY.current = touch.clientY;

      // Prevent default scrolling if horizontal movement is significant
      const deltaX = Math.abs(currentX.current - startX.current);
      const deltaY = Math.abs(currentY.current - startY.current);

      if (deltaX > deltaY && deltaX > 20) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isSwipeInProgress.current) return;

      const deltaX = currentX.current - startX.current;
      const deltaY = currentY.current - startY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const deltaTime = Date.now() - startTime.current;
      const velocity = absDeltaX / deltaTime;

      // Only trigger swipe if:
      // 1. Horizontal movement is greater than vertical
      // 2. Distance exceeds threshold OR velocity is high enough
      // 3. Time is reasonable (not too slow)
      if (
        absDeltaX > absDeltaY &&
        deltaTime < 500 &&
        (absDeltaX > threshold || velocity > velocityThreshold)
      ) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      isSwipeInProgress.current = false;
    };

    // Add passive: false to prevent default when needed
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, onSwipeRight, onSwipeLeft, threshold, velocityThreshold]);

  return <>{children}</>;
}
