// components/ClerkSupabaseProvider.tsx
// Provider component that handles Clerk-Supabase integration

import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useTheme } from '@/contexts/ThemeContext';
import { useClerkSupabase } from '@/hooks/useClerkSupabase';

interface ClerkSupabaseProviderProps {
  children: React.ReactNode;
}

export function ClerkSupabaseProvider({ children }: ClerkSupabaseProviderProps) {
  const { colors } = useTheme();
  const { isSignedIn } = useAuth();
  const { isInitializing, error, isReady } = useClerkSupabase();

  // Show loading screen while initializing user data
  if (isSignedIn && (isInitializing || !isReady)) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          color: colors.text, 
          marginTop: 16, 
          fontSize: 16 
        }}>
          Setting up your profile...
        </Text>
      </View>
    );
  }

  // Show error if initialization failed
  if (error) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background,
        padding: 20
      }}>
        <Text style={{ 
          color: colors.error || '#e74c3c', 
          fontSize: 16,
          textAlign: 'center',
          marginBottom: 16
        }}>
          Failed to initialize user profile
        </Text>
        <Text style={{ 
          color: colors.textSecondary, 
          fontSize: 14,
          textAlign: 'center'
        }}>
          {error}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default ClerkSupabaseProvider;
