import api from '@/lib/axios';
import type { Organization } from '@/types';

export async function getOrganization(): Promise<{ organization: Organization }> {
  const res = await api.get('/org');
  return res.data.data;
}

export async function updateOrganization(data: {
  name?: string;
  description?: string;
  phone?: string;
  settings?: Record<string, unknown>;
}): Promise<Organization> {
  const res = await api.put('/org', data);
  return res.data.data;
}
