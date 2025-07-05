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
      // Tabela de usuários
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefone TEXT,
        perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'engenheiro', 'mestre', 'operador', 'visitante')),
        avatar_url TEXT,
        empresa TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1
      )`,

      // Tabela de obras
      `CREATE TABLE IF NOT EXISTS obras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(uuid)
      )`,

      // Tabela de equipe por obra
      `CREATE TABLE IF NOT EXISTS equipe_obras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        obra_id TEXT NOT NULL,
        usuario_id TEXT NOT NULL,
        perfil_na_obra TEXT NOT NULL 
          CHECK (perfil_na_obra IN ('responsavel', 'engenheiro', 'mestre', 'operador', 'visitante')),
        data_entrada DATE NOT NULL,
        data_saida DATE,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(uuid),
        UNIQUE(obra_id, usuario_id)
      )`,

      // Tabela de cronograma/etapas
      `CREATE TABLE IF NOT EXISTS cronograma (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid),
        FOREIGN KEY (etapa_pai_id) REFERENCES cronograma(uuid)
      )`,

      // Tabela de tarefas
      `CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid),
        FOREIGN KEY (etapa_id) REFERENCES cronograma(uuid),
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(uuid)
      )`,

      // Tabela de diário de obra
      `CREATE TABLE IF NOT EXISTS diarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid),
        FOREIGN KEY (registrado_por) REFERENCES usuarios(uuid),
        FOREIGN KEY (aprovado_por) REFERENCES usuarios(uuid)
      )`,

      // Tabela de materiais
      `CREATE TABLE IF NOT EXISTS materiais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid)
      )`,

      // Tabela de movimentações de materiais
      `CREATE TABLE IF NOT EXISTS movimentacoes_materiais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        FOREIGN KEY (material_id) REFERENCES materiais(uuid),
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(uuid)
      )`,

      // Tabela de documentos
      `CREATE TABLE IF NOT EXISTS documentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid),
        FOREIGN KEY (uploaded_by) REFERENCES usuarios(uuid),
        FOREIGN KEY (documento_pai_id) REFERENCES documentos(uuid)
      )`,

      // Tabela de controle de qualidade/checklists
      `CREATE TABLE IF NOT EXISTS checklist_qualidade (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid),
        FOREIGN KEY (etapa_id) REFERENCES cronograma(uuid),
        FOREIGN KEY (responsavel_verificacao) REFERENCES usuarios(uuid),
        FOREIGN KEY (responsavel_aprovacao) REFERENCES usuarios(uuid)
      )`,

      // Tabela de custos
      `CREATE TABLE IF NOT EXISTS custos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (obra_id) REFERENCES obras(uuid),
        FOREIGN KEY (etapa_id) REFERENCES cronograma(uuid),
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(uuid),
        FOREIGN KEY (aprovado_por) REFERENCES usuarios(uuid)
      )`,

      // Tabela de sincronização
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_uuid TEXT NOT NULL,
        operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
        data TEXT, -- JSON dos dados
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        sync_attempts INTEGER DEFAULT 0,
        last_error TEXT
      )`,

      // Índices para performance (usando CREATE INDEX IF NOT EXISTS)
      `CREATE INDEX IF NOT EXISTS idx_obras_status ON obras(status)`,
      `CREATE INDEX IF NOT EXISTS idx_obras_responsavel ON obras(responsavel_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tarefas_obra ON tarefas(obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas(responsavel_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status)`,
      `CREATE INDEX IF NOT EXISTS idx_diarios_obra_data ON diarios(obra_id, data_registro)`,
      `CREATE INDEX IF NOT EXISTS idx_equipe_obra ON equipe_obras(obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_materiais_obra ON materiais(obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_documentos_obra ON documentos(obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cronograma_obra ON cronograma(obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_custos_obra ON custos(obra_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced_at)`,
    ],
  },
];

export default migrations;