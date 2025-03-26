import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminCredential {
  username: string;
  password: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Parse admin credentials from environment variables
// Format for env variables: REACT_APP_ADMIN_USERNAMES=user1,user2,user3
// Format for env variables: REACT_APP_ADMIN_PASSWORDS=pass1,pass2,pass3
const parseAdminCredentials = (): AdminCredential[] => {
  const usernames = (process.env.REACT_APP_ADMIN_USERNAMES || process.env.REACT_APP_ADMIN_USERNAME || '').split(',');
  const passwords = (process.env.REACT_APP_ADMIN_PASSWORDS || process.env.REACT_APP_ADMIN_PASSWORD || '').split(',');
  
  // If single username/password are provided via the old env variables, use those
  if (process.env.REACT_APP_ADMIN_USERNAME && process.env.REACT_APP_ADMIN_PASSWORD && !process.env.REACT_APP_ADMIN_USERNAMES) {
    return [{
      username: process.env.REACT_APP_ADMIN_USERNAME,
      password: process.env.REACT_APP_ADMIN_PASSWORD
    }];
  }
  
  // Create credentials array, making sure we have matching usernames and passwords
  const credentials: AdminCredential[] = [];
  const count = Math.min(usernames.length, passwords.length);
  
  for (let i = 0; i < count; i++) {
    if (usernames[i].trim() && passwords[i].trim()) {
      credentials.push({
        username: usernames[i].trim(),
        password: passwords[i].trim()
      });
    }
  }
  
  return credentials;
};

const ADMIN_CREDENTIALS = parseAdminCredentials();

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
    // Check if credentials match any admin user
    const isValidAdmin = ADMIN_CREDENTIALS.some(
      admin => admin.username === username && admin.password === password
    );
    
    if (isValidAdmin) {
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