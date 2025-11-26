'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginRequest, SignupRequest, GoogleAuthRequest } from '@/types/auth';
import { authService } from '@/services/auth';
import { getRefreshToken } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  googleAuth: (data: GoogleAuthRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = getRefreshToken();
      
      if (refreshToken) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user:', error);
          authService.clearTokens();
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authService.login(data);
      setUser(response.user);
      router.push('/inbox');
    } catch (error) {
      throw error;
    }
  };

  const signup = async (data: SignupRequest) => {
    try {
      const response = await authService.signup(data);
      setUser(response.user);
      router.push('/inbox');
    } catch (error) {
      throw error;
    }
  };

  const googleAuth = async (data: GoogleAuthRequest) => {
    try {
      const response = await authService.googleAuth(data);
      setUser(response.user);
      router.push('/inbox');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
