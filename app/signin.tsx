// app/signin.tsx
// Dedicated sign-in page for users with existing accounts

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
  Image,
} from 'react-native';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useGoogleOAuth } from '@/lib/clerk';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import GoogleIcon from '@/components/GoogleIcon';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';
import { LinearGradient } from 'expo-linear-gradient';

// Import logo assets
const logoLight = require('../assets/images/dietary-Logo.png');
const logoDark = require('../assets/images/dietary-Logo.png');

export default function SignInScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const { signInWithGoogle } = useGoogleOAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  // Redirect if already signed in - let AuthGuard handle this
  React.useEffect(() => {
    if (isSignedIn) {
      // AuthGuard will handle the proper redirect based on onboarding status
      console.log('User signed in, AuthGuard will handle redirect');
    }
  }, [isSignedIn]);

  // Handle sign in
  const handleSignIn = async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else if (result.status === 'needs_first_factor') {
        // Handle MFA or other verification
        setPendingVerification(true);
      } else {
        console.log('Sign in incomplete:', result);
        Alert.alert('Error', 'Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      Alert.alert(
        'Sign In Failed', 
        err.errors?.[0]?.message || 'Failed to sign in. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerification = async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    try {
      await signIn?.create({
        identifier: email,
        strategy: 'reset_password_email_code',
      });
      Alert.alert(
        'Reset Email Sent',
        'Check your email for password reset instructions.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to send reset email');
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      console.log('Starting Google OAuth flow from signin...');

      const result = await signInWithGoogle();
      console.log('Google OAuth result:', result);

      if (result.success) {
        console.log('Google OAuth successful!', { isNewUser: result.isNewUser });

        if (result.isNewUser) {
          console.log('New user detected, continuing with onboarding...');
          // New user - basic profile has been created, now go to onboarding to complete it
          router.replace('/onboarding');
        } else {
          console.log('Existing user, going to main app...');
          // Existing user - navigate to main app
          router.replace('/(tabs)');
        }
      } else {
        console.error('Google OAuth failed:', result.error);

        const errorMessage = result.error || 'Unable to sign in with Google. Please try again.';

        Alert.alert(
          'Google Sign-in Failed',
          errorMessage,
          [
            { text: 'Try Again', onPress: handleGoogleSignIn },
            { text: 'Use Email Instead', style: 'cancel' }
          ]
        );
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const errorMessage = err?.message || err?.errors?.[0]?.message || 'An unexpected error occurred during Google sign-in';

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
    return (
      <KeyboardAvoidingWrapper>
        <LinearGradient
          colors={theme === 'dark'
            ? ['#2d4a3e', '#1e3329', '#0f1f17', '#1a2f22']
            : ['#6bc795', '#55b685', '#4a9d73', '#3e8461', '#2f6b47']
          }
          locations={theme === 'dark'
            ? [0, 0.4, 0.8, 1]
            : [0, 0.25, 0.5, 0.75, 1]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setPendingVerification(false)}
                style={styles.backButton}
              >
                <ArrowLeft size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Mail size={48} color="#55b685" />
              </View>
            </View>

            <View style={styles.welcomeContainer}>
              <Text style={styles.title}>
                Check Your Email
              </Text>
              <Text style={styles.subtitle}>
                We've sent a verification code to {email}
              </Text>
            </View>

            <View style={styles.formContainer}>
              <Input
                label="Verification Code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                leftIcon={<Lock size={20} color="#55b685" />}
                containerStyle={styles.inputContainer}
                labelStyle={styles.inputLabel}
              />

              <Button
                title="Verify & Sign In"
                onPress={handleVerification}
                loading={loading}
                style={styles.signInButton}
              />
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingWrapper>
    );
  }

  return (
    <KeyboardAvoidingWrapper>
      <LinearGradient
        colors={theme === 'dark'
          ? ['#2d4a3e', '#1e3329', '#0f1f17', '#1a2f22']
          : ['#6bc795', '#55b685', '#4a9d73', '#3e8461', '#2f6b47']
        }
        locations={theme === 'dark'
          ? [0, 0.4, 0.8, 1]
          : [0, 0.25, 0.5, 0.75, 1]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button */}
          {/* <View style={styles.header}> */}
            {/* <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity> */}
          {/* </View> */}

          {/* Logo */}
          <View style={styles.logoContainer}>
              <Image
                source={theme === 'dark' ? logoDark : logoLight}
                style={styles.logo}
                resizeMode="contain"
              />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.title}>
              Welcome Back
            </Text>
            <Text style={styles.subtitle}>
              Sign in to your account to continue your health journey
            </Text>
          </View>

          {/* Sign In Form */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={20} color="#55b685" />}
                containerStyle={styles.inputContainer}
                labelStyle={styles.inputLabel}
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={20} color="#55b685" />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color="#55b685" />
                    ) : (
                      <Eye size={20} color="#55b685" />
                    )}
                  </TouchableOpacity>
                }
                containerStyle={styles.inputContainer}
                labelStyle={styles.inputLabel}
              />

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                disabled={!email || !password}
                style={styles.signInButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  or continue with
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={handleGoogleSignIn}
                style={styles.googleButton}
                disabled={loading}
              >
                <GoogleIcon size={20} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
                {loading && <ActivityIndicator size="small" color="#55B685" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>
              Don't have an account?{' '}
            </Text>
            <Link href="/clerk-auth" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLink}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logo: {
    width: 200,
    height: 200,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  form: {
    gap: 20,
  },
  input: {
    marginBottom: 0,
  },
  inputContainer: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#55b685',
  },
  signInButton: {
    marginTop: 24,
    backgroundColor: '#55b685',
    borderRadius: 12,
    height: 52,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signUpLink: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textDecorationLine: 'underline',
  },
});
