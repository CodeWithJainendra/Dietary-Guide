import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { UserProfile } from '@/types';
import Card from './Card';

interface HealthStatsCardProps {
  title: string;
  value: string;
  status?: string;
  icon?: React.ReactNode;
  profile?: UserProfile;
  bmi?: number | null;
  healthStatus?: string;
}

const HealthStatsCard: React.FC<HealthStatsCardProps> = ({
  title,
  value,
  status,
  icon,
  profile,
  bmi,
  healthStatus,
}) => {
  const { colors } = useTheme();
  
  // Determine status color
  const getStatusColor = () => {
    if (!status && !healthStatus) return colors.textSecondary;
    
    const statusToCheck = status || healthStatus || '';
    
    switch (statusToCheck.toLowerCase()) {
      case 'underweight':
        return '#FFA726'; // Orange
      case 'normal weight':
      case 'normal':
        return '#66BB6A'; // Green
      case 'overweight':
        return '#FFA726'; // Orange
      case 'obese':
      case 'obesity':
        return '#EF5350'; // Red
      default:
        return colors.textSecondary;
    }
  };
  
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        {icon}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.value, { color: colors.primary }]}>{value}</Text>
        {(status || healthStatus) && (
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {status || healthStatus}
          </Text>
        )}
      </View>
      
      {profile && (
        <View style={styles.profileInfo}>
          <Text style={[styles.profileText, { color: colors.textSecondary }]}>
            {profile.age} years old • {profile.height}cm • {profile.weight}kg
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    alignItems: 'center',
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  profileText: {
    fontSize: 14,
  },
});

export default HealthStatsCard;

export { HealthStatsCard }