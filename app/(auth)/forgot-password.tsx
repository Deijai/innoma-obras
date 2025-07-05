import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Haptics from 'expo-haptics';
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

    // Animações simples
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        getValues,
    } = useForm<ForgotPasswordForm>({
        resolver: yupResolver(forgotPasswordSchema),
        mode: 'onBlur',
        reValidateMode: 'onBlur',
        defaultValues: {
            email: '',
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

    // Tela de sucesso
    if (emailSent) {
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

                            {/* Success Content */}
                            <View style={styles.successContainer}>
                                <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={64}
                                        color={theme.colors.success}
                                    />
                                </View>

                                <Text style={[styles.successTitle, { color: theme.colors.text }]}>
                                    Verifique seu email
                                </Text>

                                <Text style={[styles.successSubtitle, { color: theme.colors.textSecondary }]}>
                                    Enviamos as instruções de recuperação{'\n'}de senha para{' '}
                                    <Text style={[styles.emailText, { color: theme.colors.text }]}>
                                        {getValues('email')}
                                    </Text>
                                </Text>

                                <View style={styles.instructionsContainer}>
                                    <View style={styles.instructionItem}>
                                        <Ionicons name="mail" size={20} color={theme.colors.textSecondary} />
                                        <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                                            Verifique sua caixa de entrada
                                        </Text>
                                    </View>
                                    <View style={styles.instructionItem}>
                                        <Ionicons name="warning" size={20} color={theme.colors.textSecondary} />
                                        <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                                            Verifique também o spam
                                        </Text>
                                    </View>
                                    <View style={styles.instructionItem}>
                                        <Ionicons name="time" size={20} color={theme.colors.textSecondary} />
                                        <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                                            Link expira em 1 hora
                                        </Text>
                                    </View>
                                </View>

                                <Button
                                    title="Reenviar email"
                                    onPress={handleResendEmail}
                                    loading={isLoading}
                                    variant="outline"
                                    size="large"
                                    style={styles.resendButton}
                                />

                                <Button
                                    title="Voltar ao login"
                                    onPress={handleBackToLogin}
                                    variant="primary"
                                    size="large"
                                    style={styles.backToLoginButton}
                                />
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        );
    }

    // Tela principal de recuperação
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
                                Esqueceu a senha?
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                                Não se preocupe! Isso acontece. Digite o{'\n'}email vinculado à sua conta.
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
                                        placeholder="Digite seu email"
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

                            {/* Send Code Button */}
                            <Button
                                title="Enviar código"
                                onPress={handleSubmit(onSubmit)}
                                loading={isLoading}
                                disabled={!isValid || isLoading}
                                variant="primary"
                                size="large"
                                style={styles.sendCodeButton}
                            />
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                                Lembrou da senha?{' '}
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
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
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
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        lineHeight: 24,
    },

    // Form
    form: {
        gap: 24,
    },
    inputContainer: {
        marginBottom: 0,
    },

    // Send Code Button
    sendCodeButton: {
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

    // Success Screen
    successContainer: {
        alignItems: 'center',
        gap: 24,
        marginTop: 40,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 24,
    },
    emailText: {
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },
    instructionsContainer: {
        gap: 16,
        marginVertical: 8,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    instructionText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    resendButton: {
        borderRadius: 12,
        height: 56,
        width: '100%',
        marginBottom: 8,
    },
    backToLoginButton: {
        borderRadius: 12,
        height: 56,
        width: '100%',
    },
});