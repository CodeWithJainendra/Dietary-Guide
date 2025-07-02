// app/test-integration.tsx
// Test page to verify Clerk-Supabase integration

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserStore } from '@/store/userStore';
import { useClerkSupabase } from '@/hooks/useClerkSupabase';
import { testSupabaseConnection, testProfileInsertion, getTableSchema } from '@/utils/test-supabase';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ArrowLeft, User, Database, Sync, TestTube } from 'lucide-react-native';

export default function TestIntegrationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { profile } = useUserStore();
  const { syncProfile, updateProfile, refreshProfile, error, isInitializing } = useClerkSupabase();

  const handleSyncProfile = async () => {
    try {
      await syncProfile();
      Alert.alert('Success', 'Profile synced successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sync profile');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        name: 'Updated Name',
        age: 30,
      });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleRefreshProfile = async () => {
    try {
      await refreshProfile();
      Alert.alert('Success', 'Profile refreshed successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to refresh profile');
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testSupabaseConnection();
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.success ? 'Supabase connection successful!' : result.error || 'Connection failed'
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Test failed');
    }
  };

  const handleTestInsertion = async () => {
    try {
      const result = await testProfileInsertion();
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.success ? 'Profile insertion test successful!' : result.error || 'Insertion failed'
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Test failed');
    }
  };

  const handleTestSchema = async () => {
    try {
      const result = await getTableSchema();
      Alert.alert(
        'Schema Info',
        result.schemaError || 'Schema test completed'
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Test failed');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Integration Test</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Clerk User</Text>
          </View>
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Signed In:</Text>
          <Text style={[styles.value, { color: colors.text }]}>{isSignedIn ? 'Yes' : 'No'}</Text>
          
          {user && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>User ID:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user.id}</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user.primaryEmailAddress?.emailAddress}</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>Name:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user.fullName || 'Not set'}</Text>
            </>
          )}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Supabase Profile</Text>
          </View>
          
          {profile ? (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>User ID:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile.userId}</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>Name:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile.name}</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile.email}</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>Age:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile.age}</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>Goal:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile.goal}</Text>
            </>
          ) : (
            <Text style={[styles.value, { color: colors.textSecondary }]}>No profile data</Text>
          )}
        </View>
      </Card>

      {error && (
        <Card style={[styles.card, { backgroundColor: '#fee' }]}>
          <Text style={[styles.errorText, { color: '#c53030' }]}>Error: {error}</Text>
        </Card>
      )}

      <Card style={styles.card}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sync size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
          </View>

          <Button
            title="Sync Profile"
            onPress={handleSyncProfile}
            loading={isInitializing}
            style={styles.button}
          />

          <Button
            title="Update Profile"
            onPress={handleUpdateProfile}
            loading={isInitializing}
            style={styles.button}
          />

          <Button
            title="Refresh Profile"
            onPress={handleRefreshProfile}
            loading={isInitializing}
            style={styles.button}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TestTube size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Supabase Tests</Text>
          </View>

          <Button
            title="Test Connection"
            onPress={handleTestConnection}
            style={styles.button}
          />

          <Button
            title="Test Profile Insertion"
            onPress={handleTestInsertion}
            style={styles.button}
          />

          <Button
            title="Test Schema"
            onPress={handleTestSchema}
            style={styles.button}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    padding: 16,
  },
  button: {
    marginBottom: 12,
  },
});
