import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (formData: FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveUser = (userData: any) => {
    const formattedUser: User = {
      _id: userData._id || userData.id,
      id: userData.id || userData._id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      role: userData.role,
    };

    setUser(formattedUser);
    localStorage.setItem('intellmeet_user', JSON.stringify(formattedUser));
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await api.get('/auth/me');
    saveUser(res.data);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('intellmeet_user');

        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
          await fetchProfile();
        } else if (token) {
          await fetchProfile();
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('intellmeet_user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const res = await api.post('/auth/login', { email, password });
      const data = res.data;

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.user) {
        saveUser(data.user);
      } else {
        await fetchProfile();
      }
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);

      const res = await api.post('/auth/register', { name, email, password });
      const data = res.data;

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.user) {
        saveUser(data.user);
      } else {
        await fetchProfile();
      }
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (formData: FormData) => {
    try {
      setIsLoading(true);

      const res = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.user) {
        saveUser(res.data.user);
      } else {
        saveUser(res.data);
      }
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Profile update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('intellmeet_user');
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, fetchProfile, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}