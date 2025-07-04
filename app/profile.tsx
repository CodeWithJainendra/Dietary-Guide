import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Switch
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { 
  LogOut, 
  User, 
  Calendar, 
  CheckSquare, 
  Edit, 
  Trash2,
  ExternalLink,
  ArrowLeft,
  Home,
  MessageCircle,
  BarChart2
} from 'lucide-react-native';
import { openGoogleCalendar, openGoogleTasks } from '@/utils/googleService';
import { signOut } from '@/lib/supabase';

export default function ProfileScreen() {
  const { profile, updateProfile, logout } = useUserStore();
  const clearNutritionData = useNutritionStore((state) => state.clearAllData);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  
  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
          <Button
            title="Go to Home"
            onPress={() => router.replace('/home')}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      updateProfile(editedProfile || {});
      Alert.alert('Success', 'Your profile has been updated.');
    }
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (key: string, value: any) => {
    setEditedProfile(prev => ({
      ...prev!,
      [key]: value,
    }));
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };
  
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your meal entries and nutrition plans. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            clearNutritionData();
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ]
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
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profile.photoUrl ? (
              <Image
                source={{ uri: profile.photoUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <User size={40} color={theme.colors.textSecondary} />
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{profile.name || 'User'}</Text>
          <Text style={styles.email}>{profile.email || ''}</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditToggle}>
            {isEditing ? (
              <Text style={styles.editButtonText}>Save</Text>
            ) : (
              <>
                <Edit size={16} color={theme.colors.primary} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          
          {isEditing ? (
            <View style={styles.editForm}>
              <Input
                label="Height (cm)"
                value={editedProfile?.height.toString()}
                onChangeText={(value) => handleInputChange('height', parseInt(value) || 0)}
                keyboardType="numeric"
              />
              
              <Input
                label="Weight (kg)"
                value={editedProfile?.weight.toString()}
                onChangeText={(value) => handleInputChange('weight', parseInt(value) || 0)}
                keyboardType="numeric"
              />
              
              <Input
                label="Age"
                value={editedProfile?.age.toString()}
                onChangeText={(value) => handleInputChange('age', parseInt(value) || 0)}
                keyboardType="numeric"
              />
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Smoker</Text>
                <Switch
                  value={editedProfile?.isSmoker}
                  onValueChange={(value) => handleInputChange('isSmoker', value)}
                  trackColor={{ false: theme.colors.inactive, true: theme.colors.primary }}
                  thumbColor="white"
                />
              </View>
              
              <Text style={styles.label}>Goal</Text>
              <View style={styles.optionsContainer}>
                <Button
                  title="Weight Loss"
                  variant={editedProfile?.goal === 'weight_loss' ? 'primary' : 'outline'}
                  onPress={() => handleInputChange('goal', 'weight_loss')}
                  style={styles.optionButton}
                  size="small"
                />
                <Button
                  title="Healthy Lifestyle"
                  variant={editedProfile?.goal === 'healthy_lifestyle' ? 'primary' : 'outline'}
                  onPress={() => handleInputChange('goal', 'healthy_lifestyle')}
                  style={styles.optionButton}
                  size="small"
                />
                <Button
                  title="Weight Gain"
                  variant={editedProfile?.goal === 'weight_gain' ? 'primary' : 'outline'}
                  onPress={() => handleInputChange('goal', 'weight_gain')}
                  style={styles.optionButton}
                  size="small"
                />
              </View>
              
              <Input
                label="Daily Exercise (minutes)"
                value={editedProfile?.exerciseDuration.toString()}
                onChangeText={(value) => handleInputChange('exerciseDuration', parseInt(value) || 0)}
                keyboardType="numeric"
              />
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{profile.height} cm</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>{profile.weight} kg</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{profile.age}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Smoker</Text>
                <Text style={styles.infoValue}>{profile.isSmoker ? 'Yes' : 'No'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Goal</Text>
                <Text style={styles.infoValue}>
                  {profile.goal === 'weight_loss'
                    ? 'Weight Loss'
                    : profile.goal === 'weight_gain'
                    ? 'Weight Gain'
                    : 'Healthy Lifestyle'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Daily Exercise</Text>
                <Text style={styles.infoValue}>{profile.exerciseDuration} minutes</Text>
              </View>
            </View>
          )}
        </Card>
        
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Google Integration</Text>
          
          <TouchableOpacity style={styles.integrationButton} onPress={openGoogleCalendar}>
            <Calendar size={20} color={theme.colors.primary} />
            <Text style={styles.integrationButtonText}>Open Google Calendar</Text>
            <ExternalLink size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.integrationButton} onPress={openGoogleTasks}>
            <CheckSquare size={20} color={theme.colors.primary} />
            <Text style={styles.integrationButtonText}>Open Google Tasks</Text>
            <ExternalLink size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Card>
        
        <View style={styles.actionsContainer}>
          <Button
            title="Clear All Data"
            onPress={handleClearData}
            variant="outline"
            leftIcon={<Trash2 size={18} color={theme.colors.error} />}
            textStyle={{ color: theme.colors.error }}
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
          />
          
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            leftIcon={<LogOut size={18} color={theme.colors.error} />}
            textStyle={{ color: theme.colors.error }}
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
          />
        </View>
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
          onPress={() => router.push('/stats')}
        >
          <View style={styles.tabIcon}>
            <BarChart2 size={24} color={theme.colors.inactive} />
          </View>
          <Text style={styles.tabLabel}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {/* Already on profile */}}
        >
          <View style={[styles.tabIcon, styles.activeTabIcon]}>
            <User size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Profile</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 80, // Extra padding for tab bar
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  profileImageContainer: {
    marginBottom: theme.spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  email: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  editButtonText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
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
  infoContainer: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500',
    color: theme.colors.text,
  },
  editForm: {
    gap: theme.spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  switchLabel: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
  },
  label: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  optionButton: {
    flex: 1,
  },
  integrationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  integrationButtonText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  actionsContainer: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    width: '100%',
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