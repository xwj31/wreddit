// workers/reddit-api/src/index.ts - Enhanced with better video metadata support
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
  // Enhanced video properties
  media?: {
    reddit_video?: {
      bitrate_kbps?: number;
      fallback_url?: string;
      height?: number;
      width?: number;
      scrubber_media_url?: string;
      dash_url?: string;
      duration?: number;
      hls_url?: string;
      is_gif?: boolean;
      transcoding_status?: string;
    };
    oembed?: {
      provider_name?: string;
      title?: string;
      html?: string;
      width?: number;
      height?: number;
      thumbnail_url?: string;
    };
  };
  secure_media?: {
    reddit_video?: {
      bitrate_kbps?: number;
      fallback_url?: string;
      height?: number;
      width?: number;
      scrubber_media_url?: string;
      dash_url?: string;
      duration?: number;
      hls_url?: string;
      is_gif?: boolean;
      transcoding_status?: string;
    };
    oembed?: {
      provider_name?: string;
      title?: string;
      html?: string;
      width?: number;
      height?: number;
      thumbnail_url?: string;
    };
  };
  crosspost_parent_list?: RedditPost[];
  domain?: string;
  post_hint?: string;
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
  [key: string]: unknown; // Add index signature for flexibility
}

// Reddit API response types
interface RedditCommentsResponse {
  0: unknown; // Post data
  1: {
    data?: {
      children?: Array<{
        kind: string;
        data: unknown;
      }>;
    };
  };
}

// Enhanced logging function with proper TypeScript types
type LogData =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | Array<unknown>
  | FilterOptions;

