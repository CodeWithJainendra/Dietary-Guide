import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@/components/Card';
import { UserProfile } from '@/types';
import { Sparkles, Utensils, Zap } from 'lucide-react-native';

interface AIRecommendationsProps {
  profile: UserProfile;
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
  recommendedCalories: number;
}

interface Recommendations {
  mealSuggestion: string;
  exerciseSuggestion: string;
  additionalNotes: string;
}

export default function AIRecommendations({
  profile,
  todayCalories,
  todayProtein,
  todayCarbs,
  todayFat,
  recommendedCalories
}: AIRecommendationsProps) {
  const { colors } = useTheme();
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const generateRecommendations = async (): Promise<Recommendations> => {
    // Get current time for personalized recommendations
    const now = new Date();
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const date = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric'
    });

    // Calculate remaining calories and macros
    const remainingCalories = Math.max(0, recommendedCalories - todayCalories);
    const proteinGoal = Math.round(profile.weight * 1.6); // 1.6g per kg for active individuals
    const remainingProtein = Math.max(0, proteinGoal - todayProtein);

    // Generate meal suggestion based on time of day and remaining calories
    let mealSuggestion = '';
    if (timeOfDay === 'morning') {
      if (profile.dietaryPreferences?.includes('vegetarian') || profile.dietaryPreferences?.includes('vegan')) {
        mealSuggestion = 'Breakfast: Tofu scramble with spinach and whole-wheat toast.';
      } else {
        mealSuggestion = 'Breakfast: Greek yogurt with berries and granola, or scrambled eggs with avocado toast.';
      }
    } else if (timeOfDay === 'afternoon') {
      if (remainingCalories > 400) {
        mealSuggestion = profile.dietaryPreferences?.includes('vegetarian') 
          ? 'Lunch: Quinoa bowl with roasted vegetables, chickpeas, and tahini dressing.'
          : 'Lunch: Grilled chicken salad with mixed greens, nuts, and olive oil dressing.';
      } else {
        mealSuggestion = 'Light lunch: Mixed green salad with lean protein and a light vinaigrette.';
      }
    } else {
      if (remainingCalories > 300) {
        mealSuggestion = profile.dietaryPreferences?.includes('vegetarian')
          ? 'Dinner: Lentil curry with brown rice and steamed broccoli.'
          : 'Dinner: Baked salmon with roasted sweet potato and asparagus.';
      } else {
        mealSuggestion = 'Light dinner: Vegetable soup with a small portion of whole grains.';
      }
    }

    // Generate exercise suggestion based on profile and day
    let exerciseSuggestion = '';
    const exerciseMinutes = profile.exerciseDuration || 30;
    
    if (profile.goal === 'weight_loss') {
      exerciseSuggestion = `${exerciseMinutes}-minute HIIT workout combining cardio and strength training for maximum calorie burn.`;
    } else if (profile.goal === 'weight_gain') {
      exerciseSuggestion = `${exerciseMinutes}-minute weight training session focusing on compound exercises like squats, bench presses, and deadlifts.`;
    } else {
      exerciseSuggestion = `${exerciseMinutes}-minute balanced workout combining cardio and strength training for overall fitness.`;
    }

    // Generate additional notes based on profile and current intake
    let additionalNotes = '';
    const notes = [];

    if (remainingProtein > 10) {
      notes.push(`You need ${Math.round(remainingProtein)}g more protein today. Consider adding a protein shake after your workout.`);
    }

    if (profile.dietaryPreferences?.includes('vegetarian') || profile.dietaryPreferences?.includes('vegan')) {
      notes.push('Since you are vegetarian, be sure to include varied sources of protein in your diet like lentils, beans, tofu, quinoa, and nuts.');
    }

    if (profile.diseases && profile.diseases.length > 0) {
      notes.push('Remember to follow your healthcare provider\'s dietary recommendations for your health conditions.');
    }

    if (todayCalories < recommendedCalories * 0.7) {
      notes.push('You\'re significantly under your calorie goal. Make sure you\'re eating enough to fuel your body properly.');
    }

    additionalNotes = notes.join(' ');

    return {
      mealSuggestion,
      exerciseSuggestion,
      additionalNotes
    };
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        const recs = await generateRecommendations();
        setRecommendations(recs);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        // Fallback recommendations
        setRecommendations({
          mealSuggestion: 'Breakfast: Balanced meal with protein, healthy fats, and complex carbohydrates.',
          exerciseSuggestion: '30-minute moderate exercise session combining cardio and strength training.',
          additionalNotes: 'Stay hydrated throughout the day and listen to your body\'s hunger cues.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (profile) {
      loadRecommendations();
    }
  }, [profile, todayCalories, todayProtein, recommendedCalories]);

  if (isLoading) {
    return (
      <Card style={styles.recommendationsCard}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Generating personalized recommendations...
          </Text>
        </View>
      </Card>
    );
  }

  if (!recommendations) {
    return null;
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <Card style={styles.recommendationsCard}>
      <View style={styles.header}>
        <Sparkles size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>AI Recommendations</Text>
      </View>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Personalized meal and exercise suggestions for {formattedDate}.
      </Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Utensils size={18} color={colors.success} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meal Suggestion:</Text>
        </View>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          {recommendations.mealSuggestion}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Zap size={18} color={colors.warning} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercise Suggestion:</Text>
        </View>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          {recommendations.exerciseSuggestion}
        </Text>
      </View>

      {recommendations.additionalNotes && (
        <View style={styles.notesSection}>
          <Text style={[styles.notesTitle, { color: colors.text }]}>Additional Notes:</Text>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>
            {recommendations.additionalNotes}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  recommendationsCard: {
    marginBottom: 20,
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 24,
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
