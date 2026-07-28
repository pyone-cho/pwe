// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAuthSession, getStoredAccessToken, persistAuthSession } from './authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists auth tokens and organization to localStorage', () => {
    persistAuthSession({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      organization: { id: 'org-1', name: 'Acme' },
    });

    expect(getStoredAccessToken()).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    expect(localStorage.getItem('organization')).toContain('Acme');
  });

  it('clears auth session values from storage', () => {
    persistAuthSession({ accessToken: 'a', refreshToken: 'r', organization: { id: 'org-1', name: 'Acme' } });

    clearAuthSession();

    expect(getStoredAccessToken()).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('organization')).toBeNull();
  });
});
