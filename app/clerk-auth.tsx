// app/clerk-auth.tsx
// Clerk authentication screen - now redirects to onboarding

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ClerkAuthScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new onboarding experience
    router.replace('/onboarding');
  }, []);

  return null; // This component just redirects
}
