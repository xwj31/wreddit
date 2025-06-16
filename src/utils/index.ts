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

export const getHighQualityImage = (post: {
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
