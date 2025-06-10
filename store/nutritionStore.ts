import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealEntry, NutritionPlan, AvatarMood } from '@/types';

interface NutritionState {
  mealEntries: MealEntry[];
  nutritionPlans: NutritionPlan[];
  avatarMood: AvatarMood;
  addMealEntry: (meal: MealEntry) => void;
  updateMealEntry: (id: string, updates: Partial<MealEntry>) => void;
  deleteMealEntry: (id: string) => void;
  setNutritionPlan: (plan: NutritionPlan) => void;
  updateNutritionPlan: (id: string, updates: Partial<NutritionPlan>) => void;
  deleteNutritionPlan: (id: string) => void;
  setAvatarMood: (mood: AvatarMood) => void;
  determineAvatarMood: (bmi: number | null, recentCalories?: number, goal?: string) => AvatarMood;
  clearAllData: () => void;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      mealEntries: [],
      nutritionPlans: [],
      avatarMood: 'happy',
      
      addMealEntry: (meal) => set((state) => ({
        mealEntries: [meal, ...state.mealEntries]
      })),
      
      updateMealEntry: (id, updates) => set((state) => ({
        mealEntries: state.mealEntries.map(meal => 
          meal.id === id ? { ...meal, ...updates } : meal
        )
      })),
      
      deleteMealEntry: (id) => set((state) => ({
        mealEntries: state.mealEntries.filter(meal => meal.id !== id)
      })),
      
      setNutritionPlan: (plan) => set((state) => ({
        nutritionPlans: [plan, ...state.nutritionPlans]
      })),
      
      updateNutritionPlan: (id, updates) => set((state) => ({
        nutritionPlans: state.nutritionPlans.map(plan => 
          plan.id === id ? { ...plan, ...updates } : plan
        )
      })),
      
      deleteNutritionPlan: (id) => set((state) => ({
        nutritionPlans: state.nutritionPlans.filter(plan => plan.id !== id)
      })),
      
      setAvatarMood: (mood) => set({ avatarMood: mood }),
      
      determineAvatarMood: (bmi, recentCalories, goal) => {
        // Prioritize positive emotions and be encouraging
        
        // If BMI is in healthy range, be happy
        if (bmi && bmi >= 18.5 && bmi < 25) {
          // Check if they're meeting their goals
          if (recentCalories) {
            if (goal === 'weight_loss' && recentCalories < 2000) {
              return 'proud'; // They're doing well with their diet
            } else if (goal === 'weight_gain' && recentCalories > 2200) {
              return 'encouraging'; // Supporting their weight gain
            } else if (goal === 'maintenance') {
              return 'very_happy'; // Maintaining well
            }
          }
          return 'happy'; // Default positive for healthy BMI
        }
        
        // For overweight but not severely
        if (bmi && bmi >= 25 && bmi < 30) {
          return 'supportive'; // Encouraging but supportive
        }
        
        // For underweight
        if (bmi && bmi < 18.5 && bmi >= 17) {
          return 'caring'; // Gentle encouragement
        }
        
        // For more concerning ranges, still be supportive
        if (bmi && (bmi >= 30 || bmi < 17)) {
          return 'concerned'; // Show concern but still supportive
        }
        
        // Default to encouraging for unknown situations
        return 'encouraging';
      },
      
      clearAllData: () => set({
        mealEntries: [],
        nutritionPlans: [],
        avatarMood: 'happy'
      }),
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);