import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/reddit';

const USER_ID_KEY = 'wreddit-user-id';

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    if (storedUserId) {
      setUserId(storedUserId);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (existingUserId?: string) => {
    setLoading(true);
    try {
      let id: string;
      if (existingUserId) {
        id = existingUserId;
      } else {
        id = await api.createUser();
      }
      
      localStorage.setItem(USER_ID_KEY, id);
      setUserId(id);
      return id;
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    setUserId(null);
  }, []);

  const isAuthenticated = Boolean(userId);

  return {
    userId,
    loading,
    isAuthenticated,
    login,
    logout,
  };
};