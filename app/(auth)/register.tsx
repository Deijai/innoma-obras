import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Card } from '@/components/common/Card';
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
        .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido')
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
});

export default function RegisterScreen() {
    const { theme } = useTheme();
    const { register, isLoading, error } = useAuth();
    const insets = useSafeAreaInsets();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        watch,
    } = useForm<RegisterData>({
        resolver: yupResolver(registerSchema) as any,
        mode: 'onChange',
        defaultValues: {
            nome: '',
            email: '',
            telefone: '',
            empresa: '',
            password: '',
            confirmPassword: '',
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

    const onSubmit = async (data: RegisterData) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await register(data);

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
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '');

        // Aplica a máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
        } else {
            return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={[theme.colors.secondary, theme.colors.secondaryDark] as const}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
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
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable
                            style={styles.backButton}
                            onPress={handleBackToLogin}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color={theme.colors.white}
                            />
                        </Pressable>

                        <View style={styles.headerContent}>
                            <View style={styles.logoContainer}>
                                <LinearGradient
                                    colors={[theme.colors.white, theme.colors.gray100] as const}
                                    style={styles.logoGradient}
                                >
                                    <Ionicons
                                        name="person-add"
                                        size={40}
                                        color={theme.colors.secondary}
                                    />
                                </LinearGradient>
                            </View>

                            <Text style={[styles.title, { color: theme.colors.white }]}>
                                Criar Conta
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.white }]}>
                                Junte-se à revolução na gestão de obras
                            </Text>
                        </View>
                    </View>

                    {/* Card de Cadastro */}
                    <Card
                        variant="elevated"
                        padding="large"
                        style={styles.registerCard}
                    >
                        <View style={styles.form}>
                            {/* Nome Input */}
                            <Controller
                                control={control}
                                name="nome"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Nome completo"
                                        placeholder="Seu nome completo"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.nome?.message}
                                        leftIcon="person"
                                        autoCapitalize="words"
                                        required
                                    />
                                )}
                            />

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

                            {/* Telefone Input */}
                            <Controller
                                control={control}
                                name="telefone"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Telefone"
                                        placeholder="(00) 00000-0000"
                                        value={value}
                                        onChangeText={(text) => onChange(formatPhone(text))}
                                        onBlur={onBlur}
                                        error={errors.telefone?.message}
                                        leftIcon="call"
                                        keyboardType="phone-pad"
                                        maxLength={15}
                                    />
                                )}
                            />

                            {/* Empresa Input */}
                            <Controller
                                control={control}
                                name="empresa"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Empresa"
                                        placeholder="Nome da sua empresa"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.empresa?.message}
                                        leftIcon="business"
                                        autoCapitalize="words"
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

                            {/* Confirm Password Input */}
                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Confirmar senha"
                                        placeholder="••••••••"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.confirmPassword?.message}
                                        leftIcon="lock-closed"
                                        isPassword
                                        required
                                    />
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

                            {/* Terms */}
                            <View style={styles.termsContainer}>
                                <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                                    Ao criar uma conta, você concorda com nossos{' '}
                                    <Text style={[styles.termsLink, { color: theme.colors.secondary }]}>
                                        Termos de Uso
                                    </Text>
                                    {' e '}
                                    <Text style={[styles.termsLink, { color: theme.colors.secondary }]}>
                                        Política de Privacidade
                                    </Text>
                                </Text>
                            </View>

                            {/* Register Button */}
                            <Button
                                title="Criar Conta"
                                onPress={handleSubmit(onSubmit)}
                                loading={isLoading}
                                disabled={!isValid || isLoading}
                                variant="secondary"
                                gradient
                                size="large"
                                style={styles.registerButton}
                            />
                        </View>
                    </Card>

                    {/* Back to Login */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.colors.white }]}>
                            Já tem uma conta?{' '}
                        </Text>
                        <Pressable onPress={handleBackToLogin}>
                            <Text style={[styles.footerLink, { color: theme.colors.white }]}>
                                Fazer login
                            </Text>
                        </Pressable>
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
        marginBottom: 32,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 8,
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerContent: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 70,
        height: 70,
        borderRadius: 16,
        marginBottom: 16,
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
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.9,
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
    },
    registerCard: {
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
    termsContainer: {
        marginBottom: 24,
        marginTop: 8,
    },
    termsText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },
    registerButton: {
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
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
        textDecorationLine: 'underline',
    },
});