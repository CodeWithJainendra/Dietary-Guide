// utils/navigation.ts
// Navigation utilities to prevent route errors

import { router } from 'expo-router';

// Define valid routes to prevent typos
export const ROUTES = {
  // Auth routes
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  ONBOARDING: '/onboarding',
  
  // Main app routes
  TABS: '/(tabs)',
  HOME: '/(tabs)',
  CHAT: '/(tabs)/chat',
  STATS: '/(tabs)/stats',
  PROFILE: '/(tabs)/profile',
  
  // Other routes
  AUTH_TEST: '/auth-test',
  DASHBOARD: '/dashboard',
} as const;

// Type for valid routes
export type ValidRoute = typeof ROUTES[keyof typeof ROUTES];

// Safe navigation functions with error handling
export const safeNavigate = {
  replace: (route: ValidRoute) => {
    try {
      console.log(`Navigating to: ${route}`);
      router.replace(route);
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
      // Fallback navigation
      if (route !== ROUTES.SIGNIN) {
        router.replace(ROUTES.SIGNIN);
      }
    }
  },

  push: (route: ValidRoute) => {
    try {
      console.log(`Pushing to: ${route}`);
      router.push(route);
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
    }
  },

  back: () => {
    try {
      router.back();
    } catch (error) {
      console.error('Navigation back error:', error);
      // Fallback to home
      router.replace(ROUTES.TABS);
    }
  }
};

// Navigation helpers for common flows
export const navigationHelpers = {
  // Go to main app (tabs)
  goToMainApp: () => safeNavigate.replace(ROUTES.TABS),
  
  // Go to signin
  goToSignin: () => safeNavigate.replace(ROUTES.SIGNIN),
  
  // Go to onboarding
  goToOnboarding: () => safeNavigate.replace(ROUTES.ONBOARDING),
  
  // Handle authentication flow
  handleAuthFlow: (isSignedIn: boolean, isOnboarded: boolean, hasProfile: boolean) => {
    console.log('Navigation: handleAuthFlow called with:', { isSignedIn, isOnboarded, hasProfile });

    if (!isSignedIn) {
      console.log('Navigation: User not signed in, going to signin');
      safeNavigate.replace(ROUTES.SIGNIN);
    } else if (!isOnboarded || !hasProfile) {
      console.log('Navigation: User not onboarded, going to onboarding');
      safeNavigate.replace(ROUTES.ONBOARDING);
    } else {
      console.log('Navigation: User fully authenticated, going to main app');
      safeNavigate.replace(ROUTES.TABS);
    }
  }
};

// Validate route exists
export const isValidRoute = (route: string): route is ValidRoute => {
  return Object.values(ROUTES).includes(route as ValidRoute);
};

// Get current route info
export const getCurrentRouteInfo = () => {
  // This would need to be implemented based on your routing setup
  // For now, return basic info
  return {
    isTabsRoute: window.location?.pathname?.includes('(tabs)') || false,
    isAuthRoute: window.location?.pathname?.includes('signin') || 
                 window.location?.pathname?.includes('signup') || 
                 window.location?.pathname?.includes('onboarding') || false,
  };
};
