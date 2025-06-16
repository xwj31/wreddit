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
  data: RedditComment | RedditPost;
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
  parent_id?: string;
  depth?: number;
  replies?:
    | {
        kind: string;
        data: {
          children: Array<{
            kind: string;
            data: RedditComment | { count: number; children: string[] }; // MoreComments object
          }>;
        };
      }
    | "";
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

export interface SubredditInfo {
  display_name: string;
  title: string;
  public_description: string;
  subscribers: number;
  icon_img?: string;
  banner_img?: string;
  created_utc: number;
}

export interface SearchSubredditsResponse {
  subreddits: Array<{
    name: string;
    display_name: string;
    subscribers: number;
    public_description: string;
  }>;
}

export interface BookmarkedPost {
  id: string;
  title: string;
  subreddit: string;
  permalink: string;
  bookmarkedAt: number;
}
