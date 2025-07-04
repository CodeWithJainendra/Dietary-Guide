import { UserProfile, MealEntry } from '@/types';
import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tozbstequzpevxvxnkev.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvemJzdGVxdXpwZXZ4dnhua2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDc5NTcsImV4cCI6MjA1NjQyMzk1N30.XpmX6KbD3SeQV_04y7Mx1eqHsLaKKVD3oTru-nnEDdo';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// NOTE: Ensure 'userId' is unique or primary key in the Supabase 'profiles' table for true upsert safety.
export async function saveUserProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  try {
    if (!profile.userId) {
      throw new Error('User ID is required to save profile');
    }

    // Create a clean profile object without the id field for insertion
    // Also ensure all required fields have default values
    const { id, ...profileData } = profile;

    // Ensure all required fields are present with proper defaults
    const cleanProfileData = {
      ...profileData,
      name: profileData.name || 'User',
      email: profileData.email || '',
      height: profileData.height || 170,
      weight: profileData.weight || 70,
      age: profileData.age || 25,
      gender: (profileData.gender || 'other').toLowerCase(), // Convert to lowercase
      goal: profileData.goal || 'healthy_lifestyle',
      exerciseDuration: profileData.exerciseDuration || 30,
      isSmoker: profileData.isSmoker !== undefined ? profileData.isSmoker : false,
      diseases: profileData.diseases || [],
      dietaryPreferences: profileData.dietaryPreferences || [],
      dietaryRestrictions: profileData.dietaryRestrictions || [],
      photoUrl: profileData.photoUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Saving profile data to Supabase:', cleanProfileData);

    // Use upsert to ensure only one profile per userId
    const { error } = await supabase
      .from('profiles')
      .upsert([cleanProfileData], { onConflict: 'userId' });
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error upserting profile in Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error upserting profile',
    };
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required to update profile');
    }
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates })
      .eq('userId', userId);
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating profile in Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating profile',
    };
  }
}

export async function getUserProfileFromSupabase(
  userId: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch profile');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('userId', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

    if (error) {
      throw error;
    }

    // If no profile found, return success with no profile (not an error)
    if (!data) {
      console.log('No profile found for userId:', userId);
      return {
        success: true,
        profile: undefined,
      };
    }

    return {
      success: true,
      profile: data as UserProfile,
    };
  } catch (error) {
    console.error('Error getting profile from Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting profile',
    };
  }
}

export async function deleteUserProfile(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required to delete profile');
    }
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('userId', userId);
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting profile from Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting profile',
    };
  }
}

// Type for chat message
export interface ChatHistoryMessage {
  user_id: string;
  message: string;
  sender: string;
  created_at?: string;
}

// Save a chat message to Supabase chat_history table
// userId should be the Clerk user ID (profile.userId), not the database UUID (profile.id)
export async function saveChatMessage({ userId, message, sender, timestamp }: { userId: string, message: string, sender: string, timestamp: number }) {
  try {
    console.log('saveChatMessage called', { userId, message, sender, timestamp });
    if (!userId || !message || !sender) {
      console.error('saveChatMessage: Missing required fields', { userId, message, sender });
      throw new Error('Missing required chat message fields');
    }
    const insertObj = {
      user_id: userId, // This should be profile.userId (Clerk ID), not profile.id (UUID)
      message,
      sender,
      created_at: new Date(timestamp).toISOString(),
    };
    console.log('Inserting chat message:', insertObj);
    const { data, error } = await supabase
      .from('chat_history')
      .insert([insertObj]);
    if (error) {
      console.error('Supabase error in saveChatMessage:', error);
      throw error;
    }
    console.log('Supabase insert result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error saving chat message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error saving chat message' };
  }
}

// Fetch all chat messages for a user from Supabase chat_history table
export async function fetchChatHistory(userId: string) {
  try {
    if (!userId) throw new Error('User ID is required to fetch chat history');
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { success: true, messages: data as ChatHistoryMessage[] };
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error fetching chat history' };
  }
}

