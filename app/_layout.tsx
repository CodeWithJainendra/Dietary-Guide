import React, { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text, Alert, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { trpc, trpcClient } from '@/lib/trpc';
import { isAuthenticated, getUserProfile, getStoredTokens, logout } from '@/lib/auth0';
import { getUserProfileFromSupabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

// Root layout wrapper with theme provider
function RootLayoutContent() {
  const { theme, colors } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Set showAuthError to false to prevent showing error toasts
  const [showAuthError, setShowAuthError] = useState(false);
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const isAuthenticatedInStore = useUserStore((state) => state.isAuthenticated);
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking auth status in _layout...');
        
        // Clear any stale auth state that might be causing issues
        await AsyncStorage.removeItem('auth0_code_verifier');
        await AsyncStorage.removeItem('auth0_state');
        
        // First check if we have tokens
        const { accessToken } = await getStoredTokens();
        
        if (!accessToken) {
          console.log('No access token found, user is not authenticated');
          setIsReady(true);
          SplashScreen.hideAsync();
          return;
        }
        
        // Check if token is valid
        const isAuth = await isAuthenticated();
        console.log('Auth status:', isAuth);
        
        if (isAuth) {
          // Get user profile from Auth0
          const userProfile = await getUserProfile();
          
          if (userProfile.success && userProfile.profile) {
            console.log('User profile retrieved successfully from Auth0');
            
            // Try to get additional profile data from Supabase
            if (userProfile.profile.userId) {
              try {
                const supabaseProfile = await getUserProfileFromSupabase(userProfile.profile.userId);
                
                if (supabaseProfile.success && supabaseProfile.profile) {
                  console.log('User profile retrieved successfully from Supabase');
                  // Merge Auth0 profile with Supabase profile
                  // Auth0 data takes precedence for basic info
                  const mergedProfile = {
                    ...supabaseProfile.profile,
                    userId: userProfile.profile.userId,
                    email: userProfile.profile.email,
                    name: userProfile.profile.name,
                    photoUrl: userProfile.profile.photoUrl,
                  };
                  
                  // Update user profile with merged data
                  updateProfile(mergedProfile);
                } else {
                  // If no Supabase profile, use Auth0 profile
                  console.log('No Supabase profile found, using Auth0 profile');
                  updateProfile(userProfile.profile);
                }
              } catch (error) {
                // If Supabase fails, still use Auth0 profile
                console.log('Error getting Supabase profile, using Auth0 profile');
                updateProfile(userProfile.profile);
              }
            } else {
              // If no userId, use Auth0 profile
              updateProfile(userProfile.profile);
            }
            
            // Set authenticated state
            setAuthenticated(true);
          } else {
            console.log('Failed to get user profile from Auth0:', userProfile.error);
            // Clear invalid auth state but don't show error
            await logout();
            setAuthenticated(false);
            setAuthError(null); // Clear any previous errors
          }
        } else {
          // If not authenticated, clear auth state
          setAuthenticated(false);
        }
        
        // Set ready state after checking auth
        setIsReady(true);
        // Hide splash screen
        SplashScreen.hideAsync();
      } catch (error) {
        console.log('Error checking auth status:', error);
        // Clear auth state on error
        setAuthenticated(false);
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };
    
    // Add a slight delay to ensure stores are initialized
    setTimeout(() => {
      checkAuthStatus().catch((error) => {
        console.error('Error in checkAuthStatus:', error);
        setAuthenticated(false);
        setIsReady(true);
        SplashScreen.hideAsync();
      });
    }, 1000); // Increased delay to ensure stores are initialized
  }, [setAuthenticated, updateProfile, isAuthenticatedInStore]);
  
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            title: 'Sign In',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="google/callback"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            title: 'Nutrition Chat',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="stats"
          options={{
            title: 'Health Stats',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Your Profile',
          }}
        />
        <Stack.Screen
          name="meal/[id]"
          options={{
            title: 'Meal Details',
          }}
        />
        <Stack.Screen
          name="plan/[id]"
          options={{
            title: 'Plan Details',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      
      {/* Error toast is completely disabled */}
      {false && authError && !isAuthenticatedInStore && showAuthError && (
        <View style={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 20, 
          right: 20, 
          backgroundColor: colors.error + 'E6', 
          padding: 16, 
          borderRadius: 8 
        }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Authentication Error</Text>
          <Text style={{ color: 'white', marginTop: 4 }}>{authError}</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}

// Root layout with theme provider
export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // CRITICAL: This hook is required and must never be removed
  useFrameworkReady();
  
  useEffect(() => {
    // Initialize user store
    const initializeApp = async () => {
      try {
        // Clear any stale auth state that might be causing issues
        await AsyncStorage.removeItem('auth0_code_verifier');
        await AsyncStorage.removeItem('auth0_state');
        
        // Give time for stores to initialize
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true); // Still proceed even if there's an error
      }
    };
    
    initializeApp().catch((error) => {
      console.error('Error in initializeApp:', error);
      setIsInitialized(true); // Still proceed even if there's an error
    });
  }, []);
  
  if (!isInitialized) {
    return null; // Don't render anything until initialized
  }
  
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}