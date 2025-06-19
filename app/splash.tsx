import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import Modal from 'react-native-modal';
import { useUserStore } from '@/store/userStore';

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);
  const [biometricError, setBiometricError] = useState('');
  const [showNotVerified, setShowNotVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [manualPassword, setManualPassword] = useState('');
  const [manualError, setManualError] = useState('');

  const updateProfile = useUserStore((state) => state.updateProfile);
  const setOnboarded = useUserStore((state) => state.setOnboarded);
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);

  useEffect(() => {
    const tryBiometricLogin = async () => {
      setLoading(true);
      setBiometricError('');
      setShowNotVerified(false);
      setShowPasswordModal(false);
      // Get stored credentials
      const storedEmail = await SecureStore.getItemAsync('user_email');
      const storedPassword = await SecureStore.getItemAsync('user_password');
      setEmail(storedEmail || '');
      if (!storedEmail || !storedPassword) {
        // No credentials: route to onboarding
        setLoading(false);
        router.replace('/');
        return;
      }
      // Biometric auth
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        // Only show password modal if both credentials exist
        if (storedEmail && storedPassword) {
          setShowPasswordModal(true);
        } else {
          setLoading(false);
          router.replace('/');
          return;
        }
        setLoading(false);
        return;
      }
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        fallbackLabel: 'Enter Passcode',
      });
      if (!biometricResult.success) {
        // Only show password modal if both credentials exist
        if (storedEmail && storedPassword) {
          setShowPasswordModal(true);
        } else {
          setLoading(false);
          router.replace('/');
          return;
        }
        setLoading(false);
        return;
      }
      // Try login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: storedEmail,
        password: storedPassword,
      });
      if (error) {
        setBiometricError('Login failed. Please try again.');
        // Clear credentials and state
        await SecureStore.deleteItemAsync('user_email');
        await SecureStore.deleteItemAsync('user_password');
        setAuthenticated(false);
        setLoading(false);
        router.replace('/');
        return;
      }
      // Check if email is verified
      if (!data.user?.email_confirmed_at) {
        setShowNotVerified(true);
        setLoading(false);
        return;
      }
      // Fetch user profile from Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profileData) {
        updateProfile(profileData);
        setOnboarded(true);
        setAuthenticated(true);
        setLoading(false);
        router.replace('/(tabs)');
      } else {
        // No profile found, clear credentials and route to onboarding
        await SecureStore.deleteItemAsync('user_email');
        await SecureStore.deleteItemAsync('user_password');
        setAuthenticated(false);
        setLoading(false);
        router.replace('/');
      }
    };
    tryBiometricLogin();
  }, []);

  // Manual password login handler
  const handleManualLogin = async () => {
    setManualError('');
    setLoading(true);
    const storedEmail = await SecureStore.getItemAsync('user_email');
    if (!storedEmail) {
      setManualError('No email found. Please sign up again.');
      setLoading(false);
      return;
    }
    if (!manualPassword) {
      setManualError('Password is required.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: storedEmail,
      password: manualPassword,
    });
    if (error) {
      setManualError('Incorrect password.');
      // Clear credentials and state
      await SecureStore.deleteItemAsync('user_email');
      await SecureStore.deleteItemAsync('user_password');
      setAuthenticated(false);
      setLoading(false);
      router.replace('/');
      return;
    }
    if (!data.user?.email_confirmed_at) {
      setShowNotVerified(true);
      setLoading(false);
      setAuthenticated(false);
      return;
    }
    // Fetch user profile from Supabase
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (profileData) {
      updateProfile(profileData);
      setOnboarded(true);
      setAuthenticated(true);
      setShowPasswordModal(false);
      setLoading(false);
      router.replace('/(tabs)');
    } else {
      // No profile found, clear credentials and route to onboarding
      await SecureStore.deleteItemAsync('user_email');
      await SecureStore.deleteItemAsync('user_password');
      setAuthenticated(false);
      setShowPasswordModal(false);
      setLoading(false);
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.splashText}>Loading...</Text>
      {biometricError ? <Text style={styles.error}>{biometricError}</Text> : null}
      <Modal isVisible={showNotVerified} backdropOpacity={0.7} backdropColor="#000">
        <View style={styles.popup}>
          <Text style={styles.popupTitle}>Email Not Verified</Text>
          <Text style={styles.popupText}>Please verify your email ({email}) to continue. Check your inbox and click the verification link.</Text>
          <TouchableOpacity style={styles.popupButton} onPress={() => setShowNotVerified(false)}>
            <Text style={styles.popupButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal
        isVisible={showPasswordModal}
        onBackdropPress={() => {}}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropOpacity={0.7}
        backdropColor="#000"
      >
        <View style={styles.passwordModal}>
          <Text style={styles.popupTitle}>Enter Password</Text>
          <Text style={styles.popupText}>Biometric authentication is not available. Please enter your password to continue.</Text>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={manualPassword}
            onChangeText={setManualPassword}
            autoFocus
          />
          {manualError ? <Text style={styles.error}>{manualError}</Text> : null}
          <TouchableOpacity style={styles.popupButton} onPress={handleManualLogin}>
            <Text style={styles.popupButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
  splashText: {
    marginTop: 16,
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  error: {
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  popup: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  popupText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  popupButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  popupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  passwordModal: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  passwordInput: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    color: '#1A1A1A',
    borderColor: '#4A90E2',
  },
});
