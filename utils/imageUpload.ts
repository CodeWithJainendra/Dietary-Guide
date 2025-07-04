import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Request camera and media library permissions
 */
export async function requestImagePermissions(): Promise<boolean> {
  try {
    // Request camera permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    // Request media library permissions
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

/**
 * Pick an image from the device's photo library
 */
export async function pickImageFromLibrary(): Promise<ImagePicker.ImagePickerResult | null> {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error('Camera and media library permissions are required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile pictures
      quality: 0.8,
      base64: false,
    });

    return result;
  } catch (error) {
    console.error('Error picking image from library:', error);
    return null;
  }
}

/**
 * Take a photo using the device's camera
 */
export async function takePhotoWithCamera(): Promise<ImagePicker.ImagePickerResult | null> {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error('Camera and media library permissions are required');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile pictures
      quality: 0.8,
      base64: false,
    });

    return result;
  } catch (error) {
    console.error('Error taking photo with camera:', error);
    return null;
  }
}

/**
 * Upload image to Supabase storage
 */
export async function uploadImageToSupabase(
  imageUri: string,
  bucket: string,
  fileName: string
): Promise<ImageUploadResult> {
  try {
    // Convert image URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Convert blob to ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: blob.type || 'image/jpeg',
        upsert: true, // Replace if file already exists
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Upload profile picture for a user
 */
export async function uploadProfilePicture(
  userId: string,
  imageUri: string
): Promise<ImageUploadResult> {
  try {
    const fileName = `${userId}/profile-picture-${Date.now()}.jpg`;
    const result = await uploadImageToSupabase(imageUri, 'profile-pic', fileName);
    
    if (result.success && result.url) {
      // Update user profile in database with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photoUrl: result.url })
        .eq('userId', userId);

      if (updateError) {
        throw updateError;
      }
    }

    return result;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload profile picture',
    };
  }
}

/**
 * Delete image from Supabase storage
 */
export async function deleteImageFromSupabase(
  bucket: string,
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting image from Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    };
  }
}

/**
 * Get file name from Supabase storage URL
 */
export function getFileNameFromUrl(url: string): string | null {
  try {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName || null;
  } catch (error) {
    console.error('Error extracting file name from URL:', error);
    return null;
  }
}

/**
 * Complete image picker and upload flow for profile pictures
 */
export async function handleProfilePictureUpload(
  userId: string,
  source: 'camera' | 'library'
): Promise<ImageUploadResult> {
  try {
    let result: ImagePicker.ImagePickerResult | null = null;

    if (source === 'camera') {
      result = await takePhotoWithCamera();
    } else {
      result = await pickImageFromLibrary();
    }

    if (!result || result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: 'No image selected',
      };
    }

    const imageUri = result.assets[0].uri;
    return await uploadProfilePicture(userId, imageUri);
  } catch (error) {
    console.error('Error in profile picture upload flow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload profile picture',
    };
  }
}
