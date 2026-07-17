import api from '@/lib/axios';
import type { Member, MemberListResponse, MemberFilters } from '@/types';

function buildParams(filters: MemberFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.type) params.type = filters.type;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.sort) params.sort = filters.sort;
  if (filters.order) params.order = filters.order;
  return params;
}

export async function getMyMember(): Promise<Member> {
  const res = await api.get('/members/me');
  return res.data.data;
}

export async function listMembers(filters: MemberFilters = {}): Promise<MemberListResponse> {
  const res = await api.get('/members', { params: buildParams(filters) });
  return res.data.data;
}

export async function getMember(id: string): Promise<Member> {
  const res = await api.get(`/members/${id}`);
  return res.data.data;
}

export async function createMember(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  membershipType?: string;
  emergencyContact?: string;
  notes?: string;
}): Promise<Member> {
  const res = await api.post('/members', data);
  return res.data.data;
}

export async function updateMember(id: string, data: Partial<Member>): Promise<Member> {
  const res = await api.put(`/members/${id}`, data);
  return res.data.data;
}

export async function updateMemberStatus(id: string, status: string): Promise<void> {
  await api.patch(`/members/${id}/status`, { status });
}

export async function resetMemberPassword(id: string): Promise<string> {
  const res = await api.patch(`/members/${id}/reset-password`);
  return res.data.data.temporaryPassword;
}

export async function importMembers(file: File): Promise<{
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/members/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function exportMembers(filters: MemberFilters = {}): Promise<Blob> {
  const res = await api.get('/members/export', {
    params: { ...buildParams(filters), format: 'csv' },
    responseType: 'blob',
  });
  return res.data;
}
