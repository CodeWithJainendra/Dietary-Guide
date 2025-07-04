// app/test-profile-save.tsx
// Test page to verify profile saving functionality

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { runProfileSaveTests } from '@/utils/test-profile-save-fix';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ArrowLeft, TestTube, CheckCircle, XCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function TestProfileSaveScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Override console.log to capture logs
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const captureConsoleLogs = () => {
    const logCapture: string[] = [];
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logCapture.push(`LOG: ${message}`);
      originalConsoleLog(...args);
    };

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logCapture.push(`ERROR: ${message}`);
      originalConsoleError(...args);
    };

    return logCapture;
  };

  const restoreConsoleLogs = () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    setLogs([]);

    try {
      // Capture console logs during test execution
      const logCapture = captureConsoleLogs();
      
      // Run the tests
      const results = await runProfileSaveTests();
      
      // Restore console and set results
      restoreConsoleLogs();
      setLogs([...logCapture]);
      setTestResults(results);
    } catch (error) {
      restoreConsoleLogs();
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Profile Save Test</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <TestTube size={48} color={colors.primary} />
        </View>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Test the profile saving functionality to ensure Google OAuth onboarding works correctly.
        </Text>

        <Button
          title={isRunning ? "Running Tests..." : "Run Profile Save Tests"}
          onPress={runTests}
          disabled={isRunning}
          loading={isRunning}
          style={styles.button}
        />

        {testResults && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultHeader}>
              {testResults.success ? (
                <CheckCircle size={24} color={colors.success} />
              ) : (
                <XCircle size={24} color={colors.error} />
              )}
              <Text style={[
                styles.resultTitle,
                { color: testResults.success ? colors.success : colors.error }
              ]}>
                {testResults.success ? 'Tests Passed!' : 'Tests Failed'}
              </Text>
            </View>
            
            <Text style={[styles.resultMessage, { color: colors.text }]}>
              {testResults.success ? testResults.message : testResults.error}
            </Text>
          </View>
        )}

        {logs.length > 0 && (
          <View style={styles.logsContainer}>
            <Text style={[styles.logsTitle, { color: colors.text }]}>Test Logs:</Text>
            <ScrollView style={[styles.logsScroll, { backgroundColor: colors.card }]}>
              {logs.map((log, index) => (
                <Text
                  key={index}
                  style={[
                    styles.logText,
                    {
                      color: log.startsWith('ERROR:') ? colors.error : colors.textSecondary,
                      fontFamily: 'monospace'
                    }
                  ]}
                >
                  {log}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    margin: 20,
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    marginBottom: 24,
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  logsContainer: {
    marginTop: 16,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  logsScroll: {
    maxHeight: 300,
    borderRadius: 8,
    padding: 12,
  },
  logText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
});
