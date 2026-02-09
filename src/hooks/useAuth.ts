import { createContext, useContext } from 'react';
import type { User, UserRole } from '../types';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  userRole: UserRole;
  userName: string;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>(null!);

export function useAuth() {
  return useContext(AuthContext);
}
