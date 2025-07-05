// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Permission, usePermissions } from '@/contexts/PermissionsContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabsLayout() {
    const { theme } = useTheme();
    const { hasPermission } = usePermissions();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.colors.navigationBackground,
                    borderTopColor: theme.colors.navigationBorder,
                    borderTopWidth: 1,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    paddingTop: 10,
                    height: Platform.OS === 'ios' ? 85 : 65,
                },
                tabBarItemStyle: {
                    borderRadius: 8,
                    marginHorizontal: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                },
                tabBarIconStyle: {
                    marginBottom: 4,
                },
            }}
        >
            {/* Home/Dashboard */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? 'home' : 'home-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            {/* Obras */}
            <Tabs.Screen
                name="obras"
                options={{
                    title: 'Obras',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? 'construct' : 'construct-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                    href: hasPermission(Permission.VIEW_OBRA) ? '/obras' : null,
                }}
            />

            {/* Calendário/Cronograma */}
            <Tabs.Screen
                name="calendario"
                options={{
                    title: 'Agenda',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? 'calendar' : 'calendar-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                    href: hasPermission(Permission.VIEW_TAREFA) ? '/calendario' : null,
                }}
            />

            {/* Equipe */}
            <Tabs.Screen
                name="equipe"
                options={{
                    title: 'Equipe',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? 'people' : 'people-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                    href: hasPermission(Permission.VIEW_EQUIPE) ? '/equipe' : null,
                }}
            />

            {/* Perfil */}
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? 'person-circle' : 'person-circle-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}