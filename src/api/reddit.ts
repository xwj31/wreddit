import type { FilterOptions, PostsApiResponse, RedditComment } from "../types";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

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

  fetchComments: async (permalink: string): Promise<RedditComment[]> => {
    try {
      const response = await fetch(`https://www.reddit.com${permalink}.json`);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      
      if (data?.[1]?.data?.children) {
        return data[1].data.children
          .filter((child: { kind: string }) => child.kind === "t1")
          .map((child: { data: RedditComment }) => child.data);
      }
      
      return [];
    } catch {
      return [];
    }
  },

  searchSubreddits: async (query: string): Promise<{ name: string; display_name: string; subscribers: number; public_description: string }[]> => {
    if (!query.trim()) return [];

    const url = new URL(`${WORKER_URL}/api/search-subreddits`);
    url.searchParams.append("q", query);
    url.searchParams.append("limit", "20");

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.subreddits || [];
  },
};