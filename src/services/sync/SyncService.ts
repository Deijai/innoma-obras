import type { SyncQueueItem, SyncStatus } from '@/types';
import { executeQuery } from '../database/sqlite';
import { NetworkService } from '../network/NetworkService';
import { SecureStorage } from '../storage/SecureStorage';

export class SyncService {
    private static instance: SyncService;
    private syncInterval: any//NodeJS.Timeout | null = null;
    private isSyncing = false;
    private syncStatus: SyncStatus = {
        isOnline: false,
        pendingItems: 0,
        isSyncing: false,
        errors: [],
    };

    static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    /**
     * Inicia sincronização periódica
     */
    async startPeriodicSync(intervalMinutes: number = 5): Promise<void> {
        console.log('🔄 Iniciando sincronização periódica...');

        // Parar intervalo anterior se existir
        this.stopPeriodicSync();

        // Sincronização inicial
        await this.performSync();

        // Configurar intervalo
        this.syncInterval = setInterval(async () => {
            await this.performSync();
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Para sincronização periódica
     */
    stopPeriodicSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Sincronização periódica parada');
        }
    }

    /**
     * Executa sincronização manual
     */
    async performSync(): Promise<SyncStatus> {
        if (this.isSyncing) {
            console.log('⚠️ Sincronização já em andamento');
            return this.syncStatus;
        }

        try {
            this.isSyncing = true;
            this.syncStatus.isSyncing = true;
            this.syncStatus.errors = [];

            // Verificar conectividade
            const isOnline = await NetworkService.isConnected();
            this.syncStatus.isOnline = isOnline;

            if (!isOnline) {
                console.log('📱 Offline - sincronização adiada');
                return this.syncStatus;
            }

            console.log('🌐 Online - iniciando sincronização');

            // Contar itens pendentes
            const pendingCount = await this.getPendingItemsCount();
            this.syncStatus.pendingItems = pendingCount;

            if (pendingCount === 0) {
                console.log('✅ Nenhum item pendente para sincronizar');
                this.syncStatus.lastSync = new Date().toISOString();
                await SecureStorage.setItem('last_sync', this.syncStatus.lastSync);
                return this.syncStatus;
            }

            console.log(`📊 ${pendingCount} itens pendentes para sincronização`);

            // Processar queue de sincronização
            await this.processSyncQueue();

            // Atualizar timestamp da última sincronização
            this.syncStatus.lastSync = new Date().toISOString();
            await SecureStorage.setItem('last_sync', this.syncStatus.lastSync);

            console.log('✅ Sincronização concluída');

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            this.syncStatus.errors.push(error instanceof Error ? error.message : 'Erro desconhecido');
        } finally {
            this.isSyncing = false;
            this.syncStatus.isSyncing = false;

            // Atualizar contagem final
            this.syncStatus.pendingItems = await this.getPendingItemsCount();
        }

        return this.syncStatus;
    }

    /**
     * Adiciona item à queue de sincronização
     */
    async addToSyncQueue(
        tableName: string,
        recordUuid: string,
        operation: 'INSERT' | 'UPDATE' | 'DELETE',
        data?: any
    ): Promise<void> {
        try {
            await executeQuery(
                `INSERT INTO sync_queue (table_name, record_uuid, operation, data, created_at)
         VALUES (?, ?, ?, ?, ?)`,
                [
                    tableName,
                    recordUuid,
                    operation,
                    data ? JSON.stringify(data) : null,
                    new Date().toISOString(),
                ]
            );

            console.log(`📝 Item adicionado à queue: ${tableName}/${recordUuid} - ${operation}`);
        } catch (error) {
            console.error('Erro ao adicionar à queue de sync:', error);
            throw error;
        }
    }

    /**
     * Processa queue de sincronização
     */
    private async processSyncQueue(): Promise<void> {
        try {
            // Buscar itens pendentes (máximo 50 por vez)
            const result = await executeQuery(
                `SELECT * FROM sync_queue 
         WHERE synced_at IS NULL 
         ORDER BY created_at ASC 
         LIMIT 50`
            );

            const items: SyncQueueItem[] = [];
            for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                items.push({
                    id: row.id,
                    table_name: row.table_name,
                    record_uuid: row.record_uuid,
                    operation: row.operation,
                    data: row.data ? JSON.parse(row.data) : null,
                    created_at: row.created_at,
                    sync_attempts: row.sync_attempts || 0,
                    last_error: row.last_error,
                });
            }

            if (items.length === 0) {
                return;
            }

            console.log(`🔄 Processando ${items.length} itens da queue`);

            // Processar cada item
            for (const item of items) {
                await this.processSyncItem(item);
            }

        } catch (error) {
            console.error('Erro ao processar queue de sync:', error);
            throw error;
        }
    }

