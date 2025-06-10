import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { NutritionPlan } from '@/types';
import Card from './Card';
import { Clock, Calendar, Activity } from 'lucide-react-native';
import { router } from 'expo-router';

interface NutritionPlanCardProps {
  plan: NutritionPlan;
}

const NutritionPlanCard: React.FC<NutritionPlanCardProps> = ({ plan }) => {
  const { colors } = useTheme();
  
  const handlePress = () => {
    router.push(`/plan/${plan.id}`);
  };
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Calendar size={16} color={colors.primary} />
            <Text style={[styles.date, { color: colors.text }]}>
              {new Date(plan.date).toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <Text style={[styles.calories, { color: colors.primary }]}>
            {plan.totalCalories} cal
          </Text>
        </View>
        
        <View style={styles.mealsContainer}>
          {plan.meals.map((meal, index) => (
            <View key={index} style={styles.mealItem}>
              <View style={styles.mealHeader}>
                <Text style={[styles.mealType, { color: colors.text }]}>
                  {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                </Text>
                <View style={styles.timeContainer}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={[styles.mealTime, { color: colors.textSecondary }]}>
                    {meal.time}
                  </Text>
                </View>
              </View>
              
              <View style={styles.foodsList}>
                {meal.foods.map((food, foodIndex) => (
                  <Text 
                    key={foodIndex} 
                    style={[styles.foodItem, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    • {food.name} ({food.quantity})
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
        
        {plan.exerciseRecommendations && plan.exerciseRecommendations.length > 0 && (
          <View style={styles.exerciseContainer}>
            <View style={styles.exerciseHeader}>
              <Activity size={16} color={colors.primary} />
              <Text style={[styles.exerciseTitle, { color: colors.text }]}>
                Exercise Recommendations
              </Text>
            </View>
            
            <View style={styles.exerciseList}>
              {plan.exerciseRecommendations.map((exercise, index) => (
                <Text 
                  key={index} 
                  style={[styles.exerciseItem, { color: colors.textSecondary }]}
                >
                  • {exercise}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  calories: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealsContainer: {
    marginBottom: 16,
  },
  mealItem: {
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTime: {
    fontSize: 12,
    marginLeft: 4,
  },
  foodsList: {
    marginLeft: 8,
  },
  foodItem: {
    fontSize: 14,
    marginBottom: 2,
  },
  exerciseContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  exerciseList: {
    marginLeft: 8,
  },
  exerciseItem: {
    fontSize: 14,
    marginBottom: 2,
  },
});

export default NutritionPlanCard;