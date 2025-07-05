// src/components/common/ProtectedRoute.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, usePermissions } from '@/contexts/PermissionsContext';
import { useTheme } from '@/contexts/ThemeContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permissions?: Permission[];
    requiredRole?: 'admin' | 'engenheiro' | 'mestre' | 'operador' | 'visitante';
    fallback?: React.ReactNode;
    redirectTo?: string;
    showAccessDenied?: boolean;
}

export function ProtectedRoute({
    children,
    permissions = [],
    requiredRole,
    fallback,
    redirectTo,
    showAccessDenied = true,
}: ProtectedRouteProps) {
    const { theme } = useTheme();
    const { user, isAuthenticated } = useAuth();
    const { hasAnyPermission, getUserRole } = usePermissions();

    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated || !user) {
        if (redirectTo) {
            router.replace(redirectTo as any);
            return null;
        }

        return fallback || <UnauthorizedScreen message="Você precisa estar logado para acessar esta tela." />;
    }

    // Verificar role específico se fornecido
    if (requiredRole && getUserRole() !== requiredRole) {
        if (redirectTo) {
            router.replace(redirectTo as any);
            return null;
        }

        return fallback || (
            showAccessDenied ? (
                <AccessDeniedScreen
                    message={`Esta funcionalidade requer perfil de ${requiredRole}.`}
                    userRole={getUserRole()}
                    requiredRole={requiredRole}
                />
            ) : null
        );
    }

    // Verificar permissões se fornecidas
    if (permissions.length > 0 && !hasAnyPermission(permissions)) {
        if (redirectTo) {
            router.replace(redirectTo as any);
            return null;
        }

        return fallback || (
            showAccessDenied ? (
                <AccessDeniedScreen
                    message="Você não tem permissão para acessar esta funcionalidade."
                    permissions={permissions}
                />
            ) : null
        );
    }

    // Se passou em todas as verificações, renderizar children
    return <>{children}</>;
}

// Componente para usuários não autenticados
function UnauthorizedScreen({ message }: { message: string }) {
    const { theme } = useTheme();

    const handleLogin = () => {
        router.replace('/(auth)/login');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card variant="elevated" padding="large" style={styles.card}>
                <View style={styles.content}>
                    <Ionicons
                        name="lock-closed"
                        size={64}
                        color={theme.colors.textSecondary}
                        style={styles.icon}
                    />

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Acesso Restrito
                    </Text>

                    <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                        {message}
                    </Text>

                    <Button
                        title="Fazer Login"
                        onPress={handleLogin}
                        variant="primary"
                        size="large"
                        style={styles.button}
                    />
                </View>
            </Card>
        </View>
    );
}

// Componente para acesso negado
function AccessDeniedScreen({
    message,
    userRole,
    requiredRole,
    permissions
}: {
    message: string;
    userRole?: string | null;
    requiredRole?: string;
    permissions?: Permission[];
}) {
    const { theme } = useTheme();

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)');
        }
    };

    const handleContactSupport = () => {
        // Implementar contato com suporte
        console.log('Contatar suporte');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card variant="elevated" padding="large" style={styles.card}>
                <View style={styles.content}>
                    <Ionicons
                        name="warning"
                        size={64}
                        color={theme.colors.warning}
                        style={styles.icon}
                    />

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Acesso Negado
                    </Text>

                    <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                        {message}
                    </Text>

                    {userRole && requiredRole && (
                        <View style={styles.roleInfo}>
                            <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>
                                Seu perfil: <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{userRole}</Text>
                            </Text>
                            <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>
                                Perfil necessário: <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{requiredRole}</Text>
                            </Text>
                        </View>
                    )}

                    {permissions && permissions.length > 0 && (
                        <View style={styles.permissionsInfo}>
                            <Text style={[styles.permissionsTitle, { color: theme.colors.textSecondary }]}>
                                Permissões necessárias:
                            </Text>
                            {permissions.slice(0, 3).map((permission, index) => (
                                <Text key={index} style={[styles.permissionItem, { color: theme.colors.textTertiary }]}>
                                    • {permission}
                                </Text>
                            ))}
                            {permissions.length > 3 && (
                                <Text style={[styles.permissionItem, { color: theme.colors.textTertiary }]}>
                                    • E mais {permissions.length - 3} permissões...
                                </Text>
                            )}
                        </View>
                    )}

                    <View style={styles.actions}>
                        <Button
                            title="Voltar"
                            onPress={handleGoBack}
                            variant="outline"
                            size="medium"
                            style={styles.actionButton}
                        />

                        <Button
                            title="Contatar Suporte"
                            onPress={handleContactSupport}
                            variant="primary"
                            size="medium"
                            style={styles.actionButton}
                        />
                    </View>
                </View>
            </Card>
        </View>
    );
}

// Hook para verificar permissões de forma condicional
export function useRoutePermission(permissions: Permission[]) {
    const { hasAnyPermission } = usePermissions();
    const { isAuthenticated } = useAuth();

    return {
        hasAccess: isAuthenticated && (permissions.length === 0 || hasAnyPermission(permissions)),
        isAuthenticated,
        hasPermissions: hasAnyPermission(permissions),
    };
}

// HOC para proteger telas inteiras
export function withProtectedRoute<T extends object>(
    Component: React.ComponentType<T>,
    options: Omit<ProtectedRouteProps, 'children'>
) {
    return function ProtectedComponent(props: T) {
        return (
            <ProtectedRoute {...options}>
                <Component {...props} />
            </ProtectedRoute>
        );
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400,
    },
    content: {
        alignItems: 'center',
    },
    icon: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    button: {
        width: '100%',
    },
    roleInfo: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    roleText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    permissionsInfo: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    permissionsTitle: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    permissionItem: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 2,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionButton: {
        flex: 1,
    },
});