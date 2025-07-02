// utils/test-supabase.ts
// Test utility to check Supabase table structure and test insertions

import { supabase } from '@/lib/supabase';

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('Supabase test error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function testProfileInsertion() {
  try {
    console.log('Testing profile insertion...');
    
    const testProfile = {
      userId: `test-user-${Date.now()}`,
      name: 'Test User',
      email: 'test@example.com',
      height: 170,
      weight: 70,
      age: 25,
      gender: 'other',
      goal: 'healthy_lifestyle',
      exerciseDuration: 30,
      dietaryRestrictions: [],
      dietaryPreferences: [],
      diseases: [],
      isSmoker: false,
    };
    
    console.log('Inserting test profile:', testProfile);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([testProfile])
      .select();
      
    if (error) {
      console.error('Profile insertion error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Profile insertion successful:', data);
    
    // Clean up - delete the test profile
    await supabase
      .from('profiles')
      .delete()
      .eq('userId', testProfile.userId);
      
    return { success: true, data };
  } catch (error) {
    console.error('Profile insertion test error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getTableSchema() {
  try {
    console.log('Getting table schema...');
    
    // This won't work in the client, but we can try to insert a minimal record to see what's required
    const { error } = await supabase
      .from('profiles')
      .insert([{}]);
      
    if (error) {
      console.log('Schema validation error (expected):', error);
      return { success: true, schemaError: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Schema test error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
