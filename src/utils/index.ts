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

// Function to make links and subreddit references clickable
export const parseTextWithLinks = (
  text: string
): Array<{
  type: "text" | "link" | "subreddit" | "user";
  content: string;
  href?: string;
}> => {
  if (!text) return [];

  const parts: Array<{
    type: "text" | "link" | "subreddit" | "user";
    content: string;
    href?: string;
  }> = [];

  // Regex patterns for different link types
  const patterns = [
    // URLs (http/https)
    {
      regex: /(https?:\/\/[^\s)]+)/gi,
      type: "link" as const,
      getHref: (match: string) => match,
    },
    // Subreddit references
    {
      regex: /(?:^|\s)(r\/[a-zA-Z0-9_]+)/gi,
      type: "subreddit" as const,
      getHref: (match: string) => match.trim(),
    },
    // User references
    {
      regex: /(?:^|\s)(u\/[a-zA-Z0-9_]+)/gi,
      type: "user" as const,
      getHref: (match: string) => match.trim(),
    },
  ];

  let lastIndex = 0;
  const matches: Array<{
    index: number;
    length: number;
    type: "text" | "link" | "subreddit" | "user";
    content: string;
    href?: string;
  }> = [];

  // Find all matches
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: pattern.type,
        content: match[1] || match[0],
        href: pattern.getHref(match[1] || match[0]),
      });
    }
  });

  // Sort matches by position
  matches.sort((a, b) => a.index - b.index);

  // Build parts array
  matches.forEach((match) => {
    // Add text before this match
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (textContent) {
        parts.push({
          type: "text",
          content: textContent,
        });
      }
    }

    // Add the match
    parts.push({
      type: match.type,
      content: match.content,
      href: match.href,
    });

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      parts.push({
        type: "text",
        content: remaining,
      });
    }
  }

  // If no matches found, return the entire text as a text part
  if (parts.length === 0) {
    parts.push({
      type: "text",
      content: text,
    });
  }

  return parts;
};

// Function to handle word breaking for long URLs
export const breakLongWords = (
  text: string,
  maxLength: number = 30
): string => {
  return text
    .split(" ")
    .map((word) => {
      if (word.length > maxLength) {
        // Insert zero-width spaces to allow breaking
        return word.replace(new RegExp(`(.{${maxLength}})`, "g"), "$1\u200B");
      }
      return word;
    })
    .join(" ");
};

// Share functionality
export const sharePost = async (post: {
  title: string;
  permalink: string;
}): Promise<boolean> => {
  const url = `https://reddit.com${post.permalink}`;
  const shareData = {
    title: post.title,
    url: url,
  };

  try {
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return true;
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch (error) {
    console.error("Share failed:", error);
    // Final fallback: copy to clipboard without async
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error("Clipboard fallback failed:", fallbackError);
      return false;
    }
  }
};

// Scroll utilities
export const getScrollDirection = (() => {
  let lastScrollY = 0;
  return () => {
    const currentScrollY = window.scrollY;
    const direction = currentScrollY > lastScrollY ? "down" : "up";
    lastScrollY = currentScrollY;
    return direction;
  };
})();

export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};
