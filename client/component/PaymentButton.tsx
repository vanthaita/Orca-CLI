'use client';

import { useState, useRef } from 'react';
import { initiatePayment } from '@/lib/subscription-api';

interface PaymentButtonProps {
    plan: 'pro' | 'team';
    duration: '1M' | '12M';
    amount: number;
    onError?: (error: string) => void;
}

export default function PaymentButton({ plan, duration, amount, onError }: PaymentButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // Call backend to get checkout URL and form fields
            const checkoutData = await initiatePayment({ plan, duration });

            // Create form dynamically
            const form = formRef.current;
            if (!form) return;

            // Set form action to checkout URL
            form.action = checkoutData.checkoutURL;

            // Clear existing inputs (if any)
            form.innerHTML = '';

            // Add all form fields as hidden inputs
            Object.entries(checkoutData.formFields).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = String(value);
                form.appendChild(input);
            });

            // Submit form to redirect to SePay
            form.submit();
        } catch (error: any) {
            setIsLoading(false);
            const errorMessage = error?.message || 'Failed to initiate payment. Please try again.';
            onError?.(errorMessage);
            console.error('Payment initiation error:', error);
        }
    };

    return (
        <div>
            <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Processing...</span>
                    </>
                ) : (
                    `Pay ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)} Now`
                )}
            </button>

            {/* Hidden form for SePay redirect */}
            <form ref={formRef} method="POST" style={{ display: 'none' }} />
        </div>
    );
}
