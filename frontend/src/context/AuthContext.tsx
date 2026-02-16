import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { api } from '../api/config';

interface User {
  userId: number;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
  wishlistProductIds: number[];
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, name: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  const register = async (email: string, name: string, password: string) => {
    try {
      const response = await axios.post(`${api.baseURL}${api.endpoints.users}`, {
        email,
        name,
        password
      });
      // Don't auto-login after registration
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Registration failed');
      }
      throw new Error('Registration failed. Please try again.');
    }
  };

  const login = async (email: string, password: string) => {
    // In a real app, you would validate credentials with an API
    // For now, we'll fetch the user by email if credentials are provided
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await axios.get(`${api.baseURL}${api.endpoints.users}/${email}`);
      const userData = response.data;
      
      // Store user in state and sessionStorage
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('User not found. Please check your email or register.');
      }
      throw new Error('Login failed. Please try again.');
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      isLoggedIn: !!user, 
      isAdmin: user?.isAdmin || false, 
      login, 
      logout,
      register
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}