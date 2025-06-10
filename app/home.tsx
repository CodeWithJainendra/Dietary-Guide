import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useChatStore } from '@/store/chatStore';
import { theme } from '@/constants/theme';
import AvatarEmoji from '@/components/AvatarEmoji';
import Button from '@/components/Button';
import Card from '@/components/Card';
import LogMealForm from '@/components/LogMealForm';
import MealCard from '@/components/MealCard';
import NutritionPlanCard from '@/components/NutritionPlanCard';
import { MealEntry, NutritionPlan } from '@/types';
import { generateMealPlan } from '@/utils/aiService';
import { addToGoogleTasks, addToGoogleCalendar } from '@/utils/googleService';
import { PlusCircle, Calendar, MessageCircle, Home, BarChart2, User } from 'lucide-react-native';

export default function HomeScreen() {
  const profile = useUserStore((state) => state.profile);
  const calculateBMI = useUserStore((state) => state.calculateBMI);
  const { 
    mealEntries, 
    nutritionPlans, 
    avatarMood, 
    setAvatarMood, 
    determineAvatarMood,
    addMealEntry,
    setNutritionPlan
  } = useNutritionStore();
  
  const { messages } = useChatStore();
  
  const [isShowingLogMeal, setIsShowingLogMeal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    let newGreeting = '';
    
    if (hour < 12) newGreeting = 'Good morning';
    else if (hour < 18) newGreeting = 'Good afternoon';
    else newGreeting = 'Good evening';
    
    if (profile?.name) {
      newGreeting += `, ${profile.name.split(' ')[0]}!`;
    } else {
      newGreeting += '!';
    }
    
    setGreeting(newGreeting);
    
    // Set avatar mood based on BMI
    const bmi = calculateBMI();
    const mood = determineAvatarMood(bmi);
    setAvatarMood(mood);
  }, [profile, calculateBMI, determineAvatarMood, setAvatarMood]);
  
  // Check for mood indicators in chat messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      
      if (lastUserMessage) {
        const content = lastUserMessage.content.toLowerCase();
        
        if (content.includes('sad') || content.includes('depressed') || content.includes('unhappy') || 
            content.includes('feeling down') || content.includes('not feeling well')) {
          setAvatarMood('sad');
        } else if (content.includes('worried') || content.includes('anxious') || content.includes('concerned')) {
          setAvatarMood('worried');
        } else if (content.includes('scared') || content.includes('terrified') || content.includes('afraid')) {
          setAvatarMood('scared');
        } else if (content.includes('happy') || content.includes('great') || content.includes('excellent')) {
          setAvatarMood('happy');
        } else if (content.includes('excited') || content.includes('thrilled')) {
          setAvatarMood('excited');
        }
      }
    }
  }, [messages, setAvatarMood]);
  
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  const handleLogMeal = (meal: MealEntry) => {
    addMealEntry(meal);
    setIsShowingLogMeal(false);
  };
  
  const handleGeneratePlan = async () => {
    if (!profile) return;
    
    try {
      setIsGeneratingPlan(true);
      
      // Get recent meals for context
      const recentMeals = mealEntries.slice(-5);
      
      // Generate plan using AI
      const planText = await generateMealPlan(profile, recentMeals);
      
      // Parse the AI response to create a structured plan
      // This is a simplified parsing - in a real app, you'd want more robust parsing
      const today = new Date().toISOString().split('T')[0];
      
      // Create a sample plan (in a real app, you'd parse the AI response)
      const plan: NutritionPlan = {
        id: Date.now().toString(),
        userId: profile.userId || 'current-user',
        date: today,
        meals: [
          {
            mealType: 'breakfast',
            time: '08:00',
            foods: [
              { name: 'Oatmeal with berries', quantity: '1 bowl', calories: 250, protein: 8, carbs: 40, fat: 5 },
              { name: 'Greek yogurt', quantity: '1/2 cup', calories: 100, protein: 15, carbs: 5, fat: 0 }
            ]
          },
          {
            mealType: 'lunch',
            time: '13:00',
            foods: [
              { name: 'Grilled chicken salad', quantity: '1 plate', calories: 350, protein: 30, carbs: 15, fat: 15 },
              { name: 'Whole grain bread', quantity: '1 slice', calories: 80, protein: 3, carbs: 15, fat: 1 }
            ]
          },
          {
            mealType: 'dinner',
            time: '19:00',
            foods: [
              { name: 'Baked salmon', quantity: '150g', calories: 300, protein: 25, carbs: 0, fat: 18 },
              { name: 'Steamed vegetables', quantity: '1 cup', calories: 80, protein: 2, carbs: 15, fat: 0 },
              { name: 'Brown rice', quantity: '1/2 cup', calories: 120, protein: 3, carbs: 25, fat: 1 }
            ]
          }
        ],
        totalCalories: 1280,
        exerciseRecommendations: [
          '30 minutes of brisk walking',
          '15 minutes of strength training'
        ]
      };
      
      // Save the plan
      setNutritionPlan(plan);
      
      // Add to Google Tasks and Calendar
      for (const meal of plan.meals) {
        const mealDate = new Date(today);
        const [hours, minutes] = meal.time.split(':').map(Number);
        mealDate.setHours(hours, minutes);
        
        const endTime = new Date(mealDate);
        endTime.setMinutes(endTime.getMinutes() + 30);
        
        const mealTitle = `${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`;
        const mealDescription = meal.foods.map(f => `${f.name} (${f.quantity})`).join(', ');
        
        // Add to Google Tasks
        await addToGoogleTasks(
          mealTitle,
          mealDescription,
          mealDate
        );
        
        // Add to Google Calendar
        await addToGoogleCalendar(
          mealTitle,
          mealDescription,
          mealDate,
          endTime
        );
      }
      
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };
  
  const getTodaysMeals = () => {
    const today = new Date().toISOString().split('T')[0];
    return mealEntries.filter(meal => meal.date === today);
  };
  
  const getTodaysPlan = () => {
    const today = new Date().toISOString().split('T')[0];
    return nutritionPlans.find(plan => plan.date === today);
  };
  
  const todaysMeals = getTodaysMeals();
  const todaysPlan = getTodaysPlan();
  
  const navigateToChat = () => {
    router.push('/chat');
  };
  
  const navigateToStats = () => {
    router.push('/stats');
  };
  
  const navigateToProfile = () => {
    router.push('/profile');
  };
  
  // Only show today's plan if there are meals logged or if we're showing the log meal form
  const shouldShowTodaysPlan = todaysPlan && (todaysMeals.length > 0 || isShowingLogMeal);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <AvatarEmoji
            mood={avatarMood}
            message={greeting}
            showMessage={true}
          />
        </View>
        
        {isShowingLogMeal ? (
          <Card style={styles.logMealCard}>
            <LogMealForm
              onSubmit={handleLogMeal}
            />
            <Button
              title="Cancel"
              onPress={() => setIsShowingLogMeal(false)}
              variant="outline"
              style={styles.cancelButton}
            />
          </Card>
        ) : (
          <View style={styles.actionsContainer}>
            <Button
              title="Log Meal"
              onPress={() => setIsShowingLogMeal(true)}
              leftIcon={<PlusCircle size={20} color="white" />}
              style={styles.actionButton}
            />
            <Button
              title="Generate Plan"
              onPress={handleGeneratePlan}
              isLoading={isGeneratingPlan}
              leftIcon={<Calendar size={20} color="white" />}
              style={styles.actionButton}
            />
          </View>
        )}
        
        {shouldShowTodaysPlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Plan</Text>
            <NutritionPlanCard plan={todaysPlan} />
          </View>
        )}
        
        {todaysMeals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            {todaysMeals.map(meal => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </View>
        )}
        
        {!todaysPlan && !todaysMeals.length && !isShowingLogMeal && (
          <Card style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No meals or plans yet</Text>
            <Text style={styles.emptyStateText}>
              Log your meals or generate a nutrition plan to get started.
            </Text>
          </Card>
        )}
      </ScrollView>
      
      <TouchableOpacity style={styles.chatButton} onPress={navigateToChat}>
        <MessageCircle size={24} color="white" />
        <Text style={styles.chatButtonText}>Ask me anything about nutrition</Text>
      </TouchableOpacity>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {/* Already on home */}}
        >
          <View style={[styles.tabIcon, styles.activeTabIcon]}>
            <Home size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={navigateToChat}
        >
          <View style={styles.tabIcon}>
            <MessageCircle size={24} color={theme.colors.inactive} />
          </View>
          <Text style={styles.tabLabel}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={navigateToStats}
        >
          <View style={styles.tabIcon}>
            <BarChart2 size={24} color={theme.colors.inactive} />
          </View>
          <Text style={styles.tabLabel}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={navigateToProfile}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 80, // Extra padding for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  logMealCard: {
    marginBottom: theme.spacing.lg,
  },
  cancelButton: {
    marginTop: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  chatButton: {
    position: 'absolute',
    bottom: 80, // Position above tab bar
    right: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  chatButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500',
    marginLeft: theme.spacing.sm,
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