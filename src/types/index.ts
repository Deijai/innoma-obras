// src/types/index.ts
// ========================================
// TIPOS PRINCIPAIS - ORGANIZADOS E CORRETOS
// ========================================

import { User } from 'firebase/auth';

// ========================================
// TIPOS BASE E UTILITÁRIOS
// ========================================

export type UUID = string;
export type DateString = string; // ISO format
export type JSONString = string;

// Interface base para entidades com ID numérico (SQLite)
export interface BaseEntity {
    id: number;
    uuid: UUID;
    created_at: DateString;
    updated_at: DateString;
    synced_at?: DateString;
    is_active: boolean;
}

// Interface base para entidades com UUID como ID primário
export interface BaseUUIDEntity {
    id: string; // UUID string
    uuid: string; // Para compatibilidade
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
// RE-EXPORTAR TIPOS DE AUTENTICAÇÃO
// ========================================

export type {
    AuthConfig,
    AuthContextType,
    AuthError,
    AuthState,
    AuthTokenData,
    LoginCredentials,
    RegisterData,
    User,
    UserGlobalRole,
    UserProfile
} from './auth';

// ========================================
// OBRA
// ========================================

export type ObraStatus = 'planejamento' | 'iniciada' | 'pausada' | 'concluida' | 'cancelada';

export interface Obra extends BaseEntity {
    tenant_id: string; // 🔑 CHAVE MULTI-TENANT
    nome: string;
    descricao?: string;
    endereco?: string;
    latitude?: number;
    longitude?: number;
    data_inicio?: DateString;
    data_prevista_fim?: DateString;
    data_real_fim?: DateString;
    status: ObraStatus;
    orcamento_total: number;
    custo_atual: number;
    progresso_percentual: number;
    responsavel_id?: UUID;
    cliente?: string;
    contrato?: string;
    observacoes?: string;

    // Dados calculados/relacionados (opcional)
    responsavel?: User;
    equipe?: EquipeObra[];
    tarefas?: Tarefa[];
    etapas?: CronogramaEtapa[];
}

export interface CreateObraData {
    nome: string;
    descricao?: string;
    endereco?: string;
    data_inicio?: DateString;
    data_prevista_fim?: DateString;
    orcamento_total?: number;
    cliente?: string;
    contrato?: string;
    observacoes?: string;
}

// ========================================
// EQUIPE E PERMISSÕES
// ========================================

export type PerfilNaObra = 'responsavel' | 'engenheiro' | 'mestre' | 'operador' | 'visitante';

export interface EquipeObra extends BaseEntity {
    tenant_id: string; // 🔑 CHAVE MULTI-TENANT
    obra_id: UUID;
    usuario_id: UUID;
    perfil_na_obra: PerfilNaObra;
    data_entrada: DateString;
    data_saida?: DateString;

    // Dados relacionados (opcional)
    usuario?: User;
    obra?: Obra;
}

export interface ConviteEquipe {
    email: string;
    perfil_na_obra: PerfilNaObra;
    obra_id: UUID;
    mensagem?: string;
}

// ========================================
// CRONOGRAMA E ETAPAS
// ========================================

export type StatusEtapa = 'pendente' | 'iniciada' | 'pausada' | 'concluida' | 'atrasada';

export interface CronogramaEtapa extends BaseEntity {
    tenant_id: string; // 🔑 CHAVE MULTI-TENANT
    obra_id: UUID;
    nome: string;
    descricao?: string;
    data_inicio_planejada?: DateString;
    data_fim_planejada?: DateString;
    data_inicio_real?: DateString;
    data_fim_real?: DateString;
    duracao_planejada_dias?: number;
    duracao_real_dias?: number;
    status: StatusEtapa;
    progresso_percentual: number;
    ordem: number;
    etapa_pai_id?: UUID;
    cor: string;
    observacoes?: string;

