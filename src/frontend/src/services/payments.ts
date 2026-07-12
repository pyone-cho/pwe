import api from '@/lib/axios';
import type { Payment, PaymentListResponse, PaymentSummary, PaymentFilters } from '@/types';

function buildParams(filters: PaymentFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.memberId) params.memberId = filters.memberId;
  if (filters.eventId) params.eventId = filters.eventId;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  return params;
}

export async function listPayments(filters: PaymentFilters = {}): Promise<PaymentListResponse> {
  const res = await api.get('/payments', { params: buildParams(filters) });
  return res.data.data;
}

export async function recordPayment(data: {
  memberId: string;
  eventId: string;
  registrationId?: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  paidAt?: string;
}): Promise<Payment> {
  const res = await api.post('/payments', data);
  return res.data.data;
}

export async function updatePayment(
  id: string,
  data: { status?: string; referenceNumber?: string }
): Promise<Payment> {
  const res = await api.patch(`/payments/${id}`, data);
  return res.data.data;
}

export async function getPaymentSummary(eventId?: string): Promise<PaymentSummary> {
  const params: Record<string, string> = {};
  if (eventId) params.eventId = eventId;
  const res = await api.get('/payments/summary', { params });
  return res.data.data;
}
