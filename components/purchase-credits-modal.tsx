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
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="rounded-lg p-6 max-w-md w-full mx-4"
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--color-gray-900)' }}
          >
            Purchase Credits
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <p
          className="mb-6"
          style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}
        >
          Each landing page generation costs 2 credits (1 for plan + 1 for HTML).
        </p>

        <div className="space-y-4">
          {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => (
            <div
              key={key}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${(pkg.price / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${(pkg.price / 100 / pkg.credits).toFixed(2)}/credit
                  </div>
                </div>
              </div>
              <button
                onClick={() => handlePurchase(key as CreditPackage)}
                disabled={loading === key}
                className="w-full btn btn-primary"
              >
                {loading === key ? 'Processing...' : `Buy ${pkg.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-sm"
            style={{
              color: 'var(--color-gray-500)',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-gray-700)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-gray-500)';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
