import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { MealEntry } from '@/types';
import Card from './Card';
import { Clock, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

interface MealCardProps {
  meal: MealEntry;
}

const MealCard: React.FC<MealCardProps> = ({ meal }) => {
  const { colors } = useTheme();
  
  const handlePress = () => {
    router.push(`/meal/${meal.id}`);
  };
  
  // Format meal type for display
  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={styles.mealInfo}>
            <Text style={[styles.mealType, { color: colors.text }]}>
              {formatMealType(meal.mealType)}
            </Text>
            
            <View style={styles.macros}>
              <Text style={[styles.calories, { color: colors.primary }]}>
                {meal.totalCalories} cal
              </Text>
              <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                P: {meal.totalProtein}g • C: {meal.totalCarbs}g • F: {meal.totalFat}g
              </Text>
            </View>
            
            <View style={styles.foodsList}>
              {meal.foods.slice(0, 2).map((food, index) => (
                <Text 
                  key={index} 
                  style={[styles.foodItem, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  • {food.name}
                </Text>
              ))}
              {meal.foods.length > 2 && (
                <Text style={[styles.moreItems, { color: colors.textSecondary }]}>
                  +{meal.foods.length - 2} more items
                </Text>
              )}
            </View>
          </View>
          
          {meal.imageUrl && (
            <Image 
              source={{ uri: meal.imageUrl }} 
              style={styles.mealImage} 
            />
          )}
          
          <ChevronRight size={20} color={colors.textSecondary} style={styles.chevron} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  macros: {
    marginBottom: 8,
  },
  calories: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  macroText: {
    fontSize: 12,
  },
  foodsList: {
    marginTop: 4,
  },
  foodItem: {
    fontSize: 14,
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  mealImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginLeft: 12,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default MealCard;