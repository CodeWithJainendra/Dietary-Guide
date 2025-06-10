import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useNutritionStore } from '@/store/nutritionStore';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Calendar, Clock, Utensils, Activity, Share2 } from 'lucide-react-native';
import { addToGoogleCalendar, addToGoogleTasks } from '@/utils/googleService';

export default function PlanDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const nutritionPlans = useNutritionStore((state) => state.nutritionPlans);
  
  // Find the plan by ID
  const plan = nutritionPlans.find(plan => plan.id === id);
  
  if (!plan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Plan not found
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
  
  const handleSharePlan = () => {
    // In a real app, this would share the plan
    console.log('Sharing plan:', plan);
  };
  
  const handleAddToCalendar = async () => {
    try {
      // Add each meal to Google Calendar
      for (const meal of plan.meals) {
        const mealDate = new Date(plan.date);
        const [hours, minutes] = meal.time.split(':').map(Number);
        mealDate.setHours(hours, minutes);
        
        const endTime = new Date(mealDate);
        endTime.setMinutes(endTime.getMinutes() + 30);
        
        const mealTitle = `${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`;
        const mealDescription = meal.foods.map(f => `${f.name} (${f.quantity})`).join(', ');
        
        await addToGoogleCalendar(
          mealTitle,
          mealDescription,
          mealDate,
          endTime
        );
      }
      
      // Show success message
      alert('Plan added to Google Calendar');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      alert('Failed to add plan to calendar');
    }
  };
  
  const handleAddToTasks = async () => {
    try {
      // Add each meal to Google Tasks
      for (const meal of plan.meals) {
        const mealDate = new Date(plan.date);
        const [hours, minutes] = meal.time.split(':').map(Number);
        mealDate.setHours(hours, minutes);
        
        const mealTitle = `Prepare ${meal.mealType}`;
        const mealDescription = meal.foods.map(f => `${f.name} (${f.quantity})`).join(', ');
        
        await addToGoogleTasks(
          mealTitle,
          mealDescription,
          mealDate
        );
      }
      
      // Show success message
      alert('Plan added to Google Tasks');
    } catch (error) {
      console.error('Error adding to tasks:', error);
      alert('Failed to add plan to tasks');
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Nutrition Plan
          </Text>
          
          <View style={styles.dateContainer}>
            <Calendar size={16} color={colors.primary} />
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(plan.date)}
            </Text>
          </View>
        </View>
        
        <Card style={styles.summaryCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Daily Summary
          </Text>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Calories:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {plan.totalCalories} kcal
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Number of Meals:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {plan.meals.length}
            </Text>
          </View>
        </Card>
        
        <View style={styles.actionsContainer}>
          <Button
            title="Add to Calendar"
            onPress={handleAddToCalendar}
            variant="outline"
            leftIcon={<Calendar size={16} color={colors.primary} />}
            style={styles.actionButton}
          />
          <Button
            title="Add to Tasks"
            onPress={handleAddToTasks}
            variant="outline"
            leftIcon={<Activity size={16} color={colors.primary} />}
            style={styles.actionButton}
          />
        </View>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Meal Schedule
        </Text>
        
        {plan.meals.map((meal, index) => (
          <Card key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={[styles.mealType, { color: colors.text }]}>
                {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={14} color={colors.primary} />
                <Text style={[styles.mealTime, { color: colors.textSecondary }]}>
                  {meal.time}
                </Text>
              </View>
            </View>
            
            {meal.foods.map((food, foodIndex) => (
              <View key={foodIndex} style={styles.foodItem}>
                <View style={styles.foodNameContainer}>
                  <Utensils size={14} color={colors.primary} />
                  <Text style={[styles.foodName, { color: colors.text }]}>
                    {food.name}
                  </Text>
                </View>
                <Text style={[styles.foodQuantity, { color: colors.textSecondary }]}>
                  {food.quantity}
                </Text>
              </View>
            ))}
            
            <View style={styles.mealNutrition}>
              <Text style={[styles.mealNutritionItem, { color: colors.textSecondary }]}>
                {meal.foods.reduce((sum, food) => sum + food.calories, 0)} cal
              </Text>
              <Text style={[styles.mealNutritionItem, { color: colors.textSecondary }]}>
                P: {meal.foods.reduce((sum, food) => sum + food.protein, 0)}g
              </Text>
              <Text style={[styles.mealNutritionItem, { color: colors.textSecondary }]}>
                C: {meal.foods.reduce((sum, food) => sum + food.carbs, 0)}g
              </Text>
              <Text style={[styles.mealNutritionItem, { color: colors.textSecondary }]}>
                F: {meal.foods.reduce((sum, food) => sum + food.fat, 0)}g
              </Text>
            </View>
          </Card>
        ))}
        
        {plan.exerciseRecommendations && plan.exerciseRecommendations.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Exercise Recommendations
            </Text>
            
            <Card style={styles.exerciseCard}>
              {plan.exerciseRecommendations.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <Activity size={16} color={colors.primary} />
                  <Text style={[styles.exerciseText, { color: colors.text }]}>
                    {exercise}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}
        
        <Button
          title="Share Plan"
          onPress={handleSharePlan}
          leftIcon={<Share2 size={16} color="white" />}
          style={styles.shareButton}
        />
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
  summaryCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  mealCard: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealType: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTime: {
    fontSize: 14,
    marginLeft: 4,
  },
  foodItem: {
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
    marginLeft: 8,
  },
  foodQuantity: {
    fontSize: 14,
  },
  mealNutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mealNutritionItem: {
    fontSize: 14,
    marginRight: 16,
  },
  exerciseCard: {
    marginBottom: 24,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseText: {
    fontSize: 16,
    marginLeft: 8,
  },
  shareButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 24,
  },
});