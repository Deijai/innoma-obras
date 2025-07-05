// src/contexts/AuthContext.tsx
import AuthService from '@/services/auth/AuthService';
import { auth } from '@/services/firebase/config';
import { NetworkService } from '@/services/network/NetworkService';
import type { AuthState, LoginCredentials, RegisterData, User } from '@/types';
import type { CreateTenantData } from '@/types/tenant';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
    checkAuth: () => Promise<void>;

    // Multi-tenant específico
    createTenantAndUser: (tenantData: CreateTenantData, userData: RegisterData) => Promise<void>;
    joinTenant: (inviteToken: string, userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    const authService = AuthService.getInstance();

    // Verificar autenticação ao inicializar
    useEffect(() => {
        checkAuth();
    }, []);

    // Escutar mudanças no Firebase Auth (apenas quando online)
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupAuthListener = async () => {
            const isOnline = await NetworkService.isConnected();

            if (isOnline) {
                unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    try {
                        if (firebaseUser) {
                            // Usuário logado no Firebase
                            const currentUser = await authService.getCurrentUser();
                            if (!currentUser || currentUser.uuid !== firebaseUser.uid) {
                                // Sincronizar dados do usuário
                                await refreshUser();
                            }
                        } else {
                            // Usuário deslogado no Firebase (apenas se estiver online)
                            const isStillAuthenticated = await authService.isAuthenticated();
                            if (!isStillAuthenticated) {
                                setAuthState(prev => ({
                                    ...prev,
                                    user: null,
                                    token: null,
                                    isAuthenticated: false,
                                }));
                            }
                        }
                    } catch (error) {
                        console.error('Erro no listener de auth:', error);
                    }
                });
            }
        };

        setupAuthListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    /**
     * Verificar autenticação
     */
    const checkAuth = async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const isAuthenticated = await authService.isAuthenticated();

            if (isAuthenticated) {
                const user = await authService.getCurrentUser();

                if (user) {
                    const token = 'valid_token'; // Token real seria obtido do SecureStorage

                    setAuthState({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } else {
                    setAuthState({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                }
            } else {
                setAuthState({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            });
        }
    };

    /**
     * Login do usuário
     * Identifica automaticamente o tenant pelo email ou usa dados salvos
     */
    const login = async (credentials: LoginCredentials) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const { user, token } = await authService.login(credentials);

            // Verificar se usuário tem tenant_id
            if (!user.tenant_id) {
                throw new Error('Usuário não está associado a nenhuma empresa. Entre em contato com o suporte.');
            }

            setAuthState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            console.log('✅ Login realizado com sucesso:', user.nome, '- Empresa ID:', user.tenant_id);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro no login';

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            console.error('❌ Erro no login:', errorMessage);
            throw error;
        }
    };

    /**
     * Cadastro de usuário
     * Cria automaticamente um tenant (empresa) para o primeiro usuário
     */
    const register = async (data: RegisterData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const { user, token } = await authService.register(data);

            setAuthState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            console.log('✅ Cadastro realizado com sucesso:', user.nome, '- Nova empresa criada');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro no cadastro';

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            console.error('❌ Erro no cadastro:', errorMessage);
            throw error;
        }
    };

    /**
     * Logout do usuário
     * Limpa todos os dados locais e remove tokens
     */
    const logout = async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            await authService.logout();

            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });

            console.log('✅ Logout realizado com sucesso');
        } catch (error) {
            console.error('❌ Erro no logout:', error);

            // Mesmo com erro, deslogar localmente para evitar estado inconsistente
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Erro no logout',
            });
        }
    };

    /**
     * Recuperação de senha
     * Envia email para redefinição de senha
     */
    const resetPassword = async (email: string) => {
        try {
            setAuthState(prev => ({ ...prev, error: null }));

            await authService.resetPassword(email);

            console.log('✅ Email de recuperação enviado para:', email);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro na recuperação';

            setAuthState(prev => ({
                ...prev,
                error: errorMessage,
            }));

            console.error('❌ Erro ao enviar email de recuperação:', errorMessage);
            throw error;
        }
    };

    /**
     * Atualizar dados do usuário
     * Recarrega informações do usuário do banco local/Firebase
     */
    const refreshUser = async () => {
        try {
            const user = await authService.getCurrentUser();

            if (user) {
                setAuthState(prev => ({
                    ...prev,
                    user,
                }));

                console.log('✅ Dados do usuário atualizados');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário:', error);
        }
    };

    /**
     * Atualizar perfil do usuário
     * Modifica informações como nome, telefone, etc.
     */
    const updateUserProfile = async (data: Partial<User>) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            await authService.updateUserProfile(data);

            if (authState.user) {
                const updatedUser = {
                    ...authState.user,
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                setAuthState(prev => ({
                    ...prev,
                    user: updatedUser,
                    isLoading: false,
                }));
            }

            console.log('✅ Perfil atualizado com sucesso');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro na atualização';

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            console.error('❌ Erro ao atualizar perfil:', errorMessage);
            throw error;
        }
    };

    /**
     * Criar tenant e usuário (para empresas que estão começando)
     * Usado quando uma empresa quer criar sua conta do zero
     */
    const createTenantAndUser = async (tenantData: CreateTenantData, userData: RegisterData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const { user, token } = await authService.createTenantAndUser(tenantData, userData);

            setAuthState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            console.log('✅ Empresa e usuário criados com sucesso:', tenantData.nome);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao criar empresa';

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            console.error('❌ Erro ao criar empresa:', errorMessage);
            throw error;
        }
    };

    /**
     * Entrar em tenant via convite
     * Usado quando um usuário recebe convite para entrar em uma empresa
     */
    const joinTenant = async (inviteToken: string, userData: any) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const { user, token } = await authService.joinTenantByInvite(inviteToken, userData);

            setAuthState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            console.log('✅ Convite aceito com sucesso. Bem-vindo à empresa!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao aceitar convite';

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            console.error('❌ Erro ao aceitar convite:', errorMessage);
            throw error;
        }
    };

    const value: AuthContextType = {
        ...authState,
        login,
        register,
        logout,
        resetPassword,
        refreshUser,
        updateUserProfile,
        checkAuth,
        createTenantAndUser,
        joinTenant,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook para usar o contexto de autenticação
 * Deve ser usado dentro de um AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}

export default AuthContext;