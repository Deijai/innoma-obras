import AuthService from '@/services/auth/AuthService';
import { auth } from '@/services/firebase/config';
import { NetworkService } from '@/services/network/NetworkService';
import type { AuthState, LoginCredentials, RegisterData, User } from '@/types';
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
                    const token = await authService.getCurrentUser(); // Token seria obtido do SecureStorage

                    setAuthState({
                        user,
                        token: 'valid_token', // Placeholder - token real seria obtido do storage
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
     * Login
     */
    const login = async (credentials: LoginCredentials) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const { user, token } = await authService.login(credentials);

            setAuthState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro no login';

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            throw error;
        }
    };

    /**
     * Cadastro
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro no cadastro';

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            throw error;
        }
    };

    /**
     * Logout
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
        } catch (error) {
            console.error('Erro no logout:', error);

            // Mesmo com erro, deslogar localmente
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro na recuperação';

            setAuthState(prev => ({
                ...prev,
                error: errorMessage,
            }));

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
            }
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
        }
    };

    /**
     * Atualizar perfil do usuário
     */
    const updateUserProfile = async (data: Partial<User>) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            // Aqui seria implementada a atualização no Firebase e banco local
            // Por enquanto, apenas atualizamos o estado local

            if (authState.user) {
                const updatedUser = { ...authState.user, ...data };

                setAuthState(prev => ({
                    ...prev,
                    user: updatedUser,
                    isLoading: false,
                }));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro na atualização';

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

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

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}

export default AuthContext;