import api from '@/lib/axios';
import type { Announcement, AnnouncementListResponse, AnnouncementFilters } from '@/types';

function buildParams(filters: AnnouncementFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  return params;
}

export async function listAnnouncements(
  filters: AnnouncementFilters = {}
): Promise<AnnouncementListResponse> {
  const res = await api.get('/announcements', { params: buildParams(filters) });
  return res.data.data;
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  priority: string;
  eventId?: string;
  status?: string;
}): Promise<Announcement> {
  const res = await api.post('/announcements', data);
  return res.data.data;
}

export async function updateAnnouncement(
  id: string,
  data: Partial<{ title: string; content: string; priority: string; eventId?: string }>
): Promise<Announcement> {
  const res = await api.put(`/announcements/${id}`, data);
  return res.data.data;
}

export async function updateAnnouncementStatus(
  id: string,
  status: string
): Promise<void> {
  await api.patch(`/announcements/${id}/status`, { status });
}
