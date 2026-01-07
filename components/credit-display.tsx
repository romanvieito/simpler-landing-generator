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
            {credits}
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
