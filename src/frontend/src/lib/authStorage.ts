export interface AuthSessionData {
  accessToken: string;
  refreshToken: string;
  organization?: unknown;
}

export function persistAuthSession(session: AuthSessionData): void {
  localStorage.setItem('accessToken', session.accessToken);
  localStorage.setItem('refreshToken', session.refreshToken);

  if (session.organization) {
    localStorage.setItem('organization', JSON.stringify(session.organization));
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('organization');
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}
