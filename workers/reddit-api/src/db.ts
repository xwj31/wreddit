import { neon } from "@neondatabase/serverless";

// Environment interface for proper typing
export interface WorkerEnv {
  DATABASE_URL?: string;
}

// Get database connection - requires DATABASE_URL secret from Cloudflare Workers
const getDatabaseConnection = (env?: WorkerEnv) => {
  if (!env?.DATABASE_URL) {
    throw new Error('DATABASE_URL secret is not configured. Please set it using: wrangler secret put DATABASE_URL');
  }
  
  return neon(env.DATABASE_URL);
};

export type User = {
  id: string;
  created_at: Date;
};

export type UserSubreddit = {
  user_id: string;
  subreddit: string;
  created_at: Date;
};

export type DbPost = {
  id: string;
  subreddit: string;
  title: string;
  author: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  thumbnail_url: string | null;
  preview_image_url: string | null;
  selftext: string | null;
  is_video: boolean;
  video_url: string | null;
  updated_at: Date;
};

export type DbComment = {
  id: string;
  post_id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  parent_id: string | null;
  depth: number;
  updated_at: Date;
};

export type UserFilterPreference = {
  user_id: string;
  reddit_sort_filter: 'hot' | 'top' | 'new';
  created_at: Date;
  updated_at: Date;
};

// Legacy db object - will throw errors if DATABASE_URL secret is not configured
// Use createDbWithEnv(env) instead for proper secret handling
const createLegacyDbError = (methodName: string) => {
  throw new Error(`db.${methodName}() is deprecated. Use createDbWithEnv(env).${methodName}() instead. DATABASE_URL secret must be passed via environment.`);
};

export const db = {
  async createUser(): Promise<string> {
    return createLegacyDbError('createUser');
  },

  async getUserSubreddits(): Promise<string[]> {
    return createLegacyDbError('getUserSubreddits');
  },

  async addUserSubreddit(): Promise<void> {
    return createLegacyDbError('addUserSubreddit');
  },

  async removeUserSubreddit(): Promise<void> {
    return createLegacyDbError('removeUserSubreddit');
  },

  async getUserPosts(): Promise<DbPost[]> {
    return createLegacyDbError('getUserPosts');
  },

  async getUserHomeFeed(): Promise<DbPost[]> {
    return createLegacyDbError('getUserHomeFeed');
  },

  async upsertPosts(): Promise<void> {
    return createLegacyDbError('upsertPosts');
  },

  async getPostComments(): Promise<DbComment[]> {
    return createLegacyDbError('getPostComments');
  },

  async upsertComments(): Promise<void> {
    return createLegacyDbError('upsertComments');
  },

  async getAllUniqueSubreddits(): Promise<string[]> {
    return createLegacyDbError('getAllUniqueSubreddits');
  },

  async initSchema(): Promise<void> {
    return createLegacyDbError('initSchema');
  },
};