// Save a meal entry to Supabase
export async function saveMealEntry(meal: MealEntry) {
  try {
    console.log('Saving meal entry to Supabase:', meal);

    if (!meal.userId) {
      throw new Error('User ID is required to save meal entry');
    }

    // First, save the meal entry
    const mealData = {
      id: meal.id,
      user_id: meal.userId,
      meal_type: meal.mealType,
      meal_name: meal.foods.map(food => food.name).join(', '), // Combine food names
      meal_time: new Date(meal.timestamp).toISOString(),
      total_calories: meal.totalCalories,
      total_protein: meal.totalProtein,
      total_carbs: meal.totalCarbs,
      total_fat: meal.totalFat,
      notes: meal.imageUrl ? `Image: ${meal.imageUrl}` : null,
    };

    const { data: mealEntryData, error: mealError } = await supabase
      .from('meal_entries')
      .insert([mealData])
      .select()
      .single();

    if (mealError) {
      throw mealError;
    }

    console.log('Meal entry saved successfully:', mealEntryData);

    // Then, save individual food items
    const foodItems = meal.foods.map(food => ({
      meal_entry_id: mealEntryData.id,
      food_name: food.name,
      quantity: food.quantity,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    }));

    const { data: foodItemsData, error: foodError } = await supabase
      .from('food_items')
      .insert(foodItems)
      .select();

    if (foodError) {
      console.error('Error saving food items:', foodError);
      // Don't throw here, meal entry is already saved
    } else {
      console.log('Food items saved successfully:', foodItemsData);
    }

    return {
      success: true,
      data: {
        mealEntry: mealEntryData,
        foodItems: foodItemsData
      }
    };
  } catch (error) {
    console.error('Error saving meal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving meal entry'
    };
  }
}

