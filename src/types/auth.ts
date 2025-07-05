// src/types/auth.ts
// Este arquivo pode ser removido ou mantido para compatibilidade
// Os tipos principais estão em src/types/index.ts

import type { LoginCredentials, RegisterData, User } from './index';

// Re-exportar tipos principais
export type {
    AuthState,
    LoginCredentials,
    RegisterData, User, UserGlobalRole, UserProfile
} from './index';

// Tipos específicos de autenticação que não estão no index
export interface AuthTokenData {
    token: string;
    refreshToken?: string;
    expiresAt: string;
    user: User;
}

export interface AuthError {
    code: string;
    message: string;
    details?: any;
}

export interface AuthContext {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Métodos de autenticação
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
    checkAuth: () => Promise<void>;
}

// Configurações de autenticação
export interface AuthConfig {
    tokenStorageKey: string;
    userStorageKey: string;
    tokenExpirationBuffer: number; // em minutos
    maxRetryAttempts: number;
    offlineMode: boolean;
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
    tokenStorageKey: 'auth_token',
    userStorageKey: 'current_user',
    tokenExpirationBuffer: 5,
    maxRetryAttempts: 3,
    offlineMode: true,
};