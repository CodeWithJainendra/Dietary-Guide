// utils/test-profile-save.ts
// Test utility to verify profile saving functionality after OTP verification

import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

/**
 * Test function to verify that profile data can be saved to Supabase
 * This simulates what happens after successful OTP verification
 */
export async function testProfileSave(): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  try {
    console.log('Testing profile save functionality...');

    // Test profile data (similar to what comes from onboarding)
    const testProfile: Partial<UserProfile> = {
      userId: 'test_user_' + Date.now(), // Unique test user ID
      name: 'Test User',
      email: 'test@example.com',
      height: 175,
      weight: 70,
      age: 25,
      gender: 'other' as const,
      goal: 'healthy_lifestyle' as const,
      exerciseDuration: 30,
      isSmoker: false,
      diseases: ['none'],
      dietaryPreferences: ['vegetarian'],
      dietaryRestrictions: []
    };

    console.log('Attempting to save test profile:', testProfile);

    // Use the same upsert logic as the real implementation
    const { id, ...profileData } = testProfile;

    // Ensure all required fields have proper defaults
    const cleanProfileData = {
      ...profileData,
      name: profileData.name || 'User',
      email: profileData.email || '',
      height: profileData.height || 170,
      weight: profileData.weight || 70,
      age: profileData.age || 25,
      gender: profileData.gender || 'other',
      goal: profileData.goal || 'healthy_lifestyle',
      exerciseDuration: profileData.exerciseDuration || 30,
      isSmoker: profileData.isSmoker !== undefined ? profileData.isSmoker : false,
      diseases: profileData.diseases || [],
      dietaryPreferences: profileData.dietaryPreferences || [],
      dietaryRestrictions: profileData.dietaryRestrictions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert([cleanProfileData], { onConflict: 'userId' })
      .select()
      .single();

    if (error) {
      console.error('Error saving test profile:', error);
      return { success: false, error: error.message };
    }

    console.log('Test profile saved successfully:', data);

    // Clean up test data
    await supabase
      .from('profiles')
      .delete()
      .eq('userId', testProfile.userId);

    return { success: true, profile: data };
  } catch (error: any) {
    console.error('Test profile save failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test the complete flow: Clerk user ID → Profile save
 */
export async function testClerkProfileFlow(clerkUserId: string, onboardingData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Testing Clerk profile flow for user:', clerkUserId);
    
    const profileData = {
      userId: clerkUserId,
      name: onboardingData.name || 'User',
      email: onboardingData.email || 'user@example.com',
      height: onboardingData.height || 170,
      weight: onboardingData.weight || 70,
      age: onboardingData.age || 25,
      gender: onboardingData.gender || 'other' as const,
      goal: onboardingData.goal || 'healthy_lifestyle' as const,
      exerciseDuration: onboardingData.exerciseDuration || 30,
      isSmoker: onboardingData.isSmoker || false,
      diseases: onboardingData.diseases || [],
      dietaryPreferences: onboardingData.dietaryPreferences || [],
      dietaryRestrictions: onboardingData.dietaryRestrictions || []
    };

    const { error } = await supabase
      .from('profiles')
      .upsert([profileData], { onConflict: 'userId' });

    if (error) {
      console.error('Error in Clerk profile flow:', error);
      return { success: false, error: error.message };
    }

    console.log('Clerk profile flow completed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Clerk profile flow failed:', error);
    return { success: false, error: error.message };
  }
}
