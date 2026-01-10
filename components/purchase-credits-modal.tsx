// components/purchase-credits-modal.tsx
'use client';

import { useState } from 'react';
import { CREDIT_PACKAGES, type CreditPackage } from '@/lib/stripe';

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const [loading, setLoading] = useState<CreditPackage | 'custom' | null>(null);
  const [customQuantity, setCustomQuantity] = useState<string>('10');

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

  const handleCustomPurchase = async () => {
    const quantity = parseInt(customQuantity);
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setLoading('custom');
    try {
      const res = await fetch('/api/credits/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
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
          Pay-as-you-go pricing. Redirects to Stripe.
        </p>

        <div className="space-y-4">
          {/* Quick 5 Credits Purchase */}
          <button
            onClick={() => handlePurchase('small')}
            disabled={loading === 'small'}
            className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50"
          >
            {loading === 'small' ? '...' : 'Buy 5 Credits - $5'}
          </button>

          {/* Custom Quantity */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Quantity
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter credits"
              />
              <button
                onClick={handleCustomPurchase}
                disabled={loading === 'custom'}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading === 'custom' ? '...' : `Buy $${parseInt(customQuantity) || 0}`}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              $1 per credit
            </p>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}
