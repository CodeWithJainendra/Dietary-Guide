// hooks/useClerkSupabase.ts
// Custom hook for managing Clerk-Supabase integration

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useUserStore } from '@/store/userStore';
import { 
  syncClerkUserToSupabase, 
  getClerkUserProfile, 
  updateClerkUserProfile,
  initializeUserData 
} from '@/lib/clerk-supabase-integration';
import { UserProfile } from '@/types';

export function useClerkSupabase() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { profile, setProfile, isOnboarded, setOnboarded } = useUserStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user data when user signs in
  useEffect(() => {
    const initializeUser = async () => {
      if (!userLoaded || !authLoaded || !isSignedIn || !user || isInitializing) {
        return;
      }

      // Check if we already have the profile in the store
      if (profile && profile.userId === user.id) {
        console.log('User profile already loaded in store');
        return;
      }

      try {
        setIsInitializing(true);
        setError(null);

        console.log('Initializing user data for:', user.id);

        // Try to get existing profile from Supabase
        const existingProfile = await getClerkUserProfile(user.id);

        if (existingProfile.success && existingProfile.profile) {
          // User exists in Supabase, load their profile
          console.log('Loading existing user profile from Supabase');
          setProfile(existingProfile.profile);
          setOnboarded(true);
        } else {
          // User doesn't exist in Supabase yet
          console.log('User profile not found in Supabase - will be created after onboarding');
          // Don't create a profile here - let the signup process handle it
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize user');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeUser();
  }, [userLoaded, authLoaded, isSignedIn, user?.id]); // Simplified dependencies to prevent loops

  // Sync user profile to Supabase
  const syncProfile = async (onboardingData?: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user available');
    }

    try {
      setError(null);
      const result = await syncClerkUserToSupabase(user, onboardingData);
      
      if (result.success && result.profile) {
        setProfile(result.profile);
        setOnboarded(true);
        return result.profile;
      } else {
        throw new Error(result.error || 'Failed to sync profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync profile';
      setError(errorMessage);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error('No user or profile available');
    }

    try {
      setError(null);
      const result = await updateClerkUserProfile(user.id, updates);
      
      if (result.success) {
        // Update local profile
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        return updatedProfile;
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      throw error;
    }
  };

  // Get fresh profile from Supabase
  const refreshProfile = async () => {
    if (!user) {
      throw new Error('No user available');
    }

    try {
      setError(null);
      const result = await getClerkUserProfile(user.id);
      
      if (result.success && result.profile) {
        setProfile(result.profile);
        return result.profile;
      } else {
        throw new Error(result.error || 'Failed to refresh profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh profile';
      setError(errorMessage);
      throw error;
    }
  };

  return {
    // State
    user,
    profile,
    isOnboarded,
    isInitializing,
    error,
    isReady: userLoaded && authLoaded && !isInitializing,
    
    // Actions
    syncProfile,
    updateProfile,
    refreshProfile,
    
    // Utilities
    clearError: () => setError(null),
  };
}

export default useClerkSupabase;
