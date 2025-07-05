import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef } from 'react';
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

    // Animações simples
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<LoginCredentials>({
        resolver: yupResolver(loginSchema) as any,
        mode: 'onBlur',
        reValidateMode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    // Animação de entrada suave
    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const onSubmit = async (data: LoginCredentials) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await login(data);
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
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingTop: insets.top + 60,
                            paddingBottom: insets.bottom + 40
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={[
                            styles.content,
                            { opacity: fadeAnim }
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.colors.text }]}>
                                Vamos fazer login
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                                Bem-vindo de volta,{'\n'}Você fez falta por aqui
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Email Input */}
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Email, telefone ou usuário"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.email?.message}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                    />
                                )}
                            />

                            {/* Password Input */}
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Senha"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.password?.message}
                                        isPassword
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                        autoComplete="current-password"
                                        textContentType="password"
                                        returnKeyType="done"
                                        blurOnSubmit={false}
                                    />
                                )}
                            />

                            {/* Forgot Password */}
                            <Pressable
                                style={styles.forgotButton}
                                onPress={handleForgotPassword}
                            >
                                <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                                    Esqueci a senha
                                </Text>
                            </Pressable>

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

                            {/* Sign In Button */}
                            <Button
                                title="Entrar"
                                onPress={handleSubmit(onSubmit)}
                                loading={isLoading}
                                disabled={!isValid || isLoading}
                                variant="primary"
                                size="large"
                                style={styles.signInButton}
                            />

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                                <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
                                    ou
                                </Text>
                                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                            </View>

                            {/* Social Buttons */}
                            <View style={styles.socialButtons}>
                                <Pressable
                                    style={[styles.socialButton, { borderColor: theme.colors.border }]}
                                    onPress={() => Alert.alert('Em breve', 'Login com Google será implementado em breve.')}
                                >
                                    <Ionicons name="logo-google" size={24} color="#4285F4" />
                                </Pressable>
                                <Pressable
                                    style={[styles.socialButton, { borderColor: theme.colors.border }]}
                                    onPress={() => Alert.alert('Em breve', 'Login com Facebook será implementado em breve.')}
                                >
                                    <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                                </Pressable>
                                <Pressable
                                    style={[styles.socialButton, { borderColor: theme.colors.border }]}
                                    onPress={() => Alert.alert('Em breve', 'Login com Apple será implementado em breve.')}
                                >
                                    <Ionicons name="logo-apple" size={24} color={theme.colors.text} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                                Não tem uma conta?{' '}
                            </Text>
                            <Pressable onPress={handleCreateAccount}>
                                <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                                    Cadastre-se
                                </Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: 40,
    },

    // Header
    header: {
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        marginBottom: 16,
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'Inter-Regular',
        lineHeight: 28,
    },

    // Form
    form: {
        gap: 20,
    },
    inputContainer: {
        marginBottom: 0,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        padding: 4,
        marginTop: -8,
    },
    forgotText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },

    // Error
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        flex: 1,
        lineHeight: 20,
    },

    // Sign In Button
    signInButton: {
        marginTop: 8,
        borderRadius: 12,
        height: 56,
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginHorizontal: 16,
    },

    // Social Buttons
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 16,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    footerText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    footerLink: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },
});