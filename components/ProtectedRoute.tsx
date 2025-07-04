// components/ProtectedRoute.tsx
// Simple protected route wrapper component

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthProtection } from '@/hooks/useAuthProtection';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  loadingMessage?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireOnboarding = true,
  loadingMessage = "Loading..."
}: ProtectedRouteProps) {
  const { colors } = useTheme();
  const { isLoading, shouldShowContent } = useAuthProtection({
    requireAuth,
    requireOnboarding
  });

  if (isLoading) {
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
          {loadingMessage}
        </Text>
      </View>
    );
  }

  if (!shouldShowContent) {
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
          Redirecting...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
