import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials from environment variables
// These will be loaded from .env file which is not committed to the repository
const ADMIN_USERNAME = process.env.REACT_APP_ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || '';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      const { isAuthenticated, isAdmin } = JSON.parse(authData);
      setIsAuthenticated(isAuthenticated);
      setIsAdmin(isAdmin);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Check if credentials match the admin user
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      
      // Store auth state in localStorage
      localStorage.setItem('authData', JSON.stringify({ 
        isAuthenticated: true, 
        isAdmin: true 
      }));
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('authData');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 