function log(message: string, data?: LogData): void {
  const timestamp = new Date().toISOString();
  if (data !== undefined && data !== null) {
    try {
      const serializedData =
        typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
      console.log(`[${timestamp}] ${message}`, serializedData);
    } catch (error) {
      // Fallback for non-serializable objects
      console.error(
        `[${timestamp}] ${message}`,
        "[Object - could not serialize]",
        error
      );
      console.log(
        `[${timestamp}] ${message}`,
        "[Object - could not serialize]"
      );
    }
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Cache helper functions
function generateCacheKey(
  subreddit: string,
  sort: string,
  limit: string,
  after: string,
  filters: FilterOptions
): string {
  const filtersHash = JSON.stringify(filters);
  const key = `posts:${subreddit}:${sort}:${limit}:${after || "none"}:${btoa(
    filtersHash
  )}`;
  return key;
}

function generateSubredditSearchCacheKey(query: string, limit: string): string {
  return `search:${query}:${limit}`;
}

function generateSubredditInfoCacheKey(name: string): string {
  return `info:${name}`;
}

function generateCommentsCacheKey(permalink: string): string {
  // Remove leading slash and convert to cache key
  const cleanPermalink = permalink.startsWith("/")
    ? permalink.slice(1)
    : permalink;
  return `comments:${cleanPermalink}`;
}

async function getCachedResponse(
  cache: Cache,
  cacheKey: string,
  requestId: string
): Promise<Response | null> {
  try {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      log(`[${requestId}] Cache hit for key: ${cacheKey}`);
      return cachedResponse;
    }
    log(`[${requestId}] Cache miss for key: ${cacheKey}`);
    return null;
  } catch (error) {
    log(`[${requestId}] Cache lookup error`, error as LogData);
    return null;
  }
}

async function setCachedResponse(
  cache: Cache,
  cacheKey: string,
  response: Response,
  ttlSeconds: number,
  requestId: string,
  ctx: ExecutionContext
): Promise<void> {
  try {
    // Clone the response and add cache control headers
    const responseToCache = new Response(response.body, response);
    responseToCache.headers.set("Cache-Control", `s-maxage=${ttlSeconds}`);
    responseToCache.headers.set("X-Cached-At", new Date().toISOString());
    responseToCache.headers.set("X-Cache-TTL", ttlSeconds.toString());

    // Use waitUntil to cache in background
    ctx.waitUntil(cache.put(cacheKey, responseToCache));
    log(`[${requestId}] Cached response with TTL: ${ttlSeconds}s`);
  } catch (error) {
    log(`[${requestId}] Cache storage error`, error as LogData);
  }
}

// Helper function to check if a post has video content
function hasVideoContent(post: RedditPost): boolean {
  if (post.is_video) return true;
  if (post.media?.reddit_video || post.secure_media?.reddit_video) return true;
  if (post.media?.oembed || post.secure_media?.oembed) return true;

  // Check for video domains
  const videoDomains = [
    "youtube.com",
    "youtu.be",
    "vimeo.com",
    "streamable.com",
    "gfycat.com",
    "redgifs.com",
    "imgur.com",
  ];

  if (
    post.domain &&
    videoDomains.some((domain) => post.domain?.includes(domain))
  ) {
    return true;
  }

  // Check for video file extensions
  if (post.url && /\.(mp4|webm|ogv|mov|avi|m4v|gifv)(\?.*)?$/i.test(post.url)) {
    return true;
  }

  return false;
}

export default {
  async fetch(
    request: Request,
    env: unknown,
    ctx: ExecutionContext
  ): Promise<Response> {
    const requestId = crypto.randomUUID().substring(0, 8);

    log(`[${requestId}] Incoming request`, {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Enhanced CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      log(`[${requestId}] CORS preflight request`);
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    log(`[${requestId}] Processing path: ${path}`);

    try {
      if (path === "/api/posts") {
        return await handleGetPosts(request, corsHeaders, requestId, ctx);
      } else if (path === "/api/subreddit") {
        return await handleGetSubreddit(request, corsHeaders, requestId, ctx);
      } else if (path === "/api/search-subreddits") {
        return await handleSearchSubreddits(
          request,
          corsHeaders,
          requestId,
          ctx
        );
      } else if (path === "/api/comments") {
        return await handleGetComments(request, corsHeaders, requestId, ctx);
      } else if (path === "/api/health") {
        return await handleHealthCheck(corsHeaders, requestId);
      }

      log(`[${requestId}] Path not found: ${path}`);
      return new Response(JSON.stringify({ error: "Not found", path }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (error) {
      log(`[${requestId}] Worker error`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : String(error),
          requestId,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};

async function handleHealthCheck(
  corsHeaders: Record<string, string>,
  requestId: string
): Promise<Response> {
  log(`[${requestId}] Health check requested`);

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    requestId,
    worker: "reddit-api-worker",
    version: "1.0.0",
  };

  return new Response(JSON.stringify(health), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

async function handleSearchSubreddits(
  request: Request,
  corsHeaders: Record<string, string>,
  requestId: string,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const limit = url.searchParams.get("limit") || "20";

  log(`[${requestId}] Search subreddits request`, {
    query,
    limit,
  });

  if (!query.trim()) {
    return new Response(
      JSON.stringify({
        subreddits: [],
        requestId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Generate cache key and check cache first
  const cacheKey = generateSubredditSearchCacheKey(query, limit);
  const cache = caches.default;

  // Try to get cached response
  const cachedResponse = await getCachedResponse(cache, cacheKey, requestId);
  if (cachedResponse) {
    const response = new Response(cachedResponse.body, cachedResponse);
    response.headers.set("X-Cache-Status", "HIT");
    response.headers.set("X-Cache-Key", cacheKey);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  try {
    // Use Reddit's search API to find subreddits
    const searchUrl = `https://www.reddit.com/api/search_reddit_names.json?query=${encodeURIComponent(
      query
    )}&limit=${limit}`;

    log(`[${requestId}] Fetching from Reddit API: ${searchUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const searchResponse = await fetch(searchUrl, {
      headers: {
        "User-Agent": "WReddit/1.0.0 (by /u/wreddit_app)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!searchResponse.ok) {
      throw new Error(`Reddit API error: ${searchResponse.status}`);
    }

    const data = (await searchResponse.json()) as { names: string[] };

    // Get detailed info for each subreddit
    const subredditPromises = data.names
      .slice(0, parseInt(limit))
      .map(async (name) => {
        try {
          const aboutResponse = await fetch(
            `https://www.reddit.com/r/${name}/about.json`,
            {
              headers: {
                "User-Agent": "WReddit/1.0.0 (by /u/wreddit_app)",
                Accept: "application/json",
              },
            }
          );

          if (aboutResponse.ok) {
            const aboutData = (await aboutResponse.json()) as {
              data: {
                display_name: string;
                subscribers: number;
                public_description: string;
              };
            };

            return {
              name: name,
              display_name: aboutData.data.display_name,
              subscribers: aboutData.data.subscribers || 0,
              public_description: aboutData.data.public_description || "",
            };
          }
        } catch (error) {
          log(
            `[${requestId}] Error fetching subreddit details for ${name}`,
            error as LogData
          );
        }

        // Fallback if we can't get detailed info
        return {
          name: name,
          display_name: name,
          subscribers: 0,
          public_description: "",
        };
      });

    const subreddits = await Promise.all(subredditPromises);

    // Sort by subscriber count (descending)
    subreddits.sort((a, b) => b.subscribers - a.subscribers);

    log(`[${requestId}] Found ${subreddits.length} subreddits`);

    // Create response with cache miss header
    const response = new Response(
      JSON.stringify({
        subreddits,
        requestId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "X-Cache-Status": "MISS",
          "X-Cache-Key": cacheKey,
          ...corsHeaders,
        },
      }
    );

    // Cache the response for 30 minutes (1800 seconds) - search results are less volatile
    await setCachedResponse(
      cache,
      cacheKey,
      response.clone(),
      1800,
      requestId,
      ctx
    );

    return response;
  } catch (error) {
    log(`[${requestId}] Error searching subreddits`, {
      error: error instanceof Error ? error.message : String(error),
      query,
    });

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - Reddit API took too long to respond");
    }

    throw error;
  }
}

async function handleGetPosts(
  request: Request,
  corsHeaders: Record<string, string>,
  requestId: string,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const subreddit = url.searchParams.get("subreddit") || "all";
  const sort = url.searchParams.get("sort") || "hot";
  const limit = url.searchParams.get("limit") || "25";
  const after = url.searchParams.get("after") || "";

  log(`[${requestId}] Posts request parameters`, {
    subreddit,
    sort,
    limit,
    after: after || "none",
  });

  // Get filter options from request body
  let filterOptions: FilterOptions = {};
  if (request.method === "POST") {
    try {
      const contentType = request.headers.get("content-type");
      log(`[${requestId}] Request content-type: ${contentType}`);

      if (contentType?.includes("application/json")) {
        const body = (await request.json()) as FilterOptions;
        filterOptions = body;
        log(`[${requestId}] Parsed filter options`, filterOptions);
      }
    } catch (error) {
      log(`[${requestId}] Error parsing request body`, {
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with empty filters
    }
  }

  // Generate cache key and check cache first
  const cacheKey = generateCacheKey(
    subreddit,
    sort,
    limit,
    after,
    filterOptions
  );
  const cache = caches.default;

  // Try to get cached response
  const cachedResponse = await getCachedResponse(cache, cacheKey, requestId);
  if (cachedResponse) {
    // Add cache hit header for debugging
    const response = new Response(cachedResponse.body, cachedResponse);
    response.headers.set("X-Cache-Status", "HIT");
    response.headers.set("X-Cache-Key", cacheKey);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Build Reddit API URL
  let redditUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
  if (after) {
    redditUrl += `&after=${after}`;
  }

  log(`[${requestId}] Fetching from Reddit API: ${redditUrl}`);

  try {
    // Fetch from Reddit API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const redditResponse = await fetch(redditUrl, {
      headers: {
        "User-Agent": "WReddit/1.0.0 (by /u/wreddit_app)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    log(`[${requestId}] Reddit API response`, {
      status: redditResponse.status,
      statusText: redditResponse.statusText,
      headers: Object.fromEntries(redditResponse.headers.entries()),
    });

    if (!redditResponse.ok) {
      const errorText = await redditResponse.text();
      log(`[${requestId}] Reddit API error response`, {
        status: redditResponse.status,
        body: errorText,
      });

      throw new Error(
        `Reddit API error: ${redditResponse.status} - ${errorText}`
      );
    }

    const data: RedditResponse = await redditResponse.json();

    log(`[${requestId}] Reddit API data received`, {
      postsCount: data.data.children.length,
      after: data.data.after || "none",
    });

    // Filter posts based on user preferences
    const allPosts = data.data.children.map((child) => child.data);
    const filteredPosts = filterPosts(allPosts, filterOptions);

    // Add video content detection
    const postsWithVideoInfo = filteredPosts.map((post) => ({
      ...post,
      has_video_content: hasVideoContent(post),
    }));

    log(`[${requestId}] Posts filtered and enhanced`, {
      originalCount: allPosts.length,
      filteredCount: filteredPosts.length,
      videoPosts: postsWithVideoInfo.filter((p) => p.has_video_content).length,
    });

    const result = {
      posts: postsWithVideoInfo,
      after: data.data.after,
      metadata: {
        requestId,
        subreddit,
        sort,
        originalCount: allPosts.length,
        filteredCount: filteredPosts.length,
        videoPosts: postsWithVideoInfo.filter((p) => p.has_video_content)
          .length,
      },
    };

    // Create response with cache miss header
    const response = new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "X-Cache-Status": "MISS",
        "X-Cache-Key": cacheKey,
        ...corsHeaders,
      },
    });

    // Cache the response for 5 minutes (300 seconds)
    await setCachedResponse(
      cache,
      cacheKey,
      response.clone(),
      300,
      requestId,
      ctx
    );

    return response;
  } catch (error) {
    log(`[${requestId}] Error fetching from Reddit`, {
      error: error instanceof Error ? error.message : String(error),
      redditUrl,
    });

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - Reddit API took too long to respond");
    }

    throw error;
  }
}

async function handleGetSubreddit(
  request: Request,
  corsHeaders: Record<string, string>,
  requestId: string,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const subredditName = url.searchParams.get("name");

  log(`[${requestId}] Subreddit info request for: ${subredditName}`);

  if (!subredditName) {
    return new Response(
      JSON.stringify({
        error: "Subreddit name is required",
        requestId,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Generate cache key and check cache first
  const cacheKey = generateSubredditInfoCacheKey(subredditName);
  const cache = caches.default;

  // Try to get cached response
  const cachedResponse = await getCachedResponse(cache, cacheKey, requestId);
  if (cachedResponse) {
    const response = new Response(cachedResponse.body, cachedResponse);
    response.headers.set("X-Cache-Status", "HIT");
    response.headers.set("X-Cache-Key", cacheKey);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const aboutUrl = `https://www.reddit.com/r/${subredditName}/about.json`;
  log(`[${requestId}] Fetching subreddit info from: ${aboutUrl}`);

  try {
    const subredditResponse = await fetch(aboutUrl, {
      headers: {
        "User-Agent": "WReddit/1.0.0 (by /u/wreddit_app)",
        Accept: "application/json",
      },
    });

    log(`[${requestId}] Subreddit API response`, {
      status: subredditResponse.status,
      statusText: subredditResponse.statusText,
    });

    if (!subredditResponse.ok) {
      const errorText = await subredditResponse.text();
      log(`[${requestId}] Subreddit API error`, {
        status: subredditResponse.status,
        body: errorText,
      });

      return new Response(
        JSON.stringify({
          error: "Subreddit not found",
          subreddit: subredditName,
          requestId,
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const data = (await subredditResponse.json()) as {
      data: Record<string, unknown>;
    };
    log(`[${requestId}] Subreddit data received successfully`);

    // Create response with cache miss header
    const responseObj = new Response(
      JSON.stringify({
        ...data.data,
        requestId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "X-Cache-Status": "MISS",
          "X-Cache-Key": cacheKey,
          ...corsHeaders,
        },
      }
    );

    // Cache the response for 1 hour (3600 seconds) - subreddit info changes infrequently
    await setCachedResponse(
      cache,
      cacheKey,
      responseObj.clone(),
      3600,
      requestId,
      ctx
    );

    return responseObj;
  } catch (error) {
    log(`[${requestId}] Error fetching subreddit info`, {
      error: error instanceof Error ? error.message : String(error),
      subreddit: subredditName,
    });
    throw error;
  }
}

async function handleGetComments(
  request: Request,
  corsHeaders: Record<string, string>,
  requestId: string,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const permalink = url.searchParams.get("permalink");

  log(`[${requestId}] Comments request for: ${permalink}`);

  if (!permalink) {
    return new Response(
      JSON.stringify({
        error: "Permalink is required",
        requestId,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Generate cache key and check cache first
  const cacheKey = generateCommentsCacheKey(permalink);
  const cache = caches.default;

  // Try to get cached response
  const cachedResponse = await getCachedResponse(cache, cacheKey, requestId);
  if (cachedResponse) {
    const response = new Response(cachedResponse.body, cachedResponse);
    response.headers.set("X-Cache-Status", "HIT");
    response.headers.set("X-Cache-Key", cacheKey);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Build Reddit API URL for comments
  const commentsUrl = `https://www.reddit.com${permalink}.json`;
  log(`[${requestId}] Fetching comments from: ${commentsUrl}`);

  try {
    // Fetch from Reddit API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const commentsResponse = await fetch(commentsUrl, {
      headers: {
        "User-Agent": "WReddit/1.0.0 (by /u/wreddit_app)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    log(`[${requestId}] Reddit comments API response`, {
      status: commentsResponse.status,
      statusText: commentsResponse.statusText,
    });

    if (!commentsResponse.ok) {
      const errorText = await commentsResponse.text();
      log(`[${requestId}] Reddit comments API error`, {
        status: commentsResponse.status,
        body: errorText,
      });

      // Return empty comments array on error to avoid breaking the UI
      const errorResponse = new Response(
        JSON.stringify({
          comments: [],
          error: `Reddit API error: ${commentsResponse.status}`,
          requestId,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "X-Cache-Status": "MISS",
            "X-Cache-Key": cacheKey,
            ...corsHeaders,
          },
        }
      );

      return errorResponse;
    }

    const data = await commentsResponse.json() as RedditCommentsResponse;

    // Extract comments from Reddit response
    const comments: unknown[] = [];
    if (data?.[1]?.data?.children) {
      const children = data[1].data.children;
      for (const child of children) {
        if (child.kind === "t1") {
          comments.push(child.data);
        }
      }
    }

    log(`[${requestId}] Comments processed`, {
      commentsCount: comments.length,
    });

    // Create response with cache miss header
    const responseObj = new Response(
      JSON.stringify({
        comments,
        requestId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "X-Cache-Status": "MISS",
          "X-Cache-Key": cacheKey,
          ...corsHeaders,
        },
      }
    );

    // Cache the response for 15 minutes (900 seconds) - comments change but not too frequently
    await setCachedResponse(
      cache,
      cacheKey,
      responseObj.clone(),
      900,
      requestId,
      ctx
    );

    return responseObj;
  } catch (error) {
    log(`[${requestId}] Error fetching comments`, {
      error: error instanceof Error ? error.message : String(error),
      permalink,
    });

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - Reddit API took too long to respond");
    }

    // Return empty comments array on error
    return new Response(
      JSON.stringify({
        comments: [],
        error: "Failed to fetch comments",
        requestId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "X-Cache-Status": "ERROR",
          "X-Cache-Key": cacheKey,
          ...corsHeaders,
        },
      }
    );
  }
}

function filterPosts(
  posts: RedditPost[],
  options: FilterOptions
): RedditPost[] {
  return posts.filter((post) => {
    // Filter out blocked subreddits
    if (
      options.blockedSubreddits?.some(
        (blocked) => blocked.toLowerCase() === post.subreddit.toLowerCase()
      )
    ) {
      return false;
    }

    // If favorite subreddits are specified, only show those
    if (options.favoriteSubreddits && options.favoriteSubreddits.length > 0) {
      if (
        !options.favoriteSubreddits.some(
          (fav) => fav.toLowerCase() === post.subreddit.toLowerCase()
        )
      ) {
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
