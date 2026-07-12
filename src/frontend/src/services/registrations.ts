import api from '@/lib/axios';
import type { Registration, RegistrationListResponse, PaginationParams } from '@/types';

export async function registerForEvent(
  eventId: string,
  data: {
    memberId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    formData?: Record<string, unknown>;
  }
): Promise<{ registration: Registration }> {
  const res = await api.post(`/events/${eventId}/register`, data);
  return res.data.data;
}

export async function listRegistrations(
  eventId: string,
  filters: PaginationParams & { status?: string; type?: string } = {}
): Promise<RegistrationListResponse> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.type) params.type = filters.type;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  const res = await api.get(`/events/${eventId}/registrations`, { params });
  return res.data.data;
}

export async function cancelRegistration(id: string): Promise<void> {
  await api.patch(`/registrations/${id}/cancel`);
}
