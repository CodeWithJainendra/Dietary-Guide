import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import Card from '@/components/Card';
import { HealthStatsCard } from '@/components/HealthStatsCard';
import { getHealthInsights } from '@/utils/aiService';
import { ArrowLeft, Home, MessageCircle, BarChart2, User } from 'lucide-react-native';

export default function StatsScreen() {
  const profile = useUserStore((state) => state.profile);
  const calculateBMI = useUserStore((state) => state.calculateBMI);
  const getHealthStatus = useUserStore((state) => state.getHealthStatus);
  const { mealEntries, nutritionPlans } = useNutritionStore();
  
  const [healthInsights, setHealthInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  useEffect(() => {
    if (profile) {
      loadHealthInsights();
    }
  }, [profile]);
  
  const loadHealthInsights = async () => {
    if (!profile) return;
    
    try {
      setIsLoadingInsights(true);
      const insights = await getHealthInsights(profile);
      setHealthInsights(insights);
    } catch (error) {
      console.error('Error loading health insights:', error);
      setHealthInsights('Unable to load health insights at this time.');
    } finally {
      setIsLoadingInsights(false);
    }
  };
  
  const getTotalCaloriesConsumed = () => {
    const today = new Date().toISOString().split('T')[0];
    return mealEntries
      .filter(meal => meal.date === today)
      .reduce((sum, meal) => sum + meal.totalCalories, 0);
  };
  
  const getCalorieGoal = () => {
    const todaysPlan = nutritionPlans.find(
      plan => plan.date === new Date().toISOString().split('T')[0]
    );
    
    if (todaysPlan) {
      return todaysPlan.totalCalories;
    }
    
    // Default calorie goals based on profile
    if (!profile) return 2000;
    
    const bmi = calculateBMI() || 25;
    const baseCalories = profile.gender === 'female' ? 1800 : 2200;
    
    if (profile.goal === 'weight_loss') {
      return baseCalories - 300;
    } else if (profile.goal === 'weight_gain') {
      return baseCalories + 300;
    }
    
    return baseCalories;
  };
  
  const getCompletedMealsCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return mealEntries.filter(meal => meal.date === today).length;
  };
  
  const getPlannedMealsCount = () => {
    const todaysPlan = nutritionPlans.find(
      plan => plan.date === new Date().toISOString().split('T')[0]
    );
    
    return todaysPlan ? todaysPlan.meals.length : 0;
  };
  
  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const bmi = calculateBMI() || 0;
  const healthStatus = getHealthStatus();
  const caloriesConsumed = getTotalCaloriesConsumed();
  const calorieGoal = getCalorieGoal();
  const completedMeals = getCompletedMealsCount();
  const plannedMeals = getPlannedMealsCount();
  
  // Function to render formatted health insights with proper styling
  const renderHealthInsights = () => {
    if (!healthInsights) return null;
    
    // Split the text into paragraphs
    const paragraphs = healthInsights.split('\n\n');
    
    return (
      <>
        {paragraphs.map((paragraph, index) => {
          // Check if this paragraph looks like a heading (all caps or ends with colon)
          const isHeading = /^[A-Z\s]+$/.test(paragraph.trim()) || paragraph.trim().endsWith(':');
          
          // Check if this paragraph is a bullet point
          const isBulletPoint = paragraph.trim().startsWith('•') || 
                               paragraph.trim().startsWith('-') || 
                               /^\d+\./.test(paragraph.trim());
          
          if (isHeading) {
            return (
              <Text key={index} style={styles.insightHeading}>
                {paragraph.trim()}
              </Text>
            );
          } else if (isBulletPoint) {
            return (
              <Text key={index} style={styles.insightBullet}>
                {paragraph.trim()}
              </Text>
            );
          } else {
            return (
              <Text key={index} style={styles.insightParagraph}>
                {paragraph.trim()}
              </Text>
            );
          }
        })}
      </>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>

        
        <HealthStatsCard
          profile={profile}
          bmi={bmi}
          healthStatus={healthStatus}
        />
        
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Today's Nutrition</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{caloriesConsumed}</Text>
              <Text style={styles.statLabel}>Calories Consumed</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{calorieGoal}</Text>
              <Text style={styles.statLabel}>Calorie Goal</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(100, (caloriesConsumed / calorieGoal) * 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((caloriesConsumed / calorieGoal) * 100)}% of daily goal
            </Text>
          </View>
        </Card>
        
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Meal Tracking</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedMeals}</Text>
              <Text style={styles.statLabel}>Meals Logged</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{plannedMeals}</Text>
              <Text style={styles.statLabel}>Planned Meals</Text>
            </View>
          </View>
        </Card>
        
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Health Insights</Text>
          
          {isLoadingInsights ? (
            <View style={styles.insightsLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.insightsLoadingText}>Loading insights...</Text>
            </View>
          ) : (
            <View style={styles.insightsContainer}>
              {renderHealthInsights()}
            </View>
          )}
        </Card>
      </ScrollView>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('/home')}
        >
          <View style={styles.tabIcon}>
            <Home size={24} color={theme.colors.inactive} />
          </View>
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('/chat')}
        >
          <View style={styles.tabIcon}>
            <MessageCircle size={24} color={theme.colors.inactive} />
          </View>
          <Text style={styles.tabLabel}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {/* Already on stats */}}
        >
          <View style={[styles.tabIcon, styles.activeTabIcon]}>
            <BarChart2 size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('/profile')}
        >
          <View style={styles.tabIcon}>
            <User size={24} color={theme.colors.inactive} />
          </View>
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerRight: {
    width: 40, // Balance the header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 80, // Extra padding for tab bar
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
  },
  insightsLoading: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  insightsLoadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  insightsContainer: {
    padding: theme.spacing.sm,
  },
  insightHeading: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  insightParagraph: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  insightBullet: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
    lineHeight: 22,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    ...theme.shadows.medium,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    marginBottom: 4,
  },
  activeTabIcon: {
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 8,
    padding: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: theme.colors.inactive,
  },
  activeTabLabel: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});