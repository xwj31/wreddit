import type { FilterOptions, PostsApiResponse, RedditComment } from "../types";
import { apiCache, backoff, RequestQueue } from "../utils/cache";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

// Create a request queue to space out multiple subreddit requests
const requestQueue = new RequestQueue(500); // 500ms delay between requests

type FetchPostsParams = {
  subreddit: string;
  sort: string;
  after?: string;
  filters: FilterOptions;
};

export const api = {
  fetchPosts: async ({ subreddit, sort, after, filters }: FetchPostsParams): Promise<PostsApiResponse> => {
    const url = new URL(`${WORKER_URL}/api/posts`);
    url.searchParams.append("subreddit", subreddit);
    url.searchParams.append("sort", sort);
    url.searchParams.append("limit", "25");
    
    if (after) {
      url.searchParams.append("after", after);
    }

    const requestKey = `posts:${subreddit}:${sort}:${after || 'none'}:${JSON.stringify(filters)}`;
    
    // Use request queue and retry logic for posts
    return requestQueue.add(async () => {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          // Use cache with deduplication
          const result = await apiCache.deduplicate<PostsApiResponse>(
            requestKey,
            async () => {
              const response = await fetch(url.toString(), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify(filters),
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
              }

              return response.json();
            },
            5 * 60 * 1000 // 5 minute cache TTL for posts
          );
          
          // Reset backoff on success
          backoff.reset(requestKey);
          return result;
        } catch (error) {
          attempts++;
          const err = error instanceof Error ? error : new Error(String(error));
          
          // Check if we should retry
          if (attempts < maxAttempts && backoff.shouldRetry(requestKey, err)) {
            console.warn(`Retrying request (attempt ${attempts + 1}/${maxAttempts}) for ${subreddit}:`, err.message);
            await backoff.delay(requestKey);
            continue;
          }
          
          throw err;
        }
      }
      
      throw new Error(`Failed to fetch posts after ${maxAttempts} attempts`);
    });
  },

  fetchComments: async (permalink: string): Promise<RedditComment[]> => {
    const requestKey = `comments:${permalink}`;
    
    try {
      // Use cache with deduplication for comments
      const result = await apiCache.deduplicate<{ comments: RedditComment[] }>(
        requestKey,
        async () => {
          const url = new URL(`${WORKER_URL}/api/comments`);
          url.searchParams.append("permalink", permalink);

          const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            // Don't throw for comments, just return empty array
            console.warn(`Comments fetch failed for ${permalink}:`, response.status);
            return { comments: [] };
          }

          return response.json();
        },
        15 * 60 * 1000 // 15 minute cache TTL for comments
      );
      
      return result.comments || [];
    } catch (error) {
      console.warn(`Error fetching comments for ${permalink}:`, error);
      return [];
    }
  },

  searchSubreddits: async (query: string): Promise<{ name: string; display_name: string; subscribers: number; public_description: string }[]> => {
    if (!query.trim()) return [];

    const requestKey = `search-subreddits:${query}`;
    
    try {
      // Use cache with deduplication for subreddit searches
      const result = await apiCache.deduplicate<{ subreddits: { name: string; display_name: string; subscribers: number; public_description: string }[] }>(
        requestKey,
        async () => {
          const url = new URL(`${WORKER_URL}/api/search-subreddits`);
          url.searchParams.append("q", query);
          url.searchParams.append("limit", "20");

          const response = await fetch(url.toString(), {
            headers: {
              Accept: "application/json",
            },
          });
          
          if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
          }

          return response.json();
        },
        30 * 60 * 1000 // 30 minute cache TTL for subreddit searches
      );
      
      return result.subreddits || [];
    } catch (error) {
      console.error(`Error searching subreddits for "${query}":`, error);
      throw error;
    }
  },
};