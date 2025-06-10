import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserStore } from '@/store/userStore';
import Input from './Input';
import Button from './Button';
import { MealEntry } from '@/types';
import { Camera, Upload } from 'lucide-react-native';
import { analyzeFoodWithAI } from '@/utils/aiService';

interface LogMealFormProps {
  onSubmit: (meal: MealEntry) => void;
}

export default function LogMealForm({ onSubmit }: LogMealFormProps) {
  const { colors } = useTheme();
  const profile = useUserStore((state) => state.profile);
  
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const handleImageUpload = () => {
    Alert.alert(
      "Add Food Photo",
      "Choose an option",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Take Photo",
          onPress: () => {
            Alert.alert("Camera", "Camera functionality would be implemented here.");
          }
        },
        {
          text: "Choose from Gallery",
          onPress: () => {
            // For demo, we'll use a sample food image
            setSelectedImage('https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');
            if (!foodName) {
              setFoodName('Mixed Salad Bowl');
            }
            if (!quantity) {
              setQuantity('1 bowl');
            }
          }
        }
      ]
    );
  };
  
  const handleSubmit = async () => {
    if (!foodName.trim() || !quantity.trim()) {
      Alert.alert('Error', 'Please fill in the food name and quantity');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      
      // Analyze food with AI
      const nutrition = await analyzeFoodWithAI(foodName.trim(), quantity.trim());
      
      const meal: MealEntry = {
        id: Date.now().toString(),
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
      <Text style={[styles.title, { color: colors.text }]}>Log Your Meal</Text>
      
      {/* Meal Type Selection */}
      <View style={styles.mealTypeContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Meal Type</Text>
        <View style={styles.mealTypeButtons}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mealTypeButton,
                { 
                  backgroundColor: mealType === type ? colors.primary : colors.card,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setMealType(type)}
            >
              <Text style={[
                styles.mealTypeText,
                { 
                  color: mealType === type ? 'white' : colors.text 
                }
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Image Upload */}
      <View style={styles.imageSection}>
        <Text style={[styles.label, { color: colors.text }]}>Food Photo (Optional)</Text>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.foodImage} />
            <TouchableOpacity 
              style={[styles.changeImageButton, { backgroundColor: colors.primary }]}
              onPress={handleImageUpload}
            >
              <Camera size={16} color="white" />
              <Text style={styles.changeImageText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={handleImageUpload}
          >
            <Upload size={24} color={colors.primary} />
            <Text style={[styles.uploadText, { color: colors.primary }]}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Input
        label="Food Name"
        value={foodName}
        onChangeText={setFoodName}
        placeholder="e.g., Grilled chicken breast, Apple, Pasta with tomato sauce"
      />
      
      <Input
        label="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="e.g., 1 cup, 150g, 1 medium, 2 slices"
      />
      
      <View style={[styles.aiNote, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
        <Text style={[styles.aiNoteText, { color: colors.primary }]}>
          🤖 Our AI will automatically calculate calories, protein, carbs, and fat for you!
        </Text>
      </View>
      
      <Button
        title={isAnalyzing ? "Analyzing nutrition..." : "Log Meal"}
        onPress={handleSubmit}
        isLoading={isAnalyzing}
        style={styles.submitButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  mealTypeContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageSection: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  foodImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  changeImageText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  aiNote: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  aiNoteText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 8,
  },
});