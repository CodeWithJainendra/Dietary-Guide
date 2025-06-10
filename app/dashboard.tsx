import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import { fetchGoogleCalendarEvents, fetchGoogleTasks, fetchGoogleTaskLists } from '@/utils/googleService';
import { GoogleEvent, GoogleTask, GoogleTaskList } from '@/types';
import { Calendar, CheckSquare } from 'lucide-react-native';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<string>('list1');
  const [isLoading, setIsLoading] = useState(true);
  
  const googleTokens = useUserStore((state) => state.googleTokens);
  const profile = useUserStore((state) => state.profile);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch Google Calendar events
      const calendarEvents = await fetchGoogleCalendarEvents();
      setEvents(calendarEvents);
      
      // Fetch Google Task Lists
      const lists = await fetchGoogleTaskLists();
      setTaskLists(lists);
      
      // Fetch tasks for the selected list
      const taskItems = await fetchGoogleTasks(selectedTaskList);
      setTasks(taskItems);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const handleTaskListChange = async (listId: string) => {
    setSelectedTaskList(listId);
    try {
      const taskItems = await fetchGoogleTasks(listId);
      setTasks(taskItems);
    } catch (error) {
      console.error('Error fetching tasks for list:', error);
    }
  };
  
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Your Dashboard</Text>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          
          {events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.summary}</Text>
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTime}>
                    {formatEventDate(event.start.dateTime)} - {formatEventDate(event.end.dateTime)}
                  </Text>
                  {event.location && (
                    <Text style={styles.eventLocation}>{event.location}</Text>
                  )}
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming events</Text>
            </Card>
          )}
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckSquare size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Tasks</Text>
          </View>
          
          <View style={styles.taskListSelector}>
            {taskLists.map((list) => (
              <Text
                key={list.id}
                style={[
                  styles.taskListItem,
                  selectedTaskList === list.id && styles.taskListItemSelected,
                ]}
                onPress={() => handleTaskListChange(list.id)}
              >
                {list.title}
              </Text>
            ))}
          </View>
          
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <Card key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={[
                    styles.taskTitle,
                    task.status === 'completed' && styles.taskCompleted,
                  ]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskStatus}>
                    {task.status === 'completed' ? 'Done' : 'To Do'}
                  </Text>
                </View>
                {task.notes && (
                  <Text style={styles.taskNotes}>{task.notes}</Text>
                )}
                {task.due && (
                  <Text style={styles.taskDue}>
                    Due: {new Date(task.due).toLocaleDateString()}
                  </Text>
                )}
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tasks in this list</Text>
            </Card>
          )}
        </View>
      </ScrollView>
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
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  eventCard: {
    marginBottom: theme.spacing.md,
  },
  eventTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  eventDetails: {
    marginTop: theme.spacing.xs,
  },
  eventTime: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  taskListSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  taskListItem: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  taskListItemSelected: {
    backgroundColor: theme.colors.primary,
    color: 'white',
    borderColor: theme.colors.primary,
  },
  taskCard: {
    marginBottom: theme.spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  taskTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  taskStatus: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  taskNotes: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  taskDue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
  },
});