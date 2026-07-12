import api from '@/lib/axios';
import type { MemberReport, EventReport, PaymentSummary } from '@/types';

export async function getMemberReport(status?: string): Promise<MemberReport> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const res = await api.get('/reports/members', { params });
  return res.data.data;
}

export async function getEventReport(from?: string, to?: string): Promise<EventReport> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get('/reports/events', { params });
  return res.data.data;
}

export async function getPaymentReport(
  from?: string,
  to?: string,
  status?: string
): Promise<PaymentSummary> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (status) params.status = status;
  const res = await api.get('/reports/payments', { params });
  return res.data.data;
}
