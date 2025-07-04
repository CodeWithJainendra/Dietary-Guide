import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImagePickerResult {
  success: boolean;
  imageUri?: string;
  error?: string;
}

/**
 * Request camera and media library permissions
 */
export const requestImagePermissions = async (): Promise<boolean> => {
  try {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to use this feature.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

/**
 * Open camera to take a photo
 */
export const openCamera = async (): Promise<ImagePickerResult> => {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return { success: false, error: 'User cancelled' };
    }

    if (result.assets && result.assets[0]) {
      return { success: true, imageUri: result.assets[0].uri };
    }

    return { success: false, error: 'No image selected' };
  } catch (error) {
    console.error('Error opening camera:', error);
    return { success: false, error: 'Failed to open camera' };
  }
};

/**
 * Open image picker to select from gallery
 */
export const openImagePicker = async (): Promise<ImagePickerResult> => {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return { success: false, error: 'User cancelled' };
    }

    if (result.assets && result.assets[0]) {
      return { success: true, imageUri: result.assets[0].uri };
    }

    return { success: false, error: 'No image selected' };
  } catch (error) {
    console.error('Error opening image picker:', error);
    return { success: false, error: 'Failed to open image picker' };
  }
};

/**
 * Show image picker options (camera, gallery, sample avatars)
 */
export const showImagePickerOptions = (
  onImageSelected: (imageUri: string) => void,
  includeSampleAvatars: boolean = false
) => {
  const options = [
    {
      text: "Cancel",
      style: "cancel" as const
    },
    {
      text: "Take Photo",
      onPress: async () => {
        const result = await openCamera();
        if (result.success && result.imageUri) {
          onImageSelected(result.imageUri);
        } else if (result.error && result.error !== 'User cancelled') {
          Alert.alert('Error', result.error);
        }
      }
    },
    {
      text: "Choose from Gallery",
      onPress: async () => {
        const result = await openImagePicker();
        if (result.success && result.imageUri) {
          onImageSelected(result.imageUri);
        } else if (result.error && result.error !== 'User cancelled') {
          Alert.alert('Error', result.error);
        }
      }
    }
  ];

  if (includeSampleAvatars) {
    options.push({
      text: "Use Sample Avatar",
      onPress: () => {
        const avatars = [
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1770&auto=format&fit=crop'
        ];
        
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
        onImageSelected(randomAvatar);
      }
    });
  }

  Alert.alert(
    "Select Image",
    "Choose an option",
    options
  );
};

/**
 * Sample food images for demo purposes
 */
export const getSampleFoodImages = () => [
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
];

/**
 * Show food image picker options
 */
export const showFoodImagePickerOptions = (
  onImageSelected: (imageUri: string) => void,
  onFoodDetected?: (foodName: string, quantity: string) => void
) => {
  const options = [
    {
      text: "Cancel",
      style: "cancel" as const
    },
    {
      text: "Take Photo",
      onPress: async () => {
        const result = await openCamera();
        if (result.success && result.imageUri) {
          onImageSelected(result.imageUri);
        } else if (result.error && result.error !== 'User cancelled') {
          Alert.alert('Error', result.error);
        }
      }
    },
    {
      text: "Choose from Gallery",
      onPress: async () => {
        const result = await openImagePicker();
        if (result.success && result.imageUri) {
          onImageSelected(result.imageUri);
        } else if (result.error && result.error !== 'User cancelled') {
          Alert.alert('Error', result.error);
        }
      }
    },
    {
      text: "Use Sample Food",
      onPress: () => {
        const sampleImages = getSampleFoodImages();
        const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
        onImageSelected(randomImage);
        
        // Simulate food detection for demo
        if (onFoodDetected) {
          const sampleFoods = [
            { name: 'Mixed Salad Bowl', quantity: '1 bowl' },
            { name: 'Grilled Chicken', quantity: '150g' },
            { name: 'Pasta with Vegetables', quantity: '1 plate' },
            { name: 'Fresh Fruit Bowl', quantity: '1 cup' },
            { name: 'Sandwich', quantity: '1 piece' }
          ];
          const randomFood = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
          onFoodDetected(randomFood.name, randomFood.quantity);
        }
      }
    }
  ];

  Alert.alert(
    "Add Food Photo",
    "Choose an option",
    options
  );
};
