import React, { createContext, useContext, useEffect, useState } from 'react';
import { saveToken, getToken, deleteToken } from '../utils/storage';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  gender?: string;
  age?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;                  // Додано токен сюди
  login: (phone: string, password: string) => Promise<{ token: string; user: User }>;
  logout: () => Promise<void>;
  setAuthData: (token: string, user: User) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);    // Стейт для токена
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const savedToken = await getToken();
      if (savedToken) {
        try {
          const res = await axios.get('http://192.168.100.103:5050/api/auth/profile', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          setUser(res.data.user);
          setIsAuthenticated(true);
          setToken(savedToken);   // Записуємо токен в стейт
        } catch (error) {
          console.log('❌ Failed to load profile:', error);
          await deleteToken();
          setUser(null);
          setIsAuthenticated(false);
          setToken(null);
        }
      }
    };
    loadUser();
  }, []);

  const login = async (phone: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const res = await axios.post('http://192.168.100.103:5050/api/auth/login', { phone, password });
      const { token: newToken, user: loggedUser } = res.data;
      await saveToken(newToken);
      setUser(loggedUser);
      setIsAuthenticated(true);
      setToken(newToken);       // Записуємо новий токен
      return { token: newToken, user: loggedUser };
    } catch (error: any) {
      console.log('❌ Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    await deleteToken();
    setUser(null);
    setIsAuthenticated(false);
    setToken(null);           // Очищаємо токен
  };

  const setAuthData = async (newToken: string, newUser: User) => {
    await saveToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    setToken(newToken);       // Записуємо токен
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...updatedFields } : prevUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, token, login, logout, setAuthData, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};