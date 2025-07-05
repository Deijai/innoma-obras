export interface Migration {
  version: number;
  name: string;
  sql: string[];
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'Estrutura inicial do banco',
    sql: [
      // ========================================
      // TABELA DE TENANTS (EMPRESAS) - PRIMEIRA!
      // ========================================
      `CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        cnpj TEXT,
        email_contato TEXT NOT NULL,
        telefone TEXT,
        endereco TEXT,
        logo_url TEXT,
        website TEXT,
        
        -- Plano e status
        plano TEXT NOT NULL DEFAULT 'basico' 
          CHECK (plano IN ('basico', 'pro', 'enterprise', 'custom')),
        status TEXT NOT NULL DEFAULT 'trial'
          CHECK (status IN ('ativo', 'suspenso', 'cancelado', 'trial')),
        
        -- Limites por plano
        limite_usuarios INTEGER DEFAULT 10,
        limite_obras INTEGER DEFAULT 5,
        limite_storage_gb INTEGER DEFAULT 1,
        
        -- Configurações (JSON)
        configuracoes TEXT,
        
        -- Datas importantes
        trial_end_date DATETIME,
        subscription_end_date DATETIME,
        
        -- Billing
        billing_email TEXT,
        billing_address TEXT,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1
      )`,

      // ========================================
      // TABELA DE USUÁRIOS - MODIFICADA PARA MULTI-TENANT
      // ========================================
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        
        -- Perfis
        perfil TEXT NOT NULL DEFAULT 'operador' 
          CHECK (perfil IN ('admin', 'engenheiro', 'mestre', 'operador', 'visitante')),
        perfil_global TEXT DEFAULT 'user' 
          CHECK (perfil_global IN ('super_admin', 'tenant_admin', 'user')),
        
        -- Flags importantes
        is_tenant_owner INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        
        -- Metadados
        avatar_url TEXT,
        empresa TEXT, -- Mantido para compatibilidade
        last_login_at DATETIME,
        email_verified INTEGER DEFAULT 0,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        
        -- Índices únicos
        UNIQUE(tenant_id, email) -- Email único POR EMPRESA
      )`,

      // ========================================
      // TABELA DE CONVITES
      // ========================================
      `CREATE TABLE IF NOT EXISTS convites_tenant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL,
        email TEXT NOT NULL,
        perfil_tenant TEXT NOT NULL
          CHECK (perfil_tenant IN ('admin', 'engenheiro', 'mestre', 'operador', 'visitante')),
        token TEXT UNIQUE NOT NULL,
        enviado_por TEXT NOT NULL,
        data_expiracao DATETIME NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente'
          CHECK (status IN ('pendente', 'aceito', 'expirado', 'cancelado')),
        mensagem TEXT,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (enviado_por) REFERENCES usuarios(uuid),
        
        -- Índices
        UNIQUE(tenant_id, email, status) -- Evitar convites duplicados
      )`,

      // ========================================
      // TABELA DE OBRAS - MODIFICADA PARA MULTI-TENANT
      // ========================================
      `CREATE TABLE IF NOT EXISTS obras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        nome TEXT NOT NULL,
        descricao TEXT,
        endereco TEXT,
        latitude REAL,
        longitude REAL,
        data_inicio DATE,
        data_prevista_fim DATE,
        data_real_fim DATE,
        status TEXT NOT NULL DEFAULT 'planejamento' 
          CHECK (status IN ('planejamento', 'iniciada', 'pausada', 'concluida', 'cancelada')),
        orcamento_total REAL DEFAULT 0,
        custo_atual REAL DEFAULT 0,
        progresso_percentual REAL DEFAULT 0,
        responsavel_id TEXT,
        cliente TEXT,
        contrato TEXT,
        observacoes TEXT,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(uuid)
      )`,

      // ========================================
      // TABELA DE EQUIPE POR OBRA - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS equipe_obras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL, -- 🔑 REDUNDANTE MAS GARANTE ISOLAMENTO
        obra_id TEXT NOT NULL,
        usuario_id TEXT NOT NULL,
        perfil_na_obra TEXT NOT NULL 
          CHECK (perfil_na_obra IN ('responsavel', 'engenheiro', 'mestre', 'operador', 'visitante')),
        data_entrada DATE NOT NULL,
        data_saida DATE,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(uuid) ON DELETE CASCADE,
        
        -- Índices únicos
        UNIQUE(obra_id, usuario_id)
      )`,

      // ========================================
      // TABELA DE CRONOGRAMA/ETAPAS - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS cronograma (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        obra_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        descricao TEXT,
        data_inicio_planejada DATE,
        data_fim_planejada DATE,
        data_inicio_real DATE,
        data_fim_real DATE,
        duracao_planejada_dias INTEGER,
        duracao_real_dias INTEGER,
        status TEXT NOT NULL DEFAULT 'pendente'
          CHECK (status IN ('pendente', 'iniciada', 'pausada', 'concluida', 'atrasada')),
        progresso_percentual REAL DEFAULT 0,
        ordem INTEGER NOT NULL,
        etapa_pai_id TEXT,
        cor TEXT DEFAULT '#3B82F6',
        observacoes TEXT,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid) ON DELETE CASCADE,
        FOREIGN KEY (etapa_pai_id) REFERENCES cronograma(uuid)
      )`,

      // ========================================
      // TABELA DE TAREFAS - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        obra_id TEXT NOT NULL,
        etapa_id TEXT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        status TEXT NOT NULL DEFAULT 'pendente'
          CHECK (status IN ('pendente', 'iniciada', 'pausada', 'concluida', 'cancelada')),
        prioridade TEXT NOT NULL DEFAULT 'media'
          CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
        responsavel_id TEXT,
        data_criacao DATE NOT NULL,
        data_inicio_planejada DATE,
        data_fim_planejada DATE,
        data_inicio_real DATE,
        data_fim_real DATE,
        tempo_estimado_horas REAL,
        tempo_gasto_horas REAL DEFAULT 0,
        progresso_percentual REAL DEFAULT 0,
        localizacao TEXT,
        observacoes TEXT,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid) ON DELETE CASCADE,
        FOREIGN KEY (etapa_id) REFERENCES cronograma(uuid),
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(uuid)
      )`,

      // ========================================
      // TABELA DE DIÁRIO DE OBRA - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS diarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        obra_id TEXT NOT NULL,
        data_registro DATE NOT NULL,
        turno TEXT NOT NULL DEFAULT 'manha'
          CHECK (turno IN ('manha', 'tarde', 'noite', 'madrugada')),
        clima TEXT,
        temperatura REAL,
        atividades_realizadas TEXT NOT NULL,
        equipamentos_utilizados TEXT,
        materiais_utilizados TEXT,
        mao_de_obra_presente TEXT,
        problemas_encontrados TEXT,
        observacoes TEXT,
        fotos_anexas TEXT, -- JSON array de URLs/paths
        audio_anexo TEXT,
        latitude REAL,
        longitude REAL,
        registrado_por TEXT NOT NULL,
        aprovado_por TEXT,
        status_aprovacao TEXT DEFAULT 'pendente'
          CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid) ON DELETE CASCADE,
        FOREIGN KEY (registrado_por) REFERENCES usuarios(uuid),
        FOREIGN KEY (aprovado_por) REFERENCES usuarios(uuid)
      )`,

      // ========================================
      // TABELA DE MATERIAIS - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS materiais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        obra_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        descricao TEXT,
        categoria TEXT,
        unidade_medida TEXT NOT NULL,
        quantidade_estoque REAL DEFAULT 0,
        quantidade_minima REAL DEFAULT 0,
        preco_unitario REAL DEFAULT 0,
        fornecedor TEXT,
        codigo_fornecedor TEXT,
        observacoes TEXT,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid) ON DELETE CASCADE
      )`,

      // ========================================
      // TABELA DE MOVIMENTAÇÕES DE MATERIAIS - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS movimentacoes_materiais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        material_id TEXT NOT NULL,
        tipo_movimentacao TEXT NOT NULL
          CHECK (tipo_movimentacao IN ('entrada', 'saida', 'ajuste', 'transferencia')),
        quantidade REAL NOT NULL,
        valor_unitario REAL,
        valor_total REAL,
        data_movimentacao DATETIME NOT NULL,
        responsavel_id TEXT NOT NULL,
        documento_referencia TEXT,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materiais(uuid) ON DELETE CASCADE,
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(uuid)
      )`,

      // ========================================
      // TABELA DE DOCUMENTOS - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS documentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        obra_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        descricao TEXT,
        tipo TEXT NOT NULL
          CHECK (tipo IN ('projeto', 'licenca', 'contrato', 'nota_fiscal', 'foto', 'video', 'audio', 'outro')),
        categoria TEXT,
        arquivo_path TEXT NOT NULL,
        arquivo_nome TEXT NOT NULL,
        arquivo_tamanho INTEGER,
        arquivo_tipo TEXT, -- MIME type
        tags TEXT, -- JSON array
        is_publico INTEGER DEFAULT 0,
        uploaded_by TEXT NOT NULL,
        data_upload DATETIME NOT NULL,
        data_validade DATE,
        versao INTEGER DEFAULT 1,
        documento_pai_id TEXT,
        observacoes TEXT,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES usuarios(uuid),
        FOREIGN KEY (documento_pai_id) REFERENCES documentos(uuid)
      )`,

      // ========================================
      // TABELA DE CONTROLE DE QUALIDADE - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS checklist_qualidade (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        obra_id TEXT NOT NULL,
        etapa_id TEXT,
        nome TEXT NOT NULL,
        descricao TEXT,
        itens_checklist TEXT NOT NULL, -- JSON array de itens
        responsavel_verificacao TEXT,
        responsavel_aprovacao TEXT,
        data_verificacao DATETIME,
        data_aprovacao DATETIME,
        status TEXT NOT NULL DEFAULT 'pendente'
          CHECK (status IN ('pendente', 'em_verificacao', 'aprovado', 'reprovado', 'corrigido')),
        observacoes TEXT,
        fotos_evidencia TEXT, -- JSON array de URLs/paths
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid) ON DELETE CASCADE,
        FOREIGN KEY (etapa_id) REFERENCES cronograma(uuid),
        FOREIGN KEY (responsavel_verificacao) REFERENCES usuarios(uuid),
        FOREIGN KEY (responsavel_aprovacao) REFERENCES usuarios(uuid)
      )`,

      // ========================================
      // TABELA DE CUSTOS - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS custos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL, -- 🔑 CHAVE MULTI-TENANT
        obra_id TEXT NOT NULL,
        etapa_id TEXT,
        categoria TEXT NOT NULL
          CHECK (categoria IN ('material', 'mao_de_obra', 'equipamento', 'subcontratacao', 'outros')),
        subcategoria TEXT,
        descricao TEXT NOT NULL,
        valor_planejado REAL DEFAULT 0,
        valor_real REAL DEFAULT 0,
        data_planejada DATE,
        data_real DATE,
        responsavel_id TEXT,
        documento_referencia TEXT,
        aprovado_por TEXT,
        status_aprovacao TEXT DEFAULT 'pendente'
          CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
        observacoes TEXT,
        
        -- Controle
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid) ON DELETE CASCADE,
        FOREIGN KEY (etapa_id) REFERENCES cronograma(uuid),
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(uuid),
        FOREIGN KEY (aprovado_por) REFERENCES usuarios(uuid)
      )`,

      // ========================================
      // TABELA DE SINCRONIZAÇÃO - MODIFICADA
      // ========================================
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT, -- Para filtrar sync por tenant
        table_name TEXT NOT NULL,
        record_uuid TEXT NOT NULL,
        operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
        data TEXT, -- JSON dos dados
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        sync_attempts INTEGER DEFAULT 0,
        last_error TEXT
      )`,

      // ========================================
      // TABELA DE USAGE E LIMITES
      // ========================================
      `CREATE TABLE IF NOT EXISTS tenant_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT UNIQUE NOT NULL,
        usuarios_ativos INTEGER DEFAULT 0,
        obras_ativas INTEGER DEFAULT 0,
        tarefas_total INTEGER DEFAULT 0,
        documentos_total INTEGER DEFAULT 0,
        storage_usado_mb INTEGER DEFAULT 0,
        ultimo_calculo DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Relacionamentos
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )`,

      // ========================================
      // ÍNDICES OTIMIZADOS PARA MULTI-TENANT
      // ========================================

      //-- Tenants
      `CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug)`,
      `CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status)`,
      `CREATE INDEX IF NOT EXISTS idx_tenants_plano ON tenants(plano)`,

      //-- Usuários
      `CREATE INDEX IF NOT EXISTS idx_usuarios_tenant ON usuarios(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_usuarios_email_tenant ON usuarios(tenant_id, email)`,
      `CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(tenant_id, perfil_tenant)`,

      //-- Convites
      `CREATE INDEX IF NOT EXISTS idx_convites_tenant ON convites_tenant(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_convites_token ON convites_tenant(token)`,
      `CREATE INDEX IF NOT EXISTS idx_convites_status ON convites_tenant(tenant_id, status)`,

      //-- Obras
      `CREATE INDEX IF NOT EXISTS idx_obras_tenant ON obras(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_obras_status_tenant ON obras(tenant_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_obras_responsavel_tenant ON obras(tenant_id, responsavel_id)`,

      //-- Tarefas
      `CREATE INDEX IF NOT EXISTS idx_tarefas_tenant ON tarefas(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tarefas_obra_tenant ON tarefas(tenant_id, obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel_tenant ON tarefas(tenant_id, responsavel_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tarefas_status_tenant ON tarefas(tenant_id, status)`,

      //-- Diários
      `CREATE INDEX IF NOT EXISTS idx_diarios_tenant ON diarios(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_diarios_obra_data_tenant ON diarios(tenant_id, obra_id, data_registro)`,

      //-- Outros
      `CREATE INDEX IF NOT EXISTS idx_equipe_tenant ON equipe_obras(tenant_id, obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_materiais_tenant ON materiais(tenant_id, obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_documentos_tenant ON documentos(tenant_id, obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cronograma_tenant ON cronograma(tenant_id, obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_custos_tenant ON custos(tenant_id, obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_tenant ON sync_queue(tenant_id, synced_at)`,
    ],
  },
];

export default migrations;