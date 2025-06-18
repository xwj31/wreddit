// src/types.ts - Enhanced with video support
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

// New video-related types
export interface VideoInfo {
  url: string;
  type:
    | "reddit_video"
    | "youtube"
    | "vimeo"
    | "streamable"
    | "imgur_gifv"
    | "gfycat"
    | "redgifs"
    | "external";
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  isGif?: boolean;
  embedHtml?: string;
}
