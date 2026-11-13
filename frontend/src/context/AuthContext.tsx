import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: 'Station Master' | 'Handler' | 'Administrator') => void;
  isLoading: boolean;
}

const DEMO_USERS: Record<string, User> = {
  'Station Master': {
    id: 1,
    username: 'station_master',
    role: 'Station Master',
    full_name: 'SM Rajesh Kumar',
    division: 'SBC'
  },
  'Handler': {
    id: 4,
    username: 'handler_sig1',
    role: 'Handler',
    full_name: 'Engr. Deepa Murthy',
    division: 'SBC'
  },
  'Administrator': {
    id: 7,
    username: 'admin',
    role: 'Administrator',
    full_name: 'Chief Rail Operations Director (Admin)',
    division: 'ALL'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('railway_user');
    return saved ? JSON.parse(saved) : DEMO_USERS['Administrator'];
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('railway_token') || 'demo-admin-token';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await api.login({ username, password });
      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('railway_user', JSON.stringify(data.user));
        localStorage.setItem('railway_token', data.token);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (err) {
      console.error('Login error:', err);
      // Fallback to local demo users if offline
      for (const key of Object.keys(DEMO_USERS)) {
        if (DEMO_USERS[key].username === username) {
          setUser(DEMO_USERS[key]);
          setToken(`token-${username}`);
          localStorage.setItem('railway_user', JSON.stringify(DEMO_USERS[key]));
          localStorage.setItem('railway_token', `token-${username}`);
          setIsLoading(false);
          return true;
        }
      }
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('railway_user');
    localStorage.removeItem('railway_token');
  };

  const switchDemoRole = (role: 'Station Master' | 'Handler' | 'Administrator') => {
    const selected = DEMO_USERS[role];
    if (selected) {
      setUser(selected);
      setToken(`token-${selected.username}`);
      localStorage.setItem('railway_user', JSON.stringify(selected));
      localStorage.setItem('railway_token', `token-${selected.username}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchDemoRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
