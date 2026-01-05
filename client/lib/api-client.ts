import axios from 'axios';
import { ORCA_API_BASE_URL } from '@/config/env';

export const apiClient = axios.create({
    baseURL: ORCA_API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) => {
        // If the server follows the standard format { statusCode, data, ... }
        // we return the 'data' field directly.
        if (response.data && response.data.data !== undefined) {
            return response.data.data;
        }
        return response.data;
    },
    (error) => {
        // Transform API errors or simply reject
        if (error.response?.data) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
);
