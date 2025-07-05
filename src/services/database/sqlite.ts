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

        // CORREÇÃO: Usar a nova API do Expo SQLite
        database = await SQLite.openDatabaseAsync(DATABASE_NAME);

        // Executar migrações
        await runMigrations();

        console.log('✅ Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
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

        // CORREÇÃO: Usar a nova API
        const result = await db.runAsync(sql, params);
        console.log(`📝 Query executada: ${sql}`, { params, result });

        return result;
    } catch (error) {
        console.error('❌ Erro na query SQL:', { sql, params, error });
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

        // CORREÇÃO: Usar getAllAsync para SELECT
        const result = await db.getAllAsync(sql, params);
        console.log(`🔍 Select executado: ${sql}`, { params, rows: result.length });

        return result;
    } catch (error) {
        console.error('❌ Erro na query SELECT:', { sql, params, error });
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

        // CORREÇÃO: Usar transação da nova API
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
 * Executa as migrações do banco de dados
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

        // Executar migrações pendentes
        for (const migration of migrations) {
            if (migration.version > currentVersion) {
                console.log(`📝 Aplicando migração ${migration.version}: ${migration.name}`);

                // Executar todas as queries da migração em uma transação
                const queries = migration.sql.map(sql => ({ sql }));
                await executeTransaction(queries);

                // Registrar migração aplicada
                await executeQuery(
                    'INSERT INTO schema_versions (version) VALUES (?)',
                    [migration.version]
                );

                console.log(`✅ Migração ${migration.version} aplicada com sucesso`);
            }
        }

        console.log('✅ Todas as migrações foram aplicadas');
    } catch (error) {
        console.error('❌ Erro ao executar migrações:', error);
        throw error;
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

        const queries = tables.map(table => ({ sql: `DELETE FROM ${table}` }));
        queries.push({ sql: 'DELETE FROM schema_versions' });

        await executeTransaction(queries);

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
            data[table] = await executeSelectQuery(`SELECT * FROM ${table}`);
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