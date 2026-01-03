// components/credit-display.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface CreditDisplayProps {
  onPurchaseClick?: () => void;
}

export function CreditDisplay({ onPurchaseClick }: CreditDisplayProps) {
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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm">
        <span className="text-gray-600">Credits:</span>
        <span className={`font-semibold ${credits === 0 ? 'text-red-600' : 'text-green-600'}`}>
          {credits}
        </span>
      </div>
      {credits === 0 && onPurchaseClick && (
        <button
          onClick={onPurchaseClick}
          className="btn btn-primary text-xs px-2 py-1"
        >
          Buy Credits
        </button>
      )}
    </div>
  );
}
