// components/AuthGuardTest.tsx
// Simple test to verify AuthGuard exports are working

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

// Test importing the AuthGuard functions
import AuthGuard, { useAuthGuard, withAuthGuard } from './AuthGuard';

// Simple test component
function TestComponent() {
  const { colors } = useTheme();
  const { isAuthenticated, isFullySetup, isLoading } = useAuthGuard();

  return (
    <View style={{ padding: 20, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 16, marginBottom: 10 }}>
        AuthGuard Test Component
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
        isAuthenticated: {isAuthenticated ? 'true' : 'false'}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
        isFullySetup: {isFullySetup ? 'true' : 'false'}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
        isLoading: {isLoading ? 'true' : 'false'}
      </Text>
    </View>
  );
}

// Test the withAuthGuard HOC
const ProtectedTestComponent = withAuthGuard(TestComponent);

// Export both versions for testing
export { TestComponent, ProtectedTestComponent };
export default TestComponent;
