// src/components/ui/VideoPlayer.tsx - Updated without fullscreen
import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Button } from "./Button";
import { formatDuration } from "../../utils/video";
import type { VideoInfo } from "../../types";

type VideoPlayerProps = {
  videoInfo: VideoInfo;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
};

export const VideoPlayer = ({
  videoInfo,
  autoplay = false,
  muted = true,
  controls = true,
  className = "",
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => setError("Failed to load video");

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => setError("Failed to play video"));
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const retry = () => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    video.load();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  // For embedded content (YouTube, Vimeo, etc.)
  if (videoInfo.embedHtml && videoInfo.type !== "reddit_video") {
    return (
      <div
        className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}
        style={{
          aspectRatio:
            videoInfo.width && videoInfo.height
              ? `${videoInfo.width}/${videoInfo.height}`
              : "16/9",
        }}
      >
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: videoInfo.embedHtml }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`relative w-full bg-gray-900 rounded-lg overflow-hidden flex flex-col items-center justify-center p-8 ${className}`}
      >
        <div className="text-red-400 text-center mb-4">
          <div className="text-lg font-medium mb-2">Video failed to load</div>
          <div className="text-sm text-gray-400">{error}</div>
        </div>
        <Button
          onClick={retry}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          <RotateCcw size={16} />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={videoInfo.url}
        autoPlay={autoplay}
        muted={isMuted}
        loop={videoInfo.isGif}
        playsInline
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {controls && (
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Center play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={togglePlay}
              className={`bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-all ${
                isPlaying ? "opacity-0 scale-75" : "opacity-100 scale-100"
              }`}
            >
              <Play size={32} />
            </Button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress bar */}
            {duration > 0 && (
              <div
                className="w-full h-1 bg-gray-600 rounded cursor-pointer mb-3"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-red-500 rounded"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            )}

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={togglePlay}
                  className="text-white hover:text-gray-300"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </Button>

                <Button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </Button>

                {duration > 0 && (
                  <span className="text-white text-sm">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                )}

                {videoInfo.isGif && (
                  <span className="text-white text-xs bg-white/20 px-2 py-1 rounded">
                    GIF
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
