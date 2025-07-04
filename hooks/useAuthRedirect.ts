// hooks/useAuthRedirect.ts
// Custom hook for handling authentication redirects

import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  redirectTo?: string;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
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
      console.log('useAuthRedirect: Redirecting to signin - not authenticated');
      router.replace(redirectTo);
      return;
    }

    // Check onboarding requirement
    if (requireOnboarding && isSignedIn && (!isOnboarded || !profile)) {
      console.log('useAuthRedirect: Redirecting to onboarding - not onboarded');
      router.replace('/onboarding');
      return;
    }

    // If user is authenticated and onboarded but on auth pages, redirect to main app
    if (isSignedIn && isOnboarded && profile && redirectTo === '/signin') {
      console.log('useAuthRedirect: Redirecting to main app - already authenticated');
      router.replace('/(tabs)');
      return;
    }
  }, [isSignedIn, isLoaded, isOnboarded, profile, requireAuth, requireOnboarding, redirectTo]);

  return {
    isAuthenticated: isSignedIn && isLoaded,
    isFullySetup: isSignedIn && isOnboarded && profile,
    isLoading: !isLoaded,
    needsOnboarding: isSignedIn && (!isOnboarded || !profile)
  };
}

// Specific hooks for common use cases
export function useRequireAuth() {
  return useAuthRedirect({ requireAuth: true, requireOnboarding: false });
}

export function useRequireOnboarding() {
  return useAuthRedirect({ requireAuth: true, requireOnboarding: true });
}

export function useRedirectIfAuthenticated() {
  return useAuthRedirect({ requireAuth: false, requireOnboarding: false, redirectTo: '/(tabs)' });
}
