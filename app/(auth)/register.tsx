import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
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
import type { RegisterData } from '@/types';

// Schema de validação para nova empresa
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
        .required('Nome da empresa é obrigatório'),
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

// Schema para aceitar convite
const acceptInviteSchema = yup.object().shape({
    nome: yup
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .required('Nome é obrigatório'),
    telefone: yup
        .string()
        .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido')
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
    const { register, acceptInvite, isLoading, error } = useAuth();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Estado para controle de modo
    const [isInviteMode, setIsInviteMode] = useState(false);
    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [inviteInfo, setInviteInfo] = useState<any>(null);

    // Animações simples
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Forms
    const registerForm = useForm<RegisterData & { acceptTerms: boolean }>({
        resolver: yupResolver(registerSchema) as any,
        mode: 'onBlur',
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

    const inviteForm = useForm({
        resolver: yupResolver(acceptInviteSchema),
        mode: 'onBlur',
        defaultValues: {
            nome: '',
            telefone: '',
            password: '',
            confirmPassword: '',
        },
    });

    // Verificar se há token de convite
    React.useEffect(() => {
        const token = params.token as string;
        if (token) {
            setInviteToken(token);
            setIsInviteMode(true);
            loadInviteInfo(token);
        }
    }, [params]);

    // Animação de entrada
    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const loadInviteInfo = async (token: string) => {
        try {
            // TODO: Implementar busca real do convite
            setInviteInfo({
                empresa: 'Silva Construções LTDA',
                role: 'Engenheiro',
                email: 'maria@email.com'
            });
        } catch (error) {
            Alert.alert('Erro', 'Convite inválido ou expirado');
            setIsInviteMode(false);
        }
    };

    const handleRegister = async (data: RegisterData & { acceptTerms: boolean }) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const { acceptTerms, ...registerData } = data;
            await register(registerData);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                'Empresa Criada!',
                `Sua empresa "${data.empresa}" foi criada com sucesso!`,
                [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
            );
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
        }
    };

    const handleAcceptInvite = async (data: any) => {
        if (!inviteToken) return;

        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            await acceptInvite(inviteToken, {
                ...data,
                email: inviteInfo?.email
            });

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                'Bem-vindo!',
                `Você foi adicionado à equipe de ${inviteInfo?.empresa}!`,
                [{ text: 'Continuar', onPress: () => router.replace('/(tabs)') }]
            );
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
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

    const currentForm = isInviteMode ? inviteForm : registerForm;
    const currentSubmit = isInviteMode ? handleAcceptInvite : handleRegister;

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
                                {isInviteMode ? 'Aceitar convite' : 'Vamos criar sua conta'}
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                                {isInviteMode
                                    ? `Junte-se à equipe de\n${inviteInfo?.empresa || 'uma empresa'}`
                                    : 'Você terá uma jornada\nincrível na gestão de obras'
                                }
                            </Text>
                        </View>

                        {/* Convite Info */}
                        {isInviteMode && inviteInfo && (
                            <View style={[styles.inviteCard, {
                                backgroundColor: theme.colors.primary + '10',
                                borderColor: theme.colors.primary + '30'
                            }]}>
                                <View style={[styles.inviteIcon, { backgroundColor: theme.colors.primary }]}>
                                    <Ionicons name="business" size={24} color={theme.colors.white} />
                                </View>
                                <View style={styles.inviteDetails}>
                                    <Text style={[styles.inviteCompany, { color: theme.colors.text }]}>
                                        {inviteInfo.empresa}
                                    </Text>
                                    <Text style={[styles.inviteRole, { color: theme.colors.textSecondary }]}>
                                        Cargo: {inviteInfo.role}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Mode Toggle */}
                        {!inviteToken && (
                            <View style={styles.modeToggle}>
                                <Button
                                    title="Criar Empresa"
                                    onPress={() => setIsInviteMode(false)}
                                    variant={!isInviteMode ? 'primary' : 'outline'}
                                    size="medium"
                                    style={styles.toggleButton}
                                />
                                <Button
                                    title="Tenho Convite"
                                    onPress={() => setIsInviteMode(true)}
                                    variant={isInviteMode ? 'primary' : 'outline'}
                                    size="medium"
                                    style={styles.toggleButton}
                                />
                            </View>
                        )}

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Nome */}
                            <Controller
                                control={currentForm.control}
                                name="nome"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Nome completo"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={currentForm.formState.errors.nome?.message}
                                        autoCapitalize="words"
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                    />
                                )}
                            />

                            {/* Email - apenas se não for convite */}
                            {!isInviteMode && (
                                <Controller
                                    control={registerForm.control}
                                    name="email"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input
                                            placeholder="Email"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            error={registerForm.formState.errors.email?.message}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            size="large"
                                            containerStyle={styles.inputContainer}
                                        />
                                    )}
                                />
                            )}

                            {/* Empresa - apenas se não for convite */}
                            {!isInviteMode && (
                                <Controller
                                    control={registerForm.control}
                                    name="empresa"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input
                                            placeholder="Nome da empresa"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            error={registerForm.formState.errors.empresa?.message}
                                            autoCapitalize="words"
                                            size="large"
                                            containerStyle={styles.inputContainer}
                                        />
                                    )}
                                />
                            )}

                            {/* Token - apenas se for convite sem info */}
                            {isInviteMode && !inviteInfo && (
                                <Input
                                    placeholder="Token do convite"
                                    value={inviteToken || ''}
                                    onChangeText={setInviteToken}
                                    size="large"
                                    containerStyle={styles.inputContainer}
                                />
                            )}

                            {/* Telefone */}
                            <Controller
                                control={currentForm.control}
                                name="telefone"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Telefone (opcional)"
                                        value={value}
                                        onChangeText={(text) => onChange(formatPhone(text))}
                                        onBlur={onBlur}
                                        error={currentForm.formState.errors.telefone?.message}
                                        keyboardType="phone-pad"
                                        maxLength={15}
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                    />
                                )}
                            />

                            {/* Senha */}
                            <Controller
                                control={currentForm.control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder={isInviteMode ? "Criar senha" : "Senha"}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={currentForm.formState.errors.password?.message}
                                        isPassword
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                    />
                                )}
                            />

                            {/* Confirmar Senha */}
                            <Controller
                                control={currentForm.control}
                                name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Confirmar senha"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={currentForm.formState.errors.confirmPassword?.message}
                                        isPassword
                                        size="large"
                                        containerStyle={styles.inputContainer}
                                    />
                                )}
                            />

                            {/* Terms - apenas para nova empresa */}
                            {!isInviteMode && (
                                <Controller
                                    control={registerForm.control}
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
                                            {registerForm.formState.errors.acceptTerms && (
                                                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                                    {registerForm.formState.errors.acceptTerms.message}
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                />
                            )}

                            {/* Error Message */}
                            {error && (
                                <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}>
                                    <Ionicons
                                        name="alert-circle"
                                        size={20}
                                        color={theme.colors.error}
                                    />
                                    <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
                                        {error}
                                    </Text>
                                </View>
                            )}

                            {/* Submit Button */}
                            <Button
                                title={isInviteMode ? "Aceitar convite" : "Criar conta"}
                                onPress={currentForm.handleSubmit(currentSubmit)}
                                loading={isLoading}
                                disabled={!currentForm.formState.isValid || isLoading}
                                variant="primary"
                                size="large"
                                style={styles.submitButton}
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

    // Invite Card
    inviteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    inviteIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteDetails: {
        flex: 1,
    },
    inviteCompany: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        marginBottom: 2,
    },
    inviteRole: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },

    // Mode Toggle
    modeToggle: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: -16,
    },
    toggleButton: {
        flex: 1,
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
    },
    errorMessage: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        flex: 1,
        lineHeight: 20,
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
        marginLeft: 4,
    },

    // Submit Button
    submitButton: {
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