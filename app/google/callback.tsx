import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function GoogleCallbackScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  
  useEffect(() => {
    // Log the callback parameters for debugging
    console.log('Google callback received with params:', JSON.stringify(params));
    
    // Redirect to the main app after a short delay
    // In a real implementation, you would process the callback parameters
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);
  }, [params]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>
        Processing Google authentication...
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});