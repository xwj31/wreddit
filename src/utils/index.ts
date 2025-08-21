// src/utils/index.ts - Updated with video utilities export
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
};

export const formatScore = (score: number): string => {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
};

export const getImageUrl = (post: {
  preview?: {
    images?: Array<{
      source: { url: string; width: number; height: number };
    }>;
  };
  thumbnail?: string;
}): string | null => {
  if (post.preview?.images?.[0]?.source) {
    return post.preview.images[0].source.url.replace(/&amp;/g, "&");
  }

  if (
    post.thumbnail &&
    post.thumbnail !== "self" &&
    post.thumbnail !== "default" &&
    post.thumbnail !== "nsfw" &&
    post.thumbnail !== "spoiler"
  ) {
    return post.thumbnail;
  }

  return null;
};

// Alias for backward compatibility
export const getHighQualityImage = getImageUrl;

export const sharePost = async (post: {
  title: string;
  permalink: string;
}): Promise<boolean> => {
  const url = `https://reddit.com${post.permalink}`;

  try {
    if (navigator.share) {
      await navigator.share({ title: post.title, url });
      return true;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

// Re-export video utilities
export * from "./video";

// Re-export link parser utilities
export { parseTextWithLinks } from "./linkParserUtils";
export { LinkifiedText } from "./linkParser";
