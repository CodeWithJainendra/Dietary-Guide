import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image, Modal, TextInput } from 'react-native';
import { router, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { loginWithAuth0 } from '@/lib/auth0';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Lock, User } from 'lucide-react-native';
import { generateUUID } from '@/utils/uuid';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';

export default function AuthScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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
      userId: `user-${generateUUID()}`,
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
  
  const handleSendMagicLink = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('A sign-in link has been sent to your email. Please check your inbox and verify.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>

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

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/signin')}
            style={[styles.clerkButton, { borderColor: colors.border }]}
          >
            <User size={18} color={colors.primary} />
            <Text style={[styles.clerkButtonText, { color: colors.primary }]}>
              Sign in with Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/clerk-auth')}
            style={styles.signUpLink}
          >
            <Text style={[styles.signUpText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Sign up here
              </Text>
            </Text>
          </TouchableOpacity>

          {(Platform.OS === 'web' || __DEV__) && (
            <TouchableOpacity onPress={handleSkipAuth} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                Skip authentication (Development only)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
      
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
      >
        <KeyboardAvoidingWrapper
          style={styles.centeredView}
          enableScrollView={false}
        >
          <View style={[styles.modalView, { backgroundColor: colors.card }]}> 
            <View style={styles.iconContainer}>
              <View style={styles.iconEnvelope}>
                <Text style={styles.iconText}>📧</Text>
              </View>
            </View>
            <Text style={[styles.title, { color: colors.primary }]}>That newsletter you'll read</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Are you ready for the best newsletter you've ever read? Seriously. THE BEST</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
                placeholder="the email you actually check"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.success}>{message}</Text> : null}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleSendMagicLink}
              disabled={loading || !email}
            >
              <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send me the goods'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingWrapper>
      </Modal>
      
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modalView: {
    width: 340,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconEnvelope: {
    backgroundColor: '#e6f0fa',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 36,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  success: {
    color: '#27ae60',
    marginBottom: 8,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  clerkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  clerkButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  signUpLink: {
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpText: {
    fontSize: 14,
    textAlign: 'center',
  },
});