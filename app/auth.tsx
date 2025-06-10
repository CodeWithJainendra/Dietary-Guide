import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { loginWithAuth0 } from '@/lib/auth0';
import { useUserStore } from '@/store/userStore';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Lock, User } from 'lucide-react-native';

export default function AuthScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);
  const updateProfile = useUserStore((state) => state.updateProfile);
  
  const handleAuth0Login = async () => {
    try {
      setLoading(true);
      
      // Clear any previous auth state to avoid conflicts
      await AsyncStorage.removeItem('auth0_code_verifier');
      await AsyncStorage.removeItem('auth0_state');
      
      // Attempt Auth0 login
      const result = await loginWithAuth0();
      
      if (result.success) {
        console.log('Auth0 login successful in auth screen');
        
        // If we have user data from Auth0, update the profile
        if (result.user) {
          const userProfile = {
            userId: result.user.sub,
            email: result.user.email,
            name: result.user.name || result.user.nickname || result.user.email?.split('@')[0] || '',
            photoUrl: result.user.picture,
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
          updateProfile(userProfile);
        }
        
        // Mark as authenticated
        setAuthenticated(true);
        
        // Navigate to main app
        console.log('Navigating to main app after successful login');
        router.replace('/(tabs)');
      } else {
        console.log('Auth0 login failed:', result.error);
        
        // Show error message
        Alert.alert(
          'Authentication Failed',
          result.error || 'Could not sign in. Please try again.',
          [{ text: 'OK' }]
        );
        
        // For development/testing, allow skipping authentication
        if (Platform.OS === 'web' || __DEV__) {
          console.log('Development mode: Creating fallback profile');
          createFallbackProfile();
        }
      }
    } catch (error) {
      console.error('Error during Auth0 login:', error);
      
      // Show error message
      Alert.alert(
        'Authentication Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
      
      // For development/testing, allow skipping authentication
      if (Platform.OS === 'web' || __DEV__) {
        console.log('Development mode: Creating fallback profile');
        createFallbackProfile();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to create a fallback profile for development
  const createFallbackProfile = () => {
    // Create a fallback profile for development with a unique userId
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
    router.replace('/(tabs)');
  };
  
  const handleSkipAuth = () => {
    if (Platform.OS === 'web' || __DEV__) {
      console.log('Development mode: Skipping authentication');
      createFallbackProfile();
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🌟 Healthy Lifestyle</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your personal AI nutrition companion
        </Text>
      </View>
      
      <Card style={styles.authCard}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <User size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sign In</Text>
          </View>
          
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Sign in to access your personalized nutrition plans, track your meals, and get AI-powered health recommendations.
          </Text>
          
          <Button
            title="Sign in with Auth0"
            onPress={handleAuth0Login}
            leftIcon={<Lock size={18} color="white" />}
            loading={loading}
            style={styles.authButton}
          />
          
          {(Platform.OS === 'web' || __DEV__) && (
            <TouchableOpacity onPress={handleSkipAuth} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                Skip authentication (Development only)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  authCard: {
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  authButton: {
    width: '100%',
    marginBottom: 16,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});