import type { FilterOptions } from "../types";

const STORAGE_KEYS = {
  FILTERS: "wreddit-filters",
  SUBREDDIT: "wreddit-subreddit",
  SORT: "wreddit-sort",
} as const;

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean | Storage => {
  return typeof window !== "undefined" && window.localStorage;
};

// Filter operations
export const getFilters = (): FilterOptions => {
  if (!isLocalStorageAvailable()) {
    return {
      blockedSubreddits: [],
      favoriteSubreddits: [],
      keywords: [],
      blockedKeywords: [],
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FILTERS);
    return saved
      ? JSON.parse(saved)
      : {
          blockedSubreddits: [],
          favoriteSubreddits: [],
          keywords: [],
          blockedKeywords: [],
        };
  } catch (error) {
    console.error("Error parsing filters from localStorage:", error);
    return {
      blockedSubreddits: [],
      favoriteSubreddits: [],
      keywords: [],
      blockedKeywords: [],
    };
  }
};

export const saveFilters = (filters: FilterOptions): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
  } catch (error) {
    console.error("Error saving filters to localStorage:", error);
  }
};

// Subreddit operations
export const getSubreddit = (): string => {
  if (!isLocalStorageAvailable()) return "all";

  return localStorage.getItem(STORAGE_KEYS.SUBREDDIT) || "all";
};

export const saveSubreddit = (subreddit: string): void => {
  if (!isLocalStorageAvailable()) return;

  localStorage.setItem(STORAGE_KEYS.SUBREDDIT, subreddit);
};

// Sort operations
export const getSort = (): string => {
  if (!isLocalStorageAvailable()) return "hot";

  return localStorage.getItem(STORAGE_KEYS.SORT) || "hot";
};

export const saveSort = (sort: string): void => {
  if (!isLocalStorageAvailable()) return;

  localStorage.setItem(STORAGE_KEYS.SORT, sort);
};

// Utility functions for filter management
export const addToFilterList = (list: string[], item: string): string[] => {
  const trimmedItem = item.toLowerCase().trim();
  if (trimmedItem && !list.includes(trimmedItem)) {
    return [...list, trimmedItem];
  }
  return list;
};

export const removeFromFilterList = (
  list: string[],
  item: string
): string[] => {
  return list.filter((i) => i !== item);
};
