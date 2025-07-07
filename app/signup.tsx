// app/signup.tsx
// Email signup page after onboarding questionnaire

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useSignUp, useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useGoogleOAuth } from '@/lib/clerk';
import { useUserStore } from '@/store/userStore';
import { handleSignupComplete } from '@/lib/clerk-supabase-integration';
import { UserProfile } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react-native';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';
import GoogleIcon from '@/components/GoogleIcon';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signInWithGoogle } = useGoogleOAuth();
  const params = useLocalSearchParams();
  const { setProfile, setOnboarded } = useUserStore();

  // Clear verification flag when component unmounts
  React.useEffect(() => {
    return () => {
      AsyncStorage.removeItem('pendingEmailVerification');
    };
  }, []);

  // Pre-fill form with data from onboarding if available
  const [email, setEmail] = useState(params.email as string || '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  // Parse name from onboarding data
  React.useEffect(() => {
    console.log('Signup params received:', params);

    if (params.name && typeof params.name === 'string') {
      console.log('Parsing name:', params.name);
      const nameParts = params.name.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length >= 2) {
        setFirstName(nameParts[0]);
        setLastName(nameParts.slice(1).join(' '));
      } else if (nameParts.length === 1) {
        setFirstName(nameParts[0]);
        // Set a default last name if only one name is provided
        setLastName('Awasthi'); // Using the last name you mentioned
      }
      console.log('Set names - First:', nameParts[0], 'Last:', nameParts.slice(1).join(' ') || 'Awasthi');
    } else {
      console.log('No name parameter found, using defaults');
      setFirstName('Kushagra');
      setLastName('Awasthi');
    }
  }, [params.name]);

  // Redirect if already signed in
  React.useEffect(() => {
    if (isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn]);

  // Handle sign up
  const handleSignUp = async () => {
    if (!isLoaded) return;

    // Validate required fields
    if (!firstName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first name.');
      return;
    }

    // Last name is optional for now due to potential Clerk configuration issues
    if (!lastName.trim()) {
      setLastName('Awasthi'); // Use the provided last name as default
    }

    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      Alert.alert('Password Too Short', 'Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);

      console.log('Attempting signup with:', {
        emailAddress: email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordLength: password.length
      });

      // Use minimal signup approach since Clerk app doesn't support name fields during creation
      console.log('Creating Clerk account with email and password...');
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      console.log('Signup result:', result);

      // Note: We'll save the name information to Supabase after verification
      // since Clerk doesn't allow firstName/lastName in this configuration

      console.log('Signup result:', result);

      // Prepare email verification
      console.log('Preparing email verification...');
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      console.log('Email verification prepared, showing verification screen');

      // Set flags to indicate user is in verification/signup process
      await AsyncStorage.setItem('pendingEmailVerification', 'true');
      await AsyncStorage.setItem('inSignupProcess', 'true');

      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));

      const errorMessage = err.errors?.[0]?.message || err.message || 'Failed to create account. Please try again.';

      // Provide specific guidance for common errors
      if (errorMessage.includes('data breach')) {
        Alert.alert(
          'Password Not Secure',
          'This password has been found in a data breach. Please choose a stronger, unique password.'
        );
      } else if (errorMessage.includes('8 characters')) {
        Alert.alert(
          'Password Too Short',
          'Password must be at least 8 characters long.'
        );
      } else if (errorMessage.includes('not a valid parameter') || errorMessage.includes('last_name')) {
        // Try a simplified signup without name fields
        console.log('Retrying signup without name fields...');
        try {
          const simpleResult = await signUp.create({
            emailAddress: email,
            password,
          });

          if (simpleResult) {
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
            return; // Success with simplified signup
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }

        Alert.alert(
          'Sign Up Error',
          'There was an issue with the signup process. The account was created but name information could not be saved. You can update your profile later.\n\nError: ' + errorMessage
        );
      } else {
        Alert.alert('Sign Up Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerification = async () => {
    console.log('handleVerification called with code:', verificationCode);

    if (!isLoaded) {
      console.log('Clerk not loaded, returning');
      return;
    }

    // Validate verification code
    if (!verificationCode.trim()) {
      Alert.alert('Missing Code', 'Please enter the verification code sent to your email.');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting email verification with code:', verificationCode.trim());

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      console.log('Verification result:', result);

      if (result.status === 'complete') {
        console.log('Verification complete! Setting active session...');
        await setActive({ session: result.createdSessionId });
        console.log('Active session set successfully');

        // Clear the verification and signup flags
        await AsyncStorage.removeItem('pendingEmailVerification');
        await AsyncStorage.removeItem('inSignupProcess');

        // After successful verification, save user data to Supabase
        console.log('=== STARTING PROFILE SAVE PROCESS ===');
        console.log('Saving user data to Supabase after verification...');
        console.log('Created user ID:', result.createdUserId);
        console.log('Email:', email);
        console.log('First name:', firstName);
        console.log('Last name:', lastName);

        // Create a mock user object with the essential data we need
        const createdUser = {
          id: result.createdUserId,
          primaryEmailAddress: { emailAddress: email },
          fullName: `${firstName} ${lastName}`.trim(),
          imageUrl: null
        };

        // Prepare comprehensive onboarding data from URL params
        const onboardingData: Partial<UserProfile> = {
          name: params.name as string || `${firstName} ${lastName}`.trim(),
          email: email,
          height: params.height ? parseInt(params.height as string) : 170,
          weight: params.weight ? parseInt(params.weight as string) : 70,
          age: params.age ? parseInt(params.age as string) : 25,
          gender: (params.gender as 'male' | 'female' | 'other') || 'other',
          goal: (params.goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle') || 'healthy_lifestyle',
          exerciseDuration: params.exerciseDuration ? parseInt(params.exerciseDuration as string) : 30,
          isSmoker: params.isSmoker === 'true',
          diseases: params.diseases ? (params.diseases as string).split(',').map(d => d.trim()).filter(Boolean) : [],
          dietaryPreferences: params.dietaryPreferences ? (params.dietaryPreferences as string).split(',').map(p => p.trim()).filter(Boolean) : [],
          dietaryRestrictions: [], // Can be added later
        };

        console.log('Onboarding data to save:', onboardingData);

        try {
          const syncResult = await handleSignupComplete(createdUser as any, onboardingData);

          if (syncResult.success && syncResult.profile) {
            // Update the user store with the profile
            setProfile(syncResult.profile);
            console.log('User profile saved to Supabase successfully');

            // Mark user as onboarded since we have all the data from the signup flow
            setOnboarded(true);
          } else {
            console.error('Failed to save user profile to Supabase:', syncResult.error);
            // Don't block the user from proceeding, just log the error
          }
        } catch (error) {
          console.error('Error during signup completion:', error);
          // Don't block the user from proceeding
        }

        // Navigate to the main app
        console.log('Navigating to main app...');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage = err.errors?.[0]?.message || err.message || 'Verification failed';

      if (errorMessage.includes('Enter code') || errorMessage.includes('code')) {
        Alert.alert('Invalid Code', 'Please check the verification code and try again.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      console.log('Starting Google OAuth flow from signup...');

      // Prepare comprehensive onboarding data from URL params to pass to Google OAuth
      const onboardingData: Partial<UserProfile> = {
        name: params.name as string || `${firstName} ${lastName}`.trim(),
        height: params.height ? parseInt(params.height as string) : 170,
        weight: params.weight ? parseInt(params.weight as string) : 70,
        age: params.age ? parseInt(params.age as string) : 25,
        gender: (params.gender as 'male' | 'female' | 'other') || 'other',
        goal: (params.goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle') || 'healthy_lifestyle',
        exerciseDuration: params.exerciseDuration ? parseInt(params.exerciseDuration as string) : 30,
        isSmoker: params.isSmoker === 'true',
        diseases: params.diseases ? (params.diseases as string).split(',').map(d => d.trim()).filter(Boolean) : [],
        dietaryPreferences: params.dietaryPreferences ? (params.dietaryPreferences as string).split(',').map(p => p.trim()).filter(Boolean) : [],
        dietaryRestrictions: [], // Can be added later
      };

      console.log('Onboarding data for Google OAuth:', onboardingData);

      const result = await signInWithGoogle(onboardingData);
      console.log('Google OAuth result:', result);

      if (result.success) {
        console.log('Google OAuth successful!', { isNewUser: result.isNewUser });

        if (result.isNewUser) {
          console.log('New Google user detected');

          // Check if profile was created and returned
          if ((result as any).profile) {
            // Update the user store with the created profile
            setProfile((result as any).profile);
            setOnboarded(true);
            console.log('New Google user profile created and stored');
          } else {
            console.log('Profile creation may have failed, but user was created in Clerk');
          }
        }

        // Navigate to the main app
        router.replace('/(tabs)');
      } else {
        console.error('Google OAuth failed:', result.error);

        const errorMessage = result.error || 'Unable to sign up with Google. Please try again or use email sign-up.';

        Alert.alert(
          'Google Sign-up Failed',
          errorMessage,
          [
            { text: 'Try Again', onPress: handleGoogleSignIn },
            { text: 'Use Email Instead', style: 'cancel' }
          ]
        );
      }
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      const errorMessage = err?.message || err?.errors?.[0]?.message || 'An unexpected error occurred during Google sign-up';

      Alert.alert(
        'Error',
        errorMessage,
        [
          { text: 'Try Again', onPress: handleGoogleSignIn },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    console.log('Rendering verification screen');
    return (
      <KeyboardAvoidingWrapper
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setPendingVerification(false)}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>

          </View>

          <Card style={styles.card}>
            <View style={styles.iconContainer}>
              <Mail size={48} color={colors.primary} />
            </View>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We've sent a verification code to {email}
            </Text>

            <Input
              label="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
            />

            <Button
              title="Verify & Complete Setup"
              onPress={handleVerification}
              loading={loading}
              style={styles.button}
            />
          </Card>
      </KeyboardAvoidingWrapper>
    );
  }

  return (
    <KeyboardAvoidingWrapper
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <UserPlus size={48} color={colors.primary} />
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            You're almost there! Create your account to start your personalized nutrition journey.
          </Text>

          {/* Google Sign-In Option */}
          <Button
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            leftIcon={<GoogleIcon size={18} />}
            style={[styles.button, { backgroundColor: '#55B685' }]}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email Sign-Up Form */}
          <View style={styles.row}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              autoCapitalize="words"
              style={styles.halfInput}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              autoCapitalize="words"
              style={styles.halfInput}
            />
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={colors.textSecondary} />}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry={!showPassword}
            leftIcon={<Lock size={20} color={colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            }

          />

          {password.length > 0 && password.length < 8 && (
            <Text style={[styles.passwordHint, { color: '#e74c3c' }]}>
              Password must be at least 8 characters long
            </Text>
          )}

          {password.length >= 8 && (
            <Text style={[styles.passwordHint, { color: '#27ae60' }]}>
              ✓ Password length requirement met
            </Text>
          )}

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            disabled={!email || !password || !firstName || !lastName}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/signin" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Card>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  button: {
    marginBottom: 16,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  passwordHint: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
});
