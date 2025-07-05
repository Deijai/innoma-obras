// src/services/database/sqlite.ts
import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

const DATABASE_NAME = 'innoma_obras.db';
const DATABASE_VERSION = 1;

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Inicializa o banco de dados SQLite
 */
export async function initializeDatabase(): Promise<void> {
    try {
        console.log('🚀 Inicializando banco de dados...');

        // Abrir/criar banco de dados
        database = await SQLite.openDatabaseAsync(DATABASE_NAME);

        // Verificar se o banco está funcionando
        await testDatabaseConnection();

        // Executar migrações
        await runMigrations();

        console.log('✅ Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        throw error;
    }
}

/**
 * Testa a conexão com o banco de dados
 */
async function testDatabaseConnection(): Promise<void> {
    try {
        const db = getDatabase();
        const result: any = await db.getAllAsync('SELECT 1 as test');
        if (result.length === 0 || result[0].test !== 1) {
            throw new Error('Teste de conexão com banco falhou');
        }
        console.log('🔌 Conexão com banco de dados verificada');
    } catch (error) {
        console.error('❌ Erro na conexão com banco:', error);
        throw error;
    }
}

/**
 * Retorna a instância do banco de dados
 */
export function getDatabase(): SQLite.SQLiteDatabase {
    if (!database) {
        throw new Error('Banco de dados não foi inicializado. Chame initializeDatabase() primeiro.');
    }
    return database;
}

/**
 * Executa uma query SQL
 */
export async function executeQuery(
    sql: string,
    params: any[] = []
): Promise<SQLite.SQLiteRunResult> {
    try {
        const db = getDatabase();
        const result = await db.runAsync(sql, params);
        console.log(`📝 Query executada: ${sql.substring(0, 50)}...`, {
            params: params.length > 0 ? params : 'sem parâmetros',
            changes: result.changes
        });
        return result;
    } catch (error) {
        console.error('❌ Erro na query SQL:', {
            sql: sql.substring(0, 100),
            params,
            error: error instanceof Error ? error.message : error
        });
        throw error;
    }
}

/**
 * Executa uma query SELECT e retorna os resultados
 */
export async function executeSelectQuery(
    sql: string,
    params: any[] = []
): Promise<any[]> {
    try {
        const db = getDatabase();
        const result = await db.getAllAsync(sql, params);
        console.log(`🔍 Select executado: ${sql.substring(0, 50)}...`, {
            params: params.length > 0 ? params : 'sem parâmetros',
            rows: result.length
        });
        return result;
    } catch (error) {
        console.error('❌ Erro na query SELECT:', {
            sql: sql.substring(0, 100),
            params,
            error: error instanceof Error ? error.message : error
        });
        throw error;
    }
}

/**
 * Executa múltiplas queries em uma transação
 */
export async function executeTransaction(
    queries: Array<{ sql: string; params?: any[] }>
): Promise<any[]> {
    try {
        const db = getDatabase();
        const results: any[] = [];

        await db.withTransactionAsync(async () => {
            for (const query of queries) {
                const result = await db.runAsync(query.sql, query.params || []);
                results.push(result);
            }
        });

        console.log(`📦 Transação executada com ${queries.length} queries`);
        return results;
    } catch (error) {
        console.error('❌ Erro na transação:', error);
        throw error;
    }
}

/**
 * Executa as migrações do banco de dados de forma segura
 */
async function runMigrations(): Promise<void> {
    try {
        console.log('🔄 Executando migrações...');

        // Criar tabela de versões se não existir
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS schema_versions (
                version INTEGER PRIMARY KEY,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Verificar versão atual
        const versionResult = await executeSelectQuery(
            'SELECT MAX(version) as current_version FROM schema_versions'
        );

        const currentVersion = versionResult[0]?.current_version || 0;
        console.log(`📊 Versão atual do schema: ${currentVersion}`);

        // Executar migrações pendentes
        for (const migration of migrations) {
            if (migration.version > currentVersion) {
                console.log(`📝 Aplicando migração ${migration.version}: ${migration.name}`);

                try {
                    // Executar cada SQL da migração de forma individual
                    for (let i = 0; i < migration.sql.length; i++) {
                        const sql = migration.sql[i];
                        try {
                            await executeQuery(sql);
                            console.log(`   ✅ SQL ${i + 1}/${migration.sql.length} executado`);
                        } catch (sqlError) {
                            // Se for erro de "already exists", apenas avisar e continuar
                            if (sqlError instanceof Error &&
                                (sqlError.message.includes('already exists') ||
                                    sqlError.message.includes('duplicate column name'))) {
                                console.log(`   ⚠️ SQL ${i + 1}: ${sqlError.message} (ignorado)`);
                                continue;
                            }
                            throw sqlError;
                        }
                    }

                    // Registrar migração aplicada
                    await executeQuery(
                        'INSERT INTO schema_versions (version) VALUES (?)',
                        [migration.version]
                    );

                    console.log(`✅ Migração ${migration.version} aplicada com sucesso`);
                } catch (migrationError) {
                    console.error(`❌ Erro na migração ${migration.version}:`, migrationError);

                    // Se a migração já foi parcialmente aplicada, tentar registrá-la
                    try {
                        await executeQuery(
                            'INSERT OR IGNORE INTO schema_versions (version) VALUES (?)',
                            [migration.version]
                        );
                        console.log(`⚠️ Migração ${migration.version} marcada como aplicada após erro`);
                    } catch (registerError) {
                        console.error(`❌ Erro ao registrar migração ${migration.version}:`, registerError);
                    }

                    // Não parar o processo, apenas reportar
                    console.log(`⚠️ Continuando com outras migrações...`);
                }
            } else {
                console.log(`⏭️ Migração ${migration.version} já aplicada`);
            }
        }

        // Verificar integridade das tabelas principais
        await verifyDatabaseIntegrity();

        console.log('✅ Todas as migrações foram processadas');
    } catch (error) {
        console.error('❌ Erro ao executar migrações:', error);
        throw error;
    }
}

/**
 * Verifica a integridade das tabelas principais
 */
async function verifyDatabaseIntegrity(): Promise<void> {
    try {
        const essentialTables = ['usuarios', 'obras', 'tarefas', 'diarios', 'sync_queue'];

        for (const tableName of essentialTables) {
            const exists = await tableExists(tableName);
            if (exists) {
                console.log(`✅ Tabela ${tableName} verificada`);
            } else {
                console.warn(`⚠️ Tabela ${tableName} não encontrada`);
            }
        }
    } catch (error) {
        console.error('❌ Erro na verificação de integridade:', error);
    }
}

/**
 * Limpa todos os dados do banco (útil para desenvolvimento/testes)
 */
export async function clearDatabase(): Promise<void> {
    try {
        console.log('🗑️ Limpando banco de dados...');

        const tables = [
            'usuarios', 'obras', 'tarefas', 'diarios', 'equipe_obras',
            'materiais', 'movimentacoes_materiais', 'documentos',
            'checklist_qualidade', 'cronograma', 'custos', 'sync_queue'
        ];

        for (const table of tables) {
            try {
                await executeQuery(`DELETE FROM ${table}`);
                console.log(`🗑️ Tabela ${table} limpa`);
            } catch (error) {
                console.warn(`⚠️ Erro ao limpar tabela ${table}:`, error);
            }
        }

        // Limpar versões de schema para forçar re-execução das migrações
        try {
            await executeQuery('DELETE FROM schema_versions');
            console.log('🗑️ Versões de schema limpas');
        } catch (error) {
            console.warn('⚠️ Erro ao limpar schema_versions:', error);
        }

        console.log('✅ Banco de dados limpo com sucesso');
    } catch (error) {
        console.error('❌ Erro ao limpar banco de dados:', error);
        throw error;
    }
}

/**
 * Fecha a conexão com o banco de dados
 */
export async function closeDatabase(): Promise<void> {
    try {
        if (database) {
            await database.closeAsync();
            database = null;
            console.log('📌 Conexão com banco de dados fechada');
        }
    } catch (error) {
        console.error('❌ Erro ao fechar banco:', error);
    }
}

/**
 * Backup dos dados em JSON (para desenvolvimento)
 */
export async function exportData(): Promise<any> {
    try {
        const data: any = {};

        const tables = [
            'usuarios', 'obras', 'tarefas', 'diarios', 'equipe_obras',
            'materiais', 'movimentacoes_materiais', 'documentos',
            'checklist_qualidade', 'cronograma', 'custos'
        ];

        for (const table of tables) {
            try {
                data[table] = await executeSelectQuery(`SELECT * FROM ${table}`);
            } catch (error) {
                console.warn(`⚠️ Erro ao exportar tabela ${table}:`, error);
                data[table] = [];
            }
        }

        return data;
    } catch (error) {
        console.error('❌ Erro ao exportar dados:', error);
        throw error;
    }
}

/**
 * Utilitário para verificar se uma tabela existe
 */
export async function tableExists(tableName: string): Promise<boolean> {
    try {
        const result = await executeSelectQuery(
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
            [tableName]
        );
        return result.length > 0;
    } catch (error) {
        console.error(`❌ Erro ao verificar tabela ${tableName}:`, error);
        return false;
    }
}

/**
 * Utilitário para contar registros em uma tabela
 */
export async function countRecords(tableName: string): Promise<number> {
    try {
        const exists = await tableExists(tableName);
        if (!exists) {
            return 0;
        }

        const result = await executeSelectQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
        return result[0]?.count || 0;
    } catch (error) {
        console.error(`❌ Erro ao contar registros em ${tableName}:`, error);
        return 0;
    }
}

/**
 * Utilitário para debug - listar todas as tabelas
 */
export async function listTables(): Promise<string[]> {
    try {
        const result = await executeSelectQuery(
            `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
        );
        return result.map(row => row.name);
    } catch (error) {
        console.error('❌ Erro ao listar tabelas:', error);
        return [];
    }
}

/**
 * Utilitário para debug - obter informações do banco
 */
export async function getDatabaseInfo(): Promise<any> {
    try {
        const tables = await listTables();
        const info: any = {
            tables: {},
            totalTables: tables.length,
        };

        for (const table of tables) {
            const count = await countRecords(table);
            info.tables[table] = count;
        }

        return info;
    } catch (error) {
        console.error('❌ Erro ao obter informações do banco:', error);
        return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
}