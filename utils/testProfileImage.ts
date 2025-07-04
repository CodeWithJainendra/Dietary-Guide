import { supabase } from '@/lib/supabase';

/**
 * Test function to verify profile image functionality
 */
export const testProfileImageUpdate = async (userId: string, imageUrl: string) => {
  try {
    console.log('Testing profile image update...');
    console.log('User ID:', userId);
    console.log('Image URL:', imageUrl);

    // Test updating the profile image in the database
    const { data, error } = await supabase
      .from('profiles')
      .update({ photoUrl: imageUrl })
      .eq('userId', userId)
      .select();

    if (error) {
      console.error('Error updating profile image:', error);
      return { success: false, error: error.message };
    }

    console.log('Profile image updated successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Test function to verify profile image retrieval
 */
export const testProfileImageRetrieval = async (userId: string) => {
  try {
    console.log('Testing profile image retrieval...');
    console.log('User ID:', userId);

    // Test retrieving the profile image from the database
    const { data, error } = await supabase
      .from('profiles')
      .select('photoUrl')
      .eq('userId', userId)
      .single();

    if (error) {
      console.error('Error retrieving profile image:', error);
      return { success: false, error: error.message };
    }

    console.log('Profile image retrieved successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Sample test URLs for testing
 */
export const getSampleTestImages = () => [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop'
];

/**
 * Run complete profile image test suite
 */
export const runProfileImageTests = async (userId: string) => {
  console.log('🧪 Starting profile image test suite...');
  
  const testImages = getSampleTestImages();
  const results = [];

  for (let i = 0; i < testImages.length; i++) {
    const imageUrl = testImages[i];
    console.log(`\n📸 Test ${i + 1}: Testing with image ${i + 1}`);
    
    // Test update
    const updateResult = await testProfileImageUpdate(userId, imageUrl);
    if (!updateResult.success) {
      console.error(`❌ Update test ${i + 1} failed:`, updateResult.error);
      results.push({ test: `update_${i + 1}`, success: false, error: updateResult.error });
      continue;
    }
    
    // Test retrieval
    const retrievalResult = await testProfileImageRetrieval(userId);
    if (!retrievalResult.success) {
      console.error(`❌ Retrieval test ${i + 1} failed:`, retrievalResult.error);
      results.push({ test: `retrieval_${i + 1}`, success: false, error: retrievalResult.error });
      continue;
    }
    
    // Verify the URL matches
    if (retrievalResult.data?.photoUrl === imageUrl) {
      console.log(`✅ Test ${i + 1} passed: Image URL matches`);
      results.push({ test: `complete_${i + 1}`, success: true });
    } else {
      console.error(`❌ Test ${i + 1} failed: Image URL mismatch`);
      console.error('Expected:', imageUrl);
      console.error('Got:', retrievalResult.data?.photoUrl);
      results.push({ test: `complete_${i + 1}`, success: false, error: 'URL mismatch' });
    }
  }

  // Test removing profile image
  console.log('\n🗑️ Testing profile image removal...');
  const removeResult = await testProfileImageUpdate(userId, null as any);
  if (removeResult.success) {
    const verifyRemovalResult = await testProfileImageRetrieval(userId);
    if (verifyRemovalResult.success && !verifyRemovalResult.data?.photoUrl) {
      console.log('✅ Profile image removal test passed');
      results.push({ test: 'removal', success: true });
    } else {
      console.error('❌ Profile image removal verification failed');
      results.push({ test: 'removal', success: false, error: 'Removal verification failed' });
    }
  } else {
    console.error('❌ Profile image removal test failed:', removeResult.error);
    results.push({ test: 'removal', success: false, error: removeResult.error });
  }

  // Summary
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n📊 Test Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Profile image functionality is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }

  return {
    success: passedTests === totalTests,
    results,
    summary: `${passedTests}/${totalTests} tests passed`
  };
};
