interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  thumbnail?: string;
  preview?: {
    images?: Array<{
      source: { url: string; width: number; height: number };
    }>;
  };
  selftext?: string;
  is_video: boolean;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after?: string;
  };
}

interface FilterOptions {
  blockedSubreddits?: string[];
  favoriteSubreddits?: string[];
  keywords?: string[];
  blockedKeywords?: string[];
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/posts") {
        return await handleGetPosts(request, corsHeaders);
      } else if (path === "/api/subreddit") {
        return await handleGetSubreddit(request, corsHeaders);
      }

      return new Response("Not found", { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal server error", {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

async function handleGetPosts(
  request: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const subreddit = url.searchParams.get("subreddit") || "all";
  const sort = url.searchParams.get("sort") || "hot";
  const limit = url.searchParams.get("limit") || "25";
  const after = url.searchParams.get("after") || "";

  // Get filter options from request body or query params
  let filterOptions: FilterOptions = {};
  if (request.method === "POST") {
    try {
      const body = (await request.json()) as FilterOptions;
      filterOptions = body;
    } catch (error) {
      // Fallback to query params if body parsing fails
      console.error("Error parsing request body:", error);
    }
  }

  // Build Reddit API URL
  let redditUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
  if (after) {
    redditUrl += `&after=${after}`;
  }

  // Fetch from Reddit API
  console.log(redditUrl);

  const response = await fetch(redditUrl, {
    headers: {
      "User-Agent": "WReddit/1.0.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data: RedditResponse = await response.json();

  // Filter posts based on user preferences
  const filteredPosts = filterPosts(
    data.data.children.map((child) => child.data),
    filterOptions
  );

  const result = {
    posts: filteredPosts,
    after: data.data.after,
  };

  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

async function handleGetSubreddit(
  request: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const subredditName = url.searchParams.get("name");

  if (!subredditName) {
    return new Response("Subreddit name is required", {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Fetch subreddit info
  const response = await fetch(
    `https://www.reddit.com/r/${subredditName}/about.json`,
    {
      headers: {
        "User-Agent": "WReddit/1.0.0",
      },
    }
  );

  if (!response.ok) {
    return new Response("Subreddit not found", {
      status: 404,
      headers: corsHeaders,
    });
  }

  const data = await response.json<
    RedditResponse & { data: { children: Array<{ data: RedditPost }> } }
  >();

  return new Response(JSON.stringify(data.data), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function filterPosts(
  posts: RedditPost[],
  options: FilterOptions
): RedditPost[] {
  return posts.filter((post) => {
    // Filter out blocked subreddits
    if (options.blockedSubreddits?.includes(post.subreddit.toLowerCase())) {
      return false;
    }

    // If favorite subreddits are specified, only show those
    if (options.favoriteSubreddits && options.favoriteSubreddits.length > 0) {
      if (!options.favoriteSubreddits.includes(post.subreddit.toLowerCase())) {
        return false;
      }
    }

    // Filter out posts with blocked keywords
    if (options.blockedKeywords && options.blockedKeywords.length > 0) {
      const postText = `${post.title} ${post.selftext || ""}`.toLowerCase();
      const hasBlockedKeyword = options.blockedKeywords.some((keyword) =>
        postText.includes(keyword.toLowerCase())
      );
      if (hasBlockedKeyword) {
        return false;
      }
    }

    // Filter for specific keywords (if specified)
    if (options.keywords && options.keywords.length > 0) {
      const postText = `${post.title} ${post.selftext || ""}`.toLowerCase();
      const hasKeyword = options.keywords.some((keyword) =>
        postText.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) {
        return false;
      }
    }

    return true;
  });
}
