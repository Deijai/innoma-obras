// app/_layout.tsx
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider, NetworkProvider, ThemeProvider } from '@/contexts';

// Services
import { initializeDatabase } from '@/services/database/sqlite';
import { NetworkService } from '@/services/network/NetworkService';

// Auth Middleware
import { AuthGuard } from '@/middleware/AuthGuard';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'Space-Mono': require('@/assets/fonts/SpaceMono-Regular.ttf'),
        // Adicionar fonts Inter quando disponíveis
        // 'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
        // 'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
        // 'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
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
            console.log('🚀 Inicializando Innoma Obras...');

            // Inicializar serviços essenciais
            await Promise.all([
                initializeDatabase(),
                NetworkService.initialize(),
            ]);

            console.log('✅ App inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar app:', error);
            // Não bloquear a app por erro de banco
            console.log('⚠️ Continuando sem banco de dados...');
        }
    };

    if (!fontsLoaded) {
        return null; // Splash screen continue exibido
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NetworkProvider>
                    <ThemeProvider>
                        <AuthProvider>
                            <AuthGuard>
                                <Stack
                                    screenOptions={{
                                        headerShown: false,
                                        animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade',
                                        gestureEnabled: true,
                                    }}
                                >
                                    {/* Rotas de Autenticação */}
                                    <Stack.Screen
                                        name="(auth)"
                                        options={{
                                            headerShown: false,
                                            presentation: 'modal',
                                            gestureEnabled: false,
                                        }}
                                    />

                                    {/* Aplicação Principal */}
                                    <Stack.Screen
                                        name="(tabs)"
                                        options={{
                                            headerShown: false,
                                            gestureEnabled: false,
                                        }}
                                    />

                                    {/* 404 - Página não encontrada */}
                                    <Stack.Screen
                                        name="+not-found"
                                        options={{
                                            title: 'Página não encontrada',
                                            headerShown: true,
                                            presentation: 'modal',
                                        }}
                                    />
                                </Stack>

                                {/* Toast Messages Globais */}
                                <FlashMessage
                                    position="top"
                                    floating
                                    duration={4000}
                                    titleStyle={{
                                        fontFamily: 'Inter-Medium',
                                        fontSize: 16,
                                        fontWeight: '600',
                                    }}
                                    textStyle={{
                                        fontFamily: 'Inter-Regular',
                                        fontSize: 14,
                                    }}
                                    style={{
                                        borderRadius: 12,
                                        marginHorizontal: 16,
                                        marginTop: 8,
                                    }}
                                />
                            </AuthGuard>
                        </AuthProvider>
                    </ThemeProvider>
                </NetworkProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}