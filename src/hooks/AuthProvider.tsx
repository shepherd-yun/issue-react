import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { login as apiLogin } from '../api/auth';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token'),
  );

  const isLoggedIn = !!token;
  const userRole: UserRole = user?.role || 'user';
  const userName = user?.name || '';

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    localStorage.setItem('token', result.access_token);
    localStorage.setItem('user', JSON.stringify(result.user));
    setToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoggedIn, userRole, userName, login, logout }),
    [user, token, isLoggedIn, userRole, userName, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
