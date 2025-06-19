// Minimal placeholder for /auth/callback to remove route warning
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';

export default function AuthCallbackScreen() {
  useEffect(() => {
    // Immediately redirect to home or main app
    router.replace('/');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Redirecting...</Text>
    </View>
  );
}
