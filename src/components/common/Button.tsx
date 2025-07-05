import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    title: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    gradient?: boolean;
    style?: any;
}

export function Button({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    gradient = false,
    disabled,
    style,
    ...props
}: ButtonProps) {
    const { theme } = useTheme();

    const getButtonStyle = () => {
        const baseStyle = [
            styles.button,
            theme.sizes.button[size],
            fullWidth && styles.fullWidth,
        ];

        switch (variant) {
            case 'primary':
                if (gradient) {
                    return [...baseStyle, styles.gradientButton];
                }
                return [
                    ...baseStyle,
                    {
                        backgroundColor: disabled ? theme.colors.gray300 : theme.colors.primary,
                    },
                ];

            case 'secondary':
                return [
                    ...baseStyle,
                    {
                        backgroundColor: disabled ? theme.colors.gray200 : theme.colors.secondary,
                    },
                ];

            case 'outline':
                return [
                    ...baseStyle,
                    {
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: disabled ? theme.colors.gray300 : theme.colors.primary,
                    },
                ];

            case 'ghost':
                return [
                    ...baseStyle,
                    {
                        backgroundColor: 'transparent',
                    },
                ];

            case 'danger':
                return [
                    ...baseStyle,
                    {
                        backgroundColor: disabled ? theme.colors.gray300 : theme.colors.error,
                    },
                ];

            default:
                return baseStyle;
        }
    };

    const getTextStyle = () => {
        const baseTextStyle = [
            styles.text,
            {
                fontFamily: theme.typography.fontFamily.medium,
                fontSize: size === 'small' ? theme.typography.fontSize.sm : theme.typography.fontSize.base,
            },
        ];

        switch (variant) {
            case 'primary':
            case 'secondary':
            case 'danger':
                return [
                    ...baseTextStyle,
                    {
                        color: disabled ? theme.colors.textDisabled : theme.colors.white,
                    },
                ];

            case 'outline':
                return [
                    ...baseTextStyle,
                    {
                        color: disabled ? theme.colors.textDisabled : theme.colors.primary,
                    },
                ];

            case 'ghost':
                return [
                    ...baseTextStyle,
                    {
                        color: disabled ? theme.colors.textDisabled : theme.colors.text,
                    },
                ];

            default:
                return baseTextStyle;
        }
    };

    const renderContent = () => (
        <View style={styles.content}>
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.white}
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <View style={[styles.icon, styles.iconLeft]}>{icon}</View>
                    )}
                    <Text style={getTextStyle()}>{title}</Text>
                    {icon && iconPosition === 'right' && (
                        <View style={[styles.icon, styles.iconRight]}>{icon}</View>
                    )}
                </>
            )}
        </View>
    );

    if (variant === 'primary' && gradient && !disabled) {
        return (
            <TouchableOpacity
                {...props}
                disabled={disabled || loading}
                style={[getButtonStyle(), style]}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: theme.borderRadius.base }]}
                />
                {renderContent()}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            {...props}
            disabled={disabled || loading}
            style={[getButtonStyle(), style]}
            activeOpacity={0.8}
        >
            {renderContent()}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    gradientButton: {
        backgroundColor: 'transparent',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        textAlign: 'center',
        fontWeight: '500',
    },
    icon: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
});