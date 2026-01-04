import axios from 'axios';

import { ORCA_API_BASE_URL } from '@/config/env';

export const http = axios.create({
  baseURL: `${ORCA_API_BASE_URL}/api/v1`,
  timeout: 10000,
  withCredentials: true,
});
