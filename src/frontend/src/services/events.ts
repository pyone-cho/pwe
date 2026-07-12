import api from '@/lib/axios';
import type { Event, EventListResponse, EventFilters, CustomField } from '@/types';

function buildParams(filters: EventFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.sort) params.sort = filters.sort;
  if (filters.order) params.order = filters.order;
  return params;
}

export async function listEvents(filters: EventFilters = {}): Promise<EventListResponse> {
  const res = await api.get('/events', { params: buildParams(filters) });
  return res.data.data;
}

export async function getEvent(id: string): Promise<Event> {
  const res = await api.get(`/events/${id}`);
  return res.data.data;
}

export async function createEvent(data: {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  registrationMode: string;
  requiresPayment?: boolean;
  paymentAmount?: number;
  customFields?: CustomField[];
}): Promise<Event> {
  const res = await api.post('/events', data);
  return res.data.data;
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
  const res = await api.put(`/events/${id}`, data);
  return res.data.data;
}

export async function updateEventStatus(id: string, status: string): Promise<void> {
  await api.patch(`/events/${id}/status`, { status });
}

export async function listPublicEvents(slug: string, page = 1): Promise<EventListResponse> {
  const res = await api.get('/events/public', { params: { slug, page } });
  return res.data.data;
}

export async function getPublicEvent(id: string): Promise<Event> {
  const res = await api.get(`/events/public/${id}`);
  return res.data.data;
}
