'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { initMixpanel, identifyUser } from '@/lib/mixpanel';

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Initialize Mixpanel
    initMixpanel();
  }, []);

  useEffect(() => {
    // Identify user when Clerk user data is loaded
    // Add a small delay to ensure Mixpanel is fully initialized
    if (isLoaded && user) {
      const timer = setTimeout(() => {
        identifyUser(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          created_at: user.createdAt?.toISOString(),
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}