import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  primaryColor: string;
  secondaryColor: string;
  updateTheme: (primary: string, secondary: string) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  primaryColor: '#8b5cf6',
  secondaryColor: '#ec4899',
  updateTheme: () => {},
  resetTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check Premium status from LocalStorage directly to prevent flashing dark mode on reload
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const isPremium = localStorage.getItem('nova_premium') === 'true';
      if (!isPremium) return false; // Force light if not premium

      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6');
  const [secondaryColor, setSecondaryColor] = useState('#ec4899');

  // Load saved colors
  useEffect(() => {
    const savedPrimary = localStorage.getItem('theme_primary');
    const savedSecondary = localStorage.getItem('theme_secondary');
    
    if (savedPrimary) setPrimaryColor(savedPrimary);
    if (savedSecondary) setSecondaryColor(savedSecondary);
  }, []);

  // Apply colors to CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
  }, [primaryColor, secondaryColor]);

  // Handle Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f1f5f9');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const updateTheme = (primary: string, secondary: string) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
    localStorage.setItem('theme_primary', primary);
    localStorage.setItem('theme_secondary', secondary);
  };

  const resetTheme = () => {
    updateTheme('#8b5cf6', '#ec4899');
  };

  return (
    <ThemeContext.Provider value={{ 
        isDarkMode, 
        toggleDarkMode, 
        primaryColor, 
        secondaryColor, 
        updateTheme,
        resetTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};