    /**
     * Processa um item individual da queue
     */
    private async processSyncItem(item: SyncQueueItem): Promise<void> {
        try {
            console.log(`📤 Sincronizando: ${item.table_name}/${item.record_uuid} - ${item.operation}`);

            // Aqui seria implementada a lógica específica para cada tabela
            // Por enquanto, vamos simular o sucesso
            const success = await this.syncItemToFirebase(item);

            if (success) {
                // Marcar como sincronizado
                await executeQuery(
                    `UPDATE sync_queue 
           SET synced_at = ?, sync_attempts = sync_attempts + 1
           WHERE id = ?`,
                    [new Date().toISOString(), item.id]
                );

                console.log(`✅ Item sincronizado: ${item.table_name}/${item.record_uuid}`);
            } else {
                throw new Error('Falha na sincronização com Firebase');
            }

        } catch (error) {
            console.error(`❌ Erro ao sincronizar item ${item.id}:`, error);

            // Incrementar tentativas e salvar erro
            await executeQuery(
                `UPDATE sync_queue 
         SET sync_attempts = sync_attempts + 1, last_error = ?
         WHERE id = ?`,
                [error instanceof Error ? error.message : 'Erro desconhecido', item.id]
            );

            // Se muitas tentativas, remover da queue (log do erro)
            if (item.sync_attempts >= 5) {
                console.error(`⚠️ Item ${item.id} removido da queue após 5 tentativas`);
                await executeQuery('DELETE FROM sync_queue WHERE id = ?', [item.id]);
            }
        }
    }

    /**
     * Sincroniza item específico com Firebase
     */
    private async syncItemToFirebase(item: SyncQueueItem): Promise<boolean> {
        try {
            // Aqui seria implementada a sincronização real com Firebase
            // Por enquanto, vamos simular sucesso

            await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay de rede

            // Simular 95% de sucesso
            return Math.random() > 0.05;

        } catch (error) {
            console.error('Erro na sincronização Firebase:', error);
            return false;
        }
    }

    /**
     * Conta itens pendentes na queue
     */
    private async getPendingItemsCount(): Promise<number> {
        try {
            const result = await executeQuery(
                'SELECT COUNT(*) as count FROM sync_queue WHERE synced_at IS NULL'
            );
            return result.rows.item(0).count || 0;
        } catch (error) {
            console.error('Erro ao contar itens pendentes:', error);
            return 0;
        }
    }

    /**
     * Obtém status atual da sincronização
     */
    async getSyncStatus(): Promise<SyncStatus> {
        try {
            const isOnline = await NetworkService.isConnected();
            const pendingItems = await this.getPendingItemsCount();
            const lastSync = await SecureStorage.getItem('last_sync');

            this.syncStatus = {
                isOnline,
                lastSync: lastSync || undefined,
                pendingItems,
                isSyncing: this.isSyncing,
                errors: this.syncStatus.errors,
            };

            return this.syncStatus;
        } catch (error) {
            console.error('Erro ao obter status de sync:', error);
            return this.syncStatus;
        }
    }

    /**
     * Limpa queue de sincronização (apenas itens antigos)
     */
    async cleanupSyncQueue(): Promise<void> {
        try {
            // Remove itens sincronizados há mais de 7 dias
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);

            await executeQuery(
                'DELETE FROM sync_queue WHERE synced_at IS NOT NULL AND synced_at < ?',
                [cutoffDate.toISOString()]
            );

            // Remove itens com mais de 10 tentativas falhas
            await executeQuery(
                'DELETE FROM sync_queue WHERE sync_attempts > 10'
            );

            console.log('🧹 Limpeza da queue de sync concluída');
        } catch (error) {
            console.error('Erro na limpeza da queue:', error);
        }
    }

    /**
     * Força sincronização de uma tabela específica
     */
    async forceSyncTable(tableName: string): Promise<void> {
        try {
            const result = await executeQuery(
                `SELECT * FROM sync_queue 
         WHERE table_name = ? AND synced_at IS NULL
         ORDER BY created_at ASC`,
                [tableName]
            );

            console.log(`🔄 Sincronização forçada para ${tableName}: ${result.rows.length} itens`);

            for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                const item: SyncQueueItem = {
                    id: row.id,
                    table_name: row.table_name,
                    record_uuid: row.record_uuid,
                    operation: row.operation,
                    data: row.data ? JSON.parse(row.data) : null,
                    created_at: row.created_at,
                    sync_attempts: row.sync_attempts || 0,
                    last_error: row.last_error,
                };

                await this.processSyncItem(item);
            }
        } catch (error) {
            console.error(`Erro na sincronização forçada de ${tableName}:`, error);
            throw error;
        }
    }
}