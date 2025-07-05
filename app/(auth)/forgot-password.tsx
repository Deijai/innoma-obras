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

// Schema de validação
const forgotPasswordSchema = yup.object().shape({
    email: yup
        .string()
        .email('Email inválido')
        .required('Email é obrigatório'),
});

interface ForgotPasswordForm {
    email: string;
}

export default function ForgotPasswordScreen() {
    const { theme } = useTheme();
    const { resetPassword, isLoading } = useAuth();
    const insets = useSafeAreaInsets();

    const [emailSent, setEmailSent] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        getValues,
    } = useForm<ForgotPasswordForm>({
        resolver: yupResolver(forgotPasswordSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
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

    const onSubmit = async (data: ForgotPasswordForm) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await resetPassword(data.email);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEmailSent(true);
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            Alert.alert(
                'Erro',
                error instanceof Error ? error.message : 'Erro ao enviar email de recuperação',
                [{ text: 'OK', style: 'default' }]
            );
        }
    };

    const handleBackToLogin = () => {
        router.back();
    };

    const handleResendEmail = async () => {
        const email = getValues('email');
        if (email) {
            try {
                await resetPassword(email);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                Alert.alert(
                    'Email Reenviado',
                    'Um novo email de recuperação foi enviado.',
                    [{ text: 'OK' }]
                );
            } catch (error) {
                Alert.alert(
                    'Erro',
                    'Não foi possível reenviar o email.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    if (emailSent) {
        return (
            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <LinearGradient
                    colors={[theme.colors.accent, theme.colors.accentDark] as const}
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
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <LinearGradient
                                    colors={[theme.colors.white, theme.colors.gray100]}
                                    style={styles.logoGradient}
                                >
                                    <Ionicons
                                        name="mail-open"
                                        size={48}
                                        color={theme.colors.accent}
                                    />
                                </LinearGradient>
                            </View>

                            <Text style={[styles.title, { color: theme.colors.white }]}>
                                Email Enviado!
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.white }]}>
                                Verifique sua caixa de entrada
                            </Text>
                        </View>

                        <Card
                            variant="elevated"
                            padding="large"
                            style={styles.successCard}
                        >
                            <View style={styles.successContent}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={64}
                                    color={theme.colors.success}
                                    style={styles.successIcon}
                                />

                                <Text style={[styles.successTitle, { color: theme.colors.text }]}>
                                    Instruções Enviadas
                                </Text>

                                <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
                                    Enviamos instruções para redefinir sua senha para o email{' '}
                                    <Text style={[styles.emailText, { color: theme.colors.text }]}>
                                        {getValues('email')}
                                    </Text>
                                </Text>

                                <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
                                    • Verifique sua caixa de entrada{'\n'}
                                    • Verifique também a pasta de spam{'\n'}
                                    • O link expira em 1 hora{'\n'}
                                    • Caso não receba, tente reenviar
                                </Text>

                                <View style={styles.actionButtons}>
                                    <Button
                                        title="Reenviar Email"
                                        onPress={handleResendEmail}
                                        variant="outline"
                                        size="medium"
                                        loading={isLoading}
                                        style={styles.resendButton}
                                    />

                                    <Button
                                        title="Voltar ao Login"
                                        onPress={handleBackToLogin}
                                        variant="primary"
                                        size="medium"
                                        style={styles.backButton}
                                    />
                                </View>
                            </View>
                        </Card>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={[theme.colors.accent, theme.colors.accentDark]}
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
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable
                            style={styles.backButtonHeader}
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
                                    colors={[theme.colors.white, theme.colors.gray100]}
                                    style={styles.logoGradient}
                                >
                                    <Ionicons
                                        name="key"
                                        size={40}
                                        color={theme.colors.accent}
                                    />
                                </LinearGradient>
                            </View>

                            <Text style={[styles.title, { color: theme.colors.white }]}>
                                Recuperar Senha
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.white }]}>
                                Não se preocupe, isso acontece com todos nós
                            </Text>
                        </View>
                    </View>

                    {/* Card de Recuperação */}
                    <Card
                        variant="elevated"
                        padding="large"
                        style={styles.forgotCard}
                    >
                        <View style={styles.form}>
                            <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>
                                Digite seu email
                            </Text>
                            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                                Enviaremos instruções para redefinir sua senha para o email cadastrado.
                            </Text>

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

                            {/* Send Button */}
                            <Button
                                title="Enviar Instruções"
                                onPress={handleSubmit(onSubmit)}
                                loading={isLoading}
                                disabled={!isValid || isLoading}
                                variant="primary"
                                size="large"
                                style={styles.sendButton}
                            />

                            {/* Help Text */}
                            <View style={styles.helpContainer}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={16}
                                    color={theme.colors.textSecondary}
                                />
                                <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                                    Lembrou da senha?{' '}
                                    <Pressable onPress={handleBackToLogin}>
                                        <Text style={[styles.helpLink, { color: theme.colors.accent }]}>
                                            Fazer login
                                        </Text>
                                    </Pressable>
                                </Text>
                            </View>
                        </View>
                    </Card>
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
    backButtonHeader: {
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
    forgotCard: {
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
    },
    form: {
        gap: 8,
    },
    instructionTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        lineHeight: 20,
        marginBottom: 24,
    },
    sendButton: {
        marginTop: 16,
        marginBottom: 16,
    },
    helpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    helpText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    helpLink: {
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },
    // Success state styles
    successCard: {
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
    },
    successContent: {
        alignItems: 'center',
    },
    successIcon: {
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        marginBottom: 16,
        textAlign: 'center',
    },
    successText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    emailText: {
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },
    instructionsText: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        lineHeight: 20,
        marginBottom: 32,
    },
    actionButtons: {
        width: '100%',
        gap: 12,
    },
    resendButton: {
        marginBottom: 8,
    },
    backButton: {
        marginBottom: 8,
    },
});