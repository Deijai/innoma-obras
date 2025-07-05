import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export class SecureStorage {
    private static isAvailable: boolean | undefined;

    /**
     * Verifica se o armazenamento seguro está disponível
     */
    private static async checkAvailability(): Promise<boolean> {
        if (this.isAvailable !== undefined) {
            return this.isAvailable;
        }

        try {
            // No web, SecureStore não está disponível
            if (Platform.OS === 'web') {
                this.isAvailable = false;
                return false;
            }

            // Teste simples para verificar se funciona
            const testKey = '__secure_store_test__';
            await SecureStore.setItemAsync(testKey, 'test');
            await SecureStore.deleteItemAsync(testKey);

            this.isAvailable = true;
            return true;
        } catch (error) {
            console.warn('SecureStore não está disponível:', error);
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Salva um item no armazenamento seguro
     */
    static async setItem(key: string, value: string): Promise<void> {
        try {
            const isAvailable = await this.checkAvailability();

            if (!isAvailable) {
                // Fallback para AsyncStorage em caso de erro
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem(`secure_${key}`, value);
                return;
            }

            await SecureStore.setItemAsync(key, value, {
                keychainService: 'innoma-obras-keychain',
            });
        } catch (error) {
            console.error(`Erro ao salvar item seguro ${key}:`, error);
            throw new Error(`Falha ao salvar ${key} no armazenamento seguro`);
        }
    }

    /**
     * Recupera um item do armazenamento seguro
     */
    static async getItem(key: string): Promise<string | null> {
        try {
            const isAvailable = await this.checkAvailability();

            if (!isAvailable) {
                // Fallback para AsyncStorage
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                return await AsyncStorage.getItem(`secure_${key}`);
            }

            return await SecureStore.getItemAsync(key, {
                keychainService: 'innoma-obras-keychain',
            });
        } catch (error) {
            console.error(`Erro ao recuperar item seguro ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove um item do armazenamento seguro
     */
    static async removeItem(key: string): Promise<void> {
        try {
            const isAvailable = await this.checkAvailability();

            if (!isAvailable) {
                // Fallback para AsyncStorage
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.removeItem(`secure_${key}`);
                return;
            }

            await SecureStore.deleteItemAsync(key, {
                keychainService: 'innoma-obras-keychain',
            });
        } catch (error) {
            console.error(`Erro ao remover item seguro ${key}:`, error);
            throw new Error(`Falha ao remover ${key} do armazenamento seguro`);
        }
    }

    /**
     * Verifica se um item existe no armazenamento seguro
     */
    static async hasItem(key: string): Promise<boolean> {
        try {
            const value = await this.getItem(key);
            return value !== null;
        } catch (error) {
            console.error(`Erro ao verificar item seguro ${key}:`, error);
            return false;
        }
    }

    /**
     * Limpa todos os itens relacionados ao app
     */
    static async clear(): Promise<void> {
        try {
            const keys = [
                'auth_token',
                'user_credentials',
                'remember_login',
                'refresh_token',
                'user_preferences',
                'offline_queue',
            ];

            const promises = keys.map(key => this.removeItem(key));
            await Promise.allSettled(promises);

            console.log('✅ Armazenamento seguro limpo');
        } catch (error) {
            console.error('Erro ao limpar armazenamento seguro:', error);
            throw error;
        }
    }

    /**
     * Salva dados estruturados (JSON)
     */
    static async setObject(key: string, value: any): Promise<void> {
        try {
            const jsonString = JSON.stringify(value);
            await this.setItem(key, jsonString);
        } catch (error) {
            console.error(`Erro ao salvar objeto seguro ${key}:`, error);
            throw new Error(`Falha ao salvar objeto ${key} no armazenamento seguro`);
        }
    }

    /**
     * Recupera dados estruturados (JSON)
     */
    static async getObject<T = any>(key: string): Promise<T | null> {
        try {
            const jsonString = await this.getItem(key);

            if (!jsonString) {
                return null;
            }

            return JSON.parse(jsonString) as T;
        } catch (error) {
            console.error(`Erro ao recuperar objeto seguro ${key}:`, error);
            return null;
        }
    }

    /**
     * Salva múltiplos itens em batch
     */
    static async setMultiple(items: Array<[string, string]>): Promise<void> {
        try {
            const promises = items.map(([key, value]) => this.setItem(key, value));
            await Promise.all(promises);
        } catch (error) {
            console.error('Erro ao salvar múltiplos itens seguros:', error);
            throw error;
        }
    }

    /**
     * Recupera múltiplos itens em batch
     */
    static async getMultiple(keys: string[]): Promise<Array<[string, string | null]>> {
        try {
            const promises = keys.map(async (key) => {
                const value = await this.getItem(key);
                return [key, value] as [string, string | null];
            });

            return await Promise.all(promises);
        } catch (error) {
            console.error('Erro ao recuperar múltiplos itens seguros:', error);
            throw error;
        }
    }

    /**
     * Utilitário para debug (apenas em desenvolvimento)
     */
    static async getAllKeys(): Promise<string[]> {
        if (!__DEV__) {
            throw new Error('getAllKeys apenas disponível em desenvolvimento');
        }

        try {
            // Como SecureStore não tem uma função para listar chaves,
            // vamos tentar algumas chaves conhecidas
            const knownKeys = [
                'auth_token',
                'user_credentials',
                'remember_login',
                'refresh_token',
                'user_preferences',
                'theme_mode',
                'offline_queue',
            ];

            const existingKeys: string[] = [];

            for (const key of knownKeys) {
                const hasKey = await this.hasItem(key);
                if (hasKey) {
                    existingKeys.push(key);
                }
            }

            return existingKeys;
        } catch (error) {
            console.error('Erro ao listar chaves seguras:', error);
            return [];
        }
    }
}