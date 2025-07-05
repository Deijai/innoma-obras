import Theme, { ThemeType } from '@/styles/theme';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeType;
    themeMode: ThemeMode;
    isDarkMode: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isLoading, setIsLoading] = useState(true);

    // Determina se deve usar tema escuro
    const isDarkMode = themeMode === 'system'
        ? systemColorScheme === 'dark'
        : themeMode === 'dark';

    // Seleciona o tema atual
    const theme = isDarkMode ? Theme.dark : Theme.light;

    // Carrega preferência salva
    useEffect(() => {
        loadThemePreference();
    }, []);

    // Salva preferência quando muda
    useEffect(() => {
        if (!isLoading) {
            saveThemePreference(themeMode);
        }
    }, [themeMode, isLoading]);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
            if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                setThemeModeState(savedTheme as ThemeMode);
            }
        } catch (error) {
            console.warn('Erro ao carregar preferência de tema:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveThemePreference = async (mode: ThemeMode) => {
        try {
            await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
        } catch (error) {
            console.warn('Erro ao salvar preferência de tema:', error);
        }
    };

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
    };

    const toggleTheme = () => {
        if (themeMode === 'system') {
            setThemeMode(systemColorScheme === 'dark' ? 'light' : 'dark');
        } else if (themeMode === 'light') {
            setThemeMode('dark');
        } else {
            setThemeMode('light');
        }
    };

    const value: ThemeContextType = {
        theme,
        themeMode,
        isDarkMode,
        setThemeMode,
        toggleTheme,
    };

    if (isLoading) {
        return null; // ou um componente de loading
    }

    return (
        <ThemeContext.Provider value={value}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
    }
    return context;
}