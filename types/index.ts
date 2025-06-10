export type UserProfile = {
  userId?: string;
  email?: string;
  name?: string;
  photoUrl?: string;
  height: number; // in cm
  weight: number; // in kg
  age: number;
  gender: 'male' | 'female' | 'other';
  goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'healthy_lifestyle';
  exerciseDuration: number; // in minutes
  dietaryRestrictions: string[];
  dietaryPreferences?: string[];
  diseases?: string[];
  isSmoker?: boolean;
  id?: number; // Make id optional to fix TypeScript errors with delete operator
};

export type Food = {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodItem = Food;

export type Meal = {
  mealType: string;
  time: string;
  foods: Food[];
};

export type MealEntry = {
  id: string;
  userId: string;
  date: string;
  mealType: string;
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  timestamp: number; // Added timestamp property
  imageUrl?: string;
};

export type NutritionPlan = {
  id: string;
  userId: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  exerciseRecommendations: string[];
};

export type AvatarMood = 
  | 'happy' 
  | 'very_happy'
  | 'excited' 
  | 'loving'
  | 'caring'
  | 'joyful'
  | 'neutral' 
  | 'concerned' 
  | 'worried'
  | 'tired'
  | 'confused'
  | 'surprised'
  | 'encouraging'
  | 'proud'
  | 'supportive'
  | 'polite'
  | 'humble';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

// Fixed ContentPart and CoreMessage types to match the API requirements
export type ContentPart = 
  | { type: 'text'; text: string; }
  | { type: 'image'; image: string; };

export type CoreMessage = 
  | { role: 'system'; content: string; }  
  | { role: 'user'; content: string | Array<ContentPart>; }
  | { role: 'assistant'; content: string | Array<ContentPart>; };

export type GoogleEvent = {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
};

export type GoogleTask = {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  completed?: boolean;
  status?: 'needsAction' | 'completed';
};

export type GoogleTaskList = {
  id: string;
  title: string;
};