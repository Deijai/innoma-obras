import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export interface NetworkStatus {
    isConnected: boolean;
    isInternetReachable: boolean;
    type: NetInfoStateType;
    isWifiEnabled: boolean;
    isCellularEnabled: boolean;
    strength?: number;
}

export class NetworkService {
    private static instance: NetworkService;
    private static listeners: Array<(status: NetworkStatus) => void> = [];
    private static currentStatus: NetworkStatus | null = null;
    private static unsubscribe: (() => void) | null = null;

    static getInstance(): NetworkService {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService();
        }
        return NetworkService.instance;
    }

    /**
     * Inicializa o monitoramento de rede
     */
    static async initialize(): Promise<void> {
        try {
            // Configurar NetInfo
            if (Platform.OS === 'ios') {
                await NetInfo.configure({
                    reachabilityUrl: 'https://clients3.google.com/generate_204',
                    reachabilityTest: async (response) => response.status === 204,
                    reachabilityLongTimeout: 60 * 1000,
                    reachabilityShortTimeout: 5 * 1000,
                    reachabilityRequestTimeout: 15 * 1000,
                });
            } else {
                await NetInfo.configure({
                    reachabilityUrl: 'https://clients3.google.com/generate_204',
                    reachabilityTest: async (response) => response.status === 204,
                    reachabilityLongTimeout: 60 * 1000,
                    reachabilityShortTimeout: 5 * 1000,
                    reachabilityRequestTimeout: 15 * 1000,
                });
            }

            // Obter status inicial
            const state = await NetInfo.fetch();
            this.currentStatus = this.parseNetInfoState(state);

            // Iniciar monitoramento
            this.startMonitoring();

            console.log('🌐 NetworkService inicializado:', this.currentStatus);
        } catch (error) {
            console.error('❌ Erro ao inicializar NetworkService:', error);
        }
    }

    /**
     * Inicia o monitoramento contínuo da rede
     */
    private static startMonitoring(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.unsubscribe = NetInfo.addEventListener((state) => {
            const newStatus = this.parseNetInfoState(state);
            const oldStatus = this.currentStatus;

            this.currentStatus = newStatus;

            // Notificar listeners apenas se o status mudou
            if (this.hasStatusChanged(oldStatus, newStatus)) {
                console.log('🔄 Status de rede alterado:', newStatus);
                this.notifyListeners(newStatus);
            }
        });
    }

    /**
     * Para o monitoramento de rede
     */
    static stopMonitoring(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    /**
     * Verifica se há conexão com a internet
     */
    static async isConnected(): Promise<boolean> {
        try {
            const state = await NetInfo.fetch();
            return state.isConnected === true && state.isInternetReachable === true;
        } catch (error) {
            console.error('Erro ao verificar conexão:', error);
            return false;
        }
    }

    /**
     * Verifica se há conexão (apenas conectado, não necessariamente com internet)
     */
    static async isNetworkConnected(): Promise<boolean> {
        try {
            const state = await NetInfo.fetch();
            return state.isConnected === true;
        } catch (error) {
            console.error('Erro ao verificar rede:', error);
            return false;
        }
    }

    /**
     * Obtém o status completo da rede
     */
    static async getNetworkStatus(): Promise<NetworkStatus> {
        try {
            const state = await NetInfo.fetch();
            const status = this.parseNetInfoState(state);
            this.currentStatus = status;
            return status;
        } catch (error) {
            console.error('Erro ao obter status da rede:', error);
            return {
                isConnected: false,
                isInternetReachable: false,
                type: NetInfoStateType.unknown,
                isWifiEnabled: false,
                isCellularEnabled: false,
            };
        }
    }

    /**
     * Obtém o status atual da rede (cache)
     */
    static getCurrentStatus(): NetworkStatus | null {
        return this.currentStatus;
    }

    /**
     * Adiciona um listener para mudanças de status
     */
    static addListener(listener: (status: NetworkStatus) => void): () => void {
        this.listeners.push(listener);

        // Retorna função para remover o listener
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Remove todos os listeners
     */
    static removeAllListeners(): void {
        this.listeners = [];
    }

    /**
     * Testa a conectividade fazendo uma requisição
     */
    static async testConnectivity(url?: string): Promise<boolean> {
        try {
            const testUrl = url || 'https://www.google.com/generate_204';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(testUrl, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache',
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.warn('Teste de conectividade falhou:', error);
            return false;
        }
    }

    /**
     * Aguarda até que haja conexão
     */
    static async waitForConnection(timeout: number = 30000): Promise<boolean> {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const checkConnection = async () => {
                const isConnected = await this.isConnected();

                if (isConnected) {
                    resolve(true);
                    return;
                }

                if (Date.now() - startTime >= timeout) {
                    resolve(false);
                    return;
                }

                setTimeout(checkConnection, 1000);
            };

            checkConnection();
        });
    }

    /**
     * Converte NetInfoState para NetworkStatus
     */
    private static parseNetInfoState(state: NetInfoState): NetworkStatus {
        return {
            isConnected: state.isConnected === true,
            isInternetReachable: state.isInternetReachable === true,
            type: state.type,
            isWifiEnabled: state.type === NetInfoStateType.wifi,
            isCellularEnabled: state.type === NetInfoStateType.cellular,
            strength: this.getSignalStrength(state),
        };
    }

    /**
     * Extrai força do sinal se disponível
     */
    private static getSignalStrength(state: NetInfoState): number | undefined {
        if (state.type === NetInfoStateType.wifi && state.details) {
            return (state.details as any).strength;
        }
        if (state.type === NetInfoStateType.cellular && state.details) {
            return (state.details as any).cellularGeneration;
        }
        return undefined;
    }

    /**
     * Verifica se o status mudou significativamente
     */
    private static hasStatusChanged(
        oldStatus: NetworkStatus | null,
        newStatus: NetworkStatus
    ): boolean {
        if (!oldStatus) return true;

        return (
            oldStatus.isConnected !== newStatus.isConnected ||
            oldStatus.isInternetReachable !== newStatus.isInternetReachable ||
            oldStatus.type !== newStatus.type
        );
    }

    /**
     * Notifica todos os listeners
     */
    private static notifyListeners(status: NetworkStatus): void {
        this.listeners.forEach((listener) => {
            try {
                listener(status);
            } catch (error) {
                console.error('Erro ao notificar listener de rede:', error);
            }
        });
    }

    /**
     * Obtém informações detalhadas sobre a conexão
     */
    static async getDetailedInfo(): Promise<any> {
        try {
            const state = await NetInfo.fetch();
            return {
                state,
                timestamp: new Date().toISOString(),
                platform: Platform.OS,
            };
        } catch (error) {
            console.error('Erro ao obter informações detalhadas:', error);
            return null;
        }
    }
}