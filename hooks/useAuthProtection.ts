// hooks/useAuthProtection.ts
// Simple authentication protection hook

import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';

interface UseAuthProtectionOptions {
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  redirectTo?: string;
}

export function useAuthProtection(options: UseAuthProtectionOptions = {}) {
  const { 
    requireAuth = true, 
    requireOnboarding = true, 
    redirectTo = '/signin' 
  } = options;
  
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);

  useEffect(() => {
    if (!isLoaded) return;

    // Check authentication requirement
    if (requireAuth && !isSignedIn) {
      console.log('useAuthProtection: Redirecting to signin - not authenticated');
      router.replace(redirectTo);
      return;
    }

    // Check onboarding requirement
    if (requireOnboarding && isSignedIn && (!isOnboarded || !profile)) {
      console.log('useAuthProtection: Redirecting to onboarding - not onboarded');
      router.replace('/onboarding');
      return;
    }
  }, [isSignedIn, isLoaded, isOnboarded, profile, requireAuth, requireOnboarding, redirectTo]);

  return {
    isAuthenticated: isSignedIn && isLoaded,
    isFullySetup: isSignedIn && isOnboarded && profile,
    isLoading: !isLoaded,
    needsOnboarding: isSignedIn && (!isOnboarded || !profile),
    shouldShowContent: isLoaded && (!requireAuth || isSignedIn) && (!requireOnboarding || (isOnboarded && profile))
  };
}

// Specific hooks for common use cases
export function useRequireAuth() {
  return useAuthProtection({ requireAuth: true, requireOnboarding: false });
}

export function useRequireFullAuth() {
  return useAuthProtection({ requireAuth: true, requireOnboarding: true });
}

export function useRedirectIfAuthenticated() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && isOnboarded && profile) {
      console.log('useRedirectIfAuthenticated: Redirecting to main app');
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, isOnboarded, profile]);

  return {
    isAuthenticated: isSignedIn && isLoaded,
    isFullySetup: isSignedIn && isOnboarded && profile,
    isLoading: !isLoaded
  };
}