// Fetch meal entries for a user from Supabase
export async function fetchMealEntries(userId: string, date?: string) {
  try {
    console.log('Fetching meal entries from Supabase for user:', userId, 'date:', date);

    if (!userId) {
      throw new Error('User ID is required to fetch meal entries');
    }

    let query = supabase
      .from('meal_entries')
      .select(`
        *,
        food_items (
          id,
          food_name,
          quantity,
          calories,
          protein,
          carbs,
          fat
        )
      `)
      .eq('user_id', userId)
      .order('meal_time', { ascending: false });

    // If date is provided, filter by date
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z').toISOString();
      const endOfDay = new Date(date + 'T23:59:59.999Z').toISOString();
      query = query.gte('meal_time', startOfDay).lte('meal_time', endOfDay);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the data to match our MealEntry type
    const mealEntries: MealEntry[] = data.map((entry: any) => ({
      id: entry.id,
      userId: entry.user_id,
      date: new Date(entry.meal_time).toISOString().split('T')[0],
      mealType: entry.meal_type,
      foods: entry.food_items.map((item: any) => ({
        name: item.food_name,
        quantity: item.quantity,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
      totalCalories: entry.total_calories,
      totalProtein: entry.total_protein,
      totalCarbs: entry.total_carbs,
      totalFat: entry.total_fat,
      timestamp: new Date(entry.meal_time).getTime(),
      imageUrl: entry.notes?.startsWith('Image: ') ? entry.notes.replace('Image: ', '') : undefined,
    }));

    console.log('Fetched meal entries successfully:', mealEntries.length, 'entries');
    return { success: true, data: mealEntries };
  } catch (error) {
    console.error('Error fetching meal entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching meal entries'
    };
  }
}

// Update a meal entry in Supabase
export async function updateMealEntry(mealId: string, updates: Partial<MealEntry>) {
  try {
    console.log('Updating meal entry in Supabase:', mealId, updates);

    if (!mealId) {
      throw new Error('Meal ID is required to update meal entry');
    }

    // Prepare the update data
    const updateData: any = {};

    if (updates.mealType) updateData.meal_type = updates.mealType;
    if (updates.totalCalories !== undefined) updateData.total_calories = updates.totalCalories;
    if (updates.totalProtein !== undefined) updateData.total_protein = updates.totalProtein;
    if (updates.totalCarbs !== undefined) updateData.total_carbs = updates.totalCarbs;
    if (updates.totalFat !== undefined) updateData.total_fat = updates.totalFat;
    if (updates.timestamp) updateData.meal_time = new Date(updates.timestamp).toISOString();
    if (updates.imageUrl !== undefined) {
      updateData.notes = updates.imageUrl ? `Image: ${updates.imageUrl}` : null;
    }
    if (updates.foods) {
      updateData.meal_name = updates.foods.map(food => food.name).join(', ');
    }

    // Update the meal entry
    const { data, error } = await supabase
      .from('meal_entries')
      .update(updateData)
      .eq('id', mealId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Meal entry updated successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error updating meal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating meal entry'
    };
  }
}

// Delete a meal entry from Supabase
export async function deleteMealEntry(mealId: string) {
  try {
    console.log('Deleting meal entry from Supabase:', mealId);

    if (!mealId) {
      throw new Error('Meal ID is required to delete meal entry');
    }

    // Delete food items first (they will be deleted automatically due to CASCADE)
    // But we'll do it explicitly for clarity
    const { error: foodItemsError } = await supabase
      .from('food_items')
      .delete()
      .eq('meal_entry_id', mealId);

    if (foodItemsError) {
      console.warn('Error deleting food items:', foodItemsError);
      // Continue with meal deletion even if food items deletion fails
    }

    // Delete the meal entry
    const { data, error } = await supabase
      .from('meal_entries')
      .delete()
      .eq('id', mealId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Meal entry deleted successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error deleting meal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting meal entry'
    };
  }
}

// Profile Picture Storage Functions

/**
 * Get setup instructions for Supabase storage bucket
 * @returns Setup instructions string
 */
export function getStorageSetupInstructions(): string {
  return `
🔧 Supabase Storage Setup Instructions:

1. Go to your Supabase Dashboard
2. Navigate to Storage section
3. Create a new bucket named 'profile-pic'
4. Set bucket to PUBLIC (important!)
5. Add RLS Policy for authenticated users:

SQL Policy for INSERT:
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pic' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

SQL Policy for SELECT:
CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pic');

SQL Policy for UPDATE:
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-pic' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

SQL Policy for DELETE:
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-pic' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
  `.trim();
}

/**
 * Test Supabase storage connection and bucket access
 * @returns Promise with success status or error
 */
export async function testStorageConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log('Testing Supabase storage connection...');

    // Test basic storage access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      throw new Error(`Storage connection failed: ${bucketsError.message}`);
    }

    console.log('Available buckets:', buckets?.map(b => ({ name: b.name, public: b.public })));

    // Check if profile-pic bucket exists
    const profilePicBucket = buckets?.find(bucket => bucket.name === 'profile-pic');
    if (!profilePicBucket) {
      throw new Error('Profile picture storage bucket "profile-pic" not found');
    }

    console.log('Profile picture bucket found:', profilePicBucket);

    // Test bucket access by trying to list files
    const { data: files, error: listError } = await supabase.storage
      .from('profile-pic')
      .list('', { limit: 1 });

    if (listError) {
      console.warn('Cannot list files in bucket (this might be normal):', listError.message);
    } else {
      console.log('Bucket access test successful, files found:', files?.length || 0);
    }

    // Test upload permissions with a tiny test file
    const testFileName = 'test-connection.txt';
    const testContent = new Blob(['test'], { type: 'text/plain' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pic')
      .upload(testFileName, testContent, { upsert: true });

    if (uploadError) {
      throw new Error(`Upload test failed: ${uploadError.message}`);
    }

    console.log('Upload test successful:', uploadData);

    // Clean up test file
    await supabase.storage
      .from('profile-pic')
      .remove([testFileName]);

    return {
      success: true,
      details: {
        bucket: profilePicBucket,
        uploadTest: 'passed',
        bucketCount: buckets?.length || 0
      }
    };
  } catch (error) {
    console.error('Storage connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown storage connection error',
    };
  }
}

/**
 * Upload a profile picture to Supabase Storage
 * @param userId - The user's unique ID
 * @param imageUri - Local URI of the image to upload
 * @returns Promise with success status and public URL or error
 */
export async function uploadProfilePicture(
  userId: string,
  imageUri: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    if (!userId || !imageUri) {
      throw new Error('User ID and image URI are required');
    }

    console.log('Uploading profile picture for user:', userId);

    // Create a unique filename
    const fileExtension = imageUri.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;
    let filePath = `${userId}/${fileName}`;

    // Convert image URI to blob for upload
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('Image blob created, size:', blob.size, 'type:', blob.type);

    // Check if bucket exists and is accessible
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw new Error(`Storage access error: ${bucketsError.message}`);
    }

    const profilePicBucket = buckets?.find(bucket => bucket.name === 'profile-pic');
    if (!profilePicBucket) {
      throw new Error('Profile picture storage bucket not found. Please contact support.');
    }

    console.log('Uploading to bucket:', profilePicBucket.name, 'path:', filePath);

    // Upload to Supabase Storage with multiple attempts and different configurations
    let uploadResult;
    let uploadError;

    // First attempt: Standard upload
    console.log('Attempting standard upload...');
    const uploadAttempt1 = await supabase.storage
      .from('profile-pic')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true, // Allow overwrite to avoid conflicts
        contentType: blob.type || 'image/jpeg',
      });

    if (!uploadAttempt1.error) {
      uploadResult = uploadAttempt1;
    } else {
      console.log('Standard upload failed, trying alternative method...');
      uploadError = uploadAttempt1.error;

      // Second attempt: Try with ArrayBuffer instead of Blob
      const arrayBuffer = await blob.arrayBuffer();
      const uploadAttempt2 = await supabase.storage
        .from('profile-pic')
        .upload(filePath, arrayBuffer, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
        });

      if (!uploadAttempt2.error) {
        uploadResult = uploadAttempt2;
        uploadError = null;
      } else {
        console.log('ArrayBuffer upload also failed, trying with different path...');

        // Third attempt: Try with simplified path (no subfolder)
        const simplePath = `${userId}-${Date.now()}.${fileExtension}`;
        const uploadAttempt3 = await supabase.storage
          .from('profile-pic')
          .upload(simplePath, blob, {
            contentType: blob.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadAttempt3.error) {
          uploadResult = uploadAttempt3;
          uploadError = null;
          filePath = simplePath; // Update filePath for URL generation
        } else {
          uploadError = uploadAttempt3.error;
        }
      }
    }

    if (uploadError) {
      console.error('All upload attempts failed. Last error:', uploadError);
      throw new Error(`Upload failed after multiple attempts: ${uploadError.message}`);
    }

    console.log('Upload successful, data:', uploadResult?.data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('profile-pic')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    console.log('Profile picture uploaded successfully:', urlData.publicUrl);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error uploading profile picture',
    };
  }
}

