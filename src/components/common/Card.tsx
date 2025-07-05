import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'gradient';
type CardPadding = 'none' | 'small' | 'medium' | 'large';

interface CardProps extends TouchableOpacityProps {
    children: React.ReactNode;
    variant?: CardVariant;
    padding?: CardPadding;
    gradient?: readonly [string, string, ...string[]]; // Tipagem correta para LinearGradient
    style?: ViewStyle;
    containerStyle?: ViewStyle;
}

export function Card({
    children,
    variant = 'elevated',
    padding = 'medium',
    gradient,
    style,
    containerStyle,
    onPress,
    ...props
}: CardProps) {
    const { theme } = useTheme();

    const getPaddingStyle = (): ViewStyle => {
        switch (padding) {
            case 'none':
                return {};
            case 'small':
                return { padding: theme.spacing?.sm || 8 };
            case 'medium':
                return { padding: theme.spacing?.md || 16 };
            case 'large':
                return { padding: theme.spacing?.lg || 24 };
            default:
                return { padding: theme.spacing?.md || 16 };
        }
    };

    const getCardStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            backgroundColor: theme.colors.cardBackground,
            borderRadius: theme.borderRadius?.base || 8,
            overflow: 'hidden',
            ...getPaddingStyle(),
        };

        switch (variant) {
            case 'elevated':
                return {
                    ...baseStyle,
                    ...theme.shadows.medium,
                };

            case 'outlined':
                return {
                    ...baseStyle,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                };

            case 'filled':
                return {
                    ...baseStyle,
                    backgroundColor: theme.colors.surfaceVariant,
                };

            case 'gradient':
                return {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                };

            default:
                return baseStyle;
        }
    };

    const CardContent = () => (
        <View style={StyleSheet.flatten([getCardStyle(), style])}>
            {children}
        </View>
    );

    if (variant === 'gradient' && gradient && gradient.length >= 2) {
        const gradientColors = gradient.length >= 2 ? gradient : [gradient[0] || '#000', gradient[1] || '#000'] as const;
        return (
            <View style={StyleSheet.flatten([styles.container, containerStyle])}>
                {onPress ? (
                    <TouchableOpacity
                        {...props}
                        onPress={onPress}
                        activeOpacity={0.8}
                        style={styles.touchable}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.flatten([getCardStyle(), style])}
                        >
                            {children}
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.flatten([getCardStyle(), style])}
                    >
                        {children}
                    </LinearGradient>
                )}
            </View>
        );
    }

    if (onPress) {
        return (
            <View style={StyleSheet.flatten([styles.container, containerStyle])}>
                <TouchableOpacity
                    {...props}
                    onPress={onPress}
                    activeOpacity={0.8}
                    style={styles.touchable}
                >
                    <CardContent />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={StyleSheet.flatten([styles.container, containerStyle])}>
            <CardContent />
        </View>
    );
}

// Componentes auxiliares para estruturar o conteúdo do Card
export function CardHeader({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
    return <View style={StyleSheet.flatten([styles.header, style])}>{children}</View>;
}

export function CardBody({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
    return <View style={StyleSheet.flatten([styles.body, style])}>{children}</View>;
}

export function CardFooter({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
    const { theme } = useTheme();
    return (
        <View style={StyleSheet.flatten([styles.footer, { borderTopColor: theme.colors.border }, style])}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    touchable: {
        borderRadius: 8,
    },
    header: {
        marginBottom: 12,
    },
    body: {
        flex: 1,
    },
    footer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
});