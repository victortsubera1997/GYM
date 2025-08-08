import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      if (token) {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
          const res = await api.get('/auth/profile');
          setUser(res.data.user);
        } catch {
          logout();
        }
      } else {
        localStorage.removeItem('token');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    };

    setupAuth();
  }, [token]);

  const login = (token, user) => {
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);