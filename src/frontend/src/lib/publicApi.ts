import axios from 'axios';

const orgSlug = import.meta.env.VITE_ORG_SLUG;
if (!orgSlug) {
  console.warn('VITE_ORG_SLUG is not set — public API requests will fail');
}

const publicApi = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'x-org-id': orgSlug,
  },
});

export default publicApi;
