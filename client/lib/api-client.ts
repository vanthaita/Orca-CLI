import axios from 'axios';
import { ORCA_API_BASE_URL, NEXT_PUBLIC_PREFIX_API } from '@/config/env';

export const apiClient = axios.create({
    baseURL: `${ORCA_API_BASE_URL}/${NEXT_PUBLIC_PREFIX_API}`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const baseURL = config.baseURL ?? '';
        const url = config.url ?? '';
        const fullUrl = url.startsWith('http') ? url : `${String(baseURL).replace(/\/+$/, '')}/${String(url).replace(/^\/+/, '')}`;
        const method = (config.method ?? 'GET').toUpperCase();
        // eslint-disable-next-line no-console
        console.log('[apiClient]', method, fullUrl);
        return config;
    },
    (error) => {
        // eslint-disable-next-line no-console
        console.log('[apiClient] request error', error);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        if (response.data && response.data.data !== undefined) {
            return response.data.data;
        }
        return response.data;
    },
    (error) => {
        if (error.response?.data) {
            // eslint-disable-next-line no-console
            console.log('[apiClient] response error', error.response.status, error.response.data);
            return Promise.reject(error.response.data);
        }
        // eslint-disable-next-line no-console
        console.log('[apiClient] response error', error);
        return Promise.reject(error);
    }
);
