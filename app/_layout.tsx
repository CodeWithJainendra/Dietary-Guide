import React, { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text, Alert, Platform, Image } from 'react-native';
import { useUserStore } from '@/store/userStore';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ClerkProvider } from '@clerk/clerk-expo';
import { publishableKey, tokenCache } from '@/lib/clerk';
import { ClerkSupabaseProvider } from '@/components/ClerkSupabaseProvider';
import appConfig from '../app.json';

const logoLight = require('../assets/images/logo-light.png');
const logoDark = require('../assets/images/logo-dark.png');

// Conditionally import tRPC only if we have a valid environment
let trpc: any = null;
let trpcClient: any = null;

try {
  const trpcModule = require('@/lib/trpc');
  trpc = trpcModule.trpc;
  trpcClient = trpcModule.trpcClient;
} catch (error) {
  console.warn('tRPC not available:', error);
}

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a client
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: false, // Disable retries to prevent infinite loops
//       staleTime: 1000 * 60 * 5, // 5 minutes
//     },
//   },
// });

// Root layout wrapper with theme provider
function RootLayoutContent() {
  const { theme, colors } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthError, setShowAuthError] = useState(false);
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const isAuthenticatedInStore = useUserStore((state) => state.isAuthenticated);
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);
  const fetchProfile = useUserStore((state) => state.fetchProfile);
  
  // Helper to select logo based on theme
  const appLogo = theme === 'dark' ? logoDark : logoLight;
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking auth status in _layout...');
        
        // Clear any stale auth state that might be causing issues
        await AsyncStorage.removeItem('auth0_code_verifier').catch(() => {});
        await AsyncStorage.removeItem('auth0_state').catch(() => {});
        
        // For now, just set ready state without complex auth checks
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      } catch (error) {
        console.log('Error checking auth status:', error);
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    };
    
    // Add a slight delay to ensure stores are initialized
    setTimeout(() => {
      checkAuthStatus().catch((error) => {
        console.error('Error in checkAuthStatus:', error);
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      });
    }, 1000);
  }, [setAuthenticated, updateProfile, isAuthenticatedInStore]);
  
  // Fetch user profile on app load if not already loaded
  useEffect(() => {
    const tryFetchProfile = async () => {
      // Try to get userId from persisted profile or auth0 tokens
      let userId = profile?.id || profile?.userId;
      if (!userId) {
        // Try to get from auth0 tokens if available (customize as needed)
        // Example: const idToken = useUserStore.getState().auth0.idToken;
        // Parse userId from idToken if your app supports it
      }
      if (userId) {
        await fetchProfile(userId.toString());
      }
    };
    if (!profile) {
      tryFetchProfile();
    }
  }, [profile, fetchProfile]);
  
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Image source={appLogo} style={{ width: 120, height: 120, marginBottom: 24 }} resizeMode="contain" />
        <ActivityIndicator size="large" color={colors.primary} />
        <View style={{ position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontWeight: 'bold' }}>{appConfig.Version || appConfig.expo?.version || 'v1.0.0'}</Text>
        </View>
      </View>
    );
  }
  
  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ClerkSupabaseProvider>
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
          name="signin"
          options={{
            title: 'Sign In',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="clerk-auth"
          options={{
            title: 'Authentication',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            title: 'Get Started',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            title: 'Sign Up',
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
          name="test-integration"
          options={{
            title: 'Integration Test',
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
      </ClerkSupabaseProvider>
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
        await AsyncStorage.removeItem('auth0_code_verifier').catch(() => {});
        await AsyncStorage.removeItem('auth0_state').catch(() => {});
        
        // Give time for stores to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
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
  
  // Conditionally wrap with tRPC provider if available
  const content = (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </ClerkProvider>
  );

  if (trpc && trpcClient) {
    return (
      <trpc.Provider client={trpcClient}>
        {content}
      </trpc.Provider>
    );
  }

  return content;
}