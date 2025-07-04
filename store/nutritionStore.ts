import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealEntry, NutritionPlan, AvatarMood } from '@/types';
import { saveMealEntry, updateMealEntry as updateSupabaseMealEntry, deleteMealEntry as deleteSupabaseMealEntry, fetchMealEntries } from '@/lib/supabase';

interface NutritionState {
  mealEntries: MealEntry[];
  nutritionPlans: NutritionPlan[];
  avatarMood: AvatarMood;
  isLoading: boolean;
  addMealEntry: (meal: MealEntry) => Promise<void>;
  updateMealEntry: (id: string, updates: Partial<MealEntry>) => Promise<void>;
  deleteMealEntry: (id: string) => Promise<void>;
  setNutritionPlan: (plan: NutritionPlan) => void;
  updateNutritionPlan: (id: string, updates: Partial<NutritionPlan>) => void;
  deleteNutritionPlan: (id: string) => void;
  setAvatarMood: (mood: AvatarMood) => void;
  determineAvatarMood: (bmi: number | null, recentCalories?: number, goal?: string) => AvatarMood;
  clearAllData: () => void;
  syncMealEntries: (userId: string) => Promise<void>;
  loadMealEntries: (userId: string, date?: string) => Promise<void>;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      mealEntries: [],
      nutritionPlans: [],
      avatarMood: 'happy',
      isLoading: false,

      addMealEntry: async (meal) => {
        // Add to local state immediately for optimistic updates
        set((state) => ({
          mealEntries: [meal, ...state.mealEntries]
        }));

        // Save to Supabase
        try {
          const result = await saveMealEntry(meal);
          if (!result.success) {
            console.error('Failed to save meal to Supabase:', result.error);
            // Could show a toast notification here
          } else {
            console.log('Meal saved to Supabase successfully');
          }
        } catch (error) {
          console.error('Error saving meal to Supabase:', error);
          // Could revert the local state here if needed
        }
      },

      updateMealEntry: async (id, updates) => {
        // Update local state immediately
        set((state) => ({
          mealEntries: state.mealEntries.map(meal =>
            meal.id === id ? { ...meal, ...updates } : meal
          )
        }));

        // Update in Supabase
        try {
          const result = await updateSupabaseMealEntry(id, updates);
          if (!result.success) {
            console.error('Failed to update meal in Supabase:', result.error);
          } else {
            console.log('Meal updated in Supabase successfully');
          }
        } catch (error) {
          console.error('Error updating meal in Supabase:', error);
        }
      },

      deleteMealEntry: async (id) => {
        // Remove from local state immediately
        set((state) => ({
          mealEntries: state.mealEntries.filter(meal => meal.id !== id)
        }));

        // Delete from Supabase
        try {
          const result = await deleteSupabaseMealEntry(id);
          if (!result.success) {
            console.error('Failed to delete meal from Supabase:', result.error);
          } else {
            console.log('Meal deleted from Supabase successfully');
          }
        } catch (error) {
          console.error('Error deleting meal from Supabase:', error);
        }
      },
      
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

      // Load meal entries from Supabase
      loadMealEntries: async (userId: string, date?: string) => {
        set({ isLoading: true });
        try {
          const result = await fetchMealEntries(userId, date);
          if (result.success && result.data) {
            set({
              mealEntries: result.data,
              isLoading: false
            });
            console.log('Loaded meal entries from Supabase:', result.data.length, 'entries');
          } else {
            console.error('Failed to load meal entries:', result.error);
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error loading meal entries:', error);
          set({ isLoading: false });
        }
      },

      // Sync local meal entries with Supabase
      syncMealEntries: async (userId: string) => {
        set({ isLoading: true });
        try {
          // Load all meal entries from Supabase
          const result = await fetchMealEntries(userId);
          if (result.success && result.data) {
            // Merge with local entries, prioritizing Supabase data
            const localEntries = get().mealEntries;
            const supabaseEntries = result.data;

            // Create a map of Supabase entries by ID
            const supabaseMap = new Map(supabaseEntries.map(entry => [entry.id, entry]));

            // Keep local entries that don't exist in Supabase (offline entries)
            const offlineEntries = localEntries.filter(entry => !supabaseMap.has(entry.id));

            // Combine Supabase entries with offline entries
            const mergedEntries = [...supabaseEntries, ...offlineEntries];

            set({
              mealEntries: mergedEntries,
              isLoading: false
            });

            console.log('Synced meal entries:', mergedEntries.length, 'total entries');

            // Save any offline entries to Supabase
            for (const offlineEntry of offlineEntries) {
              try {
                await saveMealEntry(offlineEntry);
                console.log('Synced offline entry to Supabase:', offlineEntry.id);
              } catch (error) {
                console.error('Failed to sync offline entry:', offlineEntry.id, error);
              }
            }
          } else {
            console.error('Failed to sync meal entries:', result.error);
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error syncing meal entries:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);