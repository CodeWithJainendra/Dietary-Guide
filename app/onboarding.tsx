// app/onboarding.tsx
// Complete onboarding experience with questionnaire and authentication options

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useGoogleOAuth } from '@/lib/clerk';
import { saveUserProfile } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import GoogleIcon from '@/components/GoogleIcon';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Target,
  Activity,
  Heart,
  Utensils
} from 'lucide-react-native';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signInWithGoogle } = useGoogleOAuth();
  const { profile, setProfile, setAuthenticated, setOnboarded } = useUserStore();

  // Questionnaire state
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [goal, setGoal] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [isSmoker, setIsSmoker] = useState(false);
  const [diseases, setDiseases] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');

  // Loading states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing profile data if available
  useEffect(() => {
    if (profile) {
      console.log('Initializing onboarding form with existing profile data:', profile);
      setName(profile.name || '');
      setEmail(profile.email || '');
      setHeight(profile.height?.toString() || '');
      setWeight(profile.weight?.toString() || '');
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || '');
      setGoal(profile.goal || '');
      setExerciseDuration(profile.exerciseDuration?.toString() || '');
      setIsSmoker(profile.isSmoker || false);
      setDiseases(profile.diseases?.join(', ') || '');
      setDietaryPreferences(profile.dietaryPreferences?.join(', ') || '');
    } else if (user) {
      // If no profile but user exists, initialize with user data
      console.log('Initializing onboarding form with user data:', user);
      setName(user.fullName || user.firstName || '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
    }
  }, [profile, user]);

  // Don't redirect if already signed in - let them complete onboarding
  // This prevents the redirect loop issue

  const handleNext = () => {
    if (step === 0) {
      // Validate basic info
      if (!name.trim() || !email.trim()) {
        Alert.alert('Error', 'Please fill in your name and email.');
        return;
      }
      if (!height || !weight || !age) {
        Alert.alert('Error', 'Please fill in all your basic information.');
        return;
      }
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      // On the last step, show authentication options
      setStep(4); // Authentication step
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('Starting Google OAuth flow...');

      const result = await signInWithGoogle();

      if (result.success) {
        console.log('Google OAuth successful!', { isNewUser: result.isNewUser });

        // Set authentication state
        setAuthenticated(true);

        if (result.isNewUser) {
          // New user - they need to complete the questionnaire
          console.log('New user detected, continuing with onboarding...');
          // Move to step 4 (authentication step) to show completion button
          setStep(4);
        } else {
          // Existing user - redirect to main app
          console.log('Existing user detected, redirecting to main app...');
          setOnboarded(true);
          router.replace('/(tabs)');
        }
      } else {
        console.error('Google OAuth failed:', result.error);
        Alert.alert(
          'Sign-in Failed',
          'Unable to sign in with Google. Please try again or use email sign-up.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    // Navigate to email signup with all the collected onboarding data
    const params = new URLSearchParams({
      name: name,
      email: email,
      height: height,
      weight: weight,
      age: age,
      gender: gender,
      goal: goal,
      exerciseDuration: exerciseDuration,
      isSmoker: isSmoker.toString(),
      diseases: diseases,
      dietaryPreferences: dietaryPreferences,
    });
    router.push(`/signup?${params.toString()}`);
  };

  const handleGoogleOnboardingComplete = async () => {
    try {
      setIsSubmitting(true);
      console.log('Completing Google user onboarding...');

      // Check if we have an authenticated user
      if (!user) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No authenticated user found. Please try signing in again.');
        return;
      }

      console.log('Current user ID:', user.id);
      console.log('User email:', user.primaryEmailAddress?.emailAddress);

      // Create profile data from questionnaire
      const profileData = {
        userId: user.id, // Use the actual Clerk user ID
        name: name || user.fullName || 'User',
        email: email || user.primaryEmailAddress?.emailAddress || '',
        height: parseInt(height) || 170,
        weight: parseInt(weight) || 70,
        age: parseInt(age) || 25,
        gender: (gender || 'other') as 'male' | 'female' | 'other',
        goal: (goal || 'healthy_lifestyle') as 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle',
        exerciseDuration: parseInt(exerciseDuration) || 30,
        isSmoker: isSmoker || false,
        diseases: diseases ? diseases.split(',').map(d => d.trim()).filter(Boolean) : [],
        dietaryPreferences: dietaryPreferences ? dietaryPreferences.split(',').map(p => p.trim()).filter(Boolean) : [],
        dietaryRestrictions: [],
        photoUrl: user.imageUrl || undefined,
      };

      console.log('Saving Google user profile:', profileData);

      // Save profile to Supabase
      const result = await saveUserProfile(profileData);

      if (result.success) {
        console.log('Google user profile saved successfully!');

        // Update user store
        setProfile(profileData);
        setOnboarded(true);

        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        console.error('Failed to save Google user profile:', result.error);
        Alert.alert(
          'Profile Save Failed',
          'Unable to save your profile. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error completing Google onboarding:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>👋 Let's get to know you</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Tell us about yourself to get personalized recommendations
            </Text>

            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              leftIcon={<User size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
            />

            <View style={styles.row}>
              <Input
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                placeholder="170"
                keyboardType="numeric"
                containerStyle={styles.halfInput}
              />
              <Input
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                keyboardType="numeric"
                containerStyle={styles.halfInput}
              />
            </View>

            <View style={styles.row}>
              <Input
                label="Age"
                value={age}
                onChangeText={setAge}
                placeholder="25"
                keyboardType="numeric"
                containerStyle={styles.ageInput}
              />
              <View style={styles.genderSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Gender</Text>
                <View style={styles.genderContainer}>
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.genderOption,
                        {
                          backgroundColor: gender === option.value ? colors.primary : colors.card,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setGender(option.value)}
                    >
                      <Text style={[
                        styles.genderText,
                        { color: gender === option.value ? 'white' : colors.text }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>🎯 What's your goal?</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Choose your primary health objective
            </Text>

            <View style={styles.optionsContainer}>
              {[
                { key: 'weight_loss', label: 'Weight Loss', icon: '⬇️' },
                { key: 'weight_gain', label: 'Weight Gain', icon: '⬆️' },
                { key: 'maintenance', label: 'Maintain Weight', icon: '⚖️' },
                { key: 'healthy_lifestyle', label: 'Healthy Lifestyle', icon: '🌟' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionCard,
                    { 
                      backgroundColor: goal === option.key ? colors.primary : colors.card,
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setGoal(option.key)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.optionText,
                    { color: goal === option.key ? 'white' : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>💪 Activity & Lifestyle</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Tell us about your exercise habits and lifestyle
            </Text>

            <Input
              label="Exercise Duration (minutes/day)"
              value={exerciseDuration}
              onChangeText={setExerciseDuration}
              placeholder="30"
              keyboardType="numeric"
              leftIcon={<Activity size={20} color={colors.textSecondary} />}
            />

            <View style={styles.smokerContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Do you smoke?</Text>
              <View style={styles.smokerOptions}>
                {[
                  { key: false, label: 'No' },
                  { key: true, label: 'Yes' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.smokerOption,
                      { 
                        backgroundColor: isSmoker === option.key ? colors.primary : colors.card,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setIsSmoker(option.key)}
                  >
                    <Text style={[
                      styles.smokerText,
                      { color: isSmoker === option.key ? 'white' : colors.text }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>🍽️ Dietary Preferences</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Any dietary restrictions or health conditions?
            </Text>

            <Input
              label="Health Conditions"
              value={diseases}
              onChangeText={setDiseases}
              placeholder="e.g., diabetes, hypertension (optional)"
              multiline
              leftIcon={<Heart size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Dietary Preferences"
              value={dietaryPreferences}
              onChangeText={setDietaryPreferences}
              placeholder="e.g., vegetarian, vegan, gluten-free (optional)"
              multiline
              leftIcon={<Utensils size={20} color={colors.textSecondary} />}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>🎉 Ready to Start!</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              {isSignedIn
                ? "Complete your profile setup to get personalized recommendations!"
                : "Your personalized AI nutrition companion is ready. Choose how you'd like to sign up:"
              }
            </Text>

            {isSignedIn ? (
              // User is already signed in with Google - show complete profile button
              <Card style={styles.authCard}>
                <Button
                  title={isSubmitting ? "Saving Profile..." : "Complete Setup"}
                  onPress={handleGoogleOnboardingComplete}
                  leftIcon={!isSubmitting ? <User size={18} color="white" /> : undefined}
                  style={{...styles.authButton, backgroundColor: colors.primary}}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                />
              </Card>
            ) : (
              // User is not signed in - show sign up options
              <>
                <Card style={styles.authCard}>
                  <Button
                    title={isGoogleLoading ? "Signing in..." : "Continue with Google"}
                    onPress={handleGoogleSignIn}
                    leftIcon={!isGoogleLoading ? <GoogleIcon size={18} /> : undefined}
                    style={{...styles.authButton, backgroundColor: '#55B685'}}
                    disabled={isGoogleLoading}
                    loading={isGoogleLoading}
                  />

                  <View style={styles.divider}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  </View>

                  <Button
                    title="Continue with Email"
                    onPress={handleEmailSignUp}
                    leftIcon={<Mail size={18} color="white" />}
                    style={{...styles.authButton, backgroundColor: colors.primary}}
                  />
                </Card>

                <TouchableOpacity
                  onPress={() => router.push('/signin')}
                  style={styles.signInLink}
                >
                  <Text style={[styles.signInText, { color: colors.textSecondary }]}>
                    Already have an account?{' '}
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>
                      Sign in here
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingWrapper
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {step + 1} of 5
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${((step + 1) / 5) * 100}%`
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {renderStep()}

        {step < 4 && (
          <Button
            title="Continue"
            onPress={handleNext}
            rightIcon={<ArrowRight size={18} color="white" />}
            style={styles.continueButton}
          />
        )}
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
  progressContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    gap: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
  },
  ageInput: {
    width: '20%',
    marginRight: 16,
    marginBottom: 16,
  },
  genderSection: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  smokerContainer: {
    gap: 12,
  },
  smokerOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  smokerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  smokerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  authCard: {
    padding: 24,
    gap: 16,
  },
  authButton: {
    marginBottom: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  signInLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  signInText: {
    fontSize: 14,
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 32,
  },
});
