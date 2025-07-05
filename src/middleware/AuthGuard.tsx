// src/middleware/AuthGuard.tsx
import { Redirect, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Middleware de autenticação que protege rotas baseado no estado de auth
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { theme } = useTheme();
    const segments = useSegments();

    // Verificar se está em rota de autenticação
    const inAuthGroup = segments[0] === '(auth)';

    useEffect(() => {
        if (isLoading) return; // Aguardar carregamento

        if (!isAuthenticated) {
            // Se não autenticado e não está em rota de auth, redirecionar para login
            if (!inAuthGroup) {
                console.log('❌ Não autenticado, redirecionando para login');
            }
        } else {
            // Se autenticado e está em rota de auth, redirecionar para app principal
            if (inAuthGroup) {
                console.log('✅ Usuário autenticado, redirecionando para app');
            }
        }
    }, [isAuthenticated, isLoading, inAuthGroup]);

    // Mostrar loading durante verificação inicial
    if (isLoading) {
        return <AuthLoadingScreen />;
    }

    // Lógica de redirecionamento
    if (!isAuthenticated && !inAuthGroup) {
        return <Redirect href="/(auth)/login" />;
    }

    if (isAuthenticated && inAuthGroup) {
        return <Redirect href="/(tabs)" />;
    }

    // Envolver com PermissionsProvider se autenticado
    if (isAuthenticated && user) {
        return (
            <PermissionsProvider>
                {children}
            </PermissionsProvider>
        );
    }

    return <>{children}</>;
}

/**
 * Componente de loading durante verificação de autenticação
 */
function AuthLoadingScreen() {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                    style={styles.spinner}
                />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Verificando autenticação...
                </Text>
                <Text style={[styles.subText, { color: theme.colors.textTertiary }]}>
                    Aguarde um momento
                </Text>
            </View>
        </View>
    );
}

/**
 * Hook para verificar status de autenticação em qualquer componente
 */
export function useAuthGuard() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const segments = useSegments();

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedArea = !inAuthGroup;

    return {
        isAuthenticated,
        isLoading,
        user,
        inAuthGroup,
        inProtectedArea,
        shouldRedirectToAuth: !isAuthenticated && inProtectedArea,
        shouldRedirectToApp: isAuthenticated && inAuthGroup,
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        gap: 16,
    },
    spinner: {
        marginBottom: 8,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        fontWeight: '500',
    },
    subText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
});