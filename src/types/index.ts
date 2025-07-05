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
// USUÁRIO E AUTENTICAÇÃO
// ========================================

export type UserProfile = 'admin' | 'engenheiro' | 'mestre' | 'operador' | 'visitante';

export interface User extends BaseEntity {
    nome: string;
    email: string;
    telefone?: string;
    perfil: UserProfile;
    avatar_url?: string;
    empresa?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

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
// OBRA
// ========================================

export type ObraStatus = 'planejamento' | 'iniciada' | 'pausada' | 'concluida' | 'cancelada';

export interface Obra extends BaseEntity {
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

    // Dados calculados/relacionados
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
    obra_id: UUID;
    usuario_id: UUID;
    perfil_na_obra: PerfilNaObra;
    data_entrada: DateString;
    data_saida?: DateString;

    // Dados relacionados
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

    // Dados relacionados
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

    // Dados relacionados
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

    // Dados relacionados
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
// MATERIAIS E ESTOQUE
// ========================================

export interface Material extends BaseEntity {
    obra_id: UUID;
    nome: string;
    descricao?: string;
    categoria?: string;
    unidade_medida: string;
    quantidade_estoque: number;
    quantidade_minima: number;
    preco_unitario: number;
    fornecedor?: string;
    codigo_fornecedor?: string;
    observacoes?: string;

    // Dados relacionados
    obra?: Obra;
    movimentacoes?: MovimentacaoMaterial[];
}

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste' | 'transferencia';

export interface MovimentacaoMaterial extends BaseEntity {
    material_id: UUID;
    tipo_movimentacao: TipoMovimentacao;
    quantidade: number;
    valor_unitario?: number;
    valor_total?: number;
    data_movimentacao: DateString;
    responsavel_id: UUID;
    documento_referencia?: string;
    observacoes?: string;

    // Dados relacionados
    material?: Material;
    responsavel?: User;
}

// ========================================
// DOCUMENTOS
// ========================================

export type TipoDocumento = 'projeto' | 'licenca' | 'contrato' | 'nota_fiscal' | 'foto' | 'video' | 'audio' | 'outro';

export interface Documento extends BaseEntity {
    obra_id: UUID;
    nome: string;
    descricao?: string;
    tipo: TipoDocumento;
    categoria?: string;
    arquivo_path: string;
    arquivo_nome: string;
    arquivo_tamanho?: number;
    arquivo_tipo?: string; // MIME type
    tags?: string[];
    is_publico: boolean;
    uploaded_by: UUID;
    data_upload: DateString;
    data_validade?: DateString;
    versao: number;
    documento_pai_id?: UUID;
    observacoes?: string;

    // Dados relacionados
    obra?: Obra;
    uploaded_by_usuario?: User;
    documento_pai?: Documento;
    versoes?: Documento[];
}

// ========================================
// CONTROLE DE QUALIDADE
// ========================================

export interface ItemChecklist {
    id: string;
    nome: string;
    descricao?: string;
    obrigatorio: boolean;
    tipo: 'boolean' | 'text' | 'number' | 'photo' | 'select';
    opcoes?: string[]; // Para tipo select
    valor?: any;
    conforme?: boolean;
    observacoes?: string;
    fotos?: string[];
}

export type StatusQualidade = 'pendente' | 'em_verificacao' | 'aprovado' | 'reprovado' | 'corrigido';

export interface ChecklistQualidade extends BaseEntity {
    obra_id: UUID;
    etapa_id?: UUID;
    nome: string;
    descricao?: string;
    itens_checklist: ItemChecklist[];
    responsavel_verificacao?: UUID;
    responsavel_aprovacao?: UUID;
    data_verificacao?: DateString;
    data_aprovacao?: DateString;
    status: StatusQualidade;
    observacoes?: string;
    fotos_evidencia?: string[];

    // Dados relacionados
    obra?: Obra;
    etapa?: CronogramaEtapa;
    responsavel_verificacao_usuario?: User;
    responsavel_aprovacao_usuario?: User;
}

// ========================================
// CUSTOS E FINANCEIRO
// ========================================

export type CategoriaCusto = 'material' | 'mao_de_obra' | 'equipamento' | 'subcontratacao' | 'outros';

export interface Custo extends BaseEntity {
    obra_id: UUID;
    etapa_id?: UUID;
    categoria: CategoriaCusto;
    subcategoria?: string;
    descricao: string;
    valor_planejado: number;
    valor_real: number;
    data_planejada?: DateString;
    data_real?: DateString;
    responsavel_id?: UUID;
    documento_referencia?: string;
    aprovado_por?: UUID;
    status_aprovacao: StatusAprovacao;
    observacoes?: string;

    // Dados relacionados
    obra?: Obra;
    etapa?: CronogramaEtapa;
    responsavel?: User;
    aprovado_por_usuario?: User;
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
// EXPORTS
// ========================================

export * from './api';
export * from './auth';
export * from './navigation';
export * from './obra';