    // Dados relacionados (opcional)
    obra?: Obra;
    etapa_pai?: CronogramaEtapa;
    sub_etapas?: CronogramaEtapa[];
    tarefas?: Tarefa[];
}

// ========================================
// TAREFAS
// ========================================

export type StatusTarefa = 'pendente' | 'iniciada' | 'pausada' | 'concluida' | 'cancelada';
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Tarefa extends BaseEntity {
    tenant_id: string; // 🔑 CHAVE MULTI-TENANT
    obra_id: UUID;
    etapa_id?: UUID;
    titulo: string;
    descricao?: string;
    status: StatusTarefa;
    prioridade: PrioridadeTarefa;
    responsavel_id?: UUID;
    data_criacao: DateString;
    data_inicio_planejada?: DateString;
    data_fim_planejada?: DateString;
    data_inicio_real?: DateString;
    data_fim_real?: DateString;
    tempo_estimado_horas?: number;
    tempo_gasto_horas: number;
    progresso_percentual: number;
    localizacao?: string;
    observacoes?: string;

    // Dados relacionados (opcional)
    obra?: Obra;
    etapa?: CronogramaEtapa;
    responsavel?: User;
}

export interface CreateTarefaData {
    titulo: string;
    descricao?: string;
    prioridade: PrioridadeTarefa;
    responsavel_id?: UUID;
    etapa_id?: UUID;
    data_inicio_planejada?: DateString;
    data_fim_planejada?: DateString;
    tempo_estimado_horas?: number;
    observacoes?: string;
}

// ========================================
// DIÁRIO DE OBRA
// ========================================

export type Turno = 'manha' | 'tarde' | 'noite' | 'madrugada';
export type StatusAprovacao = 'pendente' | 'aprovado' | 'rejeitado';

export interface DiarioObra extends BaseEntity {
    tenant_id: string; // 🔑 CHAVE MULTI-TENANT
    obra_id: UUID;
    data_registro: DateString;
    turno: Turno;
    clima?: string;
    temperatura?: number;
    atividades_realizadas: string;
    equipamentos_utilizados?: string;
    materiais_utilizados?: string;
    mao_de_obra_presente?: string;
    problemas_encontrados?: string;
    observacoes?: string;
    fotos_anexas?: string[]; // Array de URLs
    audio_anexo?: string;
    latitude?: number;
    longitude?: number;
    registrado_por: UUID;
    aprovado_por?: UUID;
    status_aprovacao: StatusAprovacao;

    // Dados relacionados (opcional)
    obra?: Obra;
    registrado_por_usuario?: User;
    aprovado_por_usuario?: User;
}

export interface CreateDiarioData {
    turno: Turno;
    clima?: string;
    temperatura?: number;
    atividades_realizadas: string;
    equipamentos_utilizados?: string;
    materiais_utilizados?: string;
    mao_de_obra_presente?: string;
    problemas_encontrados?: string;
    observacoes?: string;
    fotos?: File[];
    audio?: File;
}

// ========================================
// SINCRONIZAÇÃO
// ========================================

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncQueueItem {
    id: number;
    table_name: string;
    record_uuid: UUID;
    operation: SyncOperation;
    data?: any;
    created_at: DateString;
    synced_at?: DateString;
    sync_attempts: number;
    last_error?: string;
}

export interface SyncStatus {
    isOnline: boolean;
    lastSync?: DateString;
    pendingItems: number;
    isSyncing: boolean;
    errors: string[];
}

// ========================================
// NAVEGAÇÃO
// ========================================

export type RootStackParamList = {
    '(auth)': undefined;
    '(tabs)': undefined;
    'obra/[id]': { id: string };
    'obra/[id]/diario': { id: string };
    'obra/[id]/tarefas': { id: string };
    'obra/[id]/cronograma': { id: string };
    'obra/[id]/materiais': { id: string };
    'obra/[id]/financeiro': { id: string };
    'obra/[id]/documentos': { id: string };
    'obra/[id]/qualidade': { id: string };
    'obra/[id]/configuracoes': { id: string };
    'modal/adicionar-obra': undefined;
    'modal/adicionar-tarefa': { obra_id: string };
    'modal/registro-diario': { obra_id: string };
    'modal/upload-documento': { obra_id: string };
};

// ========================================
// API E RESPONSES
// ========================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

// ========================================
// FORMULÁRIOS E VALIDAÇÃO
// ========================================

export interface FormError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: FormError[];
}

// ========================================
// DASHBOARD E ANALYTICS
// ========================================

export interface DashboardStats {
    obras_ativas: number;
    obras_atrasadas: number;
    tarefas_pendentes: number;
    custo_total_mes: number;
    progresso_medio: number;
    eficiencia_equipe: number;
}

export interface KPI {
    nome: string;
    valor: number;
    unidade: string;
    tendencia: 'up' | 'down' | 'stable';
    variacao_percentual: number;
    meta?: number;
    cor: string;
}

// ========================================
// EXPORTS DE OUTROS ARQUIVOS
// ========================================

// Re-exportar tipos de tenant
export type {
    ConviteTenant,
    CreateTenantData, Tenant,
    TenantContextType,
    TenantLimits,
    UserTenant
} from './tenant';

