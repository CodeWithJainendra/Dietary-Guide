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
} from 'react-native';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useGoogleOAuth } from '@/lib/clerk';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, UserCheck, Chrome } from 'lucide-react-native';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';

export default function SignInScreen() {
  const { colors } = useTheme();
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
      console.log('Starting Google OAuth flow...');

      const result = await signInWithGoogle();

      if (result.success) {
        console.log('Google OAuth successful!', { isNewUser: result.isNewUser });

        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        console.error('Google OAuth failed:', result.error);
        Alert.alert(
          'Sign-in Failed',
          'Unable to sign in with Google. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
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
              style={styles.input}
            />

            <Button
              title="Verify & Sign In"
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
            <UserCheck size={48} color={colors.primary} />
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to your account to continue your nutrition journey
          </Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={colors.textSecondary} />}
            style={styles.input}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
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
            style={styles.input}
          />

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            disabled={!email || !password}
            style={styles.button}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Button
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            leftIcon={<Chrome size={18} color="white" />}
            loading={loading}
            style={[styles.button, { backgroundColor: '#4285F4' }]}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/clerk-auth" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/auth')}
            style={styles.altAuthButton}
          >
            <Text style={[styles.altAuthText, { color: colors.textSecondary }]}>
              More sign-in options
            </Text>
          </TouchableOpacity>
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
  input: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
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
  altAuthButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  altAuthText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
