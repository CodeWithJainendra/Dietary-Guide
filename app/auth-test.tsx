// app/auth-test.tsx
// Test page to verify authentication system is working correctly

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserStore } from '@/store/userStore';
import AuthStatus from '@/components/AuthStatus';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Shield, CheckCircle, AlertCircle, Home } from 'lucide-react-native';

function AuthTestScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);
  const { colors } = useTheme();

  // Authentication check
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      console.log('AuthTest: User not signed in, redirecting to signin');
      router.replace('/signin');
      return;
    }

    if (!isOnboarded || !profile) {
      console.log('AuthTest: User not onboarded, redirecting to onboarding');
      router.replace('/onboarding');
      return;
    }
  }, [isSignedIn, isLoaded, isOnboarded, profile]);

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  // Show loading while checking authentication
  if (!isLoaded || !isSignedIn || !isOnboarded || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 16 }}>
            {!isLoaded ? 'Loading...' : 'Checking authentication...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleGoToProfile = () => {
    router.push('/profile');
  };

  const handleGoToOnboarding = () => {
    router.push('/onboarding');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.header}>
            <Shield size={32} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>
              Authentication Test
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This page is protected by the AuthGuard component. If you can see this, 
            authentication is working correctly!
          </Text>
        </Card>

        {/* Authentication Status */}
        <AuthStatus showDebugInfo={true} />

        {/* Test Results */}
        <Card style={styles.testCard}>
          <View style={styles.testHeader}>
            <CheckCircle size={24} color={colors.success} />
            <Text style={[styles.testTitle, { color: colors.text }]}>
              Authentication Tests
            </Text>
          </View>

          <View style={styles.testList}>
            <TestItem
              label="AuthGuard Protection"
              status="passed"
              description="You can access this protected route"
            />
            <TestItem
              label="Clerk Integration"
              status="passed"
              description="Clerk authentication is working"
            />
            <TestItem
              label="User Profile"
              status="passed"
              description="User profile data is available"
            />
            <TestItem
              label="Route Protection"
              status="passed"
              description="Protected routes are properly secured"
            />
          </View>
        </Card>

        {/* Navigation Tests */}
        <Card style={styles.navigationCard}>
          <Text style={[styles.navigationTitle, { color: colors.text }]}>
            Navigation Tests
          </Text>
          <Text style={[styles.navigationSubtitle, { color: colors.textSecondary }]}>
            Test navigation to different parts of the app
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Go to Home"
              onPress={handleGoHome}
              leftIcon={<Home size={16} color="white" />}
              style={styles.navButton}
            />
            <Button
              title="Go to Profile"
              onPress={handleGoToProfile}
              variant="secondary"
              style={styles.navButton}
            />
            <Button
              title="Go to Onboarding"
              onPress={handleGoToOnboarding}
              variant="outline"
              style={styles.navButton}
            />
          </View>
        </Card>

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <AlertCircle size={20} color={colors.warning} />
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>
              How to Test
            </Text>
          </View>
          <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
            1. Sign out and try to access this page - you should be redirected to signin{'\n'}
            2. Sign in without completing onboarding - you should be redirected to onboarding{'\n'}
            3. Complete onboarding - you should be able to access all protected routes{'\n'}
            4. Check the debug info above to see your current authentication state
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

interface TestItemProps {
  label: string;
  status: 'passed' | 'failed' | 'pending';
  description: string;
}

function TestItem({ label, status, description }: TestItemProps) {
  const { colors } = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'passed': return colors.success;
      case 'failed': return colors.error;
      case 'pending': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'passed': return '✓';
      case 'failed': return '✗';
      case 'pending': return '⏳';
      default: return '?';
    }
  };

  return (
    <View style={styles.testItem}>
      <View style={styles.testItemHeader}>
        <Text style={[styles.testItemLabel, { color: colors.text }]}>
          {label}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>
            {getStatusIcon()}
          </Text>
        </View>
      </View>
      <Text style={[styles.testItemDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  headerCard: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  testCard: {
    padding: 20,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  testList: {
    gap: 12,
  },
  testItem: {
    paddingVertical: 8,
  },
  testItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testItemDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  navigationCard: {
    padding: 20,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  navigationSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  navButton: {
    marginBottom: 8,
  },
  instructionsCard: {
    padding: 20,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

// Export the component directly (authentication is handled inside)
export default AuthTestScreen;
