// app/navigation-test.tsx
// Test page to verify navigation routes are working

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { navigationHelpers, ROUTES, safeNavigate } from '@/utils/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Home, User, MessageCircle, BarChart2, LogIn, UserPlus } from 'lucide-react-native';

export default function NavigationTestScreen() {
  const { colors } = useTheme();

  const testRoutes = [
    { name: 'Home (Tabs)', route: ROUTES.TABS, icon: Home },
    { name: 'Chat', route: ROUTES.CHAT, icon: MessageCircle },
    { name: 'Stats', route: ROUTES.STATS, icon: BarChart2 },
    { name: 'Profile', route: ROUTES.PROFILE, icon: User },
    { name: 'Sign In', route: ROUTES.SIGNIN, icon: LogIn },
    { name: 'Sign Up', route: ROUTES.SIGNUP, icon: UserPlus },
    { name: 'Onboarding', route: ROUTES.ONBOARDING, icon: User },
    { name: 'Auth Test', route: ROUTES.AUTH_TEST, icon: User },
  ];

  const handleTestNavigation = (route: string, routeName: string) => {
    console.log(`Testing navigation to: ${routeName} (${route})`);
    try {
      safeNavigate.push(route as any);
    } catch (error) {
      console.error(`Navigation test failed for ${routeName}:`, error);
    }
  };

  const handleTestAuthFlow = (scenario: string) => {
    console.log(`Testing auth flow scenario: ${scenario}`);
    
    switch (scenario) {
      case 'not_signed_in':
        navigationHelpers.handleAuthFlow(false, false, false);
        break;
      case 'signed_in_not_onboarded':
        navigationHelpers.handleAuthFlow(true, false, false);
        break;
      case 'fully_authenticated':
        navigationHelpers.handleAuthFlow(true, true, true);
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Text style={[styles.title, { color: colors.text }]}>
            Navigation Test
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Test all navigation routes to ensure they work correctly
          </Text>
        </Card>

        {/* Route Tests */}
        <Card style={styles.testCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Route Navigation Tests
          </Text>
          <View style={styles.buttonGrid}>
            {testRoutes.map((route) => {
              const IconComponent = route.icon;
              return (
                <Button
                  key={route.route}
                  title={route.name}
                  onPress={() => handleTestNavigation(route.route, route.name)}
                  leftIcon={<IconComponent size={16} color="white" />}
                  style={styles.testButton}
                  variant="secondary"
                />
              );
            })}
          </View>
        </Card>

        {/* Auth Flow Tests */}
        <Card style={styles.testCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Authentication Flow Tests
          </Text>
          <View style={styles.buttonColumn}>
            <Button
              title="Test: Not Signed In"
              onPress={() => handleTestAuthFlow('not_signed_in')}
              style={styles.authButton}
              variant="outline"
            />
            <Button
              title="Test: Signed In, Not Onboarded"
              onPress={() => handleTestAuthFlow('signed_in_not_onboarded')}
              style={styles.authButton}
              variant="outline"
            />
            <Button
              title="Test: Fully Authenticated"
              onPress={() => handleTestAuthFlow('fully_authenticated')}
              style={styles.authButton}
              variant="outline"
            />
          </View>
        </Card>

        {/* Helper Functions */}
        <Card style={styles.testCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Navigation Helpers
          </Text>
          <View style={styles.buttonColumn}>
            <Button
              title="Go to Main App"
              onPress={navigationHelpers.goToMainApp}
              style={styles.helperButton}
            />
            <Button
              title="Go to Sign In"
              onPress={navigationHelpers.goToSignin}
              style={styles.helperButton}
            />
            <Button
              title="Go to Onboarding"
              onPress={navigationHelpers.goToOnboarding}
              style={styles.helperButton}
            />
            <Button
              title="Go Back"
              onPress={safeNavigate.back}
              style={styles.helperButton}
              variant="secondary"
            />
          </View>
        </Card>

        {/* Route Info */}
        <Card style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Routes
          </Text>
          <View style={styles.routeList}>
            {Object.entries(ROUTES).map(([key, value]) => (
              <View key={key} style={styles.routeItem}>
                <Text style={[styles.routeKey, { color: colors.text }]}>
                  {key}:
                </Text>
                <Text style={[styles.routeValue, { color: colors.textSecondary }]}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  headerCard: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  testCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonColumn: {
    gap: 12,
  },
  testButton: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  authButton: {
    marginBottom: 8,
  },
  helperButton: {
    marginBottom: 8,
  },
  infoCard: {
    padding: 20,
  },
  routeList: {
    gap: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeKey: {
    fontWeight: '600',
    minWidth: 120,
  },
  routeValue: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
});
