import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import Card from '@/components/Card';
import HealthStatsCard from '@/components/HealthStatsCard';
import { getHealthInsights } from '@/utils/aiService';
import { BarChart2, Activity, TrendingUp, Calendar, Heart, Clock, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react-native';

export default function StatsScreen() {
  const { colors } = useTheme();
  const profile = useUserStore((state) => state.profile);
  const calculateBMI = useUserStore((state) => state.calculateBMI);
  const getHealthStatus = useUserStore((state) => state.getHealthStatus);
  const mealEntries = useNutritionStore((state) => state.mealEntries);
  
  const [refreshing, setRefreshing] = useState(false);
  const [healthInsights, setHealthInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  const bmi = calculateBMI();
  const healthStatus = getHealthStatus();
  
  // Calculate total calories for the last 7 days
  const getCaloriesByDay = () => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const caloriesByDay = last7Days.map(date => {
      const dayMeals = mealEntries.filter(meal => meal.date === date);
      const totalCalories = dayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0);
      return {
        date,
        calories: totalCalories,
      };
    });
    
    return caloriesByDay;
  };
  
  // Calculate average calories per day
  const getAverageCalories = () => {
    const caloriesByDay = getCaloriesByDay();
    const totalCalories = caloriesByDay.reduce((sum, day) => sum + day.calories, 0);
    const daysWithData = caloriesByDay.filter(day => day.calories > 0).length;
    return daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;
  };
  
  // Calculate recommended daily calories based on profile
  const getRecommendedCalories = () => {
    if (!profile) return 2000;
    
    // Basic BMR calculation using Harris-Benedict equation
    let bmr = 0;
    
    if (profile.gender === 'male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    }
    
    // Activity multiplier
    let activityMultiplier = 1.2; // Sedentary
    
    if (profile.exerciseDuration >= 60) {
      activityMultiplier = 1.725; // Very active
    } else if (profile.exerciseDuration >= 30) {
      activityMultiplier = 1.55; // Moderately active
    } else if (profile.exerciseDuration >= 15) {
      activityMultiplier = 1.375; // Lightly active
    }
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    let tdee = bmr * activityMultiplier;
    
    // Adjust based on goal
    if (profile.goal === 'weight_loss') {
      tdee -= 500; // Deficit for weight loss
    } else if (profile.goal === 'weight_gain') {
      tdee += 500; // Surplus for weight gain
    }
    
    return Math.round(tdee);
  };
  
  // Calculate macronutrient recommendations
  const getMacroRecommendations = () => {
    const calories = getRecommendedCalories();
    
    let proteinPercentage = 0.3; // 30% protein
    let carbPercentage = 0.4;    // 40% carbs
    let fatPercentage = 0.3;     // 30% fat
    
    // Adjust based on goal
    if (profile?.goal === 'weight_loss') {
      proteinPercentage = 0.35;
      carbPercentage = 0.35;
      fatPercentage = 0.3;
    } else if (profile?.goal === 'weight_gain') {
      proteinPercentage = 0.25;
      carbPercentage = 0.45;
      fatPercentage = 0.3;
    }
    
    // Calculate grams
    const proteinGrams = Math.round((calories * proteinPercentage) / 4); // 4 calories per gram of protein
    const carbGrams = Math.round((calories * carbPercentage) / 4);       // 4 calories per gram of carbs
    const fatGrams = Math.round((calories * fatPercentage) / 9);         // 9 calories per gram of fat
    
    return { proteinGrams, carbGrams, fatGrams };
  };
  
  // Calculate exercise recommendations
  const getExerciseRecommendations = () => {
    if (!profile) return { cardioMinutes: 150, strengthDays: 2 };
    
    let cardioMinutes = 150; // Default recommendation
    let strengthDays = 2;    // Default recommendation
    
    // Adjust based on goal
    if (profile.goal === 'weight_loss') {
      cardioMinutes = 200;
      strengthDays = 2;
    } else if (profile.goal === 'weight_gain') {
      cardioMinutes = 120;
      strengthDays = 4;
    } else if (profile.goal === 'maintenance') {
      cardioMinutes = 150;
      strengthDays = 3;
    }
    
    // Adjust based on current activity level
    if (profile.exerciseDuration < 15) {
      // Beginner - start lower
      cardioMinutes = Math.max(90, cardioMinutes - 60);
      strengthDays = Math.max(1, strengthDays - 1);
    } else if (profile.exerciseDuration >= 45) {
      // Already active - can do more
      cardioMinutes = Math.min(300, cardioMinutes + 30);
      strengthDays = Math.min(5, strengthDays + 1);
    }
    
    return { cardioMinutes, strengthDays };
  };
  
  // Get health risks and recommendations
  const getHealthRisks = () => {
    const risks = [];
    const recommendations = [];
    
    if (bmi) {
      if (bmi < 18.5) {
        risks.push('Underweight - Risk of malnutrition and weakened immunity');
        recommendations.push('Increase caloric intake with nutrient-dense foods like nuts, avocados, and lean proteins');
      } else if (bmi >= 25 && bmi < 30) {
        risks.push('Overweight - Increased risk of heart disease and diabetes');
        recommendations.push('Create a moderate caloric deficit through balanced diet and regular exercise');
      } else if (bmi >= 30) {
        risks.push('Obesity - High risk of diabetes, cardiovascular disease, and joint problems');
        recommendations.push('Consult healthcare provider for comprehensive weight management plan');
      } else {
        recommendations.push('Maintain your healthy weight with balanced nutrition and regular exercise');
      }
    }
    
    if (profile?.isSmoker) {
      risks.push('Smoking - Significantly increases risk of cancer, heart disease, and stroke');
      recommendations.push('Consider smoking cessation programs and nicotine replacement therapy');
    }
    
    if (profile?.diseases && profile.diseases.length > 0) {
      risks.push(`Health conditions: ${profile.diseases.join(', ')}`);
      recommendations.push('Follow medical advice, take prescribed medications, and maintain regular check-ups');
    }
    
    if (profile?.exerciseDuration && profile.exerciseDuration < 30) {
      risks.push('Insufficient physical activity - Increased risk of chronic diseases');
      recommendations.push('Gradually increase daily exercise to 30+ minutes with activities you enjoy');
    }
    
    return { risks, recommendations };
  };
  
  const loadHealthInsights = async () => {
    if (!profile) return;
    
    try {
      setIsLoadingInsights(true);
      const insights = await getHealthInsights(profile);
      setHealthInsights(insights);
    } catch (error) {
      console.error('Error loading health insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    
    // Load health insights
    await loadHealthInsights();
    
    setRefreshing(false);
  };
  
  // Load health insights on first render
  useEffect(() => {
    if (profile && !healthInsights && !isLoadingInsights) {
      loadHealthInsights();
    }
  }, [profile, healthInsights, isLoadingInsights]);
  
  const caloriesByDay = getCaloriesByDay();
  const averageCalories = getAverageCalories();
  const recommendedCalories = getRecommendedCalories();
  const macros = getMacroRecommendations();
  const exercise = getExerciseRecommendations();
  const { risks, recommendations } = getHealthRisks();
  
  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No profile data available. Please complete your profile setup.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>Health Stats</Text>
        
        {/* BMI Card */}
        <HealthStatsCard
          title="Body Mass Index (BMI)"
          value={bmi ? bmi.toFixed(1) : 'N/A'}
          status={healthStatus}
          icon={<BarChart2 size={24} color={colors.primary} />}
        />
        
        {/* Basic Health Info */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Your Health Profile</Text>
          </View>
          
          <View style={styles.profileGrid}>
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>Age</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{profile.age} years</Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>Height</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{profile.height} cm</Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>Weight</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{profile.weight} kg</Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>Gender</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>
                {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
              </Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>Goal</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>
                {profile.goal === 'weight_loss' ? 'Weight Loss' : 
                 profile.goal === 'weight_gain' ? 'Weight Gain' : 
                 profile.goal === 'maintenance' ? 'Maintenance' : 
                 'Healthy Lifestyle'}
              </Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>Exercise</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{profile.exerciseDuration} min/day</Text>
            </View>
          </View>
        </Card>
        
        {/* Calorie Intake */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Calorie Intake Analysis</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{averageCalories}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Daily Average</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{recommendedCalories}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recommended</Text>
            </View>
          </View>
          
          <View style={styles.calorieChart}>
            {caloriesByDay.map((day, index) => {
              const maxCalories = Math.max(...caloriesByDay.map(d => d.calories), recommendedCalories);
              const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
              
              return (
                <View key={day.date} style={styles.chartBarContainer}>
                  <View style={styles.chartBarLabelContainer}>
                    <Text style={[styles.chartBarValue, { color: colors.text }]}>
                      {day.calories > 0 ? day.calories : ''}
                    </Text>
                  </View>
                  <View style={styles.chartBar}>
                    <View 
                      style={[
                        styles.chartBarFill, 
                        { 
                          height: `${barHeight}%`, 
                          backgroundColor: day.calories > recommendedCalories 
                            ? colors.error 
                            : colors.primary 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.chartBarDay, { color: colors.textSecondary }]}>
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
        
        {/* Nutrition Recommendations */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Target size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Nutrition Targets</Text>
          </View>
          
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.macroCircleText}>{macros.proteinGrams}g</Text>
              </View>
              <Text style={[styles.macroLabel, { color: colors.text }]}>Protein</Text>
              <Text style={[styles.macroDescription, { color: colors.textSecondary }]}>
                Muscle building & repair
              </Text>
            </View>
            
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: colors.secondary }]}>
                <Text style={styles.macroCircleText}>{macros.carbGrams}g</Text>
              </View>
              <Text style={[styles.macroLabel, { color: colors.text }]}>Carbs</Text>
              <Text style={[styles.macroDescription, { color: colors.textSecondary }]}>
                Energy & brain function
              </Text>
            </View>
            
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: colors.warning }]}>
                <Text style={styles.macroCircleText}>{macros.fatGrams}g</Text>
              </View>
              <Text style={[styles.macroLabel, { color: colors.text }]}>Fat</Text>
              <Text style={[styles.macroDescription, { color: colors.textSecondary }]}>
                Hormone production
              </Text>
            </View>
          </View>
          
          <Text style={[styles.macroNote, { color: colors.textSecondary }]}>
            Based on {recommendedCalories} daily calories for your {profile.goal.replace('_', ' ')} goal
          </Text>
        </Card>
        
        {/* Exercise Recommendations */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Zap size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Exercise Recommendations</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {profile.exerciseDuration || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Minutes/Day</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {Math.round(exercise.cardioMinutes / 7)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Target Minutes/Day</Text>
            </View>
          </View>
          
          <View style={styles.exerciseRecommendations}>
            <View style={styles.exerciseItem}>
              <Clock size={18} color={colors.primary} />
              <Text style={[styles.exerciseText, { color: colors.text }]}>
                {exercise.cardioMinutes} minutes of cardio per week
              </Text>
            </View>
            
            <View style={styles.exerciseItem}>
              <Activity size={18} color={colors.primary} />
              <Text style={[styles.exerciseText, { color: colors.text }]}>
                {exercise.strengthDays} days of strength training per week
              </Text>
            </View>
            
            <View style={styles.exerciseItem}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={[styles.exerciseText, { color: colors.text }]}>
                Focus on {profile.goal === 'weight_loss' ? 'cardio and HIIT' : 
                         profile.goal === 'weight_gain' ? 'strength training' : 
                         'balanced cardio and strength'}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Health Risks & Recommendations */}
        {(risks.length > 0 || recommendations.length > 0) && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <AlertTriangle size={24} color={colors.warning} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Health Assessment</Text>
            </View>
            
            {risks.length > 0 && (
              <View style={styles.riskSection}>
                <Text style={[styles.riskTitle, { color: colors.warning }]}>Areas of Concern:</Text>
                {risks.map((risk, index) => (
                  <View key={index} style={styles.riskItem}>
                    <AlertTriangle size={16} color={colors.warning} />
                    <Text style={[styles.riskText, { color: colors.text }]}>{risk}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {recommendations.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={[styles.recommendationTitle, { color: colors.success }]}>Recommendations:</Text>
                {recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.recommendationText, { color: colors.text }]}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
        
        {/* AI Health Insights */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>AI Health Insights</Text>
          </View>
          
          {isLoadingInsights ? (
            <Text style={[styles.insightsText, { color: colors.textSecondary }]}>
              Loading personalized health insights...
            </Text>
          ) : healthInsights ? (
            <Text style={[styles.insightsText, { color: colors.text }]}>
              {healthInsights}
            </Text>
          ) : (
            <Text style={[styles.insightsText, { color: colors.textSecondary }]}>
              Pull down to refresh and load your personalized health insights.
            </Text>
          )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profileItem: {
    width: '48%',
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  calorieChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginTop: 16,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartBarLabelContainer: {
    height: 20,
    justifyContent: 'center',
  },
  chartBarValue: {
    fontSize: 10,
    textAlign: 'center',
  },
  chartBar: {
    width: 20,
    height: '80%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 10,
  },
  chartBarDay: {
    fontSize: 10,
    marginTop: 4,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroCircleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
  macroNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  exerciseRecommendations: {
    marginTop: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  riskSection: {
    marginBottom: 16,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  riskText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  recommendationSection: {
    marginTop: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});