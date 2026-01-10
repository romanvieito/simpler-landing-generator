// components/credit-display.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface CreditDisplayProps {
  onPurchaseClick?: () => void;
  showCredits?: boolean;
  showButton?: boolean;
}

export function CreditDisplay({ onPurchaseClick, showCredits = true, showButton = true }: CreditDisplayProps) {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits/balance');
      if (res.ok) {
        const data = await res.json();
        setCredits(data.balance);
        
        // Handle pending Google Ads conversion
        // Fire if value is >= 0 (to handle coupons) and we have a flag
        if (data.pendingConversionValue !== undefined && data.pendingConversionValue !== null && data.pendingConversionValue >= 0 && data.hasPendingConversion) {
          // @ts-ignore
          if (typeof window !== 'undefined' && window.gtag) {
            // @ts-ignore
            window.gtag('event', 'conversion', {
              'send_to': 'AW-16510475658/HKhPCK_az-AbEIq758A9',
              'value': data.pendingConversionValue,
              'currency': 'USD'
            });
            
            // Clear the flag so it doesn't fire again
            fetch('/api/credits/clear-conversion', { method: 'POST' });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {showCredits && (
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-600">Credits:</span>
          <span className={`font-semibold ${credits === 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(credits || 0).toFixed(2)}
          </span>
        </div>
      )}
      {showButton && onPurchaseClick && (
        <button
          onClick={onPurchaseClick}
          className={`btn ml-5text-xs px-3 py-1 ${credits === 0 ? 'btn-primary' : 'btn-outline'}`}
        >
          {credits === 0 ? 'Buy Credits' : 'Add Credits'}
        </button>
      )}
    </div>
  );
}
