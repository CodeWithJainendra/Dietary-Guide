// components/HookDebugger.tsx
// Debug component to help identify hook rule violations

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface HookDebuggerProps {
  componentName: string;
  hookCount?: number;
  showDebug?: boolean;
}

export default function HookDebugger({ 
  componentName, 
  hookCount = 0, 
  showDebug = __DEV__ 
}: HookDebuggerProps) {
  const { colors } = useTheme();
  const [renderCount, setRenderCount] = useState(0);
  const [hookCallCount, setHookCallCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    setHookCallCount(hookCount);
    
    if (showDebug) {
      console.log(`[HookDebugger] ${componentName} - Render #${renderCount + 1}, Hooks: ${hookCount}`);
    }
  }, [componentName, hookCount, renderCount, showDebug]);

  if (!showDebug) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🔧 Hook Debugger
      </Text>
      <Text style={[styles.info, { color: colors.textSecondary }]}>
        Component: {componentName}
      </Text>
      <Text style={[styles.info, { color: colors.textSecondary }]}>
        Renders: {renderCount}
      </Text>
      <Text style={[styles.info, { color: colors.textSecondary }]}>
        Hook Count: {hookCallCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    minWidth: 150,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  info: {
    fontSize: 10,
    marginBottom: 2,
  },
});
