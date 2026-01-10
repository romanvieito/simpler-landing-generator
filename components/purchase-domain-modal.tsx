'use client';

import { useState } from 'react';

interface PurchaseDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string;
  onDomainPurchased?: (domain: string) => void;
}

type DomainCheckResult = {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
} | null;

export function PurchaseDomainModal({ isOpen, onClose, siteId, onDomainPurchased }: PurchaseDomainModalProps) {
  const [domain, setDomain] = useState('');
  const [checking, setChecking] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [checkResult, setCheckResult] = useState<DomainCheckResult>(null);
  const [error, setError] = useState('');

  const handleCheckAvailability = async () => {
    if (!domain.trim()) return;

    setChecking(true);
    setError('');
    setCheckResult(null);

    try {
      const res = await fetch('/api/domains/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim().toLowerCase() }),
      });

      if (!res.ok) {
        throw new Error('Failed to check domain availability');
      }

      const result = await res.json();
      setCheckResult(result);
    } catch (error) {
      console.error('Check availability error:', error);
      setError('Failed to check domain availability. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handlePurchase = async () => {
    if (!checkResult?.available || !checkResult?.price || !domain.trim()) return;

    setCreatingCheckout(true);
    setError('');

    try {
      const res = await fetch('/api/domains/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain.trim().toLowerCase(),
          siteId,
          price: checkResult.price,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const result = await res.json();

      // Redirect to Stripe checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Checkout creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create checkout. Please try again.');
      setCreatingCheckout(false);
    }
  };

  const handleClose = () => {
    setDomain('');
    setCheckResult(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Buy Custom Domain</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
              Domain Name
            </label>
            <div className="flex gap-2">
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="mynewcandystore.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCheckAvailability()}
              />
              <button
                onClick={handleCheckAvailability}
                disabled={!domain.trim() || checking}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? '...' : 'Check'}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          {checkResult && (
            <div className={`p-3 rounded ${checkResult.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{checkResult.domain}</span>
                  <span className={`ml-2 text-sm ${checkResult.available ? 'text-green-600' : 'text-red-600'}`}>
                    {checkResult.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
                {checkResult.available && checkResult.price && (
                  <div className="text-right">
                    <div className="font-semibold">${(checkResult.price / 100).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">one-time payment</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {checkResult?.available && checkResult?.price && (
            <div className="text-center">
              <button
                onClick={handlePurchase}
                disabled={creatingCheckout}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingCheckout ? 'Creating Checkout...' : `Purchase Domain - $${(checkResult.price / 100).toFixed(2)}`}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Secure payment powered by Stripe
              </p>
            </div>
          )}
        </div>

        <button onClick={handleClose} className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}