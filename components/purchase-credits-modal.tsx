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
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div
        className="rounded-lg p-6 max-w-md w-full mx-4"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-xl font-semibold"
            style={{ color: '#111827' }}
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
          style={{ color: '#6b7280', fontSize: '0.875rem' }}
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
              color: '#6b7280',
              transition: 'color 0.15s ease',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
