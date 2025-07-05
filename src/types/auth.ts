// src/types/auth.ts
// ========================================
// TIPOS DE AUTENTICAÇÃO - CORRIGIDOS
// ========================================

// ========================================
// TIPOS BASE DE USUÁRIO
// ========================================

export type UserProfile = 'admin' | 'engenheiro' | 'mestre' | 'operador' | 'visitante';
export type UserGlobalRole = 'super_admin' | 'tenant_admin' | 'user';

export interface User {
    id: number;
    uuid: string;
    tenant_id: string; // 🔑 OBRIGATÓRIO - Chave do tenant
    nome: string;
    email: string;
    telefone?: string;
    perfil: UserProfile; // Perfil dentro do tenant
    perfil_global?: UserGlobalRole; // Perfil global no sistema
    avatar_url?: string;
    empresa?: string;
    is_tenant_owner: boolean; // ✅ CORRIGIDO: obrigatório, sempre boolean
    created_at: string;
    updated_at: string;
    synced_at?: string;
    is_active: boolean;
    last_login_at?: string;
    email_verified?: boolean;
}

// ========================================
// CREDENCIAIS E FORMULÁRIOS
// ========================================

export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    nome: string;
    email: string;
    telefone?: string;
    empresa?: string;
    password: string;
    confirmPassword: string;
}

// ========================================
// ESTADO DE AUTENTICAÇÃO
// ========================================

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// ========================================
// CONTEXTO DE AUTENTICAÇÃO
// ========================================

export interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
    checkAuth: () => Promise<void>;
}

// ========================================
// DADOS DE TOKEN
// ========================================

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

// ========================================
// CONFIGURAÇÕES DE AUTENTICAÇÃO
// ========================================

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