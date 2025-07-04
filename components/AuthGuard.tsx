// components/AuthGuard.tsx
// Authentication guard component to protect routes and redirect unauthenticated users

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/contexts/ThemeContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);

  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Only proceed if Clerk is loaded and we haven't already navigated
    if (!isLoaded || hasNavigated) return;

    const currentPath = segments.join('/');
    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthGroup = segments[0] === 'auth' ||
                       currentPath.includes('signin') ||
                       currentPath.includes('signup') ||
                       currentPath.includes('onboarding') ||
                       currentPath.includes('clerk-auth') ||
                       currentPath === 'index'; // Include root index

    console.log('AuthGuard - Current path:', currentPath);
    console.log('AuthGuard - isSignedIn:', isSignedIn);
    console.log('AuthGuard - isOnboarded:', isOnboarded);
    console.log('AuthGuard - hasProfile:', !!profile);
    console.log('AuthGuard - inTabsGroup:', inTabsGroup);
    console.log('AuthGuard - inAuthGroup:', inAuthGroup);

    // Add a small delay to prevent immediate redirects
    const timer = setTimeout(() => {
      if (!isSignedIn) {
        // User is not signed in
        if (!inAuthGroup) {
          console.log('AuthGuard - Redirecting to signin (not authenticated)');
          setHasNavigated(true);
          router.replace('/signin');
        }
      } else {
        // User is signed in
        if (!isOnboarded || !profile) {
          // User is signed in but not onboarded
          if (inTabsGroup || currentPath === '') {
            console.log('AuthGuard - Redirecting to onboarding (not onboarded)');
            setHasNavigated(true);
            router.replace('/onboarding');
          }
        } else {
          // User is signed in and onboarded
          if (inAuthGroup && !currentPath.includes('onboarding') && currentPath !== 'index') {
            console.log('AuthGuard - Redirecting to main app (already authenticated)');
            setHasNavigated(true);
            router.replace('/(tabs)');
          }
        }
      }
    }, 100); // Small delay to prevent race conditions

    return () => clearTimeout(timer);
  }, [isSignedIn, isLoaded, segments, isOnboarded, profile, hasNavigated]);

  // Reset navigation flag when route changes
  useEffect(() => {
    if (hasNavigated) {
      const timer = setTimeout(() => setHasNavigated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [segments]);

  // Show loading while Clerk is initializing or during navigation
  if (!isLoaded) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          color: colors.text,
          marginTop: 16,
          fontSize: 16
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

// Hook to check authentication status
export function useAuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);

  return {
    isAuthenticated: isSignedIn && isLoaded,
    isFullySetup: isSignedIn && isOnboarded && profile,
    isLoading: !isLoaded,
    needsOnboarding: isSignedIn && (!isOnboarded || !profile)
  };
}

// Higher-order component to protect specific screens
export function withAuthGuard<T extends object>(Component: React.ComponentType<T>) {
  return function AuthGuardedComponent(props: T) {
    const { isAuthenticated, isLoading } = useAuthGuard();
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace('/signin');
      }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: colors.background 
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect in useEffect
    }

    return <Component {...props} />;
  };
}
