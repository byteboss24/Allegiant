"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STATIC_USERNAME = 'admin@allegiant.com'; // Change as needed
const STATIC_PASSWORD = '123456'; // Change as needed

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const loginTime = localStorage.getItem('loginTimestamp');
    if (storedAuth === 'true' && loginTime) {
      const now = Date.now();
      const loginTimestamp = parseInt(loginTime, 10);
      // 1 hour = 3600000 ms
      if (now - loginTimestamp < 3600000) {
        setIsAuthenticated(true);
      } else {
        // Session expired
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('loginTimestamp');
        router.replace('/auth');
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [router]);

  const login = async (username: string, password: string) => {
    if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('loginTimestamp', Date.now().toString());
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loginTimestamp');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
} 