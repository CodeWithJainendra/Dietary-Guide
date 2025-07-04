// lib/clerk-supabase-integration.ts
// Integration between Clerk authentication and Supabase database

import type { UserResource } from '@clerk/types';
import { supabase, saveUserProfile, getUserProfileFromSupabase } from './supabase';
import { UserProfile } from '@/types';

/**
 * Create or update user profile in Supabase after Clerk authentication
 */
export async function syncClerkUserToSupabase(
  clerkUser: UserResource,
  onboardingData?: Partial<UserProfile>
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    console.log('Syncing Clerk user to Supabase:', clerkUser.id);

    // Check if user profile already exists in Supabase
    const existingProfile = await getUserProfileFromSupabase(clerkUser.id);
    
    if (existingProfile.success && existingProfile.profile) {
      console.log('User profile already exists in Supabase');
      return {
        success: true,
        profile: existingProfile.profile
      };
    }

    // Create new profile from Clerk user data and onboarding data
    const newProfile: UserProfile = {
      // Don't set id - let Supabase auto-generate it
      userId: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      // Use name from onboarding data since Clerk doesn't store firstName/lastName in this config
      name: onboardingData?.name || clerkUser.fullName || 'User',
      photoUrl: clerkUser.imageUrl || undefined,

      // Use onboarding data if provided, otherwise use defaults
      height: onboardingData?.height || 170,
      weight: onboardingData?.weight || 70,
      age: onboardingData?.age || 25,
      gender: onboardingData?.gender || 'other',
      goal: onboardingData?.goal || 'healthy_lifestyle',
      exerciseDuration: onboardingData?.exerciseDuration || 30,
      dietaryRestrictions: onboardingData?.dietaryRestrictions || [],
      dietaryPreferences: onboardingData?.dietaryPreferences || [],
      diseases: onboardingData?.diseases || [],
      isSmoker: onboardingData?.isSmoker || false,
    };

    console.log('Creating new profile in Supabase:', newProfile);

    // Save to Supabase
    const result = await saveUserProfile(newProfile);
    
    if (result.success) {
      console.log('Successfully synced user to Supabase');
      return {
        success: true,
        profile: newProfile
      };
    } else {
      console.error('Failed to save profile to Supabase:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('Error syncing Clerk user to Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error syncing user'
    };
  }
}

/**
 * Handle user signup completion - called after successful Clerk signup and verification
 */
export async function handleSignupComplete(
  clerkUser: UserResource,
  onboardingData: Partial<UserProfile>
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  console.log('Handling signup completion for user:', clerkUser.id);
  
  // Sync user data to Supabase
  const syncResult = await syncClerkUserToSupabase(clerkUser, onboardingData);
  
  if (syncResult.success) {
    console.log('Signup completion successful');
    
    // You can add additional post-signup logic here, such as:
    // - Sending welcome emails
    // - Creating default user preferences
    // - Initializing user-specific data
    
    return syncResult;
  } else {
    console.error('Signup completion failed:', syncResult.error);
    return syncResult;
  }
}

/**
 * Get user profile from Supabase using Clerk user ID
 */
export async function getClerkUserProfile(
  clerkUserId: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  return await getUserProfileFromSupabase(clerkUserId);
}

/**
 * Update user profile in Supabase
 */
export async function updateClerkUserProfile(
  clerkUserId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('userId', clerkUserId);
      
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating profile'
    };
  }
}

/**
 * Delete user profile from Supabase when user deletes their Clerk account
 */
export async function handleUserDeletion(clerkUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Deleting user profile from Supabase:', clerkUserId);
    
    // Delete from profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('userId', clerkUserId);
      
    if (profileError) {
      throw profileError;
    }
    
    // Delete from chat_history table
    const { error: chatError } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', clerkUserId);
      
    if (chatError) {
      console.warn('Error deleting chat history:', chatError);
      // Don't fail the entire operation if chat deletion fails
    }
    
    console.log('Successfully deleted user data from Supabase');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting user data'
    };
  }
}

/**
 * Initialize user data after first login
 */
export async function initializeUserData(clerkUser: UserResource): Promise<void> {
  try {
    // Check if user exists in Supabase
    const existingProfile = await getUserProfileFromSupabase(clerkUser.id);
    
    if (!existingProfile.success || !existingProfile.profile) {
      // User doesn't exist in Supabase, create basic profile
      await syncClerkUserToSupabase(clerkUser);
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
  }
}
