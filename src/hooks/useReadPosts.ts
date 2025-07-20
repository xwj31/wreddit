import { useState } from 'react';

const READ_POSTS_KEY = 'reddit_read_posts';
const MAX_READ_POSTS = 1000; // Limit storage size

export const useReadPosts = () => {
  const [readPosts, setReadPosts] = useState<Set<string>>(() => {
    // Initialize from localStorage immediately
    try {
      const stored = localStorage.getItem(READ_POSTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.error('Failed to load read posts:', error);
    }
    return new Set();
  });

  // Mark a post as read
  const markAsRead = (postId: string) => {
    setReadPosts((prev) => {
      const newSet = new Set(prev);
      newSet.add(postId);
      
      // Limit the size by removing oldest entries
      if (newSet.size > MAX_READ_POSTS) {
        const array = Array.from(newSet);
        const toKeep = array.slice(-MAX_READ_POSTS);
        const limitedSet = new Set(toKeep);
        
        // Save to localStorage
        try {
          localStorage.setItem(READ_POSTS_KEY, JSON.stringify(Array.from(limitedSet)));
        } catch (error) {
          console.error('Failed to save read posts:', error);
        }
        
        return limitedSet;
      }
      
      // Save to localStorage
      try {
        localStorage.setItem(READ_POSTS_KEY, JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error('Failed to save read posts:', error);
      }
      
      return newSet;
    });
  };

  // Check if a post is read
  const isRead = (postId: string): boolean => {
    return readPosts.has(postId);
  };

  // Clear all read posts
  const clearReadPosts = () => {
    setReadPosts(new Set());
    try {
      localStorage.removeItem(READ_POSTS_KEY);
    } catch (error) {
      console.error('Failed to clear read posts:', error);
    }
  };

  return { markAsRead, isRead, clearReadPosts, readPostsCount: readPosts.size };
};