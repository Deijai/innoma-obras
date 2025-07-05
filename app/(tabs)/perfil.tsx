// app/(tabs)/perfil.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileScreen() {
    const { theme } = useTheme();
    const { user, logout, updateUserProfile, isLoading } = useAuth();
    const { getUserRole } = usePermissions();
    const insets = useSafeAreaInsets();

    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        nome: user?.nome || '',
        email: user?.email || '',
        telefone: user?.telefone || '',
        empresa: user?.empresa || '',
    });

    const handleEdit = () => {
        setEditing(true);
        setFormData({
            nome: user?.nome || '',
            email: user?.email || '',
            telefone: user?.telefone || '',
            empresa: user?.empresa || '',
        });
    };

    const handleSave = async () => {
        try {
            await updateUserProfile(formData);
            setEditing(false);
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setFormData({
            nome: user?.nome || '',
            email: user?.email || '',
            telefone: user?.telefone || '',
            empresa: user?.empresa || '',
        });
    };

    const handleChangeAvatar = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Permissão necessária',
                    'É necessário permitir acesso às fotos para alterar o avatar.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                // Aqui implementaria o upload da imagem
                console.log('Nova imagem selecionada:', result.assets[0].uri);
                Alert.alert('Em desenvolvimento', 'Upload de avatar será implementado em breve.');
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Sair da conta',
            'Tem certeza que deseja sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Excluir conta',
            'Esta ação é irreversível. Todos os seus dados serão perdidos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Em desenvolvimento', 'Exclusão de conta será implementada em breve.');
                    },
                },
            ]
        );
    };

    const getRoleDisplayName = (role: string | null) => {
        const roleNames = {
            admin: 'Administrador',
            engenheiro: 'Engenheiro',
            mestre: 'Mestre de Obras',
            operador: 'Operador',
            visitante: 'Visitante',
        };
        return role ? roleNames[role as keyof typeof roleNames] || role : 'Não definido';
    };

    const getRoleColor = (role: string | null) => {
        const roleColors = {
            admin: theme.colors.error,
            engenheiro: theme.colors.primary,
            mestre: theme.colors.secondary,
            operador: theme.colors.warning,
            visitante: theme.colors.textSecondary,
        };
        return role ? roleColors[role as keyof typeof roleColors] || theme.colors.textSecondary : theme.colors.textSecondary;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        Meu Perfil
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.editButton}
                    onPress={editing ? handleSave : handleEdit}
                    disabled={isLoading}
                >
                    <Ionicons
                        name={editing ? 'checkmark' : 'pencil'}
                        size={20}
                        color={theme.colors.primary}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Section */}
                <Card variant="elevated" padding="large" style={styles.avatarCard}>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity
                            style={[styles.avatarContainer, { borderColor: theme.colors.border }]}
                            onPress={handleChangeAvatar}
                        >
                            {user?.avatar_url ? (
                                <Image
                                    source={{ uri: user.avatar_url }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                                    <Text style={[styles.avatarText, { color: theme.colors.white }]}>
                                        {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                                    </Text>
                                </View>
                            )}

                            <View style={[styles.avatarEditIcon, { backgroundColor: theme.colors.primary }]}>
                                <Ionicons
                                    name="camera"
                                    size={16}
                                    color={theme.colors.white}
                                />
                            </View>
                        </TouchableOpacity>

                        <Text style={[styles.userName, { color: theme.colors.text }]}>
                            {user?.nome}
                        </Text>

                        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(getUserRole()) }]}>
                            <Text style={[styles.roleText, { color: theme.colors.white }]}>
                                {getRoleDisplayName(getUserRole())}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Profile Information */}
                <Card variant="elevated" padding="large" style={styles.infoCard}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Informações Pessoais
                    </Text>

                    <View style={styles.form}>
                        <Input
                            label="Nome completo"
                            value={formData.nome}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                            editable={editing}
                            leftIcon="person"
                        />

                        <Input
                            label="Email"
                            value={formData.email}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                            editable={false} // Email geralmente não é editável
                            leftIcon="mail"
                            style={{ backgroundColor: theme.colors.surfaceVariant }}
                        />

                        <Input
                            label="Telefone"
                            value={formData.telefone}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, telefone: text }))}
                            editable={editing}
                            leftIcon="call"
                            keyboardType="phone-pad"
                        />

                        <Input
                            label="Empresa"
                            value={formData.empresa}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, empresa: text }))}
                            editable={editing}
                            leftIcon="business"
                        />
                    </View>

                    {editing && (
                        <View style={styles.editActions}>
                            <Button
                                title="Cancelar"
                                onPress={handleCancel}
                                variant="outline"
                                size="medium"
                                style={styles.editActionButton}
                            />
                            <Button
                                title="Salvar"
                                onPress={handleSave}
                                variant="primary"
                                size="medium"
                                loading={isLoading}
                                style={styles.editActionButton}
                            />
                        </View>
                    )}
                </Card>

                {/* Settings Section */}
                <Card variant="elevated" padding="large" style={styles.settingsCard}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Configurações
                    </Text>

                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons
                            name="notifications"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={[styles.settingText, { color: theme.colors.text }]}>
                            Notificações
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons
                            name="shield-checkmark"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={[styles.settingText, { color: theme.colors.text }]}>
                            Privacidade e Segurança
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons
                            name="help-circle"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={[styles.settingText, { color: theme.colors.text }]}>
                            Ajuda e Suporte
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                </Card>

                {/* Actions */}
                <Card variant="elevated" padding="large" style={styles.actionsCard}>
                    <Button
                        title="Sair da Conta"
                        onPress={handleLogout}
                        variant="outline"
                        size="large"
                        icon={<Ionicons name="log-out" size={20} color={theme.colors.error} />}
                        style={[styles.actionButton, { borderColor: theme.colors.error }]}
                    />

                    <Button
                        title="Excluir Conta"
                        onPress={handleDeleteAccount}
                        variant="danger"
                        size="large"
                        icon={<Ionicons name="trash" size={20} color={theme.colors.white} />}
                        style={styles.actionButton}
                    />
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
    editButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        gap: 16,
    },

    // Avatar Section
    avatarCard: {
        marginBottom: 8,
    },
    avatarSection: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        overflow: 'hidden',
        marginBottom: 16,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
    avatarEditIcon: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        marginBottom: 8,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
    },

    // Form Section
    infoCard: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Inter-Medium',
        marginBottom: 16,
    },
    form: {
        gap: 4,
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    editActionButton: {
        flex: 1,
    },

    // Settings Section
    settingsCard: {
        marginBottom: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    settingText: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginLeft: 16,
    },

    // Actions Section
    actionsCard: {
        marginBottom: 8,
    },
    actionButton: {
        marginBottom: 12,
    },
});