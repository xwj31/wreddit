import {
  createDbWithEnv,
  type DbPost,
  type DbComment,
  type WorkerEnv,
} from "./db";

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
  media?: {
    reddit_video?: {
      fallback_url?: string;
    };
  };
  secure_media?: {
    reddit_video?: {
      fallback_url?: string;
    };
  };
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after?: string;
  };
}

interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  parent_id?: string;
  depth?: number;
  replies?:
    | {
        kind: string;
        data: {
          children: Array<{
            kind: string;
            data: RedditComment;
          }>;
        };
      }
    | "";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type",
};

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

async function fetchRedditPosts(
  subreddit: string,
  limit = 25,
  sortFilter: "hot" | "top" | "new" = "hot"
): Promise<RedditPost[]> {
  let url: string;

  switch (sortFilter) {
    case "hot":
      url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
      break;
    case "top":
      url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=day`;
      break;
    case "new":
      url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
      break;
    default:
      url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
  }

  console.log(
    `[REDDIT] Fetching ${sortFilter} posts from r/${subreddit}: ${url}`
  );

  const response = await fetch(url, {
    headers: {
      "User-Agent": "WReddit/2.0.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      `Failed to fetch ${sortFilter} posts from r/${subreddit}: ${response.status}`
    );
    return [];
  }

  const data: RedditResponse = await response.json();
  return data.data.children.map((child) => child.data);
}

async function fetchRedditComments(
  permalink: string,
  limit = 10
): Promise<RedditComment[]> {
  const url = `https://www.reddit.com${permalink}.json`;

  console.log(`[REDDIT] Fetching comments from: ${url}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "WReddit/2.0.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      `[REDDIT] Failed to fetch comments for ${permalink}: ${response.status}`
    );
    return [];
  }

  const data = (await response.json()) as Array<unknown>;
  const comments: RedditComment[] = [];

  console.log(`[REDDIT] Raw comment data structure:`, {
    dataLength: data.length,
    hasSecondElement: !!data?.[1],
    secondElementType: typeof data[1],
  });

  if (data?.[1] && typeof data[1] === "object" && "data" in data[1]) {
    const commentData = data[1] as {
      data: { children: Array<{ kind: string; data: RedditComment }> };
    };

    console.log(
      `[REDDIT] Comment children count: ${commentData.data.children.length}`
    );

    for (const child of commentData.data.children.slice(0, limit)) {
      if (child.kind === "t1") {
        comments.push(child.data);
        console.log(
          `[REDDIT] Added comment by ${
            child.data.author
          }: ${child.data.body.substring(0, 50)}...`
        );
      } else {
        console.log(
          `[REDDIT] Skipped non-comment child with kind: ${child.kind}`
        );
      }
    }
  } else {
    console.log(`[REDDIT] No valid comment data found in response`);
  }

  console.log(
    `[REDDIT] Returning ${comments.length} comments for ${permalink}`
  );
  return comments;
}

function convertRedditPostToDb(post: RedditPost): DbPost {
  const getVideoUrl = (): string | null => {
    if (post.is_video) {
      return (
        post.media?.reddit_video?.fallback_url ||
        post.secure_media?.reddit_video?.fallback_url ||
        null
      );
    }
    return null;
  };

  const getPreviewImage = (): string | null => {
    if (post.preview?.images?.[0]?.source?.url) {
      return post.preview.images[0].source.url.replace(/&amp;/g, "&");
    }
    return null;
  };

  return {
    id: post.id,
    subreddit: post.subreddit.toLowerCase(),
    title: post.title,
    author: post.author,
    url: post.url,
    permalink: post.permalink,
    score: post.score,
    num_comments: post.num_comments,
    created_utc: post.created_utc,
    thumbnail_url:
      post.thumbnail === "self" || post.thumbnail === "default"
        ? null
        : post.thumbnail || null,
    preview_image_url: getPreviewImage(),
    selftext: post.selftext || null,
    is_video: post.is_video,
    video_url: getVideoUrl(),
    updated_at: new Date(),
  };
}

function convertRedditCommentToDb(
  comment: RedditComment,
  postId: string
): DbComment {
  const dbComment = {
    id: comment.id,
    post_id: postId,
    author: comment.author,
    body: comment.body,
    score: comment.score,
    created_utc: comment.created_utc,
    parent_id: comment.parent_id?.startsWith("t1_")
      ? comment.parent_id.substring(3)
      : null,
    depth: comment.depth || 0,
    updated_at: new Date(),
  };

  console.log(
    `[CONVERT] Converting comment ${comment.id} for post ${postId}: author=${
      comment.author
    }, depth=${comment.depth || 0}, body_length=${comment.body.length}`
  );

  return dbComment;
}

function convertDbPostToReddit(dbPost: DbPost): RedditPost {
  return {
    id: dbPost.id,
    title: dbPost.title,
    author: dbPost.author,
    subreddit: dbPost.subreddit,
    url: dbPost.url,
    permalink: dbPost.permalink,
    score: dbPost.score,
    num_comments: dbPost.num_comments,
    created_utc: dbPost.created_utc,
    thumbnail: dbPost.thumbnail_url || undefined,
    preview: dbPost.preview_image_url
      ? {
          images: [
            {
              source: {
                url: dbPost.preview_image_url,
                width: 0,
                height: 0,
              },
            },
          ],
        }
      : undefined,
    selftext: dbPost.selftext || undefined,
    is_video: dbPost.is_video,
    media: dbPost.video_url
      ? {
          reddit_video: {
            fallback_url: dbPost.video_url,
          },
        }
      : undefined,
    secure_media: dbPost.video_url
      ? {
          reddit_video: {
            fallback_url: dbPost.video_url,
          },
        }
      : undefined,
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const db = createDbWithEnv(env);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Create new user
      if (path === "/api/users" && request.method === "POST") {
        const userId = await db.createUser();
        return new Response(JSON.stringify({ userId }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      // Get user's posts
      const userMatch = path.match(/^\/api\/users\/([^/]+)\/posts$/);
      if (userMatch && request.method === "GET") {
        const userId = userMatch[1];
        
        if (!isValidUUID(userId)) {
          return new Response(
            JSON.stringify({
              error: "Invalid user ID",
              message: "User ID must be a valid UUID format",
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
        
        console.log(`[${userId}] Getting user posts from database`);
        try {
          const dbPosts = await db.getUserPosts(userId);
          console.log(
            `[${userId}] Retrieved ${dbPosts.length} posts from database`
          );
          const posts = dbPosts.map(convertDbPostToReddit);
          return new Response(JSON.stringify({ posts }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (error) {
          console.error(`[${userId}] Error getting user posts:`, error);
          throw error;
        }
      }

      // Get user's home feed (25 most recent posts from favorited subreddits)
      const homeFeedMatch = path.match(/^\/api\/users\/([^/]+)\/home-feed$/);
      if (homeFeedMatch && request.method === "GET") {
        const userId = homeFeedMatch[1];
        
        if (!isValidUUID(userId)) {
          return new Response(
            JSON.stringify({
              error: "Invalid user ID",
              message: "User ID must be a valid UUID format",
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
        
        console.log(`[${userId}] Getting user home feed from database`);
        try {
          const dbPosts = await db.getUserHomeFeed(userId);
          console.log(
            `[${userId}] Retrieved ${dbPosts.length} posts for home feed`
          );
          const posts = dbPosts.map(convertDbPostToReddit);
          return new Response(JSON.stringify({ posts }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (error) {
          console.error(`[${userId}] Error getting user home feed:`, error);
          throw error;
        }
      }

      // Get user's subreddits
      const subredditsMatch = path.match(/^\/api\/users\/([^/]+)\/subreddits$/);
      if (subredditsMatch && request.method === "GET") {
        const userId = subredditsMatch[1];
        
        if (!isValidUUID(userId)) {
          return new Response(
            JSON.stringify({
              error: "Invalid user ID",
              message: "User ID must be a valid UUID format",
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
        
        const subreddits = await db.getUserSubreddits(userId);
        return new Response(JSON.stringify({ subreddits }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      // Add/remove subreddit
      if (subredditsMatch && request.method === "POST") {
        const userId = subredditsMatch[1];
        
        if (!isValidUUID(userId)) {
          return new Response(
            JSON.stringify({
              error: "Invalid user ID",
              message: "User ID must be a valid UUID format",
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
        
        const { action, subreddit } = (await request.json()) as {
          action: "add" | "remove";
          subreddit: string;
        };

        console.log(
          `[${userId}] Processing ${action} for subreddit: ${subreddit}`
        );

        if (action === "add") {
          console.log(`[${userId}] Adding subreddit to database: ${subreddit}`);
          await db.addUserSubreddit(userId, subreddit);
          console.log(`[${userId}] Successfully added subreddit to database`);

          // Immediately fetch posts for the new subreddit
          try {
            console.log(
              `[${userId}] Fetching posts for newly added subreddit: r/${subreddit}`
            );
            const redditPosts = await fetchRedditPosts(subreddit, 25);
            console.log(
              `[${userId}] Reddit API returned ${redditPosts.length} posts for r/${subreddit}`
            );

            if (redditPosts.length > 0) {
              const dbPosts = redditPosts.map(convertRedditPostToDb);
              console.log(
                `[${userId}] Upserting ${dbPosts.length} posts to database for r/${subreddit}`
              );
              await db.upsertPosts(dbPosts);
              console.log(
                `[${userId}] Successfully stored ${dbPosts.length} posts for r/${subreddit}`
              );

              // Fetch comments for all posts
              console.log(
                `[${userId}] Starting to fetch comments for ${redditPosts.length} posts`
              );
              for (const post of redditPosts) {
                try {
                  console.log(
                    `[${userId}] Fetching comments for post ${
                      post.id
                    } (${post.title.substring(0, 50)}...)`
                  );
                  const comments = await fetchRedditComments(
                    post.permalink,
                    10
                  );
                  console.log(
                    `[${userId}] Reddit API returned ${comments.length} comments for post ${post.id}`
                  );

                  if (comments.length > 0) {
                    const dbComments = comments.map((c) =>
                      convertRedditCommentToDb(c, post.id)
                    );
                    console.log(
                      `[${userId}] Converted ${dbComments.length} comments to DB format for post ${post.id}`
                    );
                    await db.upsertComments(dbComments);
                    console.log(
                      `[${userId}] Successfully stored ${dbComments.length} comments for post ${post.id}`
                    );
                  } else {
                    console.log(
                      `[${userId}] No comments to store for post ${post.id}`
                    );
                  }
                } catch (error) {
                  console.error(
                    `[${userId}] Error fetching comments for post ${post.id}:`,
                    error
                  );
                }
              }
              console.log(
                `[${userId}] Finished fetching comments for all posts`
              );
            } else {
              console.log(
                `[${userId}] No posts returned from Reddit for r/${subreddit}`
              );
            }
          } catch (error) {
            console.error(
              `[${userId}] Error fetching posts for subreddit ${subreddit}:`,
              error
            );
          }
        } else if (action === "remove") {
          await db.removeUserSubreddit(userId, subreddit);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      // Get user's filter preference
      const filterPreferenceMatch = path.match(
        /^\/api\/users\/([^/]+)\/filter-preferences$/
      );
      if (filterPreferenceMatch && request.method === "GET") {
        const userId = filterPreferenceMatch[1];
        
        if (!isValidUUID(userId)) {
          return new Response(
            JSON.stringify({
              error: "Invalid user ID",
              message: "User ID must be a valid UUID format",
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
        
        console.log(`[${userId}] Getting filter preference`);
        try {
          const preference = await db.getUserFilterPreference(userId);
          const filter = preference?.reddit_sort_filter || "hot"; // Default to 'hot' if no preference
          return new Response(JSON.stringify({ filter }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (error) {
          console.error(`[${userId}] Error getting filter preference:`, error);
          return new Response(JSON.stringify({ filter: "hot" }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }
      }

      // Update user's filter preference
      if (filterPreferenceMatch && request.method === "PUT") {
        const userId = filterPreferenceMatch[1];
        
        if (!isValidUUID(userId)) {
          return new Response(
            JSON.stringify({
              error: "Invalid user ID",
              message: "User ID must be a valid UUID format",
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
        
        try {
          const { filter } = (await request.json()) as {
            filter: "hot" | "top" | "new";
          };

          if (!["hot", "top", "new"].includes(filter)) {
            return new Response(
              JSON.stringify({
                error: "Invalid filter. Must be hot, top, or new",
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

          console.log(`[${userId}] Setting filter preference to ${filter}`);
          await db.setUserFilterPreference(userId, filter);

          return new Response(JSON.stringify({ success: true, filter }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (error) {
          console.error(`[${userId}] Error setting filter preference:`, error);
          return new Response(
            JSON.stringify({ error: "Failed to set filter preference" }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }
      }

      // Get post comments
      const commentsMatch = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
      if (commentsMatch && request.method === "GET") {
        const postId = commentsMatch[1];
        console.log(`[API] Getting comments for post ${postId}`);
        try {
          const comments = await db.getPostComments(postId);
          console.log(
            `[API] Retrieved ${comments.length} comments for post ${postId}`
          );
          return new Response(JSON.stringify({ comments }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (error) {
          console.error(
            `[API] Error getting comments for post ${postId}:`,
            error
          );
          return new Response(JSON.stringify({ comments: [] }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }
      }

      // Load more comments (fetch fresh from Reddit)
      const moreCommentsMatch = path.match(
        /^\/api\/posts\/([^/]+)\/comments\/more$/
      );
      if (moreCommentsMatch && request.method === "POST") {
        const postId = moreCommentsMatch[1];
        const { permalink, limit = 100 } = (await request.json()) as { 
          permalink: string; 
          limit?: number; 
        };
        
        console.log(`[REDDIT] Fetching more comments for post ${postId} from ${permalink} with limit ${limit}`);
        
        try {
          const comments = await fetchRedditComments(permalink, limit);
          const dbComments = comments.map((c) =>
            convertRedditCommentToDb(c, postId)
          );
          
          console.log(`[REDDIT] Successfully fetched ${dbComments.length} more comments for post ${postId}`);
          
          return new Response(JSON.stringify({ comments: dbComments }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (error) {
          console.error(`[REDDIT] Error fetching more comments for post ${postId}:`, error);
          return new Response(JSON.stringify({ 
            comments: [], 
            error: 'Failed to fetch more comments from Reddit' 
          }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }
      }

      // Manual refresh posts for user
      const manualRefreshMatch = path.match(/^\/api\/users\/([^/]+)\/refresh-posts$/);
      if (manualRefreshMatch && request.method === "POST") {
        const userId = manualRefreshMatch[1];
        
        if (!isValidUUID(userId)) {
          return new Response(
            JSON.stringify({
              error: "Invalid user ID",
              message: "User ID must be a valid UUID format",
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
        
        console.log(`[${userId}] Manual refresh posts requested`);
        
        try {
          await this.updateSubredditPosts(env, userId);
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: "Posts refreshed successfully" 
          }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (error) {
          console.error(`[${userId}] Manual refresh failed:`, error);
          return new Response(
            JSON.stringify({ 
              error: "Failed to refresh posts", 
              message: error instanceof Error ? error.message : String(error) 
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
      }

      // Initialize database schema (admin endpoint)
      if (path === "/api/admin/init-db" && request.method === "POST") {
        await db.initSchema();
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : String(error),
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

  async updateSubredditPosts(
    env: WorkerEnv,
    targetUserId?: string
  ): Promise<void> {
    const logPrefix = targetUserId ? `[Manual-${targetUserId}]` : "[Scheduled]";
    console.log(`${logPrefix} Starting update of Reddit posts with per-user filters`);
    console.log(`${logPrefix} Environment check - DATABASE_URL exists: ${!!env?.DATABASE_URL}`);

    try {
      // Use environment-aware database connection
      const dbEnv = createDbWithEnv(env);

      let allFilterPreferences;
      let allSubreddits;

      if (targetUserId) {
        // Manual update for specific user
        console.log(`${logPrefix} Updating posts for specific user: ${targetUserId}`);
        
        // Get user's subreddits
        const userSubreddits = await dbEnv.getUserSubreddits(targetUserId);
        console.log(`${logPrefix} Found ${userSubreddits.length} subreddits for user`);
        
        if (userSubreddits.length === 0) {
          console.log(`${logPrefix} No subreddits found for user, nothing to update`);
          return;
        }
        
        // Get user's filter preference
        const userPreference = await dbEnv.getUserFilterPreference(targetUserId);
        const userFilter = userPreference?.reddit_sort_filter || "hot";
        
        allFilterPreferences = [{ reddit_sort_filter: userFilter }];
        allSubreddits = userSubreddits;
      } else {
        // Scheduled update for all users
        allFilterPreferences = await dbEnv.getAllUserFilterPreferences();
        allSubreddits = await dbEnv.getAllUniqueSubreddits();
      }

      console.log(`${logPrefix} Found ${allFilterPreferences.length} filter preferences`);
      console.log(`${logPrefix} Found ${allSubreddits.length} unique subreddits`);

      // Group subreddits by filter preference to minimize API calls
      const subredditsByFilter = new Map<string, Set<string>>();

      // For each subreddit, determine which filters we need to fetch
      for (const subreddit of allSubreddits) {
        const filtersNeeded = new Set<string>();

        // Add default 'hot' filter for users without preferences
        filtersNeeded.add("hot");

        // Add filters from user preferences
        for (const preference of allFilterPreferences) {
          filtersNeeded.add(preference.reddit_sort_filter);
        }

        // Store which filters we need for this subreddit
        for (const filter of filtersNeeded) {
          if (!subredditsByFilter.has(filter)) {
            subredditsByFilter.set(filter, new Set());
          }
          subredditsByFilter.get(filter)!.add(subreddit);
        }
      }

      console.log(
        `${logPrefix} Will fetch posts using filters: ${Array.from(
          subredditsByFilter.keys()
        ).join(", ")}`
      );

      // Fetch posts for each filter/subreddit combination
      for (const [filter, subreddits] of subredditsByFilter.entries()) {
        console.log(
          `${logPrefix} Processing ${subreddits.size} subreddits with ${filter} filter`
        );

        for (const subreddit of subreddits) {
          try {
            console.log(`${logPrefix} Fetching ${filter} posts for r/${subreddit}`);
            const redditPosts = await fetchRedditPosts(
              subreddit,
              25,
              filter as "hot" | "top" | "new"
            );

            if (redditPosts.length > 0) {
              const dbPosts = redditPosts.map(convertRedditPostToDb);
              await dbEnv.upsertPosts(dbPosts);
              console.log(
                `${logPrefix} Stored ${dbPosts.length} ${filter} posts for r/${subreddit}`
              );

              // Fetch comments for all posts
              for (const post of redditPosts) {
                try {
                  const comments = await fetchRedditComments(
                    post.permalink,
                    10
                  );
                  if (comments.length > 0) {
                    const dbComments = comments.map((c) =>
                      convertRedditCommentToDb(c, post.id)
                    );
                    await dbEnv.upsertComments(dbComments);
                    console.log(
                      `${logPrefix} Stored ${dbComments.length} comments for post ${post.id}`
                    );
                  }
                } catch (error) {
                  console.error(
                    `${logPrefix} Error fetching comments for post ${post.id}:`,
                    error
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              `${logPrefix} Error processing ${filter} posts for subreddit ${subreddit}:`,
              error
            );
          }
        }
      }

      console.log(`${logPrefix} Update completed successfully`);
    } catch (error) {
      console.error(`${logPrefix} Update failed:`, error);
      throw error;
    }
  },

  async scheduled(
    _controller: ScheduledController,
    env: WorkerEnv
  ): Promise<void> {
    await this.updateSubredditPosts(env);
  },
};