// Environment-aware database factory for Cloudflare Workers
export const createDbWithEnv = (env?: WorkerEnv) => {
  const envSql = getDatabaseConnection(env);
  
  return {
    async createUser(): Promise<string> {
      const userId = crypto.randomUUID();
      await envSql`
        INSERT INTO users (id, created_at)
        VALUES (${userId}, NOW())
      `;
      return userId;
    },

    async getUserSubreddits(userId: string): Promise<string[]> {
      console.log(`[DB] Getting subreddits for user ${userId}`);
      const result = await envSql`
        SELECT subreddit FROM user_subreddits
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      const subreddits = result.map((row) => row.subreddit as string);
      console.log(
        `[DB] Found ${subreddits.length} subreddits for user: ${subreddits.join(
          ", "
        )}`
      );
      return subreddits;
    },

    async addUserSubreddit(userId: string, subreddit: string): Promise<void> {
      console.log(`[DB] Adding subreddit ${subreddit} for user ${userId}`);
      await envSql`
        INSERT INTO user_subreddits (user_id, subreddit, created_at)
        VALUES (${userId}, ${subreddit.toLowerCase()}, NOW())
        ON CONFLICT (user_id, subreddit) DO NOTHING
      `;
      console.log(
        `[DB] Successfully added subreddit ${subreddit} for user ${userId}`
      );
    },

    async removeUserSubreddit(userId: string, subreddit: string): Promise<void> {
      await envSql`
        DELETE FROM user_subreddits
        WHERE user_id = ${userId} AND subreddit = ${subreddit.toLowerCase()}
      `;
    },

    async getUserPosts(userId: string): Promise<DbPost[]> {
      console.log(`[DB] Getting posts for user ${userId}`);

      const result = await envSql`
        SELECT p.* FROM posts p
        INNER JOIN user_subreddits us ON p.subreddit = us.subreddit
        WHERE us.user_id = ${userId}
        ORDER BY p.created_utc DESC
        LIMIT 100
      `;

      console.log(`[DB] Query returned ${result.length} posts`);
      return result as DbPost[];
    },

    async getUserHomeFeed(userId: string): Promise<DbPost[]> {
      console.log(`[DB] Getting home feed for user ${userId}`);

      const result = await envSql`
        SELECT p.* FROM posts p
        INNER JOIN user_subreddits us ON p.subreddit = us.subreddit
        WHERE us.user_id = ${userId}
        ORDER BY p.created_utc DESC
        LIMIT 25
      `;

      console.log(`[DB] Home feed query returned ${result.length} posts`);
      return result as DbPost[];
    },

    async upsertPosts(posts: DbPost[]): Promise<void> {
      if (posts.length === 0) {
        console.log(`[DB] No posts to upsert, returning`);
        return;
      }

      console.log(`[DB] Upserting ${posts.length} posts`);
      const values = posts.map((p) => ({
        id: p.id,
        subreddit: p.subreddit,
        title: p.title,
        author: p.author,
        url: p.url,
        permalink: p.permalink,
        score: p.score,
        num_comments: p.num_comments,
        created_utc: p.created_utc,
        thumbnail_url: p.thumbnail_url,
        preview_image_url: p.preview_image_url,
        selftext: p.selftext,
        is_video: p.is_video,
        video_url: p.video_url,
        updated_at: new Date(),
      }));

      try {
        await envSql`
          INSERT INTO posts (
            id, subreddit, title, author, url, permalink, score,
            num_comments, created_utc, thumbnail_url, preview_image_url,
            selftext, is_video, video_url, updated_at
          )
          SELECT * FROM jsonb_populate_recordset(
            NULL::posts,
            ${JSON.stringify(values)}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            score = EXCLUDED.score,
            num_comments = EXCLUDED.num_comments,
            updated_at = NOW()
        `;
        console.log(`[DB] Successfully upserted ${posts.length} posts`);
      } catch (error) {
        console.error(`[DB] Error upserting posts:`, error);
        throw error;
      }
    },

    async getPostComments(postId: string, limit = 10): Promise<DbComment[]> {
      console.log(`[DB] Getting comments for post ${postId} with limit ${limit}`);
      
      const result = await envSql`
        SELECT * FROM comments
        WHERE post_id = ${postId} AND depth = 0
        ORDER BY score DESC
        LIMIT ${limit}
      `;
      
      console.log(`[DB] Found ${result.length} comments for post ${postId}`);
      if (result.length > 0) {
        console.log(`[DB] First comment preview: ${result[0].body?.substring(0, 100)}...`);
      }
      
      return result as DbComment[];
    },

    async upsertComments(comments: DbComment[]): Promise<void> {
      if (comments.length === 0) {
        console.log(`[DB] No comments to upsert, returning`);
        return;
      }

      console.log(`[DB] Upserting ${comments.length} comments`);
      console.log(`[DB] Comment post_ids: ${comments.map(c => c.post_id).join(', ')}`);
      console.log(`[DB] Comment depths: ${comments.map(c => c.depth).join(', ')}`);

      const values = comments.map((c) => ({
        id: c.id,
        post_id: c.post_id,
        author: c.author,
        body: c.body,
        score: c.score,
        created_utc: c.created_utc,
        parent_id: c.parent_id,
        depth: c.depth || 0,
        updated_at: new Date(),
      }));

      try {
        await envSql`
          INSERT INTO comments (
            id, post_id, author, body, score, created_utc,
            parent_id, depth, updated_at
          )
          SELECT * FROM jsonb_populate_recordset(
            NULL::comments,
            ${JSON.stringify(values)}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            score = EXCLUDED.score,
            body = EXCLUDED.body,
            updated_at = NOW()
        `;
        console.log(`[DB] Successfully upserted ${comments.length} comments`);
      } catch (error) {
        console.error(`[DB] Error upserting comments:`, error);
        throw error;
      }
    },

    async getAllUniqueSubreddits(): Promise<string[]> {
      const result = await envSql`
        SELECT DISTINCT subreddit FROM user_subreddits
        ORDER BY subreddit
      `;
      return result.map((row) => row.subreddit as string);
    },

    async initSchema(): Promise<void> {
      await envSql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;

      await envSql`
        CREATE TABLE IF NOT EXISTS user_subreddits (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subreddit TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, subreddit)
        )
      `;

      await envSql`
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          subreddit TEXT NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          url TEXT NOT NULL,
          permalink TEXT NOT NULL,
          score INTEGER NOT NULL,
          num_comments INTEGER NOT NULL,
          created_utc BIGINT NOT NULL,
          thumbnail_url TEXT,
          preview_image_url TEXT,
          selftext TEXT,
          is_video BOOLEAN NOT NULL DEFAULT FALSE,
          video_url TEXT,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;

      await envSql`
        CREATE INDEX IF NOT EXISTS idx_posts_subreddit ON posts(subreddit)
      `;

      await envSql`
        CREATE INDEX IF NOT EXISTS idx_posts_created_utc ON posts(created_utc DESC)
      `;

      await envSql`
        CREATE INDEX IF NOT EXISTS idx_posts_subreddit_created_utc ON posts(subreddit, created_utc DESC)
      `;

      await envSql`
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          author TEXT NOT NULL,
          body TEXT NOT NULL,
          score INTEGER NOT NULL,
          created_utc BIGINT NOT NULL,
          parent_id TEXT,
          depth INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;

      await envSql`
        CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)
      `;

      await envSql`
        CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)
      `;

      await envSql`
        CREATE TABLE IF NOT EXISTS user_filter_preferences (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          reddit_sort_filter TEXT NOT NULL DEFAULT 'hot' CHECK (reddit_sort_filter IN ('hot', 'top', 'new')),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
    },

    async getUserFilterPreference(userId: string): Promise<UserFilterPreference | null> {
      console.log(`[DB] Getting filter preference for user ${userId}`);
      const result = await envSql`
        SELECT * FROM user_filter_preferences
        WHERE user_id = ${userId}
      `;
      
      if (result.length === 0) {
        console.log(`[DB] No filter preference found for user ${userId}, returning null`);
        return null;
      }
      
      const preference = result[0] as UserFilterPreference;
      console.log(`[DB] Found filter preference for user ${userId}: ${preference.reddit_sort_filter}`);
      return preference;
    },

    async setUserFilterPreference(userId: string, filter: 'hot' | 'top' | 'new'): Promise<void> {
      console.log(`[DB] Setting filter preference for user ${userId} to ${filter}`);
      await envSql`
        INSERT INTO user_filter_preferences (user_id, reddit_sort_filter, created_at, updated_at)
        VALUES (${userId}, ${filter}, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          reddit_sort_filter = EXCLUDED.reddit_sort_filter,
          updated_at = NOW()
      `;
      console.log(`[DB] Successfully set filter preference for user ${userId} to ${filter}`);
    },

    async getAllUserFilterPreferences(): Promise<UserFilterPreference[]> {
      console.log(`[DB] Getting all user filter preferences`);
      const result = await envSql`
        SELECT * FROM user_filter_preferences
        ORDER BY created_at DESC
      `;
      console.log(`[DB] Found ${result.length} user filter preferences`);
      return result as UserFilterPreference[];
    },
  };
};