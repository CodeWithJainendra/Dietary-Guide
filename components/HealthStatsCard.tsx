import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Card from './Card';

interface HealthStatsCardProps {
  title: string;
  value: string;
  status?: string;
  icon?: React.ReactNode;
}

const HealthStatsCard: React.FC<HealthStatsCardProps> = ({
  title,
  value,
  status,
  icon,
}) => {
  const { colors } = useTheme();
  
  // Determine status color
  const getStatusColor = () => {
    if (!status) return colors.textSecondary;
    
    switch (status.toLowerCase()) {
      case 'underweight':
        return '#FFA726'; // Orange
      case 'normal weight':
        return '#66BB6A'; // Green
      case 'overweight':
        return '#FFA726'; // Orange
      case 'obese':
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
        {status && (
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {status}
          </Text>
        )}
      </View>
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
});

export default HealthStatsCard;