/**
 * Delete old profile pictures for a user from Supabase Storage
 * @param userId - The user's unique ID
 * @returns Promise with success status or error
 */
export async function deleteOldProfilePictures(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Deleting old profile pictures for user:', userId);

    // List all files in the user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('profile-pic')
      .list(userId);

    if (listError) {
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No old profile pictures found for user:', userId);
      return { success: true };
    }

    // Delete all files in the user's folder
    const filePaths = files.map(file => `${userId}/${file.name}`);

    const { error: deleteError } = await supabase.storage
      .from('profile-pic')
      .remove(filePaths);

    if (deleteError) {
      throw deleteError;
    }

    console.log('Old profile pictures deleted successfully for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting old profile pictures:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting old profile pictures',
    };
  }
}

/**
 * Update user's profile picture - uploads new image and deletes old ones
 * @param userId - The user's unique ID
 * @param imageUri - Local URI of the new image
 * @returns Promise with success status and public URL or error
 */
export async function updateProfilePicture(
  userId: string,
  imageUri: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    if (!userId || !imageUri) {
      throw new Error('User ID and image URI are required');
    }

    console.log('Updating profile picture for user:', userId);

    // First, delete old profile pictures
    const deleteResult = await deleteOldProfilePictures(userId);
    if (!deleteResult.success) {
      console.warn('Failed to delete old profile pictures:', deleteResult.error);
      // Continue with upload even if deletion fails
    }

    // Upload the new profile picture
    const uploadResult = await uploadProfilePicture(userId, imageUri);
    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }

    // Update the profile in the database with the new photo URL
    const updateResult = await updateUserProfile(userId, {
      photoUrl: uploadResult.publicUrl,
    });

    if (!updateResult.success) {
      console.warn('Failed to update profile with new photo URL:', updateResult.error);
      // The image is uploaded successfully, so we can still return success
    }

    console.log('Profile picture updated successfully for user:', userId);
    return {
      success: true,
      publicUrl: uploadResult.publicUrl,
    };
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating profile picture',
    };
  }
}

/**
 * Remove user's profile picture - deletes from storage and updates database
 * @param userId - The user's unique ID
 * @returns Promise with success status or error
 */
export async function removeProfilePicture(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Removing profile picture for user:', userId);

    // Delete all profile pictures from storage
    const deleteResult = await deleteOldProfilePictures(userId);
    if (!deleteResult.success) {
      console.warn('Failed to delete profile pictures from storage:', deleteResult.error);
      // Continue with database update even if storage deletion fails
    }

    // Update the profile in the database to remove photo URL
    const updateResult = await updateUserProfile(userId, {
      photoUrl: undefined,
    });

    if (!updateResult.success) {
      throw new Error(updateResult.error);
    }

    console.log('Profile picture removed successfully for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error removing profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error removing profile picture',
    };
  }
}