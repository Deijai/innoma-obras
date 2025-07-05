// src/types/index.ts
// ========================================
// TIPOS BASE E UTILITÁRIOS
// ========================================

export type UUID = string;
export type DateString = string; // ISO format
export type JSONString = string;

export interface BaseEntity {
    id: number;
    uuid: UUID;
    created_at: DateString;
    updated_at: DateString;
    synced_at?: DateString;
    is_active: boolean;
}

export interface SyncEntity extends BaseEntity {
    lastModified: DateString;
    needsSync: boolean;
    syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
}

// ========================================
// USUÁRIO E AUTENTICAÇÃO - ATUALIZADO PARA MULTI-TENANT
// ========================================

export type UserProfile = 'admin' | 'engenheiro' | 'mestre' | 'operador' | 'visitante';
export type UserGlobalRole = 'super_admin' | 'tenant_admin' | 'user';

export interface User extends BaseEntity {
    tenant_id: string; // 🔑 OBRIGATÓRIO - Chave do tenant
    nome: string;
    email: string;
    telefone?: string;
    perfil: UserProfile; // Perfil dentro do tenant
    perfil_global?: UserGlobalRole; // Perfil global no sistema
    avatar_url?: string;
    empresa?: string;
    is_tenant_owner?: boolean; // Se é dono do tenant
    last_login_at?: DateString;
    email_verified?: boolean;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// ========================================
// TENANT (EMPRESA)
// ========================================

export type TenantStatus = 'ativo' | 'suspenso' | 'cancelado' | 'trial';
export type TenantPlan = 'basico' | 'pro' | 'enterprise' | 'custom';

export interface Tenant extends BaseEntity {
    nome: string;
    slug: string; // URL-friendly identifier (ex: empresa-abc)
    cnpj?: string;
    email_contato: string;
    telefone?: string;
    endereco?: string;
    logo_url?: string;
    website?: string;

    // Plano e limites
    plano: TenantPlan;
    status: TenantStatus;
    limite_usuarios: number;
    limite_obras: number;
    limite_storage_gb: number;

    // Configurações
    configuracoes?: TenantConfiguracoes;

    // Datas importantes
    trial_end_date?: string;
    subscription_end_date?: string;

    // Dados de faturamento
    billing_email?: string;
    billing_address?: string;

    // Dados relacionados
    owner?: User;
    usuarios?: User[];
    total_obras?: number;
    storage_usado_mb?: number;
}

export interface TenantConfiguracoes {
    // Personalização
    cor_primaria?: string;
    cor_secundaria?: string;
    tema_padrao?: 'light' | 'dark' | 'auto';

    // Funcionalidades habilitadas
    modulo_financeiro: boolean;
    modulo_materiais: boolean;
    modulo_qualidade: boolean;
    modulo_documentos: boolean;

    // Configurações de negócio
    moeda: string; // BRL, USD, EUR
    fuso_horario: string;
    formato_data: string; // DD/MM/YYYY, MM/DD/YYYY

    // Notificações
    notificacoes_email: boolean;
    notificacoes_push: boolean;
    frequencia_relatorios: 'diario' | 'semanal' | 'mensal';

    // Integrações
    integracoes_ativas?: string[];
    webhook_url?: string;

    // Customizações
    campos_personalizados?: CampoPersonalizado[];
}

export interface CampoPersonalizado {
    id: string;
    nome: string;
    tipo: 'texto' | 'numero' | 'data' | 'lista' | 'boolean';
    obrigatorio: boolean;
    opcoes?: string[]; // Para tipo 'lista'
    valor_padrao?: any;
}

// ========================================
// CONVITES
// ========================================

export type ConviteStatus = 'pendente' | 'aceito' | 'expirado' | 'cancelado';

export interface ConviteTenant extends BaseEntity {
    tenant_id: string;
    email: string;
    perfil_tenant: UserTenantRole;
    token: string;
    enviado_por: string;
    data_expiracao: string;
    status: ConviteStatus;
    mensagem?: string;

