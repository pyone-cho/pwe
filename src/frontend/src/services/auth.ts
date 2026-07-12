import api from '@/lib/axios';
import type { AuthResponse, User } from '@/types';

export async function signup(data: {
  orgName: string;
  slug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResponse> {
  const res = await api.post('/auth/signup', data);
  return res.data.data;
}

export async function login(data: {
  email: string;
  password: string;
  slug?: string;
}): Promise<AuthResponse> {
  const res = await api.post('/auth/login', data);
  return res.data.data;
}

export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await api.post('/auth/refresh', { refreshToken });
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<{ user: User }> {
  const res = await api.get('/auth/me');
  return res.data.data;
}
