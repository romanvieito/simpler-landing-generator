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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Buy Credits</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Each landing page costs 1 credit. You'll be redirected to Stripe to complete payment.
        </p>

        <div className="space-y-3">
          {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => (
            <button
              key={key}
              onClick={() => handlePurchase(key as CreditPackage)}
              disabled={loading === key}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{pkg.name}</div>
                  <div className="text-sm text-gray-500">${(pkg.price / 100 / pkg.credits).toFixed(2)} each</div>
                </div>
                <div className="text-lg font-semibold">
                  {loading === key ? '...' : `$${(pkg.price / 100).toFixed(0)}`}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}
