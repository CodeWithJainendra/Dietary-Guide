# Profile Image System Documentation

## Overview

The profile image system has been updated to store image URLs directly in the database instead of using Supabase storage. This approach is more reliable and simpler to maintain.

## How It Works

### Database Storage
- Profile images are stored as URLs in the `photoUrl` field of the `profiles` table
- Supports both local image URIs (from camera/gallery) and remote URLs (sample avatars)
- No file upload to storage required

### Image Sources
1. **Camera Photos**: Users can take photos using the device camera
2. **Gallery Images**: Users can select images from their photo library
3. **Sample Avatars**: Pre-defined avatar URLs from Unsplash

## Implementation Details

### Core Files

#### `utils/imageUtils.ts`
- **Purpose**: Centralized image handling utilities
- **Key Functions**:
  - `requestImagePermissions()`: Handles camera and gallery permissions
  - `openCamera()`: Opens camera for photo capture
  - `openImagePicker()`: Opens gallery for image selection
  - `showImagePickerOptions()`: Shows unified image picker dialog
  - `showFoodImagePickerOptions()`: Specialized for food images

#### `app/(tabs)/profile.tsx`
- **Updated Functions**:
  - `updateProfileImage()`: Saves image URL directly to database
  - `handleChangeProfilePicture()`: Uses new image utility
  - Removed storage-dependent functions

#### `components/LogMealForm.tsx`
- **Updated Functions**:
  - `handleImageUpload()`: Uses new image utility for food photos

### Database Schema
```sql
-- profiles table
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'User',
  photoUrl TEXT,  -- Stores image URL directly
  -- ... other fields
);
```

## Usage Examples

### Profile Image Update
```typescript
import { showImagePickerOptions } from '@/utils/imageUtils';
import { supabase } from '@/lib/supabase';

const updateProfileImage = async (imageUri: string, userId: string) => {
  // Update database with image URL
  const { error } = await supabase
    .from('profiles')
    .update({ photoUrl: imageUri })
    .eq('userId', userId);
    
  if (error) {
    throw error;
  }
};

// Show image picker
showImagePickerOptions(
  (imageUri: string) => {
    updateProfileImage(imageUri, userId);
  },
  true // Include sample avatars
);
```

### Food Image Selection
```typescript
import { showFoodImagePickerOptions } from '@/utils/imageUtils';

showFoodImagePickerOptions(
  (imageUri: string) => {
    setSelectedImage(imageUri);
  },
  (foodName: string, quantity: string) => {
    // Auto-fill detected food info
    setFoodName(foodName);
    setQuantity(quantity);
  }
);
```

## Benefits

### ✅ Advantages
- **Simplified Architecture**: No storage bucket configuration needed
- **Reliable**: Direct database storage is more predictable
- **Fast**: No file upload delays
- **Cost Effective**: No storage costs for images
- **Easy Debugging**: Image URLs are visible in database

### ⚠️ Considerations
- **Local Images**: Camera/gallery images are stored as local URIs
- **App Reinstall**: Local images may not persist across app reinstalls
- **Sharing**: Local image URIs can't be shared between devices

## Testing

### Manual Testing
1. Open profile screen
2. Tap profile image
3. Try each option:
   - Take Photo (requires camera permission)
   - Choose from Gallery (requires photo library permission)
   - Use Sample Avatar (works immediately)
4. Verify image updates in UI and database

### Automated Testing
```typescript
import { runProfileImageTests } from '@/utils/testProfileImage';

// Run complete test suite
const results = await runProfileImageTests(userId);
console.log(results.summary); // "3/3 tests passed"
```

## Troubleshooting

### Common Issues

#### Permission Denied
- **Cause**: Camera or photo library permissions not granted
- **Solution**: Check device settings and grant permissions

#### Image Not Updating
- **Cause**: Database connection issues or invalid userId
- **Solution**: Check Supabase connection and user authentication

#### Local Images Not Displaying
- **Cause**: Invalid local URI or file moved/deleted
- **Solution**: Use sample avatars or retake photo

### Debug Steps
1. Check console logs for error messages
2. Verify userId is correct and user is authenticated
3. Test database connection with sample avatar URLs
4. Check device permissions in settings

## Future Enhancements

### Potential Improvements
- **Image Compression**: Compress large images before storing URIs
- **Cloud Storage**: Optional cloud storage for better persistence
- **Image Validation**: Validate image URLs before saving
- **Caching**: Cache remote images for offline viewing
- **Multiple Images**: Support multiple profile images

### Migration Path
If storage is needed later:
1. Add storage upload function
2. Update `updateProfileImage()` to upload first, then save URL
3. Migrate existing URLs to storage if needed
4. Keep URL-based approach as fallback

## Security Considerations

- **URL Validation**: Validate image URLs to prevent XSS
- **Permission Handling**: Proper permission requests and error handling
- **Data Privacy**: Local images stay on device until explicitly shared
- **Database Security**: Use RLS policies to protect profile data

## Conclusion

The new profile image system provides a reliable, simple solution for handling user profile pictures. It eliminates storage complexity while maintaining full functionality for camera, gallery, and sample avatar options.
