import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { theme as themeConfig } from '@/constants/theme';

// Define the theme type
export type ThemeType = 'light' | 'dark';

// Define the context shape
interface ThemeContextType {
  theme: ThemeType;
  colors: typeof themeConfig.colors | typeof themeConfig.dark;
  shadows: typeof themeConfig.shadows;
  spacing: typeof themeConfig.spacing;
  borderRadius: typeof themeConfig.borderRadius;
  typography: typeof themeConfig.typography;
  toggleTheme: () => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: themeConfig.colors,
  shadows: themeConfig.shadows,
  spacing: themeConfig.spacing,
  borderRadius: themeConfig.borderRadius,
  typography: themeConfig.typography,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default theme if context is not available
    return {
      theme: 'light' as ThemeType,
      colors: themeConfig.colors,
      shadows: themeConfig.shadows,
      spacing: themeConfig.spacing,
      borderRadius: themeConfig.borderRadius,
      typography: themeConfig.typography,
      toggleTheme: () => {},
      setThemeMode: () => {},
    };
  }
  return context;
};

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme() as ThemeType || 'light';
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>('system');
  const [isReady, setIsReady] = useState(false);
  
  // Determine the active theme based on user preference and system setting
  const [activeTheme, setActiveTheme] = useState<ThemeType>(
    themePreference === 'system' ? systemColorScheme : (themePreference as ThemeType) || 'light'
  );

  // Initialize theme
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Update the active theme when system color scheme or user preference changes
  useEffect(() => {
    if (themePreference === 'system') {
      setActiveTheme(systemColorScheme);
    } else if (themePreference === 'light' || themePreference === 'dark') {
      setActiveTheme(themePreference);
    }
  }, [themePreference, systemColorScheme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = activeTheme === 'light' ? 'dark' : 'light';
    setThemePreference(newTheme);
  };

  // Set theme mode (system, light, or dark)
  const setThemeMode = (mode: 'system' | 'light' | 'dark') => {
    setThemePreference(mode);
  };

  // Get the colors based on the active theme
  const colors = activeTheme === 'dark' ? themeConfig.dark : themeConfig.colors;

  // Context value
  const contextValue: ThemeContextType = {
    theme: activeTheme,
    colors,
    shadows: themeConfig.shadows,
    spacing: themeConfig.spacing,
    borderRadius: themeConfig.borderRadius,
    typography: themeConfig.typography,
    toggleTheme,
    setThemeMode,
  };

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};