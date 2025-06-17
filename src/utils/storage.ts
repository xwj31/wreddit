import type { FilterOptions, BookmarkedPost } from "../types";

const KEYS = {
  FILTERS: "wreddit-filters",
  SUBREDDIT: "wreddit-subreddit",
  SORT: "wreddit-sort",
  BOOKMARKS: "wreddit-bookmarks",
} as const;

const get = (key: string, fallback: unknown = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const set = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Fail silently
  }
};

export const storage = {
  getFilters: (): FilterOptions => get(KEYS.FILTERS, {
    blockedSubreddits: [],
    favoriteSubreddits: [],
    keywords: [],
    blockedKeywords: [],
  }),
  
  saveFilters: (filters: FilterOptions) => set(KEYS.FILTERS, filters),
  
  getSubreddit: () => get(KEYS.SUBREDDIT, "all") as string,
  
  saveSubreddit: (subreddit: string) => set(KEYS.SUBREDDIT, subreddit),
  
  getSort: () => get(KEYS.SORT, "hot") as string,
  
  saveSort: (sort: string) => set(KEYS.SORT, sort),
  
  getBookmarks: (): BookmarkedPost[] => get(KEYS.BOOKMARKS, []),
  
  saveBookmarks: (bookmarks: BookmarkedPost[]) => set(KEYS.BOOKMARKS, bookmarks),
  
  addBookmark: (post: { id: string; title: string; subreddit: string; permalink: string }) => {
    const bookmarks = storage.getBookmarks();
    if (!bookmarks.find(b => b.id === post.id)) {
      bookmarks.unshift({ ...post, bookmarkedAt: Date.now() });
      storage.saveBookmarks(bookmarks);
    }
  },
  
  removeBookmark: (postId: string) => {
    const bookmarks = storage.getBookmarks().filter(b => b.id !== postId);
    storage.saveBookmarks(bookmarks);
  },
  
  isBookmarked: (postId: string) => storage.getBookmarks().some(b => b.id === postId),
};
