// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, usePermissions } from '@/contexts/PermissionsContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function DashboardScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { hasPermission, getUserRole } = usePermissions();
    const insets = useSafeAreaInsets();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const quickActions = [
        {
            title: 'Nova Obra',
            icon: 'add-circle',
            color: theme.colors.primary,
            onPress: () => console.log('Criar obra - Em desenvolvimento'),
            permission: Permission.CREATE_OBRA,
        },
        {
            title: 'Diário',
            icon: 'journal',
            color: theme.colors.secondary,
            onPress: () => console.log('Diário - Em desenvolvimento'),
            permission: Permission.CREATE_DIARIO,
        },
        {
            title: 'Tarefa',
            icon: 'checkbox',
            color: theme.colors.accent,
            onPress: () => console.log('Criar tarefa - Em desenvolvimento'),
            permission: Permission.CREATE_TAREFA,
        },
        {
            title: 'Documento',
            icon: 'document-text',
            color: theme.colors.info,
            onPress: () => console.log('Upload documento - Em desenvolvimento'),
            permission: Permission.UPLOAD_DOCUMENTOS,
        },
    ];

    const stats = [
        {
            title: 'Obras Ativas',
            value: '8',
            change: '+2',
            changeType: 'positive' as const,
            icon: 'construct',
            permission: Permission.VIEW_OBRA,
        },
        {
            title: 'Tarefas Pendentes',
            value: '24',
            change: '-3',
            changeType: 'positive' as const,
            icon: 'list',
            permission: Permission.VIEW_TAREFA,
        },
        {
            title: 'Equipe Total',
            value: '156',
            change: '+12',
            changeType: 'positive' as const,
            icon: 'people',
            permission: Permission.VIEW_EQUIPE,
        },
        {
            title: 'Progresso Médio',
            value: '67%',
            change: '+5%',
            changeType: 'positive' as const,
            icon: 'trending-up',
            permission: Permission.VIEW_OBRA,
        },
    ];

    const recentActivities = [
        {
            id: 1,
            title: 'Obra Residencial Santos iniciada',
            description: 'João Silva iniciou a fundação',
            time: '2 horas atrás',
            icon: 'construct',
            color: theme.colors.primary,
        },
        {
            id: 2,
            title: 'Diário atualizado',
            description: 'Maria Costa registrou progresso da Obra Central',
            time: '4 horas atrás',
            icon: 'journal',
            color: theme.colors.secondary,
        },
        {
            id: 3,
            title: 'Nova tarefa atribuída',
            description: 'Instalação elétrica - Bloco A',
            time: '6 horas atrás',
            icon: 'flash',
            color: theme.colors.accent,
        },
        {
            id: 4,
            title: 'Documento aprovado',
            description: 'Projeto arquitetônico validado',
            time: '1 dia atrás',
            icon: 'checkmark-circle',
            color: theme.colors.success,
        },
    ];

    const getRoleDisplayName = (role: string | null) => {
        const roleNames = {
            admin: 'Administrador',
            engenheiro: 'Engenheiro',
            mestre: 'Mestre de Obras',
            operador: 'Operador',
            visitante: 'Visitante',
        };
        return role ? roleNames[role as keyof typeof roleNames] || role : 'Usuário';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                            {getGreeting()},
                        </Text>
                        <Text style={[styles.userName, { color: theme.colors.text }]}>
                            {user?.nome?.split(' ')[0] || 'Usuário'}
                        </Text>
                        <Text style={[styles.userRole, { color: theme.colors.textSecondary }]}>
                            {getRoleDisplayName(getUserRole())}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => console.log('Notificações')}
                    >
                        <Ionicons
                            name="notifications"
                            size={24}
                            color={theme.colors.text}
                        />
                        <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
                            <Text style={[styles.notificationCount, { color: theme.colors.white }]}>
                                3
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <Card variant="elevated" padding="medium" style={styles.quickActionsCard}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Ações Rápidas
                    </Text>
                    <View style={styles.quickActions}>
                        {quickActions
                            .filter(action => hasPermission(action.permission))
                            .map((action, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.quickAction}
                                    onPress={action.onPress}
                                    activeOpacity={0.7}
                                >
                                    <LinearGradient
                                        colors={[action.color, `${action.color}CC`] as const}
                                        style={styles.quickActionGradient}
                                    >
                                        <Ionicons
                                            name={action.icon as any}
                                            size={28}
                                            color={theme.colors.white}
                                        />
                                    </LinearGradient>
                                    <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                                        {action.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </View>
                </Card>

                {/* Statistics */}
                <View style={styles.statsGrid}>
                    {stats
                        .filter(stat => hasPermission(stat.permission))
                        .map((stat, index) => (
                            <Card
                                key={index}
                                variant="elevated"
                                padding="medium"
                                style={styles.statCard}
                            >
                                <View style={styles.statHeader}>
                                    <Ionicons
                                        name={stat.icon as any}
                                        size={24}
                                        color={theme.colors.primary}
                                    />
                                    <View style={[
                                        styles.changeIndicator,
                                        {
                                            backgroundColor: stat.changeType === 'positive'
                                                ? theme.colors.successLight
                                                : theme.colors.errorLight
                                        }
                                    ]}>
                                        <Text style={[
                                            styles.changeText,
                                            {
                                                color: stat.changeType === 'positive'
                                                    ? theme.colors.success
                                                    : theme.colors.error
                                            }
                                        ]}>
                                            {stat.change}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                    {stat.value}
                                </Text>
                                <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
                                    {stat.title}
                                </Text>
                            </Card>
                        ))}
                </View>

                {/* Recent Activities */}
                <Card variant="elevated" padding="medium" style={styles.activitiesCard}>
                    <View style={styles.activitiesHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Atividades Recentes
                        </Text>
                        <TouchableOpacity onPress={() => console.log('Ver todas')}>
                            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                                Ver todas
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.activities}>
                        {recentActivities.map((activity) => (
                            <TouchableOpacity
                                key={activity.id}
                                style={styles.activityItem}
                                onPress={() => console.log('Atividade:', activity.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                                    <Ionicons
                                        name={activity.icon as any}
                                        size={20}
                                        color={theme.colors.white}
                                    />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                                        {activity.title}
                                    </Text>
                                    <Text style={[styles.activityDescription, { color: theme.colors.textSecondary }]}>
                                        {activity.description}
                                    </Text>
                                    <Text style={[styles.activityTime, { color: theme.colors.textTertiary }]}>
                                        {activity.time}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={16}
                                    color={theme.colors.textTertiary}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Debug Info (apenas em desenvolvimento) */}
                {__DEV__ && (
                    <Card variant="outlined" padding="medium" style={styles.debugCard}>
                        <Text style={[styles.debugTitle, { color: theme.colors.text }]}>
                            🐛 Debug Info
                        </Text>
                        <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
                            Usuário: {user?.nome}
                        </Text>
                        <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
                            Perfil: {getUserRole()}
                        </Text>
                        <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
                            Permissões: {hasPermission(Permission.CREATE_OBRA) ? '✅' : '❌'} Criar Obra
                        </Text>
                    </Card>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 20,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerContent: {
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        marginVertical: 4,
    },
    userRole: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationCount: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },

    // Quick Actions
    quickActionsCard: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        marginBottom: 16,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 12,
    },
    quickAction: {
        alignItems: 'center',
        flex: 1,
    },
    quickActionGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },

    // Statistics
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '48%',
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    changeIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    changeText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },

    // Activities
    activitiesCard: {
        marginBottom: 8,
    },
    activitiesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },
    activities: {
        gap: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        marginBottom: 2,
    },
    activityDescription: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
    },

    // Debug
    debugCard: {
        marginTop: 8,
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
});