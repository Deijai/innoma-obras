import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
    Animated,
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
    ...props
}, ref) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [labelAnimation] = useState(new Animated.Value(props.value ? 1 : 0));

    const handleFocus = (event: any) => {
        setIsFocused(true);
        animateLabel(1);
        onFocus?.(event);
    };

    const handleBlur = (event: any) => {
        setIsFocused(false);
        if (!props.value) {
            animateLabel(0);
        }
        onBlur?.(event);
    };

    const animateLabel = (toValue: number) => {
        Animated.timing(labelAnimation, {
            toValue,
            duration: 200,
            useNativeDriver: false,
        }).start();
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
        theme.sizes.input[size],
        {
            borderColor: error
                ? theme.colors.inputError
                : isFocused
                    ? theme.colors.inputFocused
                    : theme.colors.inputBorder,
            backgroundColor: theme.colors.inputBackground,
        },
        error && styles.errorBorder,
        isFocused && styles.focusedBorder,
    ];

    const getInputStyle = () => [
        styles.input,
        {
            color: theme.colors.text,
            fontSize: size === 'small'
                ? theme.typography.fontSize.sm
                : theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily.regular,
        },
        leftIcon && styles.inputWithLeftIcon,
        (rightIcon || isPassword) && styles.inputWithRightIcon,
        style,
    ];

    const getLabelStyle = () => ({
        position: 'absolute' as const,
        left: leftIcon ? 40 : 12,
        color: error
            ? theme.colors.inputError
            : isFocused
                ? theme.colors.inputFocused
                : theme.colors.textSecondary,
        fontSize: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [
                size === 'small' ? theme.typography.fontSize.sm : theme.typography.fontSize.base,
                theme.typography.fontSize.xs
            ],
        }),
        top: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [
                size === 'small' ? 8 : size === 'medium' ? 12 : 16,
                -8
            ],
        }),
        backgroundColor: theme.colors.inputBackground,
        paddingHorizontal: 4,
        fontFamily: theme.typography.fontFamily.regular,
    });

    const getIconColor = () => {
        if (error) return theme.colors.inputError;
        if (isFocused) return theme.colors.inputFocused;
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
            {label && (
                <Animated.Text style={getLabelStyle()}>
                    {label}
                    {required && <Text style={{ color: theme.colors.error }}> *</Text>}
                </Animated.Text>
            )}

            <View style={getInputContainerStyle()}>
                {leftIcon && (
                    <View style={styles.leftIconContainer}>
                        <Ionicons
                            name={leftIcon}
                            size={theme.sizes.icon.sm}
                            color={getIconColor()}
                        />
                    </View>
                )}

                <TextInput
                    ref={ref}
                    {...props}
                    style={getInputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={isPassword && !isPasswordVisible}
                    placeholderTextColor={theme.colors.textTertiary}
                />

                {actualRightIcon && (
                    <TouchableOpacity
                        style={styles.rightIconContainer}
                        onPress={handleRightIconPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={actualRightIcon}
                            size={theme.sizes.icon.sm}
                            color={getIconColor()}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {(error || helperText) && (
                <Text style={[
                    styles.helperText,
                    {
                        color: error ? theme.colors.error : theme.colors.textSecondary,
                        fontSize: theme.typography.fontSize.xs,
                        fontFamily: theme.typography.fontFamily.regular,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        position: 'relative',
    },
    focusedBorder: {
        borderWidth: 2,
    },
    errorBorder: {
        borderWidth: 2,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 0,
    },
    inputWithLeftIcon: {
        paddingLeft: 0,
    },
    inputWithRightIcon: {
        paddingRight: 0,
    },
    leftIconContainer: {
        paddingLeft: 12,
        paddingRight: 8,
        justifyContent: 'center',
    },
    rightIconContainer: {
        paddingRight: 12,
        paddingLeft: 8,
        justifyContent: 'center',
    },
    helperText: {
        marginTop: 4,
        marginLeft: 12,
    },
});

Input.displayName = 'Input';