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

  console.log('CreditDisplay render:', {
    user: !!user,
    userId: user?.id,
    loading,
    credits,
    hasOnPurchaseClick: !!onPurchaseClick
  });

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      console.log('Fetching credits...');
      const res = await fetch('/api/credits/balance');
      console.log('Credits API response:', res.status, res.ok);
      if (res.ok) {
        const data = await res.json();
        console.log('Credits data:', data);
        setCredits(data.balance);
      } else {
        console.error('Credits API failed:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  // TEMP: Always render for debugging
  // if (!user || loading) {
  //   return null;
  // }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 text-sm">
        <span className="text-gray-600">Credits:</span>
        <span className={`font-semibold ${credits === 0 ? 'text-red-600' : 'text-green-600'}`}>
          {credits}
        </span>
      </div>
      {onPurchaseClick && (
        <button
          onClick={onPurchaseClick}
          className={`btn text-xs px-3 py-1 ${credits === 0 ? 'btn-primary' : 'btn-outline'}`}
        >
          {credits === 0 ? 'Buy Credits' : 'Add Credits'}
        </button>
      )}
    </div>
  );
}
