// components/purchase-credits-modal.tsx
'use client';

import { useState } from 'react';
import { CREDIT_PACKAGES, type CreditPackage } from '@/lib/stripe';

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const [loading, setLoading] = useState<CreditPackage | null>(null);

  const handlePurchase = async (packageType: CreditPackage) => {
    // EL - Add Credits Click Intention Purchase
    // @ts-ignore
    if (typeof window !== 'undefined' && window.gtag) {
      // @ts-ignore
      window.gtag('event', 'conversion', {
        'send_to': 'AW-16510475658/5aPyCKzaz-AbEIq758A9',
        'value': 1.0,
        'currency': 'USD'
      });
    }

    setLoading(packageType);
    try {
      const res = await fetch('/api/credits/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url; // Redirect to Stripe Checkout
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start purchase. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-900">Add Credits</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-sm">
          Credits are used to cover API costs for AI generation. 
          Choose a package to continue.
        </p>

        <div className="space-y-3">
          {(Object.entries(CREDIT_PACKAGES) as [CreditPackage, typeof CREDIT_PACKAGES.small][]).map(([key, pkg]) => (
            <button
              key={key}
              onClick={() => handlePurchase(key)}
              disabled={!!loading}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                <p className="text-xs text-gray-500">{pkg.description}</p>
              </div>
              <div className="text-right ml-4 flex flex-col items-end">
                <span className="text-lg font-bold text-blue-600 group-hover:text-blue-700">
                  ${(pkg.price / 100).toFixed(2)}
                </span>
                {loading === key && (
                  <div className="mt-1">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>You will be securely redirected to Stripe to complete your purchase. Credits are added instantly.</span>
        </div>

        <button 
          onClick={onClose} 
          className="w-full mt-4 py-2 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
