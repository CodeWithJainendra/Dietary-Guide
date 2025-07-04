// components/AuthStatus.tsx
// Debug component to show current authentication status

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthGuard } from './AuthGuard';
import Card from './Card';
import Button from './Button';
import { LogOut, User, Settings } from 'lucide-react-native';

interface AuthStatusProps {
  showDebugInfo?: boolean;
}

export default function AuthStatus({ showDebugInfo = false }: AuthStatusProps) {
  const { colors } = useTheme();
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);
  const { isAuthenticated, isFullySetup, isLoading, needsOnboarding } = useAuthGuard();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoToOnboarding = () => {
    router.push('/onboarding');
  };

  const handleGoToProfile = () => {
    router.push('/profile');
  };

  if (!showDebugInfo && isLoading) {
    return null; // Don't show anything while loading
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Authentication Status
        </Text>
        {isAuthenticated && (
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <LogOut size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusContainer}>
        <StatusItem
          label="Clerk Loaded"
          value={isLoaded}
          color={isLoaded ? colors.success : colors.error}
        />
        <StatusItem
          label="Signed In"
          value={isSignedIn}
          color={isSignedIn ? colors.success : colors.error}
        />
        <StatusItem
          label="Onboarded"
          value={isOnboarded}
          color={isOnboarded ? colors.success : colors.warning}
        />
        <StatusItem
          label="Has Profile"
          value={!!profile}
          color={profile ? colors.success : colors.warning}
        />
        <StatusItem
          label="Fully Setup"
          value={isFullySetup}
          color={isFullySetup ? colors.success : colors.warning}
        />
      </View>

      {showDebugInfo && (
        <View style={styles.debugContainer}>
          <Text style={[styles.debugTitle, { color: colors.textSecondary }]}>
            Debug Info
          </Text>
          <Text style={[styles.debugText, { color: colors.textSecondary }]}>
            Current Route: /{segments.join('/')}
          </Text>
          <Text style={[styles.debugText, { color: colors.textSecondary }]}>
            User ID: {profile?.userId || 'None'}
          </Text>
          <Text style={[styles.debugText, { color: colors.textSecondary }]}>
            Email: {profile?.email || 'None'}
          </Text>
        </View>
      )}

      {needsOnboarding && (
        <View style={styles.actionContainer}>
          <Button
            title="Complete Onboarding"
            onPress={handleGoToOnboarding}
            leftIcon={<Settings size={16} color="white" />}
            style={styles.actionButton}
          />
        </View>
      )}

      {isFullySetup && (
        <View style={styles.actionContainer}>
          <Button
            title="View Profile"
            onPress={handleGoToProfile}
            leftIcon={<User size={16} color="white" />}
            style={styles.actionButton}
            variant="secondary"
          />
        </View>
      )}
    </Card>
  );
}

interface StatusItemProps {
  label: string;
  value: boolean;
  color: string;
}

function StatusItem({ label, value, color }: StatusItemProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.statusItem}>
      <Text style={[styles.statusLabel, { color: colors.text }]}>
        {label}
      </Text>
      <View style={[styles.statusIndicator, { backgroundColor: color }]}>
        <Text style={styles.statusValue}>
          {value ? '✓' : '✗'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  signOutButton: {
    padding: 8,
  },
  statusContainer: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
    flex: 1,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
  },
  actionContainer: {
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
});
