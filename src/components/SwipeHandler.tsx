import { useEffect, useRef, type ReactNode } from "react";

interface SwipeHandlerProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  disabled?: boolean;
  threshold?: number;
}

export default function SwipeHandler({
  children,
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
  threshold = 100,
}: SwipeHandlerProps) {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
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
      isSwipeInProgress.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeInProgress.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      currentX.current = touch.clientX;
      currentY.current = touch.clientY;
    };

    const handleTouchEnd = () => {
      if (!isSwipeInProgress.current) return;

      const deltaX = currentX.current - startX.current;
      const deltaY = currentY.current - startY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Only trigger swipe if horizontal movement is greater than vertical
      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      isSwipeInProgress.current = false;
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, onSwipeRight, onSwipeLeft, threshold]);

  return <>{children}</>;
}
