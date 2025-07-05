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
import type { RegisterData } from '@/types';

// Schema de validação
const registerSchema = yup.object().shape({
    nome: yup
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .required('Nome é obrigatório'),
    email: yup
        .string()
        .email('Email inválido')
        .required('Email é obrigatório'),
    telefone: yup
        .string()
        .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido (ex: (11) 99999-9999)')
        .optional(),
    empresa: yup
        .string()
        .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
        .optional(),
    password: yup
        .string()
        .min(6, 'Senha deve ter pelo menos 6 caracteres')
        .required('Senha é obrigatória'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Senhas não coincidem')
        .required('Confirmação de senha é obrigatória'),
    acceptTerms: yup
        .boolean()
        .oneOf([true], 'Você deve aceitar os termos e condições')
        .required(),
});

export default function RegisterScreen() {
    const { theme } = useTheme();
    const { register, isLoading, error } = useAuth();
    const insets = useSafeAreaInsets();

    // Animações simples
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<RegisterData & { acceptTerms: boolean }>({
        resolver: yupResolver(registerSchema) as any,
        mode: 'onBlur',
        reValidateMode: 'onBlur',
        defaultValues: {
            nome: '',
            email: '',
            telefone: '',
            empresa: '',
            password: '',
            confirmPassword: '',
            acceptTerms: false,
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

    const onSubmit = async (data: RegisterData & { acceptTerms: boolean }) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const { acceptTerms, ...registerData } = data;
            await register(registerData);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                'Conta Criada!',
                'Sua conta foi criada com sucesso. Verifique seu email para confirmar o cadastro.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            );
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            Alert.alert(
                'Erro no Cadastro',
                error instanceof Error ? error.message : 'Erro desconhecido',
                [{ text: 'OK', style: 'default' }]
            );
        }
    };

    const handleBackToLogin = () => {
        router.back();
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
        } else {
            return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
        }
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
                            paddingTop: insets.top + 40,
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
                        {/* Back Button */}
                        <Pressable
                            style={styles.backButton}
                            onPress={handleBackToLogin}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color={theme.colors.text}
                            />
                        </Pressable>

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.colors.text }]}>
                                Vamos criar sua conta
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                                Olá usuário, você terá{'\n'}uma jornada incrível
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Nome Input */}
                            <Controller
                                control={control}
                                name="nome"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Nome"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.nome?.message}
                                        autoCapitalize="words"
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                    />
                                )}
                            />

                            {/* Email Input */}
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Email"
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

                            {/* Telefone Input */}
                            <Controller
                                control={control}
                                name="telefone"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Telefone"
                                        value={value}
                                        onChangeText={(text) => onChange(formatPhone(text))}
                                        onBlur={onBlur}
                                        error={errors.telefone?.message}
                                        keyboardType="phone-pad"
                                        maxLength={15}
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                    />
                                )}
                            />

                            {/* Empresa Input */}
                            <Controller
                                control={control}
                                name="empresa"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Empresa (opcional)"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.empresa?.message}
                                        autoCapitalize="words"
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
                                        autoComplete="new-password"
                                        textContentType="newPassword"
                                    />
                                )}
                            />

                            {/* Confirm Password Input */}
                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Confirmar senha"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.confirmPassword?.message}
                                        isPassword
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                        autoComplete="new-password"
                                        textContentType="newPassword"
                                    />
                                )}
                            />

                            {/* Terms Checkbox */}
                            <Controller
                                control={control}
                                name="acceptTerms"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.termsContainer}>
                                        <Pressable
                                            style={styles.checkboxContainer}
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
                                                        size={14}
                                                        color={theme.colors.white}
                                                    />
                                                )}
                                            </View>
                                            <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                                                Eu concordo com os{' '}
                                                <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                                                    Termos de Serviço
                                                </Text>
                                                {' '}e{' '}
                                                <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                                                    Política de Privacidade
                                                </Text>
                                            </Text>
                                        </Pressable>
                                        {errors.acceptTerms && (
                                            <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                                {errors.acceptTerms.message}
                                            </Text>
                                        )}
                                    </View>
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

                            {/* Sign Up Button */}
                            <Button
                                title="Cadastrar"
                                onPress={handleSubmit(onSubmit)}
                                loading={isLoading}
                                disabled={!isValid || isLoading}
                                variant="primary"
                                size="large"
                                style={styles.signUpButton}
                            />
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                                Já tem uma conta?{' '}
                            </Text>
                            <Pressable onPress={handleBackToLogin}>
                                <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                                    Entrar
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
    },
    content: {
        flex: 1,
        gap: 32,
    },

    // Back Button
    backButton: {
        alignSelf: 'flex-start',
        padding: 8,
        marginBottom: 8,
    },

    // Header
    header: {
        alignItems: 'flex-start',
        marginBottom: 8,
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
        gap: 16,
    },
    inputContainer: {
        marginBottom: 0,
    },

    // Terms
    termsContainer: {
        marginTop: 8,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    termsText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        lineHeight: 20,
        flex: 1,
    },
    termsLink: {
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
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
        marginTop: 8,
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        lineHeight: 16,
        marginTop: 4,
        marginLeft: 4,
    },

    // Sign Up Button
    signUpButton: {
        marginTop: 8,
        borderRadius: 12,
        height: 56,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 16,
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