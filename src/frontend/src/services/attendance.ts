import api from '@/lib/axios';
import type { AttendanceResponse } from '@/types';

export async function listAttendance(eventId: string): Promise<AttendanceResponse> {
  const res = await api.get(`/events/${eventId}/attendance`);
  return res.data.data;
}

export async function checkIn(
  eventId: string,
  data: { registrationId: string; method?: string }
): Promise<void> {
  await api.post(`/events/${eventId}/attendance`, data);
}

export async function bulkCheckIn(
  eventId: string,
  data: { registrationIds: string[]; method?: string }
): Promise<{ checkedIn: number }> {
  const res = await api.post(`/events/${eventId}/attendance/bulk`, data);
  return res.data.data;
}

export async function undoCheckIn(id: string): Promise<void> {
  await api.delete(`/attendance/${id}`);
}
