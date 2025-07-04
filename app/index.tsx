import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Platform, Linking, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Picker } from '@react-native-picker/picker';
import { Heart, Activity, Target, TrendingUp, Sparkles, Lock } from 'lucide-react-native';
import { saveUserProfile, supabase } from '@/lib/supabase';
import { navigationHelpers, ROUTES } from '@/utils/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';
import * as SecureStore from 'expo-secure-store';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';

export default function IndexScreen() {
  const { colors } = useTheme();
  const { isSignedIn, isLoaded } = useAuth();
  const isUserOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const setOnboarded = useUserStore((state) => state.setOnboarded);
  
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupMessage, setSignupMessage] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Form state
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '170');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '70');
  const [age, setAge] = useState(profile?.age?.toString() || '30');
  const [isSmoker, setIsSmoker] = useState(profile?.isSmoker || false);
  const [goal, setGoal] = useState(profile?.goal || 'weight_loss');
  const [exerciseDuration, setExerciseDuration] = useState(profile?.exerciseDuration?.toString() || '30');
  const [diseases, setDiseases] = useState(profile?.diseases?.join(', ') || '');
  const [dietaryPreferences, setDietaryPreferences] = useState(profile?.dietaryPreferences?.join(', ') || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(profile?.gender || 'other');
  
  useEffect(() => {
    // Simple authentication check and routing
    const handleAuthAndRouting = async () => {
      try {
        console.log('Checking auth in index...');

        // Wait for Clerk to load
        if (!isLoaded) {
          console.log('Clerk not loaded yet, waiting...');
          return;
        }

        console.log('Clerk loaded. isSignedIn:', isSignedIn, 'isOnboarded:', isUserOnboarded);

        // Use the navigation helper to handle auth flow
        navigationHelpers.handleAuthFlow(isSignedIn, isUserOnboarded, !!profile);

        // Set loading to false if we reach here
        setLoading(false);
      } catch (error) {
        console.error('Error in auth check:', error);
        setLoading(false);
        // Fallback to signin on error
        router.replace('/signin');
      }
    };

    // Reduced delay to make navigation faster
    const timer = setTimeout(() => {
      handleAuthAndRouting();
    }, 500); // Reduced from 1000ms to 500ms

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, isUserOnboarded, profile]);
  
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
      // On the last step, if not authenticated, navigate to auth screen
      if (!isSignedIn) {
        router.replace('/auth');
      } else {
        // If already authenticated, complete onboarding
        completeOnboarding();
      }
    }
  };
  
  const completeOnboarding = async () => {
    if (profile) {
      const updatedProfile = {
        ...profile,
        name,
        email,
        height: parseInt(height),
        weight: parseInt(weight),
        age: parseInt(age),
        isSmoker,
        goal: goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle',
        exerciseDuration: parseInt(exerciseDuration),
        diseases: diseases.split(',').map(d => d.trim()).filter(Boolean),
        dietaryPreferences: dietaryPreferences.split(',').map(p => p.trim()).filter(Boolean),
        gender: gender,
      };

      // Update profile in store
      updateProfile(updatedProfile);

      // Save updated profile to Supabase
      try {
        await saveUserProfile(updatedProfile);
        console.log('Profile saved to Supabase successfully');
      } catch (error) {
        console.error('Error saving updated profile to Supabase:', error);
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
    }
    setOnboarded(true);
    navigationHelpers.goToMainApp();
  };
  
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  // Calculate BMI for stats display
  const bmi = (parseInt(weight) / Math.pow(parseInt(height) / 100, 2)).toFixed(1);
  
  // Calculate exercise recommendation based on profile
  const getExerciseRecommendation = () => {
    const duration = parseInt(exerciseDuration);
    if (duration >= 60) {
      return 'Excellent! Keep up the great work.';
    } else if (duration >= 30) {
      return 'Good effort! Consider increasing a bit for more benefits.';
    } else {
      return 'You might want to aim for at least 30 minutes daily.';
    }
  };
  
  // Calculate years added to life if quit smoking
  const getSmokingBenefit = () => {
    return isSmoker ? 'Quitting smoking significantly improves your health.' : 'Great, non-smoker!';
  };
  
  // Get BMI status
  const getBMIStatus = () => {
    const h = parseInt(height) / 100;
    const w = parseInt(weight);
    if (h === 0 || w === 0) return 'N/A';
    const bmi = w / (h * h);

    if (bmi < 18.5) return 'Underweight';
    if (bmi >= 18.5 && bmi < 24.9) return 'Normal weight';
    if (bmi >= 25 && bmi < 29.9) return 'Overweight';
    return 'Obese';
  };
  
  // Supabase email sign-up handler (with user-provided 6-digit password)
  const openGmail = async () => {
    // Try to open Gmail inbox directly
    let gmailInboxUrl = '';
    if (Platform.OS === 'android') {
      gmailInboxUrl = 'googlegmail://inbox';
    } else if (Platform.OS === 'ios') {
      gmailInboxUrl = 'googlegmail://inbox';
    }
    let supported = false;
    if (gmailInboxUrl) {
      supported = await Linking.canOpenURL(gmailInboxUrl);
    }
    if (supported) {
      await Linking.openURL(gmailInboxUrl);
    } else {
      // Try to open the default mail app
      const mailtoSupported = await Linking.canOpenURL('mailto:');
      if (mailtoSupported) {
        await Linking.openURL('mailto:');
      } else {
        // Fallback to Gmail web inbox
        await Linking.openURL('https://mail.google.com/mail/u/0/#inbox');
      }
    }
    setShowSignupModal(false);
    setShowConfirmation(false);
    // Navigate to splash screen (replace with your splash route if needed)
    router.replace('/splash');
  };
  
  const handleSupabaseSignup = async () => {
    setSignupLoading(true);
    setSignupError('');
    setSignupMessage('');
    setShowConfirmation(false);
    // Validate email and password
    if (!signupEmail.trim() || !signupPassword.trim()) {
      setSignupError('Email and password are required.');
      setSignupLoading(false);
      return;
    }
    if (!/^[0-9]{6}$/.test(signupPassword)) {
      setSignupError('Password must be exactly 6 digits.');
      setSignupLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      });
      if (error) {
        setSignupError(error.message);
      } else {
        // Store credentials securely
        await SecureStore.setItemAsync('user_email', signupEmail);
        await SecureStore.setItemAsync('user_password', signupPassword);
        // Save onboarding details to Supabase profiles table
        const userId = data?.user?.id;
        if (userId) {
          const profilePayload = {
            // Don't set id - let Supabase auto-generate it
            userId: userId,
            name,
            email: signupEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            age: age ? parseInt(age) : 25,
            height: height ? parseInt(height) : 170,
            weight: weight ? parseInt(weight) : 70,
            gender: gender || 'other',
            isSmoker: isSmoker || false,
            goal: goal || 'healthy_lifestyle',
            exerciseDuration: exerciseDuration ? parseInt(exerciseDuration) : 30,
            diseases: diseases ? diseases.split(',').map(d => d.trim()).filter(Boolean) : [],
            dietaryPreferences: dietaryPreferences ? dietaryPreferences.split(',').map(p => p.trim()).filter(Boolean) : [],
            dietaryRestrictions: [],
            photoUrl: null,
          };
          await supabase.from('profiles').upsert([profilePayload], { onConflict: 'userId' });
        }
        setSignupMessage('A sign-up email has been sent. Please check your inbox.');
        setShowConfirmation(true);
      }
    } catch (e) {
      setSignupError('Unexpected error.');
    }
    setSignupLoading(false);
  };
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }
  
  // If user is authenticated but not onboarded, show onboarding
  return (
    <KeyboardAvoidingWrapper
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>🌟 Healthy Lifestyle</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Let's get to know you better to provide personalized recommendations
          </Text>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  { backgroundColor: index <= step ? colors.primary : colors.border }
                ]}
              />
            ))}
          </View>
          
          {step === 0 && (
            <Card style={styles.formCard}>
              <View style={styles.cardHeader}>
                <Heart size={24} color={colors.primary} />
                <Text style={[styles.formTitle, { color: colors.text }]}>Personal Information</Text>
              </View>
              
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
              />
              
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                keyboardType="email-address"
              />
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Height (cm)"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="170"
                  />
                </View>
                
                <View style={styles.halfInput}>
                  <Input
                    label="Weight (kg)"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="70"
                  />
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Age"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="30"
                    containerStyle={styles.ageInputContainer}
                  />
                </View>

                <View style={styles.halfInput}>
                  <View style={styles.pickerContainer}>
                    <Text style={[styles.pickerLabel, { color: colors.text }]}>Gender</Text>
                    <View style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Picker
                        selectedValue={gender}
                        onValueChange={(itemValue: 'male' | 'female' | 'other') => setGender(itemValue)}
                        style={{ color: colors.text }}
                      >
                        <Picker.Item label="Male" value="male" />
                        <Picker.Item label="Female" value="female" />
                        <Picker.Item label="Other" value="other" />
                      </Picker>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          )}
          
          {step === 1 && (
            <Card style={styles.formCard}>
              <View style={styles.cardHeader}>
                <Target size={24} color={colors.primary} />
                <Text style={[styles.formTitle, { color: colors.text }]}>Health Goals</Text>
              </View>
              
              <View style={styles.pickerContainer}>
                <Text style={[styles.pickerLabel, { color: colors.text }]}>What is your primary goal?</Text>
                <View style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={goal}
                    onValueChange={(itemValue: 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle') => setGoal(itemValue)}
                    style={{ color: colors.text }}
                  >
                    <Picker.Item label="🎯 Weight Loss" value="weight_loss" />
                    <Picker.Item label="💪 Weight Gain" value="weight_gain" />
                    <Picker.Item label="⚖️ Maintenance" value="maintenance" />
                    <Picker.Item label="🌱 Healthy Lifestyle" value="healthy_lifestyle" />
                  </Picker>
                </View>
              </View>
              
              <Input
                label="Daily Exercise Duration (minutes)"
                value={exerciseDuration}
                onChangeText={setExerciseDuration}
                keyboardType="numeric"
                placeholder="30"
              />
              
              <View style={styles.pickerContainer}>
                <Text style={[styles.pickerLabel, { color: colors.text }]}>Do you smoke?</Text>
                <View style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={isSmoker ? 'yes' : 'no'}
                    onValueChange={(itemValue) => setIsSmoker(itemValue === 'yes')}
                    style={{ color: colors.text }}
                  >
                    <Picker.Item label="No" value="no" />
                    <Picker.Item label="Yes" value="yes" />
                  </Picker>
                </View>
              </View>
            </Card>
          )}
          
          {step === 2 && (
            <Card style={styles.formCard}>
              <View style={styles.cardHeader}>
                <Activity size={24} color={colors.primary} />
                <Text style={[styles.formTitle, { color: colors.text }]}>Health Information</Text>
              </View>
              
              <Input
                label="Pre-existing health conditions (if any)"
                value={diseases}
                onChangeText={setDiseases}
                placeholder="Diabetes, Hypertension, etc. (comma separated)"
                multiline
              />
              
              <Input
                label="Dietary Preferences"
                value={dietaryPreferences}
                onChangeText={setDietaryPreferences}
                placeholder="Vegetarian, Vegan, Keto, etc. (comma separated)"
                multiline
              />
            </Card>
          )}
          
          {step === 3 && (
            <>
              <Card style={styles.statsCard}>
                <View style={styles.cardHeader}>
                  <TrendingUp size={24} color={colors.primary} />
                  <Text style={[styles.statsTitle, { color: colors.text }]}>Your Health Insights</Text>
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Your BMI</Text>
                    <Text style={[styles.statValue, { color: getBMIStatus() === 'Underweight' ? colors.warning : getBMIStatus() === 'Overweight' ? colors.error : colors.success }]}>{bmi}</Text>
                    <Text style={[styles.statDescription, { color: colors.textSecondary }]}>
                      {getBMIStatus()}
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recommended Exercise</Text>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{getExerciseRecommendation()}</Text>
                  </View>
                </View>
                
                {isSmoker && (
                  <View style={[styles.smokingWarning, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                    <Text style={[styles.smokingTitle, { color: colors.error }]}>⚠️ Smoking Impact</Text>
                    <Text style={[styles.smokingText, { color: colors.text }]}>
                      {getSmokingBenefit()}
                    </Text>
                  </View>
                )}
                
                {diseases && (
                  <View style={[styles.healthNote, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                    <Text style={[styles.healthNoteTitle, { color: colors.warning }]}>🏥 Health Conditions</Text>
                    <Text style={[styles.healthNoteText, { color: colors.text }]}>
                      We'll tailor your nutrition plan considering your health conditions: {diseases}
                    </Text>
                  </View>
                )}
              </Card>
              
              <Card style={styles.welcomeCard}>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>🎉 Ready to Start!</Text>
                <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                  Your personalized AI nutrition companion is ready to help you achieve your health goals. Let's begin your wellness journey!
                </Text>
              </Card>
              
              <Modal isVisible={showSignupModal}>
                <View style={[styles.modalView, { backgroundColor: colors.card }]}> 
                  {showConfirmation ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      {/* Custom confirmation icon instead of Lottie animation */}
                      <View style={styles.confirmationIconContainer}>
                        <Text style={styles.confirmationIcon}>✔️</Text>
                      </View>
                      <Text style={[styles.success, { fontSize: 18, marginTop: 16, marginBottom: 8 }]}>Check your email to confirm sign-up!</Text>
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary, marginTop: 12 }]}
                        onPress={openGmail}
                      >
                        <Text style={styles.buttonText}>Open Gmail</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.title, { color: colors.primary }]}>Sign up with Email</Text>
                      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your email and a 6-digit password to sign up.</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.textSecondary}
                        value={signupEmail}
                        onChangeText={setSignupEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TextInput
                        style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
                        placeholder="6-digit password"
                        placeholderTextColor={colors.textSecondary}
                        value={signupPassword}
                        onChangeText={text => setSignupPassword(text.replace(/[^0-9]/g, '').slice(0, 6))}
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                      />
                      {signupError ? <Text style={styles.error}>{signupError}</Text> : null}
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleSupabaseSignup}
                        disabled={signupLoading || !signupEmail || signupPassword.length !== 6}
                      >
                        <Text style={styles.buttonText}>{signupLoading ? 'Sending...' : 'Send Sign Up Email'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setShowSignupModal(false)} style={styles.skipButton}>
                        <Text style={[styles.skipText, { color: colors.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </Modal>
            </>
          )}
          
          <View style={styles.buttonContainer}>
            {step > 0 && (
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.backButton}
              />
            )}
            {step === 3 ? (
              <Button
                title="Sign in & Start"
                onPress={() => setShowSignupModal(true)}
                style={styles.nextButton}
              />
            ) : (
              <Button
                title="Next"
                onPress={handleNext}
                style={step === 0 ? [styles.nextButton, styles.fullWidthButton] : [styles.nextButton]}
                loading={authLoading}
              />
            )}
          </View>
        </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  loader: {
    marginTop: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  formCard: {
    marginBottom: 24,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  ageInputContainer: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  statsCard: {
    marginBottom: 24,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsGrid: {
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  smokingWarning: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    backgroundColor: '#FFF3F3',
    borderColor: '#FF3B30',
  },
  smokingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FF3B30',
  },
  smokingText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  healthNote: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    backgroundColor: '#FFF8E1',
    borderColor: '#FF9500',
  },
  healthNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FF9500',
  },
  healthNoteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  welcomeCard: {
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    color: '#6E6E6E',
  },
  modalView: {
    width: 340,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
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
  button: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  success: {
    color: '#34C759',
    marginBottom: 8,
    textAlign: 'center',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  nextButton: {
    flex: 1,
    marginLeft: 8,
  },
  fullWidthButton: {
    flex: 1,
    marginLeft: 0,
  },
  confirmationIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E6F9EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  confirmationIcon: {
    fontSize: 80,
    color: '#34C759',
  },
});