    // Dados relacionados
    tenant?: Tenant;
    enviado_por_usuario?: User;
}

// ========================================
// USUÁRIO MULTI-TENANT
// ========================================

export type UserTenantRole = 'owner' | 'admin' | 'engenheiro' | 'mestre' | 'operador' | 'visitante';

export interface UserTenant extends BaseEntity {
    user_id: string;
    tenant_id: string;
    role: UserTenantRole;
    is_active: boolean;
    joined_at: string;
    last_access_at?: string;

    // Dados relacionados
    user?: User;
    tenant?: Tenant;
}

// Estendendo o User base com informações de tenant quando necessário
export interface UserTenantInfo {
    current_tenant?: Tenant;
    tenants?: UserTenant[]; // Para usuários multi-tenant
}

// ========================================
// LIMITES E USAGE
// ========================================

export interface TenantLimits {
    usuarios: {
        usado: number;
        limite: number;
        percentual: number;
    };
    obras: {
        usado: number;
        limite: number;
        percentual: number;
    };
    storage: {
        usado_mb: number;
        limite_gb: number;
        percentual: number;
    };
}

export interface TenantUsage {
    tenant_id: string;
    usuarios_ativos: number;
    obras_ativas: number;
    tarefas_total: number;
    documentos_total: number;
    storage_usado_mb: number;
    ultimo_calculo: string;
}

// ========================================
// PLANOS
// ========================================

export interface PlanDefinition {
    id: TenantPlan;
    nome: string;
    descricao: string;
    preco_mensal: number;
    preco_anual?: number;
    limite_usuarios: number;
    limite_obras: number;
    limite_storage_gb: number;

    // Features incluídas
    features: {
        modulo_financeiro: boolean;
        modulo_materiais: boolean;
        modulo_qualidade: boolean;
        relatorios_avancados: boolean;
        api_access: boolean;
        white_label: boolean;
        suporte_prioritario: boolean;
        backup_automatico: boolean;
        integracao_erp: boolean;
    };

    // Customizações
    cor: string;
    popular?: boolean;
    trial_days?: number;
}

// ========================================
// TENANT CONTEXT
// ========================================

export interface TenantContextType {
    currentTenant: Tenant | null;
    userTenants: UserTenant[];
    tenantLimits: TenantLimits | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    switchTenant: (tenantId: string) => Promise<void>;
    createTenant: (data: CreateTenantData) => Promise<Tenant>;
    updateTenant: (data: Partial<Tenant>) => Promise<void>;
    deleteTenant: (tenantId: string) => Promise<void>;

    // Convites
    inviteUser: (email: string, role: UserTenantRole, message?: string) => Promise<void>;
    acceptInvite: (token: string, userData: any) => Promise<void>;
    cancelInvite: (inviteId: string) => Promise<void>;

    // Limites
    checkLimits: () => Promise<TenantLimits>;
    canAddUser: () => boolean;
    canAddObra: () => boolean;
    canUploadFile: (sizeInMB: number) => boolean;

    // Utilidades
    hasFeature: (feature: keyof PlanDefinition['features']) => boolean;
    canManageUsers: () => boolean;
    canManageSettings: () => boolean;
}

// ========================================
// FORM DATA
// ========================================

export interface CreateTenantData {
    nome: string;
    slug: string;
    email_contato: string;
    telefone?: string;
    cnpj?: string;
    plano?: TenantPlan;
}

export interface UpdateTenantData {
    nome?: string;
    email_contato?: string;
    telefone?: string;
    endereco?: string;
    website?: string;
    configuracoes?: Partial<TenantConfiguracoes>;
}

export interface InviteUserData {
    email: string;
    role: UserTenantRole;
    message?: string;
}

// ========================================
// TENANT SETTINGS
// ========================================

export interface TenantSettingsContextType {
    configuracoes: TenantConfiguracoes | null;
    updateConfiguracoes: (config: Partial<TenantConfiguracoes>) => Promise<void>;
    resetConfiguracoes: () => Promise<void>;
    exportConfiguracoes: () => string;
    importConfiguracoes: (config: string) => Promise<void>;
}