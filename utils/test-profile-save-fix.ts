// utils/test-profile-save-fix.ts
// Test utility to verify profile saving functionality

import { saveUserProfile } from '@/lib/supabase';
import { UserProfile } from '@/types';

/**
 * Test function to verify that profile saving works correctly
 * This simulates the exact data that would be saved during Google OAuth onboarding
 */
export async function testProfileSave() {
  console.log('=== TESTING PROFILE SAVE FUNCTIONALITY ===');
  
  // Simulate the exact profile data that would be created during Google OAuth onboarding
  const testProfileData: UserProfile = {
    userId: 'user_2zOlH3Gc5pTw3Y7OeWsN3da469s', // The actual user ID from the logs
    name: 'Kushagra Awasthi',
    email: 'kushagraa327@gmail.com',
    height: 175,
    weight: 70,
    age: 25,
    gender: 'male',
    goal: 'healthy_lifestyle',
    exerciseDuration: 30,
    isSmoker: false,
    diseases: [],
    dietaryPreferences: ['vegetarian'],
    dietaryRestrictions: [],
    photoUrl: undefined,
  };

  console.log('Test profile data:', testProfileData);

  try {
    console.log('Attempting to save profile to Supabase...');
    const result = await saveUserProfile(testProfileData);
    
    if (result.success) {
      console.log('✅ SUCCESS: Profile saved successfully!');
      console.log('Profile save test passed - the onboarding flow should work correctly');
      return { success: true, message: 'Profile save test passed' };
    } else {
      console.error('❌ FAILED: Profile save failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ ERROR: Exception during profile save test:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test function to verify Supabase connection
 */
export async function testSupabaseConnection() {
  console.log('=== TESTING SUPABASE CONNECTION ===');
  
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Test basic connection by trying to select from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful');
    console.log('Profiles table accessible:', data);
    return { success: true, message: 'Supabase connection working' };
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown connection error' 
    };
  }
}

/**
 * Run all tests
 */
export async function runProfileSaveTests() {
  console.log('\n🧪 RUNNING PROFILE SAVE TESTS...\n');
  
  // Test 1: Supabase connection
  const connectionTest = await testSupabaseConnection();
  console.log('\n--- Connection Test Result ---');
  console.log(connectionTest);
  
  if (!connectionTest.success) {
    console.log('❌ Stopping tests - Supabase connection failed');
    return { success: false, error: 'Supabase connection failed' };
  }
  
  // Test 2: Profile save
  const profileSaveTest = await testProfileSave();
  console.log('\n--- Profile Save Test Result ---');
  console.log(profileSaveTest);
  
  if (profileSaveTest.success) {
    console.log('\n🎉 ALL TESTS PASSED! The Google OAuth onboarding flow should work correctly.');
    return { success: true, message: 'All tests passed' };
  } else {
    console.log('\n❌ PROFILE SAVE TEST FAILED - There may be an issue with the onboarding flow');
    return { success: false, error: profileSaveTest.error };
  }
}
