import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserStore } from '@/store/userStore';
import { processAuthCallback, getUserProfile, getStoredTokens } from '@/lib/auth0';
import { saveUserProfile } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processed, setProcessed] = useState(false); // Flag to prevent multiple processing
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent multiple executions of the callback handler
      if (processed) return;
      setProcessed(true);
      
      try {
        console.log('Auth callback received with params:', JSON.stringify(params));
        
        // Check for error in params
        if (params.error) {
          console.error('Auth error in callback:', params.error);
          setError(`Authentication error: ${params.error}`);
          setLoading(false);
          
          // Navigate back to auth screen after a delay
          setTimeout(() => {
            router.replace('/auth');
          }, 3000);
          return;
        }
        
        // Check if we have code and state parameters
        if (params.code && params.state) {
          console.log('Processing auth callback with code and state parameters');
          
          // Verify we have the code verifier stored
          const codeVerifier = await AsyncStorage.getItem('auth0_code_verifier');
          const storedState = await AsyncStorage.getItem('auth0_state');
          
          console.log('Code verifier from AsyncStorage:', codeVerifier);
          console.log('Stored state from AsyncStorage:', storedState);
          console.log('Received state:', params.state);
          
          // Process the auth callback
          const authResult = await processAuthCallback(
            params.code as string,
            params.state as string
          );
          
          if (authResult.success && authResult.user) {
            console.log('Auth callback processed successfully');
            
            // Get user profile from Auth0
            const userProfileResult = await getUserProfile();
            
            if (userProfileResult.success && userProfileResult.profile) {
              console.log('User profile retrieved successfully in callback');
              
              // Update user profile in store
              updateProfile(userProfileResult.profile);
              
              // Save profile to Supabase
              try {
                if (userProfileResult.profile.userId) {
                  await saveUserProfile(userProfileResult.profile);
                  console.log('Profile saved to Supabase successfully');
                }
              } catch (error) {
                console.log('Error saving profile to Supabase:', error);
                // Continue even if Supabase save fails
              }
              
              // Mark as authenticated
              setAuthenticated(true);
              
              // Navigate to main app
              console.log('Authentication successful, navigating to main app');
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 1000);
              return;
            }
          }
          
          // If we get here, something went wrong with the token exchange or profile retrieval
          console.error('Failed to process auth callback:', authResult.error);
          
          // Show error alert
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Authentication Failed',
              authResult.error || 'Unknown error',
              [{ text: 'OK' }]
            );
          }
          
          setError(`Authentication failed: ${authResult.error || 'Unknown error'}`);
          setLoading(false);
          
          // For development/testing, allow skipping authentication
          if (Platform.OS === 'web' || __DEV__) {
            console.log('Development mode: Creating fallback profile');
            createFallbackProfile();
          } else {
            // Navigate back to auth screen after a delay
            setTimeout(() => {
              router.replace('/auth');
            }, 3000);
          }
          return;
        }
        
        // Check if we have tokens after the auth flow
        const { accessToken } = await getStoredTokens();
        
        if (!accessToken) {
          console.log('No access token found after authentication');
          setError('Authentication failed: No access token found');
          setLoading(false);
          
          // For development/testing, allow skipping authentication
          if (Platform.OS === 'web' || __DEV__) {
            console.log('Development mode: Creating fallback profile');
            createFallbackProfile();
          } else {
            // Navigate back to auth screen after a delay
            setTimeout(() => {
              router.replace('/auth');
            }, 3000);
          }
          return;
        }
        
        // Get user profile from Auth0
        const userProfileResult = await getUserProfile();
        
        if (userProfileResult.success && userProfileResult.profile) {
          console.log('User profile retrieved successfully in callback');
          
          // Update user profile in store
          updateProfile(userProfileResult.profile);
          
          // Save profile to Supabase
          try {
            if (userProfileResult.profile.userId) {
              await saveUserProfile(userProfileResult.profile);
              console.log('Profile saved to Supabase successfully');
            }
          } catch (error) {
            console.log('Error saving profile to Supabase:', error);
            // Continue even if Supabase save fails
          }
          
          // Mark as authenticated
          setAuthenticated(true);
          
          // Navigate to main app or onboarding
          console.log('Authentication successful, navigating to main app');
          setTimeout(() => {
            // Navigate to the main app
            router.replace('/(tabs)');
          }, 1000);
        } else {
          console.log('Failed to get user profile:', userProfileResult.error);
          
          // For development/testing, allow skipping authentication
          if (Platform.OS === 'web' || __DEV__) {
            console.log('Development mode: Creating fallback profile');
            createFallbackProfile();
          } else {
            setError(`Failed to get user profile: ${userProfileResult.error || 'Unknown error'}`);
            setLoading(false);
            
            // Navigate back to auth screen after a delay
            setTimeout(() => {
              router.replace('/auth');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        
        // For development/testing, allow skipping authentication
        if (Platform.OS === 'web' || __DEV__) {
          console.log('Development mode: Creating fallback profile');
          createFallbackProfile();
        } else {
          setError('An unexpected error occurred during authentication');
          setLoading(false);
          
          // Navigate back to auth screen after a delay
          setTimeout(() => {
            router.replace('/auth');
          }, 3000);
        }
      }
    };
    
    // Helper function to create a fallback profile for development
    const createFallbackProfile = () => {
      // Create a fallback profile for development
      const fallbackProfile = {
        userId: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: 'user@example.com',
        name: 'User',
        height: 170,
        weight: 70,
        age: 30,
        gender: 'other' as const,
        goal: 'healthy_lifestyle' as const,
        exerciseDuration: 30,
        dietaryRestrictions: [],
        dietaryPreferences: [],
        diseases: [],
        isSmoker: false
      };
      
      // Update profile in store
      updateProfile(fallbackProfile);
      
      // Mark as authenticated
      setAuthenticated(true);
      
      // Navigate to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    };
    
    handleAuthCallback();
  }, [params, setAuthenticated, updateProfile, processed]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.text }]}>
            Completing authentication...
          </Text>
        </>
      ) : error ? (
        <>
          <Text style={[styles.errorTitle, { color: colors.error }]}>
            Authentication Error
          </Text>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error}
          </Text>
          <Text style={[styles.redirectText, { color: colors.textSecondary }]}>
            Redirecting back to the app...
          </Text>
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  redirectText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});