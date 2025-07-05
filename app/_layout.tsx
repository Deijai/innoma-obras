import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Services
import { initializeDatabase } from '@/services/database/sqlite';
import { initializeNotifications } from '@/services/notifications';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
        'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
        'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
    });

    useEffect(() => {
        initializeApp();
    }, []);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    const initializeApp = async () => {
        try {
            // Inicializar banco de dados
            await initializeDatabase();

            // Inicializar notificações
            await initializeNotifications();

            console.log('App inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar app:', error);
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NetworkProvider>
                    <ThemeProvider>
                        <AuthProvider>
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                    animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade',
                                }}
                            >
                                <Stack.Screen
                                    name="(auth)"
                                    options={{
                                        headerShown: false,
                                        presentation: 'modal',
                                    }}
                                />
                                <Stack.Screen
                                    name="(tabs)"
                                    options={{
                                        headerShown: false,
                                    }}
                                />
                                <Stack.Screen
                                    name="obra"
                                    options={{
                                        headerShown: false,
                                        presentation: 'card',
                                    }}
                                />
                                <Stack.Screen
                                    name="modal"
                                    options={{
                                        headerShown: false,
                                        presentation: 'transparentModal',
                                        animation: 'fade',
                                    }}
                                />
                            </Stack>

                            {/* Toast Messages */}
                            <FlashMessage
                                position="top"
                                floating
                                titleStyle={{
                                    fontFamily: 'Inter-Medium',
                                    fontSize: 16,
                                }}
                                textStyle={{
                                    fontFamily: 'Inter-Regular',
                                    fontSize: 14,
                                }}
                            />
                        </AuthProvider>
                    </ThemeProvider>
                </NetworkProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}