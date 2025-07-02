// components/ClerkAuth.tsx
// Clerk authentication component

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSignIn, useSignUp, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Input';
import  Button  from '@/components/Button';
import  Card  from '@/components/Card';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

interface ClerkAuthProps {
  mode?: 'signin' | 'signup';
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

export function ClerkAuth({ mode = 'signup', onModeChange }: ClerkAuthProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { isSignedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  // Handle sign in
  const handleSignIn = async () => {
    if (!signInLoaded) return;

    try {
      setLoading(true);
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.log('Sign in incomplete:', result);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    if (!signUpLoaded) return;

    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter both first and last name.');
      return;
    }

    try {
      setLoading(true);

      // Create signup with all data at once (recommended approach)
      await signUp.create({
        emailAddress: email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      const errorMessage = err.errors?.[0]?.message || 'Failed to sign up';

      if (errorMessage.includes('not a valid parameter')) {
        Alert.alert('Error', 'There was an issue with the signup process. Please try again.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle email verification
  const handleVerification = async () => {
    if (!signUpLoaded) return;

    try {
      setLoading(true);
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  // If already signed in, redirect
  if (isSignedIn) {
    router.replace('/(tabs)');
    return null;
  }

  // Email verification screen
  if (pendingVerification) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Mail size={24} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>
                Verify Email
              </Text>
            </View>
            
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a verification code to {email}
            </Text>

            <Input
              placeholder="Enter verification code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            <Button
              title="Verify Email"
              onPress={handleVerification}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity
              onPress={() => setPendingVerification(false)}
              style={styles.linkButton}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Back to Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <User size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Text>
          </View>

          {mode === 'signup' && (
            <>
              <Input
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <Input
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </>
          )}

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            }
          />

          <Button
            title={mode === 'signin' ? 'Sign In' : 'Sign Up'}
            onPress={mode === 'signin' ? handleSignIn : handleSignUp}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity
            onPress={() => {
              if (mode === 'signup') {
                router.push('/auth');
              } else {
                onModeChange?.('signup');
              }
            }}
            style={styles.linkButton}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {mode === 'signin'
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    marginHorizontal: 0,
  },
  cardContent: {
    gap: 16,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
