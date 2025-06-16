export interface RedditPost {
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

export interface Child {
  kind: string;
  data: [];
}

export interface FilterOptions {
  blockedSubreddits: string[];
  favoriteSubreddits: string[];
  keywords: string[];
  blockedKeywords: string[];
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  replies?: {
    data: {
      children: Array<{
        kind: string;
        data: RedditComment;
      }>;
    };
  };
}

export interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after?: string;
  };
}

export interface PostsApiResponse {
  posts: RedditPost[];
  after?: string;
}
