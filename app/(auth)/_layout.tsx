import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
    const { theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
                contentStyle: {
                    backgroundColor: theme.colors.background,
                },
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    title: 'Login',
                    gestureEnabled: false, // Não permitir voltar do login
                }}
            />
            <Stack.Screen
                name="register"
                options={{
                    title: 'Cadastro',
                    gestureEnabled: true,
                }}
            />
            <Stack.Screen
                name="forgot-password"
                options={{
                    title: 'Recuperar Senha',
                    gestureEnabled: true,
                }}
            />
        </Stack>
    );
}