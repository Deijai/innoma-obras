// src/contexts/AuthContext.tsx
import { auth } from '@/services/firebase/config';
import { NetworkService } from '@/services/network/NetworkService';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

import AuthService from '@/services/auth/AuthService';
// ✅ CORRETO: Importar tipos específicos do arquivo auth.ts
import type {
    AuthContextType,
    AuthState,
    LoginCredentials,
    RegisterData,
    User
} from '@/types/auth';

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

    const value: AuthContextType = {
        ...authState,
        login,
        register,
        logout,
        resetPassword,
        refreshUser,
        updateUserProfile,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook para usar o contexto de autenticação
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}

export default AuthContext;