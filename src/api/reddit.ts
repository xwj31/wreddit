import type { RedditPost, RedditComment } from '../types';

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

export const api = {
  async createUser(): Promise<string> {
    const response = await fetch(`${WORKER_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.status}`);
    }

    const data = await response.json() as { userId: string };
    return data.userId;
  },

  async getUserPosts(userId: string): Promise<RedditPost[]> {
    console.log(`[API] Fetching posts for user ${userId}`);
    const response = await fetch(`${WORKER_URL}/api/users/${userId}/posts`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Failed to fetch posts: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch posts: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { posts: RedditPost[] };
    console.log(`[API] Retrieved ${data.posts.length} posts from database`);
    return data.posts;
  },

  async getUserSubreddits(userId: string): Promise<string[]> {
    const response = await fetch(`${WORKER_URL}/api/users/${userId}/subreddits`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subreddits: ${response.status}`);
    }

    const data = await response.json() as { subreddits: string[] };
    return data.subreddits;
  },

  async addUserSubreddit(userId: string, subreddit: string): Promise<void> {
    console.log(`[API] Adding subreddit ${subreddit} for user ${userId}`);
    const response = await fetch(`${WORKER_URL}/api/users/${userId}/subreddits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'add', subreddit }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Failed to add subreddit: ${response.status} - ${errorText}`);
      throw new Error(`Failed to add subreddit: ${response.status} - ${errorText}`);
    }
    
    console.log(`[API] Successfully added subreddit ${subreddit}`);
  },

  async removeUserSubreddit(userId: string, subreddit: string): Promise<void> {
    const response = await fetch(`${WORKER_URL}/api/users/${userId}/subreddits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'remove', subreddit }),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove subreddit: ${response.status}`);
    }
  },

  async getPostComments(postId: string): Promise<RedditComment[]> {
    const response = await fetch(`${WORKER_URL}/api/posts/${postId}/comments`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch comments for ${postId}: ${response.status}`);
      return [];
    }

    const data = await response.json() as { comments: RedditComment[] };
    return data.comments;
  },

  async loadMoreComments(postId: string, permalink: string): Promise<RedditComment[]> {
    const response = await fetch(`${WORKER_URL}/api/posts/${postId}/comments/more`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permalink }),
    });

    if (!response.ok) {
      console.warn(`Failed to load more comments for ${postId}: ${response.status}`);
      return [];
    }

    const data = await response.json() as { comments: RedditComment[] };
    return data.comments;
  },

  async fetchInitialComments(permalinks: string[]): Promise<Map<string, RedditComment[]>> {
    const commentsMap = new Map<string, RedditComment[]>();
    
    for (const permalink of permalinks) {
      try {
        const postId = permalink.split('/').slice(-3, -2)[0] || '';
        if (postId) {
          const comments = await this.getPostComments(postId);
          commentsMap.set(permalink, comments.slice(0, 3));
        }
      } catch (error) {
        console.warn(`Failed to fetch comments for ${permalink}:`, error);
        commentsMap.set(permalink, []);
      }
    }
    
    return commentsMap;
  },

  async initDatabase(): Promise<void> {
    const response = await fetch(`${WORKER_URL}/api/admin/init-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize database: ${response.status}`);
    }
  },
};