import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Platform,
  Image,
  BackHandler,
  Appearance,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import {
  User,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Calendar,
  CheckSquare,
  Trash2,
  RefreshCw,
  Camera,
  Edit3,
  UserCheck,
  Heart,
  Activity,
  Target
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { getGoogleProfilePhoto } from '@/utils/googleService';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { showImagePickerOptions } from '@/utils/imageUtils';

const defaultProfileImage = require('../../assets/images/userprofileimage.png');

// TODO: Replace with your real Google OAuth client ID for Expo
const GOOGLE_CLIENT_ID = '189295017514-66uf95g2gf858l7lh55p01kqm5bq1lr3.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri();
const GOOGLE_AUTH_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export default function ProfileScreen() {
  const { theme, colors, toggleTheme, setThemeMode } = useTheme();
  const { signOut } = useAuth();
  const {
    profile,
    logout,
    updateProfile,
    themePreference,
    setThemePreference,
    googleTokens,
    setGoogleTokens,
    calculateBMI,
    getHealthStatus
  } = useUserStore();

  const clearNutritionData = useNutritionStore((state) => state.clearAllData);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [profileImage, setProfileImage] = useState<string | undefined>(defaultProfileImage);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Modal and connection state for Google Calendar/Tasks
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleModalType, setGoogleModalType] = useState<'connect' | 'disconnect'>('connect');
  const isGoogleConnected = !!googleTokens?.accessToken;
  
  const bmi = calculateBMI();
  const healthStatus = getHealthStatus();
  
  useEffect(() => {
    // Initialize profile image
    if (profile?.photoUrl) {
      setProfileImage(profile.photoUrl);
    } else {
      setProfileImage(defaultProfileImage);
    }
  }, [profile?.photoUrl]);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (profile?.email && !profile?.photoUrl) {
        // Only fetch from Supabase if we don't already have a photoUrl
        const { data, error } = await supabase
          .from('profiles')
          .select('photoUrl')
          .eq('email', profile.email)
          .single();
        if (data && data.photoUrl) {
          // Update the profile in Zustand store
          updateProfile({ ...profile, photoUrl: data.photoUrl });
          setProfileImage(data.photoUrl);
        }
      }
    };
    fetchProfileImage();
  }, [profile?.email, profile?.photoUrl]);
  
  useEffect(() => {
    if (themePreference === 'system') {
      setThemeMode(Appearance.getColorScheme() || 'light');
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setThemeMode(colorScheme || 'light');
      });
      return () => subscription.remove();
    } else {
      setThemeMode(themePreference);
    }
  }, [themePreference, setThemeMode]);
  
  useEffect(() => {
    const fetchGoogleProfileImage = async () => {
      // If user has a Google access token, fetch their Gmail/Google profile photo
      if (googleTokens?.accessToken) {
        try {
          const photoUrl = await getGoogleProfilePhoto(googleTokens.accessToken);
          if (photoUrl) {
            setProfileImage(photoUrl);
            // Optionally update Zustand and Supabase here
          }
        } catch (err) {
          console.warn('Failed to fetch Google profile photo:', err);
        }
      }
    };
    fetchGoogleProfileImage();
  }, [googleTokens?.accessToken]);
  
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting logout process...');

              // 1. Sign out from Clerk (this clears Clerk session and tokens)
              if (signOut) {
                await signOut();
                console.log('Clerk signOut completed');
              }

              // 2. Sign out from Supabase (if using Supabase auth)
              try {
                await supabase.auth.signOut();
                console.log('Supabase signOut completed');
              } catch (e) {
                console.log('Supabase signOut error (may be expected):', e);
              }

              // 3. Clear all stored credentials and tokens from SecureStore
              const secureStoreKeys = [
                'user_email',
                'user_password',
                // Clerk token cache keys (these are automatically managed by Clerk)
                '__clerk_client_jwt',
                '__clerk_session_token',
                '__clerk_refresh_token'
              ];

              for (const key of secureStoreKeys) {
                try {
                  await SecureStore.deleteItemAsync(key);
                } catch (e) {
                  console.log(`Error clearing ${key}:`, e);
                }
              }
              console.log('SecureStore cleared');

              // 4. Clear AsyncStorage data
              try {
                await AsyncStorage.multiRemove([
                  'user-storage', // Zustand persisted state
                  'auth0_code_verifier',
                  'auth0_state',
                  'google_tokens',
                  'nutrition-storage',
                  'chat-storage'
                ]);
                console.log('AsyncStorage cleared');
              } catch (e) {
                console.log('AsyncStorage clear error:', e);
              }

              // 5. Clear user store state
              logout();
              console.log('User store cleared');

              // 6. Clear nutrition data
              clearNutritionData();
              console.log('App data cleared');

              // 7. Navigate to signin page
              router.replace('/signin');
              console.log('Redirected to signin');

            } catch (error) {
              console.error('Logout error:', error);
              // Even if there's an error, try to clear local state and redirect
              logout();
              clearNutritionData();
              router.replace('/signin');
            }
          },
        },
      ]
    );
  };
  
  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your meal entries, nutrition plans, and chat history. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: () => {
            clearNutritionData();
            clearChatHistory();
            Alert.alert("Success", "All data has been cleared.");
          }
        }
      ]
    );
  };
  
  const handleEditProfile = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };
  
  const handleSaveProfile = () => {
    if (editedProfile) {
      updateProfile(editedProfile);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleInputChange = (field: string, value: any) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value
      });
    }
  };



  const updateProfileImage = async (imageUri: string) => {
    try {
      setIsUploadingImage(true);

      if (!profile?.userId) {
        throw new Error('User ID is required to update profile picture');
      }

      // For now, we'll store the image URI directly as photoURL in the database
      // This works for both local images and URLs (sample avatars)
      const finalImageUrl = imageUri;

      // Update the database with the image URI
      const { error } = await supabase
        .from('profiles')
        .update({ photoUrl: finalImageUrl })
        .eq('userId', profile.userId);

      if (error) {
        throw error;
      }

      // Update the profile in the store
      if (editedProfile) {
        const updatedProfile = { ...editedProfile, photoUrl: finalImageUrl };
        setEditedProfile(updatedProfile);
        updateProfile(updatedProfile);
      }

      // Update the displayed image
      setProfileImage(finalImageUrl);

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');

      // Revert to previous image on error
      if (profile?.photoUrl) {
        setProfileImage(profile.photoUrl);
      } else {
        setProfileImage(theme === 'dark' ? require('../../assets/images/userprofileimagewhite.png') : defaultProfileImage);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };



  const removeProfileImageHandler = async () => {
    try {
      setIsUploadingImage(true);

      if (!profile?.userId) {
        throw new Error('User ID is required to remove profile picture');
      }

      // Remove photoUrl from database
      const { error } = await supabase
        .from('profiles')
        .update({ photoUrl: null })
        .eq('userId', profile.userId);

      if (error) {
        throw error;
      }

      // Update the profile in the store
      if (editedProfile) {
        const updatedProfile = { ...editedProfile, photoUrl: undefined };
        setEditedProfile(updatedProfile);
        updateProfile(updatedProfile);
      }

      // Reset to default image after successful removal
      const defaultImg = theme === 'dark' ? require('../../assets/images/userprofileimagewhite.png') : defaultProfileImage;
      setProfileImage(defaultImg);

      Alert.alert('Success', 'Profile picture removed successfully!');
    } catch (error) {
      console.error('Error removing profile image:', error);
      Alert.alert('Error', 'Failed to remove profile picture. Please try again.');

      // Revert to previous image on error
      if (profile?.photoUrl) {
        setProfileImage(profile.photoUrl);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleChangeProfilePicture = async () => {
    showImagePickerOptions(
      (imageUri: string) => {
        updateProfileImage(imageUri);
      },
      true // Include sample avatars
    );



    // Add remove option if user has a custom profile image
    if (profile?.photoUrl) {
      options.push({
        text: "Remove Photo",
        onPress: removeProfileImageHandler,
        style: "destructive" as const
      });
    }

    Alert.alert(
      "Change Profile Picture",
      "Choose an option",
      options
    );
  };
  
  const handleGoogleConnect = async () => {
    try {
      WebBrowser.maybeCompleteAuthSession();
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        redirectUri: GOOGLE_REDIRECT_URI,
        scopes: [
          'openid',
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/tasks',
        ],
        responseType: AuthSession.ResponseType.Token,
      });
      await request.makeAuthUrlAsync(GOOGLE_AUTH_DISCOVERY);
      const result = await request.promptAsync(GOOGLE_AUTH_DISCOVERY);
      if (result.type === 'success' && result.authentication?.accessToken) {
        setGoogleTokens({ accessToken: result.authentication.accessToken });
        setGoogleModalVisible(false);
        Alert.alert('Connected', 'Google Calendar & Tasks connected successfully.');
      } else if (result.type === 'error') {
        setGoogleModalVisible(false);
        const errorMsg = typeof result.error === 'string' ? result.error : 'Could not connect to Google.';
        Alert.alert('Google Connect Failed', errorMsg);
      } else {
        setGoogleModalVisible(false);
        Alert.alert('Google Connect Cancelled', 'Google authentication was cancelled.');
      }
    } catch (err) {
      setGoogleModalVisible(false);
      Alert.alert('Google Connect Error', 'An error occurred during Google authentication.');
    }
  };
  
  const handleGoogleDisconnect = async () => {
    setGoogleTokens({ accessToken: null, refreshToken: null, expiresAt: null });
    setGoogleModalVisible(false);
    Alert.alert('Disconnected', 'Google Calendar & Tasks disconnected.');
  };
  
  const handleGoogleServicePress = () => {
    if (isGoogleConnected) {
      setGoogleModalType('disconnect');
      setGoogleModalVisible(true);
    } else {
      setGoogleModalType('connect');
      setGoogleModalVisible(true);
    }
  };
  
  const handleThemeChange = (value: 'system' | 'light' | 'dark') => {
    setThemePreference(value);
  };
  
  const handleSwitchAccount = () => {
    Alert.alert(
      "Switch Account",
      "Are you sure you want to switch to another account?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Switch",
          onPress: () => {
            // In a real app, this would log out the current user and show the login screen
            logout();
            router.replace('/');
          }
        }
      ]
    );
  };
  
  useEffect(() => {
    // Theme-based profile image logic - only apply if no custom profile image
    if (!profile?.photoUrl) {
      if (theme === 'dark') {
        setProfileImage(require('../../assets/images/userprofileimagewhite.png'));
      } else {
        setProfileImage(defaultProfileImage);
      }
    }
  }, [theme, profile?.photoUrl]);
  
  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Profile not found. Please complete the questionnaire.
          </Text>
          <Button 
            title="Go to Setup" 
            onPress={() => router.replace('/')} 
            style={styles.loginButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  if (isEditing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>

          
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image
                source={typeof profileImage === 'string' ? { uri: profileImage } : profileImage}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.card }]}>
                <User size={40} color={colors.primary} />
              </View>
            )}
            {isUploadingImage && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}

            <TouchableOpacity
              style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}
              onPress={handleChangeProfilePicture}
              disabled={isUploadingImage}
            >
              <Camera size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
            
            <Input
              label="Name"
              value={editedProfile?.name || ''}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Your name"
            />
            
            <Input
              label="Email"
              value={editedProfile?.email || ''}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              editable={false}
              style={{ opacity: 0.6 }}
            />
            <Text style={[styles.emailNote, { color: colors.textSecondary }]}>
              Email cannot be changed for security reasons
            </Text>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Age"
                  value={editedProfile?.age?.toString() || ''}
                  onChangeText={(text) => handleInputChange('age', parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholder="Age"
                />
              </View>
              
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      { borderColor: colors.border },
                      editedProfile?.gender === 'male' && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => handleInputChange('gender', 'male')}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      { color: colors.text },
                      editedProfile?.gender === 'male' && { color: 'white' }
                    ]}>Male</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      { borderColor: colors.border },
                      editedProfile?.gender === 'female' && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => handleInputChange('gender', 'female')}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      { color: colors.text },
                      editedProfile?.gender === 'female' && { color: 'white' }
                    ]}>Female</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      { borderColor: colors.border },
                      editedProfile?.gender === 'other' && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => handleInputChange('gender', 'other')}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      { color: colors.text },
                      editedProfile?.gender === 'other' && { color: 'white' }
                    ]}>Other</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Height (cm)"
                  value={editedProfile?.height?.toString() || ''}
                  onChangeText={(text) => handleInputChange('height', parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholder="Height in cm"
                />
              </View>
              
              <View style={styles.halfInput}>
                <Input
                  label="Weight (kg)"
                  value={editedProfile?.weight?.toString() || ''}
                  onChangeText={(text) => handleInputChange('weight', parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholder="Weight in kg"
                />
              </View>
            </View>
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Goal</Text>
            <View style={styles.goalContainer}>
              {['weight_loss', 'weight_gain', 'maintenance', 'healthy_lifestyle'].map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editedProfile?.goal === goal && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => handleInputChange('goal', goal)}
                >
                  <Text style={[
                    styles.goalOptionText,
                    { color: colors.text },
                    editedProfile?.goal === goal && { color: 'white' }
                  ]}>
                    {goal === 'weight_loss' ? 'Weight Loss' : 
                     goal === 'weight_gain' ? 'Weight Gain' : 
                     goal === 'maintenance' ? 'Maintenance' : 
                     'Healthy Lifestyle'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Input
              label="Exercise Duration (minutes/day)"
              value={editedProfile?.exerciseDuration?.toString() || ''}
              onChangeText={(text) => handleInputChange('exerciseDuration', parseInt(text) || 0)}
              keyboardType="number-pad"
              placeholder="Minutes per day"
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Dietary Preferences</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.card, 
                color: colors.text,
                borderColor: colors.border
              }]}
              value={editedProfile?.dietaryPreferences?.join(', ') || ''}
              onChangeText={(text) => handleInputChange('dietaryPreferences', text.split(',').map(item => item.trim()))}
              placeholder="E.g., vegetarian, vegan, keto (comma separated)"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Dietary Restrictions</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.card, 
                color: colors.text,
                borderColor: colors.border
              }]}
              value={editedProfile?.dietaryRestrictions?.join(', ') || ''}
              onChangeText={(text) => handleInputChange('dietaryRestrictions', text.split(',').map(item => item.trim()))}
              placeholder="E.g., gluten-free, dairy-free, nut allergy (comma separated)"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Health Conditions</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.card, 
                color: colors.text,
                borderColor: colors.border
              }]}
              value={editedProfile?.diseases?.join(', ') || ''}
              onChangeText={(text) => handleInputChange('diseases', text.split(',').map(item => item.trim()))}
              placeholder="E.g., diabetes, hypertension (comma separated)"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Smoker</Text>
              <Switch
                value={editedProfile?.isSmoker || false}
                onValueChange={(value) => handleInputChange('isSmoker', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
              />
            </View>
          </Card>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Save Changes"
              onPress={handleSaveProfile}
              style={styles.saveButton}
            />
            <Button
              title="Cancel"
              onPress={handleCancelEdit}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleChangeProfilePicture}
            disabled={isUploadingImage}
          >
            {profileImage ? (
              <Image
                source={typeof profileImage === 'string' ? { uri: profileImage } : profileImage}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.avatarContainer, { backgroundColor: colors.card }]}>
                <User size={40} color={colors.primary} />
              </View>
            )}
            {isUploadingImage && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            <View style={[styles.cameraIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Camera size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.text }]}>{profile.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{profile.email}</Text>
          
          {/* Health Summary */}
          <View style={[styles.healthSummary, { backgroundColor: colors.card }]}>
            <View style={styles.healthItem}>
              <Heart size={20} color={colors.primary} />
              <Text style={[styles.healthValue, { color: colors.primary }]}>
                {bmi ? bmi.toFixed(1) : 'N/A'}
              </Text>
              <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>BMI</Text>
            </View>
            <View style={styles.healthItem}>
              <Activity size={20} color={colors.secondary} />
              <Text style={[styles.healthValue, { color: colors.secondary }]}>
                {profile.exerciseDuration}
              </Text>
              <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Min/Day</Text>
            </View>
            <View style={styles.healthItem}>
              <Target size={20} color={colors.success} />
              <Text style={[styles.healthValue, { color: colors.success }]}>
                {healthStatus.split(' ')[0]}
              </Text>
              <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Status</Text>
            </View>
          </View>
        </View>
        
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <UserCheck size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Information</Text>
            <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
              <Edit3 size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{profile.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{profile.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Age</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{profile.age} years</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Gender</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Height</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{profile.height} cm</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Weight</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{profile.weight} kg</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Goal</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.goal === 'weight_loss' ? 'Weight Loss' : 
                 profile.goal === 'weight_gain' ? 'Weight Gain' : 
                 profile.goal === 'maintenance' ? 'Maintenance' : 
                 'Healthy Lifestyle'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Exercise</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.exerciseDuration} minutes/day
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Dietary Preferences</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.dietaryPreferences && profile.dietaryPreferences.length > 0 
                  ? profile.dietaryPreferences.join(', ') 
                  : 'None'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Dietary Restrictions</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0 
                  ? profile.dietaryRestrictions.join(', ') 
                  : 'None'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Health Conditions</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.diseases && profile.diseases.length > 0 
                  ? profile.diseases.join(', ') 
                  : 'None'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Smoker</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.isSmoker ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </Card>
        
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>
          
          <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.background, borderColor: colors.border },
                themePreference === 'system' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <Text style={[
                styles.themeOptionText,
                { color: colors.text },
                themePreference === 'system' && { color: 'white' }
              ]}>System</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.background, borderColor: colors.border },
                themePreference === 'light' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Sun size={16} color={themePreference === 'light' ? 'white' : colors.text} />
              <Text style={[
                styles.themeOptionText,
                { color: colors.text },
                themePreference === 'light' && { color: 'white' }
              ]}>Light</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.background, borderColor: colors.border },
                themePreference === 'dark' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Moon size={16} color={themePreference === 'dark' ? 'white' : colors.text} />
              <Text style={[
                styles.themeOptionText,
                { color: colors.text },
                themePreference === 'dark' && { color: 'white' }
              ]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected Services</Text>
          <TouchableOpacity 
            style={[styles.serviceRow, { borderBottomColor: colors.border }]}
            onPress={handleGoogleServicePress}
          >
            <View style={styles.serviceInfo}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.serviceName, { color: colors.text }]}>Google Calendar & Tasks</Text>
            </View>
            <View style={styles.serviceStatus}>
              {isGoogleConnected ? (
                <>
                  <Text style={[styles.serviceConnected, { color: colors.success }]}>Connected</Text>
                  <RefreshCw size={16} color={colors.primary} />
                </>
              ) : (
                <Button
                  title="Connect"
                  onPress={handleGoogleServicePress}
                  style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8 }}
                />
              )}
            </View>
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <TouchableOpacity 
            style={[styles.accountOption, { borderBottomColor: colors.border }]}
            onPress={handleSwitchAccount}
          >
            <View style={styles.accountOptionContent}>
              <User size={20} color={colors.primary} />
              <Text style={[styles.accountOptionText, { color: colors.text }]}>Switch Account</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.dangerButton, { borderColor: colors.error }]}
            onPress={handleClearData}
          >
            <Trash2 size={20} color={colors.error} />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>Clear All Data</Text>
          </TouchableOpacity>
        </Card>
        
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>
        
        {/* Google Connect/Disconnect Modal (React Native Modal) */}
        <Modal
          visible={googleModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setGoogleModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: colors.card, padding: 24, borderRadius: 16, width: 320, alignItems: 'center' }}>
              {googleModalType === 'connect' ? (
                <>
                  <Calendar size={32} color={colors.primary} />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 12, color: colors.text }}>Connect Google Calendar & Tasks</Text>
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
                    Connect your Google account to sync Calendar and Tasks.
                  </Text>
                  <Button title="Connect" onPress={handleGoogleConnect} style={{ marginBottom: 8 }} />
                  <Button title="Cancel" variant="outline" onPress={() => setGoogleModalVisible(false)} />
                </>
              ) : (
                <>
                  <Calendar size={32} color={colors.primary} />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 12, color: colors.text }}>Disconnect Google Calendar & Tasks</Text>
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
                    Are you sure you want to disconnect Google Calendar & Tasks?
                  </Text>
                  <Button title="Disconnect" onPress={handleGoogleDisconnect} style={{ marginBottom: 8 }} />
                  <Button title="Cancel" variant="outline" onPress={() => setGoogleModalVisible(false)} />
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 100, // Extra padding to account for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 16,
  },
  healthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  healthItem: {
    alignItems: 'center',
  },
  healthValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
  },
  card: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  themeOptionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    marginLeft: 8,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceConnected: {
    fontSize: 14,
    marginRight: 8,
  },
  serviceDisconnected: {
    fontSize: 14,
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  accountOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountOptionText: {
    fontSize: 16,
    marginLeft: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  halfInput: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  emailNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -12,
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  genderOptionText: {
    fontSize: 14,
  },
  goalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  goalOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  goalOptionText: {
    fontSize: 14,
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    marginHorizontal: 24,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});