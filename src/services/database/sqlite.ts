import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

const DATABASE_NAME = 'innoma_obras.db';
const DATABASE_VERSION = 1;

let database: SQLite.WebSQLDatabase | null = null;

/**
 * Inicializa o banco de dados SQLite
 */
export async function initializeDatabase(): Promise<void> {
    try {
        console.log('🚀 Inicializando banco de dados...');

        database = SQLite.openDatabase(DATABASE_NAME);

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
export function getDatabase(): SQLite.WebSQLDatabase {
    if (!database) {
        throw new Error('Banco de dados não foi inicializado. Chame initializeDatabase() primeiro.');
    }
    return database;
}

/**
 * Executa uma query SQL
 */
export function executeQuery(
    sql: string,
    params: any[] = []
): Promise<SQLite.SQLResultSet> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
        db.transaction(
            (tx) => {
                tx.executeSql(
                    sql,
                    params,
                    (_, result) => resolve(result),
                    (_, error) => {
                        console.error('Erro na query SQL:', { sql, params, error });
                        reject(error);
                        return false;
                    }
                );
            },
            (error) => {
                console.error('Erro na transação SQL:', error);
                reject(error);
            }
        );
    });
}

/**
 * Executa múltiplas queries em uma transação
 */
export function executeTransaction(
    queries: Array<{ sql: string; params?: any[] }>
): Promise<SQLite.SQLResultSet[]> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
        const results: SQLite.SQLResultSet[] = [];

        db.transaction(
            (tx) => {
                queries.forEach(({ sql, params = [] }, index) => {
                    tx.executeSql(
                        sql,
                        params,
                        (_, result) => {
                            results[index] = result;
                            if (results.length === queries.length) {
                                resolve(results);
                            }
                        },
                        (_, error) => {
                            console.error('Erro na query da transação:', { sql, params, error });
                            reject(error);
                            return false;
                        }
                    );
                });
            },
            (error) => {
                console.error('Erro na transação:', error);
                reject(error);
            }
        );
    });
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
        const versionResult = await executeQuery(
            'SELECT MAX(version) as current_version FROM schema_versions'
        );

        const currentVersion = versionResult.rows.item(0)?.current_version || 0;

        // Executar migrações pendentes
        for (const migration of migrations) {
            if (migration.version > currentVersion) {
                console.log(`📝 Aplicando migração ${migration.version}: ${migration.name}`);

                await executeTransaction(migration.sql.map(sql => ({ sql })));

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

        for (const table of tables) {
            await executeQuery(`DELETE FROM ${table}`);
        }

        await executeQuery('DELETE FROM schema_versions');

        console.log('✅ Banco de dados limpo com sucesso');
    } catch (error) {
        console.error('❌ Erro ao limpar banco de dados:', error);
        throw error;
    }
}

/**
 * Fecha a conexão com o banco de dados
 */
export function closeDatabase(): void {
    if (database) {
        // SQLite do Expo não possui método close explícito
        database = null;
        console.log('📌 Conexão com banco de dados fechada');
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
            const result = await executeQuery(`SELECT * FROM ${table}`);
            data[table] = [];

            for (let i = 0; i < result.rows.length; i++) {
                data[table].push(result.rows.item(i));
            }
        }

        return data;
    } catch (error) {
        console.error('❌ Erro ao exportar dados:', error);
        throw error;
    }
}

/**
 * Utilitário para log de queries em desenvolvimento
 */
export function enableQueryLogging(): void {
    if (__DEV__) {
        const originalExecuteQuery = executeQuery;

        (global as any).executeQuery = (sql: string, params: any[] = []) => {
            console.log('🔍 SQL Query:', { sql, params });
            return originalExecuteQuery(sql, params);
        };
    }
}