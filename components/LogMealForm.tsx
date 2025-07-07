import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserStore } from '@/store/userStore';
import Input from './Input';
import Button from './Button';
import Card from './Card';
import { MealEntry } from '@/types';
import {
  Camera,
  Upload,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Utensils,
  Sparkles,
  X,
  Check,
  Loader2,
  Eye
} from 'lucide-react-native';
import { analyzeFoodWithAI, analyzeFoodImage } from '@/utils/aiService';
import { showFoodImagePickerOptions } from '@/utils/imageUtils';
import { generateUUID } from '@/utils/uuid';

interface LogMealFormProps {
  onSubmit: (meal: MealEntry) => void;
}

export default function LogMealForm({ onSubmit }: LogMealFormProps) {
  const { colors } = useTheme();
  const profile = useUserStore((state) => state.profile);

  // Animation for spinning loader
  const spinValue = useRef(new Animated.Value(0)).current;

  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{foodName?: string; quantity?: string}>({});
  const [isRecognizingFood, setIsRecognizingFood] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<{
    foodName: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
  } | null>(null);

  // Meal type configurations with icons and colors
  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: '#FF6B35' },
    { key: 'lunch', label: 'Lunch', icon: Sun, color: '#F7931E' },
    { key: 'dinner', label: 'Dinner', icon: Moon, color: '#4A90E2' },
    { key: 'snack', label: 'Snack', icon: Cookie, color: '#7B68EE' },
  ] as const;

  // Spinning animation effect
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation;

    if (isRecognizingFood) {
      spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      spinValue.setValue(0);
    }

    return () => {
      if (spinAnimation) {
        spinAnimation.stop();
      }
    };
  }, [isRecognizingFood, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleAIFoodRecognition = async (imageUri: string) => {
    try {
      setIsRecognizingFood(true);

      // Analyze the food image with AI
      const result = await analyzeFoodImage(imageUri);
      setRecognitionResult(result);

      // Auto-fill form fields if they're empty
      if (!foodName && result.foodName !== 'Unidentified Food') {
        setFoodName(result.foodName);
      }
      if (!quantity && result.quantity) {
        setQuantity(result.quantity);
      }

      // Show recognition result to user
      if (result.confidence > 70) {
        Alert.alert(
          '🎯 Food Recognized!',
          `I detected: ${result.foodName} (${result.quantity})\nConfidence: ${result.confidence}%\n\nThe form has been auto-filled. You can edit the details if needed.`,
          [{ text: 'OK', style: 'default' }]
        );
      } else if (result.confidence > 30) {
        Alert.alert(
          '🤔 Food Detected',
          `I think this might be: ${result.foodName}\nConfidence: ${result.confidence}%\n\nPlease verify and edit the details as needed.`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          '📷 Image Uploaded',
          'I couldn\'t identify the food clearly. Please enter the details manually.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error recognizing food:', error);
      Alert.alert(
        'Recognition Failed',
        'Could not analyze the food image. Please enter the details manually.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsRecognizingFood(false);
    }
  };

  const handleImageUpload = () => {
    showFoodImagePickerOptions(
      async (imageUri: string) => {
        setSelectedImage(imageUri);
        // Automatically trigger AI food recognition
        await handleAIFoodRecognition(imageUri);
      },
      (detectedFoodName: string, detectedQuantity: string) => {
        // Auto-fill detected food information (for sample images)
        if (!foodName) {
          setFoodName(detectedFoodName);
        }
        if (!quantity) {
          setQuantity(detectedQuantity);
        }
      }
    );
  };
  
  // Validation function
  const validateForm = () => {
    const newErrors: {foodName?: string; quantity?: string} = {};

    if (!foodName.trim()) {
      newErrors.foodName = 'Food name is required';
    }

    if (!quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsAnalyzing(true);

      // Analyze food with AI
      const nutrition = await analyzeFoodWithAI(foodName.trim(), quantity.trim());

      const meal: MealEntry = {
        id: generateUUID(),
        userId: profile?.userId || 'current-user',
        date: new Date().toISOString().split('T')[0],
        mealType,
        foods: [
          {
            name: nutrition.foodName,
            quantity: quantity.trim(),
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat
          }
        ],
        totalCalories: nutrition.calories,
        totalProtein: nutrition.protein,
        totalCarbs: nutrition.carbs,
        totalFat: nutrition.fat,
        timestamp: Date.now(),
        imageUrl: selectedImage || undefined
      };

      onSubmit(meal);

      // Reset form
      setFoodName('');
      setQuantity('');
      setSelectedImage(null);
      setErrors({});
      setRecognitionResult(null);

      Alert.alert(
        'Meal Logged! 🎉',
        `${nutrition.foodName} (${nutrition.calories} calories) has been added to your ${mealType}.`
      );
    } catch (error) {
      console.error('Error submitting meal:', error);
      Alert.alert('Error', 'Failed to analyze the food. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={[styles.progressHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.progressContent}>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, { backgroundColor: colors.primary }]}>
              <Text style={styles.progressStepText}>1</Text>
            </View>
            <View style={[styles.progressLine, { backgroundColor: colors.border }]} />
            <View style={[styles.progressStep, { backgroundColor: colors.border }]}>
              <Text style={[styles.progressStepText, { color: colors.textSecondary }]}>2</Text>
            </View>
            <View style={[styles.progressLine, { backgroundColor: colors.border }]} />
            <View style={[styles.progressStep, { backgroundColor: colors.border }]}>
              <Text style={[styles.progressStepText, { color: colors.textSecondary }]}>3</Text>
            </View>
          </View>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Step 1 of 3: Select meal type
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        indicatorStyle={colors.text === '#000000' ? 'black' : 'white'}
      >
        {/* Scroll Hint */}
        <View style={[styles.scrollHint, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.scrollHintText, { color: colors.primary }]}>
            💡 Scroll down to complete all steps
          </Text>
        </View>

      {/* Meal Type Selection */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Utensils size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Select Meal Type
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Choose when you had this meal
              </Text>
            </View>
          </View>
          <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
        </View>
        <View style={styles.mealTypeGrid}>
          {mealTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = mealType === type.key;

            return (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.mealTypeCard,
                  {
                    backgroundColor: isSelected ? type.color + '15' : colors.background,
                    borderColor: isSelected ? type.color : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
                onPress={() => setMealType(type.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.mealTypeIconContainer,
                  { backgroundColor: isSelected ? type.color : colors.card }
                ]}>
                  <IconComponent
                    size={22}
                    color={isSelected ? 'white' : type.color}
                  />
                </View>
                <Text style={[
                  styles.mealTypeLabel,
                  {
                    color: isSelected ? type.color : colors.text,
                    fontWeight: isSelected ? '600' : '500'
                  }
                ]}>
                  {type.label}
                </Text>
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: type.color }]}>
                    <Check size={10} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Image Upload */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Camera size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Food Photo
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Optional - helps AI analyze better
              </Text>
            </View>
          </View>
          <View style={[styles.stepBadge, { backgroundColor: colors.textSecondary }]}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
        </View>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.foodImage} />

            {/* AI Recognition Loading Overlay */}
            {isRecognizingFood && (
              <View style={[styles.recognitionOverlay, { backgroundColor: colors.background + 'E6' }]}>
                <View style={[styles.recognitionContent, { backgroundColor: colors.card }]}>
                  <Animated.View style={{ transform: [{ rotate: spin }], marginBottom: 12 }}>
                    <Loader2 size={32} color={colors.primary} />
                  </Animated.View>
                  <Text style={[styles.recognitionText, { color: colors.text }]}>
                    🤖 Analyzing food...
                  </Text>
                  <Text style={[styles.recognitionSubtext, { color: colors.textSecondary }]}>
                    AI is identifying your meal
                  </Text>
                </View>
              </View>
            )}

            {/* Recognition Result Badge */}
            {recognitionResult && !isRecognizingFood && (
              <View style={[styles.recognitionBadge, {
                backgroundColor: recognitionResult.confidence > 70 ? colors.success + '15' :
                                recognitionResult.confidence > 30 ? colors.warning + '15' : colors.error + '15',
                borderColor: recognitionResult.confidence > 70 ? colors.success :
                            recognitionResult.confidence > 30 ? colors.warning : colors.error
              }]}>
                <Eye size={14} color={
                  recognitionResult.confidence > 70 ? colors.success :
                  recognitionResult.confidence > 30 ? colors.warning : colors.error
                } />
                <Text style={[styles.recognitionBadgeText, {
                  color: recognitionResult.confidence > 70 ? colors.success :
                         recognitionResult.confidence > 30 ? colors.warning : colors.error
                }]}>
                  {recognitionResult.confidence}% confident
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.changeImageButton, { backgroundColor: colors.primary }]}
              onPress={handleImageUpload}
              activeOpacity={0.8}
              disabled={isRecognizingFood}
            >
              <Camera size={16} color="white" />
              <Text style={styles.changeImageText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.removeImageButton, { backgroundColor: colors.error }]}
              onPress={() => {
                setSelectedImage(null);
                setRecognitionResult(null);
              }}
              activeOpacity={0.8}
              disabled={isRecognizingFood}
            >
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }]}
            onPress={handleImageUpload}
            activeOpacity={0.7}
          >
            <View style={[styles.uploadIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Upload size={24} color={colors.primary} />
            </View>
            <Text style={[styles.uploadText, { color: colors.primary }]}>Add Photo</Text>
            <Text style={[styles.uploadSubtext, { color: colors.textSecondary }]}>
              Help AI analyze your food better
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Food Details */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Utensils size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Food Details
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Tell us what you ate and how much
              </Text>
            </View>
          </View>
          <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepBadgeText}>3</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputGroupLabel, { color: colors.text }]}>
            What did you eat?
          </Text>
          <Input
            label=""
            value={foodName}
            onChangeText={(text) => {
              setFoodName(text);
              if (errors.foodName) setErrors(prev => ({ ...prev, foodName: undefined }));
            }}
            placeholder="e.g., Grilled chicken breast, Apple, Pasta with tomato sauce"
            error={errors.foodName}
            leftIcon={<Utensils size={20} color={colors.textSecondary} />}
            style={[styles.input, styles.enhancedInput]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputGroupLabel, { color: colors.text }]}>
            How much did you eat?
          </Text>
          <Input
            label=""
            value={quantity}
            onChangeText={(text) => {
              setQuantity(text);
              if (errors.quantity) setErrors(prev => ({ ...prev, quantity: undefined }));
            }}
            placeholder="e.g., 1 cup, 150g, 1 medium, 2 slices"
            error={errors.quantity}
            leftIcon={<Utensils size={20} color={colors.textSecondary} />}
            style={[styles.input, styles.enhancedInput]}
          />

          {/* Quick quantity suggestions */}
          <View style={styles.quickSuggestions}>
            <Text style={[styles.quickSuggestionsLabel, { color: colors.textSecondary }]}>
              Quick suggestions:
            </Text>
            <View style={styles.suggestionTags}>
              {['1 cup', '100g', '1 medium', '2 slices', '1 tbsp'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={[styles.suggestionTag, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setQuantity(suggestion)}
                >
                  <Text style={[styles.suggestionTagText, { color: colors.textSecondary }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Card>

      {/* AI Note */}
      <Card style={[
        styles.aiNoteCard,
        {
          backgroundColor: colors.primary + '08',
          borderColor: colors.primary + '20'
        }
      ]}>
        <View style={styles.aiNoteContent}>
          <View style={[styles.aiIcon, { backgroundColor: colors.primary + '15' }]}>
            <Sparkles size={24} color={colors.primary} />
          </View>
          <View style={styles.aiTextContainer}>
            <Text style={[styles.aiNoteTitle, { color: colors.primary }]}>
              AI-Powered Analysis
            </Text>
            <Text style={[styles.aiNoteText, { color: colors.textSecondary }]}>
              Our AI will automatically calculate calories, protein, carbs, and fat for you!
            </Text>
          </View>
        </View>
      </Card>

        {/* Submit Section */}
        <Card style={[
          styles.submitCard,
          {
            backgroundColor: colors.primary + '05',
            borderColor: colors.primary + '20'
          }
        ]}>
          <View style={styles.submitHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Check size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Ready to Log
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {isAnalyzing ? 'Analyzing your meal...' : 'Tap to save your meal entry'}
                </Text>
              </View>
            </View>
          </View>

          <Button
            title={isAnalyzing ? "Analyzing nutrition..." : "Log Meal & Get Analysis"}
            onPress={handleSubmit}
            isLoading={isAnalyzing}
            disabled={isAnalyzing || !foodName.trim() || !quantity.trim()}
            style={[
              styles.submitButton,
              {
                opacity: (!foodName.trim() || !quantity.trim()) ? 0.6 : 1
              }
            ]}
            leftIcon={!isAnalyzing ? <Sparkles size={20} color="white" /> : undefined}
          />

          {(!foodName.trim() || !quantity.trim()) && (
            <Text style={[styles.submitHint, { color: colors.textSecondary }]}>
              Please fill in food name and quantity to continue
            </Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Progress Header Styles
  progressHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressContent: {
    alignItems: 'center',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Scroll Hint Styles
  scrollHint: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  scrollHintText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Header Styles
  headerCard: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },

  // Section Styles
  sectionCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },

  // Meal Type Styles - 2x2 Grid
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mealTypeCard: {
    width: '48%', // Ensures exactly 2 cards per row (48% + 48% + 4% gap = 100%)
    aspectRatio: 1, // Makes it square for perfect 2x2 grid
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 12, // Vertical spacing between rows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealTypeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Image Upload Styles
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 12,
  },
  foodImage: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    marginBottom: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    position: 'absolute',
    bottom: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  removeImageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 12,
    right: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 12,
    minHeight: 160,
  },
  uploadIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  uploadSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Input Styles
  input: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputGroupLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  enhancedInput: {
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  quickSuggestions: {
    marginTop: 12,
  },
  quickSuggestionsLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionTagText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // AI Note Styles
  aiNoteCard: {
    marginBottom: 28,
    borderWidth: 1,
  },
  aiNoteContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  aiNoteText: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Submit Section
  submitCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  submitHeader: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 16,
  },
  submitHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // AI Recognition Styles
  recognitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  recognitionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  recognitionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  recognitionSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  recognitionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recognitionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});