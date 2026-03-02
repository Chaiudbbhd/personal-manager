import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('lpk_token');
    const storedUser = localStorage.getItem('lpk_user');

    if (storedToken && storedUser) {
      console.log('AuthContext: Detected existing session', { token: !!storedToken, user: JSON.parse(storedUser) });
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      console.log('AuthContext: No existing session found');
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, userToken: string) => {
    console.log('AuthContext: Logging in user', userData);
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('lpk_token', userToken);
    localStorage.setItem('lpk_user', JSON.stringify(userData));
    console.log('AuthContext: Session saved to localStorage');
  };

  const logout = () => {
    console.log('AuthContext: Logging out');
    setUser(null);
    setToken(null);
    localStorage.removeItem('lpk_token');
    localStorage.removeItem('lpk_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!token, 
      login, 
      logout,
      isLoading 
    }}>
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
