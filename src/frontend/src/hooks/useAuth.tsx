import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Organization } from '@/types';
import * as authService from '@/services/auth';
import { clearAuthSession, persistAuthSession, getStoredAccessToken } from '@/lib/authStorage';

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
    const token = getStoredAccessToken();
    if (token) {
      authService
        .getMe()
        .then((res) => {
          setUser(res.user);
          const storedOrg = localStorage.getItem('organization');
          if (storedOrg) setOrganization(JSON.parse(storedOrg));
        })
        .catch(() => {
          clearAuthSession();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    persistAuthSession({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      organization: res.organization,
    });
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
    persistAuthSession({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      organization: res.organization,
    });
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
    persistAuthSession({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      organization: res.organization,
    });
    setUser(res.user);
    setOrganization(res.organization);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuthSession();
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
