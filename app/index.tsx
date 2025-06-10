import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Picker } from '@react-native-picker/picker';
import { Heart, Activity, Target, TrendingUp, Sparkles, Lock } from 'lucide-react-native';
import { isAuthenticated, loginWithAuth0, getUserProfile, getAndroidSHAInstructions } from '@/lib/auth0';
import { saveUserProfile } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const { colors } = useTheme();
  const isUserAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isUserOnboarded = useUserStore((state) => state.isOnboarded);
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const setOnboarded = useUserStore((state) => state.setOnboarded);
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);
  
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [showSHAInstructions, setShowSHAInstructions] = useState(false);
  
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
    // Check if user is already authenticated and onboarded
    const checkAuthStatus = async () => {
      try {
        console.log('Checking auth status in index...');
        
        // Clear any stale auth state that might be causing issues
        await AsyncStorage.removeItem('auth0_code_verifier');
        await AsyncStorage.removeItem('auth0_state');
        
        // If user is authenticated and onboarded, navigate to main app
        if (isUserAuthenticated && isUserOnboarded) {
          console.log('User is authenticated and onboarded, navigating to main app');
          router.replace('/(tabs)');
          return;
        }
        
        // If user is authenticated but not onboarded, show onboarding
        if (isUserAuthenticated && !isUserOnboarded) {
          console.log('User is authenticated but not onboarded, showing onboarding');
          setLoading(false);
          return;
        }
        
        // Check Auth0 authentication
        const isAuth = await isAuthenticated();
        console.log('Auth0 authentication status:', isAuth);
        
        if (isAuth) {
          // User is authenticated with Auth0
          console.log('User is authenticated with Auth0');
          
          // Get user profile
          const userProfileResult = await getUserProfile();
          
          if (userProfileResult.success && userProfileResult.profile) {
            // Update user profile in store
            updateProfile(userProfileResult.profile);
            setAuthenticated(true);
            
            // If user has a profile but is not onboarded, show onboarding
            if (!isUserOnboarded) {
              console.log('User has profile but is not onboarded, showing onboarding');
              setLoading(false);
            } else {
              // Navigate to main app
              router.replace('/(tabs)');
            }
          } else {
            // Show the questionnaire
            console.log('Failed to get user profile, showing onboarding');
            setLoading(false);
          }
        } else {
          // Show the questionnaire or auth screen
          console.log('User is not authenticated, showing onboarding');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Show the questionnaire as fallback
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      checkAuthStatus();
    }, 1500); // Give more time for stores to initialize
    
    return () => clearTimeout(timer);
  }, [isUserAuthenticated, isUserOnboarded, setAuthenticated, updateProfile]);
  
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
      // On the last step, check if user is authenticated
      if (!isUserAuthenticated) {
        // If not authenticated, prompt for authentication
        handleAuth0Login();
      } else {
        // If already authenticated, complete onboarding
        completeOnboarding();
      }
    }
  };
  
  const handleAuth0Login = async () => {
    try {
      setAuthLoading(true);
      console.log('User not authenticated, attempting Auth0 login');
      
      // Clear any stale auth state that might be causing issues
      await AsyncStorage.removeItem('auth0_code_verifier');
      await AsyncStorage.removeItem('auth0_state');
      
      // Attempt Auth0 login
      const result = await loginWithAuth0();
      
      if (result.success) {
        console.log('Auth0 login successful in index');
        
        // If we have user data from Auth0, update the profile
        if (result.user) {
          const updatedProfile = {
            userId: result.user.sub || `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            email: result.user.email || email,
            name: result.user.name || name,
            height: parseInt(height),
            weight: parseInt(weight),
            age: parseInt(age),
            isSmoker,
            goal: goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle',
            exerciseDuration: parseInt(exerciseDuration),
            diseases: diseases.split(',').map(d => d.trim()).filter(Boolean),
            dietaryPreferences: dietaryPreferences.split(',').map(p => p.trim()).filter(Boolean),
            gender: gender,
            dietaryRestrictions: profile?.dietaryRestrictions || [],
            photoUrl: result.user.picture,
            id: Date.now() // Ensure we have an ID for Supabase
          };
          
          // Update profile in store
          updateProfile(updatedProfile);
          
          // Save updated profile to Supabase
          try {
            await saveUserProfile(updatedProfile);
            console.log('Profile saved to Supabase successfully');
          } catch (error) {
            console.log('Error saving updated profile to Supabase:', error);
            // Continue even if Supabase save fails
          }
        }
        
        // Mark as authenticated
        setAuthenticated(true);
        
        // Complete onboarding
        completeOnboarding();
      } else {
        console.log('Auth0 login failed:', result.error);
        
        // Show error message
        Alert.alert(
          'Authentication Failed',
          result.error || 'Could not sign in. Please try again.',
          [{ text: 'OK' }]
        );
        
        // For development/testing, allow skipping authentication
        if (Platform.OS === 'web' || __DEV__) {
          console.log('Development mode: Creating fallback profile');
          createFallbackProfile();
        }
      }
    } catch (error) {
      console.error('Error during Auth0 login:', error);
      
      // Show error message
      Alert.alert(
        'Authentication Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
      
      // For development/testing, allow skipping authentication
      if (Platform.OS === 'web' || __DEV__) {
        console.log('Development mode: Creating fallback profile');
        createFallbackProfile();
      }
    } finally {
      setAuthLoading(false);
    }
  };
  
  // Helper function to create a fallback profile for development
  const createFallbackProfile = () => {
    // Create a fallback profile for development with a unique userId
    const fallbackProfile = {
      userId: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: email || 'user@example.com',
      name: name || 'User',
      height: parseInt(height) || 170,
      weight: parseInt(weight) || 70,
      age: parseInt(age) || 30,
      gender: gender,
      goal: goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle',
      exerciseDuration: parseInt(exerciseDuration) || 30,
      dietaryRestrictions: [],
      dietaryPreferences: dietaryPreferences.split(',').map(p => p.trim()).filter(Boolean),
      diseases: diseases.split(',').map(d => d.trim()).filter(Boolean),
      isSmoker,
      id: Date.now() // Ensure we have an ID for Supabase
    };
    
    // Update profile in store
    updateProfile(fallbackProfile);
    
    // Mark as authenticated
    setAuthenticated(true);
    
    // Complete onboarding
    completeOnboarding();
  };
  
  const completeOnboarding = async () => {
    try {
      setLoading(true);
      
      // Generate a unique userId if not already set
      const userId = profile?.userId || `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Save profile data from form
      const userProfile = {
        userId: userId,
        name: name.trim(),
        email: email.trim(),
        height: parseInt(height),
        weight: parseInt(weight),
        age: parseInt(age),
        isSmoker,
        goal: goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle',
        exerciseDuration: parseInt(exerciseDuration),
        diseases: diseases.split(',').map(d => d.trim()).filter(Boolean),
        dietaryPreferences: dietaryPreferences.split(',').map(p => p.trim()).filter(Boolean),
        gender: gender,
        dietaryRestrictions: profile?.dietaryRestrictions || [],
        photoUrl: profile?.photoUrl,
        id: profile?.id || Date.now() // Ensure we have an ID for Supabase
      };
      
      // Update profile in store
      updateProfile(userProfile);
      
      // Save profile to Supabase
      try {
        const saveResult = await saveUserProfile(userProfile);
        if (!saveResult.success) {
          console.log('Warning: Failed to save profile to Supabase:', saveResult.error);
          // Continue even if Supabase save fails
        } else {
          console.log('Profile saved to Supabase successfully');
        }
      } catch (error) {
        console.log('Error saving profile to Supabase:', error);
        // Continue even if Supabase save fails
      }
      
      // Mark as onboarded
      setOnboarded(true);
      
      // Navigate to main app with a slight delay to ensure state updates
      console.log('Onboarding complete, navigating to main app');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      Alert.alert('Error', 'There was a problem completing your profile. Please try again.');
      setLoading(false);
    }
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
    if (goal === 'weight_loss') {
      return `${Math.max(30, parseInt(exerciseDuration) + 15)} minutes daily`;
    } else if (goal === 'weight_gain') {
      return `${Math.max(20, parseInt(exerciseDuration))} minutes, 3-4 times weekly`;
    } else {
      return `${exerciseDuration} minutes daily`;
    }
  };
  
  // Calculate years added to life if quit smoking
  const getSmokingBenefit = () => {
    const ageNum = parseInt(age);
    if (ageNum < 30) return "10+ years";
    if (ageNum < 40) return "7-9 years";
    if (ageNum < 50) return "5-7 years";
    if (ageNum < 60) return "3-5 years";
    return "1-3 years";
  };
  
  // Get BMI status
  const getBMIStatus = () => {
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 18.5) return { status: "Underweight", color: colors.warning };
    if (bmiNum < 25) return { status: "Normal", color: colors.success };
    if (bmiNum < 30) return { status: "Overweight", color: colors.warning };
    return { status: "Obese", color: colors.error };
  };
  
  // If user is already authenticated and onboarded, redirect to main app
  useEffect(() => {
    if (isUserAuthenticated && isUserOnboarded && !loading) {
      console.log('User is authenticated and onboarded, navigating to main app from useEffect');
      router.replace('/(tabs)');
    }
  }, [isUserAuthenticated, isUserOnboarded, loading]);
  
  // Show SHA instructions for Android
  const toggleSHAInstructions = () => {
    setShowSHAInstructions(!showSHAInstructions);
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Sparkles size={48} color={colors.primary} style={styles.loadingIcon} />
          <Text style={[styles.title, { color: colors.text }]}>🌟 Healthy Lifestyle</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your personal AI nutrition companion
          </Text>
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            style={styles.loader} 
          />
        </View>
      </View>
    );
  }
  
  // If user is authenticated but not onboarded, show onboarding
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
                  <Text style={[styles.statValue, { color: getBMIStatus().color }]}>{bmi}</Text>
                  <Text style={[styles.statDescription, { color: colors.textSecondary }]}>
                    {getBMIStatus().status}
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
                    Quitting smoking could add <Text style={{ fontWeight: 'bold', color: colors.primary }}>{getSmokingBenefit()}</Text> to your life expectancy.
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
              
              {!isUserAuthenticated && (
                <View style={styles.authNote}>
                  <Lock size={16} color={colors.primary} />
                  <Text style={[styles.authNoteText, { color: colors.textSecondary }]}>
                    You'll need to sign in to save your profile and access all features
                  </Text>
                </View>
              )}
            </Card>
            
            {/* SHA Instructions for Android */}
            {Platform.OS === 'android' && (
              <TouchableOpacity onPress={toggleSHAInstructions} style={styles.shaButton}>
                <Text style={[styles.shaButtonText, { color: colors.primary }]}>
                  {showSHAInstructions ? 'Hide SHA Key Instructions' : 'Show SHA Key Instructions'}
                </Text>
              </TouchableOpacity>
            )}
            
            {showSHAInstructions && (
              <Card style={styles.shaCard}>
                <Text style={[styles.shaTitle, { color: colors.text }]}>
                  Get SHA-256 Fingerprint for Android
                </Text>
                <Text style={[styles.shaText, { color: colors.textSecondary }]}>
                  {getAndroidSHAInstructions()}
                </Text>
              </Card>
            )}
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
          
          <Button
            title={step === 3 ? (isUserAuthenticated ? "Start My Journey" : "Sign In & Start") : "Next"}
            onPress={handleNext}
            style={[styles.nextButton, step === 0 && styles.fullWidthButton]}
            loading={authLoading}
            leftIcon={step === 3 && !isUserAuthenticated ? <Lock size={18} color="white" /> : undefined}
          />
        </View>
      </View>
    </ScrollView>
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
  },
  smokingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  smokingText: {
    fontSize: 14,
    lineHeight: 20,
  },
  healthNote: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  healthNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  healthNoteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  welcomeCard: {
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  authNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  authNoteText: {
    fontSize: 14,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  shaButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  shaButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  shaCard: {
    marginBottom: 24,
    padding: 20,
  },
  shaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  shaText: {
    fontSize: 14,
    lineHeight: 20,
  },
});