import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as yup from 'yup';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { LoginCredentials } from '@/types';

// Schema de validação
const loginSchema = yup.object().shape({
    email: yup
        .string()
        .email('Email inválido')
        .required('Email é obrigatório'),
    password: yup
        .string()
        .min(6, 'Senha deve ter pelo menos 6 caracteres')
        .required('Senha é obrigatória'),
    rememberMe: yup.boolean(),
});

export default function LoginScreen() {
    const { theme } = useTheme();
    const { login, isLoading, error } = useAuth();
    const insets = useSafeAreaInsets();

    const [showPassword, setShowPassword] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        watch,
    } = useForm<LoginCredentials>({
        resolver: yupResolver(loginSchema) as any,
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    // Animações de entrada
    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onSubmit = async (data: LoginCredentials) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await login(data);

            // Sucesso! Redirecionar será feito automaticamente pelo AuthContext
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            Alert.alert(
                'Erro no Login',
                error instanceof Error ? error.message : 'Erro desconhecido',
                [{ text: 'OK', style: 'default' }]
            );
        }
    };

    const handleForgotPassword = () => {
        router.push('/(auth)/forgot-password');
    };

    const handleCreateAccount = () => {
        router.push('/(auth)/register');
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark] as const}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Logo e Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={[theme.colors.white, theme.colors.gray100] as const}
                                style={styles.logoGradient}
                            >
                                <Ionicons
                                    name="construct"
                                    size={48}
                                    color={theme.colors.primary}
                                />
                            </LinearGradient>
                        </View>

                        <Text style={[styles.title, { color: theme.colors.white }]}>
                            Innoma Obras
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.white }]}>
                            Bem-vindo de volta!
                        </Text>
                        <Text style={[styles.description, { color: theme.colors.white }]}>
                            Gerencie suas obras com eficiência e profissionalismo
                        </Text>
                    </View>

                    {/* Card de Login */}
                    <Card
                        variant="elevated"
                        padding="large"
                        style={styles.loginCard}
                    >
                        <View style={styles.form}>
                            {/* Email Input */}
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Email"
                                        placeholder="seu@email.com"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.email?.message}
                                        leftIcon="mail"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        required
                                    />
                                )}
                            />

                            {/* Password Input */}
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Senha"
                                        placeholder="••••••••"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.password?.message}
                                        leftIcon="lock-closed"
                                        isPassword
                                        required
                                    />
                                )}
                            />

                            {/* Remember Me */}
                            <Controller
                                control={control}
                                name="rememberMe"
                                render={({ field: { onChange, value } }) => (
                                    <Pressable
                                        style={styles.rememberContainer}
                                        onPress={() => onChange(!value)}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            {
                                                borderColor: value ? theme.colors.primary : theme.colors.border,
                                                backgroundColor: value ? theme.colors.primary : 'transparent',
                                            }
                                        ]}>
                                            {value && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={16}
                                                    color={theme.colors.white}
                                                />
                                            )}
                                        </View>
                                        <Text style={[styles.rememberText, { color: theme.colors.textSecondary }]}>
                                            Lembrar de mim
                                        </Text>
                                    </Pressable>
                                )}
                            />

                            {/* Error Message */}
                            {error && (
                                <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}>
                                    <Ionicons
                                        name="alert-circle"
                                        size={20}
                                        color={theme.colors.error}
                                    />
                                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                        {error}
                                    </Text>
                                </View>
                            )}

                            {/* Login Button */}
                            <Button
                                title="Entrar"
                                onPress={handleSubmit(onSubmit)}
                                loading={isLoading}
                                disabled={!isValid || isLoading}
                                gradient
                                size="large"
                                style={styles.loginButton}
                            />

                            {/* Forgot Password */}
                            <Pressable
                                style={styles.forgotButton}
                                onPress={handleForgotPassword}
                            >
                                <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                                    Esqueceu sua senha?
                                </Text>
                            </Pressable>
                        </View>
                    </Card>

                    {/* Create Account */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.colors.white }]}>
                            Não tem uma conta?{' '}
                        </Text>
                        <Pressable onPress={handleCreateAccount}>
                            <Text style={[styles.footerLink, { color: theme.colors.white }]}>
                                Criar conta
                            </Text>
                        </Pressable>
                    </View>

                    {/* Offline Indicator */}
                    <View style={styles.offlineContainer}>
                        <Ionicons
                            name="wifi-outline"
                            size={16}
                            color={theme.colors.white}
                        />
                        <Text style={[styles.offlineText, { color: theme.colors.white }]}>
                            Funciona offline
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        minHeight: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
    },
    logoGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.9,
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
    },
    loginCard: {
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
    },
    form: {
        gap: 4,
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rememberText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        flex: 1,
    },
    loginButton: {
        marginBottom: 16,
    },
    forgotButton: {
        alignSelf: 'center',
        padding: 8,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    footerLink: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        textDecorationLine: 'underline',
    },
    offlineContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        gap: 8,
    },
    offlineText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        opacity: 0.8,
    },
});