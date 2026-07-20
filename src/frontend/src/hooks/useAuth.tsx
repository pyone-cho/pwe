import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Organization } from '@/types';
import * as authService from '@/services/auth';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    orgName: string;
    slug: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  register: (data: {
    orgSlug: string;
    firstName: string;
    lastName?: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authService
        .getMe()
        .then((res) => {
          setUser(res.user);
          // Org info comes from login/signup, stored separately
          const storedOrg = localStorage.getItem('organization');
          if (storedOrg) setOrganization(JSON.parse(storedOrg));
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('organization', JSON.stringify(res.organization));
    setUser(res.user);
    setOrganization(res.organization);
  }, []);

  const signup = useCallback(async (data: {
    orgName: string;
    slug: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const res = await authService.signup(data);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('organization', JSON.stringify(res.organization));
    setUser(res.user);
    setOrganization(res.organization);
  }, []);

  const register = useCallback(async (data: {
    orgSlug: string;
    firstName: string;
    lastName?: string;
    phone: string;
    email: string;
    password: string;
  }) => {
    const res = await authService.register(data);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('organization', JSON.stringify(res.organization));
    setUser(res.user);
    setOrganization(res.organization);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('organization');
      setUser(null);
      setOrganization(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
