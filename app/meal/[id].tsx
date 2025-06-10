import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useNutritionStore } from '@/store/nutritionStore';
import Card from '@/components/Card';
import { Calendar, Clock, Utensils } from 'lucide-react-native';

export default function MealDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mealEntries = useNutritionStore((state) => state.mealEntries);
  
  // Find the meal by ID
  const meal = mealEntries.find(meal => meal.id === id);
  
  if (!meal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Meal not found
        </Text>
      </SafeAreaView>
    );
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format meal type for display
  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {formatMealType(meal.mealType)}
          </Text>
          
          <View style={styles.dateContainer}>
            <Calendar size={16} color={colors.primary} />
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(meal.date)}
            </Text>
          </View>
        </View>
        
        {meal.imageUrl && (
          <Image 
            source={{ uri: meal.imageUrl }} 
            style={styles.mealImage} 
          />
        )}
        
        <Card style={styles.nutritionCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Nutrition Summary
          </Text>
          
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.primary }]}>
                {meal.totalCalories}
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                Calories
              </Text>
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.primary }]}>
                {meal.totalProtein}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                Protein
              </Text>
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.primary }]}>
                {meal.totalCarbs}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                Carbs
              </Text>
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.primary }]}>
                {meal.totalFat}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                Fat
              </Text>
            </View>
          </View>
        </Card>
        
        <Card style={styles.foodsCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Food Items
          </Text>
          
          {meal.foods.map((food, index) => (
            <View key={index} style={styles.foodItem}>
              <View style={styles.foodHeader}>
                <View style={styles.foodNameContainer}>
                  <Utensils size={16} color={colors.primary} />
                  <Text style={[styles.foodName, { color: colors.text }]}>
                    {food.name}
                  </Text>
                </View>
                <Text style={[styles.foodQuantity, { color: colors.textSecondary }]}>
                  {food.quantity}
                </Text>
              </View>
              
              <View style={styles.foodNutrition}>
                <Text style={[styles.foodNutritionItem, { color: colors.textSecondary }]}>
                  {food.calories} cal
                </Text>
                <Text style={[styles.foodNutritionItem, { color: colors.textSecondary }]}>
                  P: {food.protein}g
                </Text>
                <Text style={[styles.foodNutritionItem, { color: colors.textSecondary }]}>
                  C: {food.carbs}g
                </Text>
                <Text style={[styles.foodNutritionItem, { color: colors.textSecondary }]}>
                  F: {food.fat}g
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    marginLeft: 8,
  },
  mealImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
  },
  nutritionCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
  },
  foodsCard: {
    marginBottom: 24,
  },
  foodItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  foodQuantity: {
    fontSize: 14,
  },
  foodNutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  foodNutritionItem: {
    fontSize: 14,
    marginRight: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 24,
  },
});