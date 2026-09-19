import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const ROLE_PERMISSIONS = {
  admin: ['admin', 'analyst', 'operator', 'viewer'],
  analyst: ['analyst', 'operator', 'viewer'],
  operator: ['operator', 'viewer'],
  viewer: ['viewer']
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing token or initialize with default analyst
    const savedToken = localStorage.getItem('traffic_token');
    const savedUser = localStorage.getItem('traffic_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('traffic_token');
        localStorage.removeItem('traffic_user');
      }
    }

    // Default fast auto-switch to analyst for zero-friction evaluation
    authApi.quickSwitch('analyst')
      .then(res => {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('traffic_token', res.data.token);
        localStorage.setItem('traffic_user', JSON.stringify(res.data.user));
      })
      .catch(err => {
        // Offline fallback
        const mockUser = {
          id: 'user_analyst_demo',
          username: 'analyst',
          email: 'analyst@traffic.ai',
          role: 'analyst',
          name: 'Traffic Analyst'
        };
        setUser(mockUser);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('traffic_token', res.data.token);
    localStorage.setItem('traffic_user', JSON.stringify(res.data.user));
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('traffic_token');
    localStorage.removeItem('traffic_user');
  };

  const switchRole = async (role) => {
    try {
      const res = await authApi.quickSwitch(role);
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('traffic_token', res.data.token);
      localStorage.setItem('traffic_user', JSON.stringify(res.data.user));
    } catch (e) {
      setUser(prev => ({ ...prev, role, name: `Demo ${role.toUpperCase()}` }));
    }
  };

  const hasPermission = (minRole) => {
    if (!user) return false;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(minRole);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
