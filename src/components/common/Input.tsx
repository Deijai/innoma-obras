import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helperText?: string;
    size?: InputSize;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    isPassword?: boolean;
    required?: boolean;
    fullWidth?: boolean;
    containerStyle?: any;
}

export const Input = forwardRef<TextInput, InputProps>(({
    label,
    error,
    helperText,
    size = 'medium',
    leftIcon,
    rightIcon,
    onRightIconPress,
    isPassword = false,
    required = false,
    fullWidth = true,
    containerStyle,
    style,
    onFocus,
    onBlur,
    value,
    ...props
}, ref) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleFocus = (event: any) => {
        setIsFocused(true);
        onFocus?.(event);
    };

    const handleBlur = (event: any) => {
        setIsFocused(false);
        onBlur?.(event);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const getContainerStyle = () => [
        styles.container,
        fullWidth && styles.fullWidth,
        containerStyle,
    ];

    const getInputContainerStyle = () => [
        styles.inputContainer,
        theme.sizes?.input?.[size] || { height: size === 'large' ? 56 : size === 'small' ? 40 : 48 },
        {
            borderColor: error
                ? theme.colors.error
                : isFocused
                    ? theme.colors.primary
                    : theme.colors.border,
            backgroundColor: theme.colors.inputBackground || theme.colors.surface,
            borderWidth: isFocused ? 2 : 1,
        },
        error && styles.errorBorder,
    ];

    const getInputStyle = () => [
        styles.input,
        {
            color: theme.colors.text,
            fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
            fontFamily: 'Inter-Regular',
        },
        leftIcon && styles.inputWithLeftIcon,
        (rightIcon || isPassword) && styles.inputWithRightIcon,
        style,
    ];

    const getIconColor = () => {
        if (error) return theme.colors.error;
        if (isFocused) return theme.colors.primary;
        return theme.colors.textSecondary;
    };

    const actualRightIcon = isPassword
        ? (isPasswordVisible ? 'eye-off' : 'eye')
        : rightIcon;

    const handleRightIconPress = isPassword
        ? togglePasswordVisibility
        : onRightIconPress;

    return (
        <View style={getContainerStyle()}>
            {/* Label externa (se fornecida) */}
            {label && (
                <Text style={[
                    styles.label,
                    {
                        color: error ? theme.colors.error : theme.colors.textSecondary,
                        fontFamily: 'Inter-Medium',
                    }
                ]}>
                    {label}
                    {required && <Text style={{ color: theme.colors.error }}> *</Text>}
                </Text>
            )}

            <View style={getInputContainerStyle()}>
                {leftIcon && (
                    <View style={styles.leftIconContainer}>
                        <Ionicons
                            name={leftIcon}
                            size={size === 'large' ? 24 : 20}
                            color={getIconColor()}
                        />
                    </View>
                )}

                <TextInput
                    ref={ref}
                    {...props}
                    value={value}
                    style={getInputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={isPassword && !isPasswordVisible}
                    placeholderTextColor={theme.colors.textTertiary}
                    // Propriedades importantes para evitar blur automático
                    blurOnSubmit={false}
                    returnKeyType="done"
                    textContentType={isPassword ? 'password' : 'none'}
                    autoCorrect={false}
                    autoComplete={isPassword ? 'password' : 'off'}
                />

                {actualRightIcon && (
                    <TouchableOpacity
                        style={styles.rightIconContainer}
                        onPress={handleRightIconPress}
                        activeOpacity={0.7}
                        // Prevenir que o toque tire o foco do input
                        onPressIn={(e) => e.preventDefault()}
                    >
                        <Ionicons
                            name={actualRightIcon}
                            size={size === 'large' ? 24 : 20}
                            color={getIconColor()}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Helper text ou erro */}
            {(error || helperText) && (
                <Text style={[
                    styles.helperText,
                    {
                        color: error ? theme.colors.error : theme.colors.textSecondary,
                        fontSize: 12,
                        fontFamily: 'Inter-Regular',
                    }
                ]}>
                    {error || helperText}
                </Text>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    fullWidth: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        position: 'relative',
    },
    errorBorder: {
        borderColor: '#EF4444',
    },
    input: {
        flex: 1,
        paddingVertical: 0,
        fontSize: 16,
        // Evitar comportamentos estranhos
        textAlign: 'left',
    },
    inputWithLeftIcon: {
        marginLeft: 12,
    },
    inputWithRightIcon: {
        marginRight: 12,
    },
    leftIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        borderRadius: 4,
    },
    helperText: {
        marginTop: 6,
        marginLeft: 4,
        lineHeight: 16,
    },
});

Input.displayName = 'Input';