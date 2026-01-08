import { apiClient } from './api-client';
import { PaymentTransaction, PaymentStats } from '@/interface/types';

export async function getPaymentHistory(): Promise<{ transactions: PaymentTransaction[] }> {
    return apiClient.get('/subscription/sepay/transactions');
}

export async function getPaymentStats(): Promise<PaymentStats> {
    return apiClient.get('/subscription/sepay/stats');
}
