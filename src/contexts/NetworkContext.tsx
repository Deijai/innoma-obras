import { NetworkService, NetworkStatus } from '@/services/network/NetworkService';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextType extends NetworkStatus {
    refreshStatus: () => Promise<void>;
    testConnectivity: () => Promise<boolean>;
    waitForConnection: (timeout?: number) => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
        isConnected: false,
        isInternetReachable: false,
        type: 'UNKNOWN' as any,
        isWifiEnabled: false,
        isCellularEnabled: false,
    });

    useEffect(() => {
        initializeNetwork();

        return () => {
            NetworkService.stopMonitoring();
            NetworkService.removeAllListeners();
        };
    }, []);

    const initializeNetwork = async () => {
        try {
            // Inicializar serviço de rede
            await NetworkService.initialize();

            // Obter status inicial
            const status = await NetworkService.getNetworkStatus();
            setNetworkStatus(status);

            // Adicionar listener para mudanças
            NetworkService.addListener((status: NetworkStatus) => {
                setNetworkStatus(status);

                // Log das mudanças
                if (status.isConnected) {
                    console.log('🌐 Conectado à internet');
                } else {
                    console.log('📱 Sem conexão com a internet');
                }
            });

        } catch (error) {
            console.error('Erro ao inicializar NetworkContext:', error);
        }
    };

    const refreshStatus = async () => {
        try {
            const status = await NetworkService.getNetworkStatus();
            setNetworkStatus(status);
        } catch (error) {
            console.error('Erro ao atualizar status da rede:', error);
        }
    };

    const testConnectivity = async () => {
        try {
            return await NetworkService.testConnectivity();
        } catch (error) {
            console.error('Erro ao testar conectividade:', error);
            return false;
        }
    };

    const waitForConnection = async (timeout: number = 30000) => {
        try {
            return await NetworkService.waitForConnection(timeout);
        } catch (error) {
            console.error('Erro ao aguardar conexão:', error);
            return false;
        }
    };

    const value: NetworkContextType = {
        ...networkStatus,
        refreshStatus,
        testConnectivity,
        waitForConnection,
    };

    return (
        <NetworkContext.Provider value={value}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetwork() {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork deve ser usado dentro de um NetworkProvider');
    }
    return context;
}

export default NetworkContext;