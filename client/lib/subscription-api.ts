import { apiClient } from './api-client';
import { PaymentTransaction, PaymentStats } from '@/interface/types';

export interface InitiatePaymentRequest {
    plan: 'pro' | 'team';
    duration: '1M' | '12M';
}

export interface PaymentCheckoutData {
    checkoutURL: string;
    formFields: Record<string, any>;
    orderInvoiceNumber: string;
    amount: number;
    description: string;
}

export async function initiatePayment(data: InitiatePaymentRequest): Promise<PaymentCheckoutData> {
    const response = await apiClient.post('/subscription/sepay/initiate-payment', data) as any;
    return response.data;
}

export async function getPaymentHistory(): Promise<{ transactions: PaymentTransaction[] }> {
    return apiClient.get('/subscription/sepay/transactions');
}

export async function getPaymentStats(): Promise<PaymentStats> {
    return apiClient.get('/subscription/sepay/stats');
}
