// src/utils/video.ts - Video handling utilities
import type { RedditPost, VideoInfo } from "../types";

export const getVideoInfo = (post: RedditPost): VideoInfo | null => {
  // Check for Reddit native video
  const redditVideo =
    post.secure_media?.reddit_video || post.media?.reddit_video;
  if (redditVideo && redditVideo.fallback_url) {
    return {
      url: redditVideo.fallback_url,
      type: "reddit_video",
      width: redditVideo.width,
      height: redditVideo.height,
      duration: redditVideo.duration,
      isGif: redditVideo.is_gif,
    };
  }

  // Check for YouTube
  if (isYouTubeUrl(post.url)) {
    const videoId = extractYouTubeId(post.url);
    if (videoId) {
      return {
        url: post.url,
        type: "youtube",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedHtml: getYouTubeEmbedHtml(videoId),
      };
    }
  }

  // Check for Vimeo
  if (isVimeoUrl(post.url)) {
    const videoId = extractVimeoId(post.url);
    if (videoId) {
      return {
        url: post.url,
        type: "vimeo",
        embedHtml: getVimeoEmbedHtml(videoId),
      };
    }
  }

  // Check for Streamable
  if (isStreamableUrl(post.url)) {
    const videoId = extractStreamableId(post.url);
    if (videoId) {
      return {
        url: `https://streamable.com/e/${videoId}`,
        type: "streamable",
        embedHtml: getStreamableEmbedHtml(videoId),
      };
    }
  }

  // Check for Imgur GIFV
  if (isImgurGifvUrl(post.url)) {
    return {
      url: post.url.replace(".gifv", ".mp4"),
      type: "imgur_gifv",
      isGif: true,
    };
  }

  // Check for Gfycat
  if (isGfycatUrl(post.url)) {
    const gfyId = extractGfycatId(post.url);
    if (gfyId) {
      return {
        url: `https://giant.gfycat.com/${gfyId}.mp4`,
        type: "gfycat",
        isGif: true,
      };
    }
  }

  // Check for RedGIFs
  if (isRedgifsUrl(post.url)) {
    const gifId = extractRedgifsId(post.url);
    if (gifId) {
      return {
        url: `https://thumbs2.redgifs.com/${gifId}.mp4`,
        type: "redgifs",
        isGif: true,
      };
    }
  }

  // Check for other video formats by URL extension
  if (isDirectVideoUrl(post.url)) {
    return {
      url: post.url,
      type: "external",
      isGif: post.url.includes(".gif"),
    };
  }

  // Check for OEmbed video content
  const oembed = post.secure_media?.oembed || post.media?.oembed;
  if (oembed && oembed.html) {
    return {
      url: post.url,
      type: "external",
      embedHtml: oembed.html,
      thumbnail: oembed.thumbnail_url,
      width: oembed.width,
      height: oembed.height,
    };
  }

  return null;
};

// URL detection functions
const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i.test(
    url
  );
};

const isVimeoUrl = (url: string): boolean => {
  return /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/i.test(
    url
  );
};

const isStreamableUrl = (url: string): boolean => {
  return /streamable\.com\/(\w+)/i.test(url);
};

const isImgurGifvUrl = (url: string): boolean => {
  return /imgur\.com\/\w+\.gifv$/i.test(url);
};

const isGfycatUrl = (url: string): boolean => {
  return /gfycat\.com\/(\w+)/i.test(url);
};

const isRedgifsUrl = (url: string): boolean => {
  return /redgifs\.com\/(?:watch\/)?(\w+)/i.test(url);
};

const isDirectVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogv|mov|avi|m4v)(\?.*)?$/i.test(url);
};

// ID extraction functions
const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  );
  return match ? match[1] : null;
};

const extractVimeoId = (url: string): string | null => {
  const match = url.match(
    /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/i
  );
  return match ? match[3] : null;
};

const extractStreamableId = (url: string): string | null => {
  const match = url.match(/streamable\.com\/(\w+)/i);
  return match ? match[1] : null;
};

const extractGfycatId = (url: string): string | null => {
  const match = url.match(/gfycat\.com\/(\w+)/i);
  return match ? match[1] : null;
};

const extractRedgifsId = (url: string): string | null => {
  const match = url.match(/redgifs\.com\/(?:watch\/)?(\w+)/i);
  return match ? match[1] : null;
};

// Embed HTML generators
const getYouTubeEmbedHtml = (videoId: string): string => {
  return `<iframe width="100%" height="315" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
};

const getVimeoEmbedHtml = (videoId: string): string => {
  return `<iframe src="https://player.vimeo.com/video/${videoId}" width="100%" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
};

const getStreamableEmbedHtml = (videoId: string): string => {
  return `<iframe src="https://streamable.com/e/${videoId}" width="100%" height="315" frameborder="0" scrolling="no" allowfullscreen></iframe>`;
};

// Format duration from seconds to MM:SS or HH:MM:SS
export const formatDuration = (seconds: number): string => {
  if (!seconds) return "";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// Check if post has any video content
export const hasVideoContent = (post: RedditPost): boolean => {
  return getVideoInfo(post) !== null || post.is_video;
};
