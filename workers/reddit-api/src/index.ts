import { db, type DbPost, type DbComment } from "./db";

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

async function fetchRedditPosts(
  subreddit: string,
  limit = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "WReddit/2.0.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch from r/${subreddit}: ${response.status}`);
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

  const response = await fetch(url, {
    headers: {
      "User-Agent": "WReddit/2.0.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      `Failed to fetch comments for ${permalink}: ${response.status}`
    );
    return [];
  }

  const data = (await response.json()) as Array<unknown>;
  const comments: RedditComment[] = [];

  if (data?.[1] && typeof data[1] === "object" && "data" in data[1]) {
    const commentData = data[1] as {
      data: { children: Array<{ kind: string; data: RedditComment }> };
    };
    for (const child of commentData.data.children.slice(0, limit)) {
      if (child.kind === "t1") {
        comments.push(child.data);
      }
    }
  }

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
  return {
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
}

export default {
  async fetch(request: Request): Promise<Response> {
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
        console.log(`[${userId}] Getting user posts from database`);
        try {
          const posts = await db.getUserPosts(userId);
          console.log(`[${userId}] Retrieved ${posts.length} posts from database`);
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

      // Get user's subreddits
      const subredditsMatch = path.match(/^\/api\/users\/([^/]+)\/subreddits$/);
      if (subredditsMatch && request.method === "GET") {
        const userId = subredditsMatch[1];
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
        const { action, subreddit } = (await request.json()) as {
          action: "add" | "remove";
          subreddit: string;
        };

        console.log(`[${userId}] Processing ${action} for subreddit: ${subreddit}`);

        if (action === "add") {
          console.log(`[${userId}] Adding subreddit to database: ${subreddit}`);
          await db.addUserSubreddit(userId, subreddit);
          console.log(`[${userId}] Successfully added subreddit to database`);
          
          // Immediately fetch posts for the new subreddit
          try {
            console.log(`[${userId}] Fetching posts for newly added subreddit: r/${subreddit}`);
            const redditPosts = await fetchRedditPosts(subreddit, 25);
            console.log(`[${userId}] Reddit API returned ${redditPosts.length} posts for r/${subreddit}`);
            
            if (redditPosts.length > 0) {
              const dbPosts = redditPosts.map(convertRedditPostToDb);
              console.log(`[${userId}] Upserting ${dbPosts.length} posts to database for r/${subreddit}`);
              await db.upsertPosts(dbPosts);
              console.log(`[${userId}] Successfully stored ${dbPosts.length} posts for r/${subreddit}`);
              
              // Fetch comments for first 10 posts
              for (const post of redditPosts.slice(0, 10)) {
                try {
                  const comments = await fetchRedditComments(post.permalink, 10);
                  if (comments.length > 0) {
                    const dbComments = comments.map(c => convertRedditCommentToDb(c, post.id));
                    await db.upsertComments(dbComments);
                  }
                } catch (error) {
                  console.error(`Error fetching comments for post ${post.id}:`, error);
                }
              }
            } else {
              console.log(`[${userId}] No posts returned from Reddit for r/${subreddit}`);
            }
          } catch (error) {
            console.error(`[${userId}] Error fetching posts for subreddit ${subreddit}:`, error);
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

      // Get post comments
      const commentsMatch = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
      if (commentsMatch && request.method === "GET") {
        const postId = commentsMatch[1];
        const comments = await db.getPostComments(postId);
        return new Response(JSON.stringify({ comments }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      // Load more comments (fetch fresh from Reddit)
      const moreCommentsMatch = path.match(
        /^\/api\/posts\/([^/]+)\/comments\/more$/
      );
      if (moreCommentsMatch && request.method === "POST") {
        const { permalink } = (await request.json()) as { permalink: string };
        const comments = await fetchRedditComments(permalink, 50);
        const postId = moreCommentsMatch[1];

        const dbComments = comments.map((c) =>
          convertRedditCommentToDb(c, postId)
        );
        return new Response(JSON.stringify({ comments: dbComments }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
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

  async scheduled(): Promise<void> {
    console.log("Starting scheduled update of Reddit posts");

    try {
      // Get all unique subreddits from all users
      const subreddits = await db.getAllUniqueSubreddits();
      console.log(`Found ${subreddits.length} unique subreddits to update`);

      // Fetch posts for each subreddit
      for (const subreddit of subreddits) {
        try {
          console.log(`Fetching posts for r/${subreddit}`);
          const redditPosts = await fetchRedditPosts(subreddit, 25);

          if (redditPosts.length > 0) {
            const dbPosts = redditPosts.map(convertRedditPostToDb);
            await db.upsertPosts(dbPosts);
            console.log(`Stored ${dbPosts.length} posts for r/${subreddit}`);

            // Fetch comments for each post
            for (const post of redditPosts.slice(0, 10)) {
              try {
                const comments = await fetchRedditComments(post.permalink, 10);
                if (comments.length > 0) {
                  const dbComments = comments.map((c) =>
                    convertRedditCommentToDb(c, post.id)
                  );
                  await db.upsertComments(dbComments);
                  console.log(
                    `Stored ${dbComments.length} comments for post ${post.id}`
                  );
                }
              } catch (error) {
                console.error(
                  `Error fetching comments for post ${post.id}:`,
                  error
                );
              }
            }
          }
        } catch (error) {
          console.error(`Error processing subreddit ${subreddit}:`, error);
        }
      }

      console.log("Scheduled update completed successfully");
    } catch (error) {
      console.error("Scheduled update failed:", error);
      throw error;
    }
  },
};
