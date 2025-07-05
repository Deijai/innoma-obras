// src/services/auth/AuthService.ts
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// ✅ CORRETO: Importar tipos específicos dos arquivos corretos
import type { LoginCredentials, RegisterData, User, UserProfile } from '@/types/auth';
import type { CreateTenantData } from '@/types/tenant';
import { executeQuery, executeSelectQuery } from '../database/sqlite';
import { auth, FirebaseConfig, firestore } from '../firebase/config';
import { NetworkService } from '../network/NetworkService';
import { SecureStorage } from '../storage/SecureStorage';
import { SyncService } from '../sync/SyncService';

export class AuthService {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private isOfflineMode = false;

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * Login do usuário (online/offline) - MÉTODO PRINCIPAL
     */
    async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
        try {
            const isOnline = await NetworkService.isConnected();

            if (isOnline) {
                return await this.loginOnline(credentials);
            } else {
                return await this.loginOffline(credentials);
            }
        } catch (error) {
            console.error('Erro no login:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Login online com Firebase
     */
    private async loginOnline(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
        );

        const firebaseUser = userCredential.user;
        const token = await firebaseUser.getIdToken();

        // Buscar dados completos do usuário no banco local primeiro
        let user = await this.getUserFromLocal(firebaseUser.uid);

        if (!user) {
            // Se não existe localmente, buscar no Firestore
            const userDoc = await getDoc(doc(firestore, FirebaseConfig.collections.users, firebaseUser.uid));

            if (!userDoc.exists()) {
                throw new Error('Dados do usuário não encontrados');
            }

            const userData = userDoc.data();
            user = await this.createUserFromFirestore(userData, firebaseUser.uid);
        }

        // Verificar se usuário tem tenant_id
        if (!user.tenant_id) {
            throw new Error('Usuário não está associado a nenhuma empresa');
        }

        // Salvar token e credenciais seguras
        await SecureStorage.setItem('auth_token', token);
        await SecureStorage.setItem('user_credentials', JSON.stringify({
            email: credentials.email,
            passwordHash: await this.hashPassword(credentials.password),
        }));

        if (credentials.rememberMe) {
            await SecureStorage.setItem('remember_login', 'true');
        }

        // Atualizar último login
        await this.updateLastLogin(user.uuid);

        this.currentUser = user;

        // Iniciar sincronização em background
        SyncService.getInstance().startPeriodicSync();

        return { user, token };
    }

    /**
     * Login offline (verificação local) - CORRIGIDO
     */
    private async loginOffline(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
        // Verificar se há credenciais salvas
        const savedCredentials = await SecureStorage.getItem('user_credentials');
        if (!savedCredentials) {
            throw new Error('Nenhuma credencial salva para login offline');
        }

        const { email, passwordHash } = JSON.parse(savedCredentials);

        // Verificar email
        if (email !== credentials.email) {
            throw new Error('Email não corresponde ao usuário salvo');
        }

        // Verificar senha (comparar hash)
        const inputPasswordHash = await this.hashPassword(credentials.password);
        if (passwordHash !== inputPasswordHash) {
            throw new Error('Senha incorreta');
        }

        // ✅ CORRIGIDO: Usar executeSelectQuery corretamente
        const result = await executeSelectQuery(
            'SELECT * FROM usuarios WHERE email = ? AND is_active = 1',
            [credentials.email]
        );

        if (result.length === 0) {
            throw new Error('Usuário não encontrado no banco local');
        }

        const userData = result[0]; // ✅ CORRETO: result[0] ao invés de result.rows.item(0)

        // ✅ CORRIGIDO: Incluir todos os campos obrigatórios
        const user: User = {
            id: userData.id,
            uuid: userData.uuid,
            tenant_id: userData.tenant_id,
            nome: userData.nome,
            email: userData.email,
            telefone: userData.telefone,
            perfil: userData.perfil,
            perfil_global: userData.perfil_global,
            avatar_url: userData.avatar_url,
            empresa: userData.empresa,
            is_tenant_owner: userData.is_tenant_owner === 1,
            created_at: userData.created_at,
            updated_at: userData.updated_at,
            synced_at: userData.synced_at,
            is_active: userData.is_active === 1,
            last_login_at: userData.last_login_at,
            email_verified: userData.email_verified === 1,
        };

        // Gerar token offline (UUID temporário)
        const offlineToken = `offline_${Date.now()}_${Math.random()}`;
        await SecureStorage.setItem('auth_token', offlineToken);

        this.currentUser = user;
        this.isOfflineMode = true;

        return { user, token: offlineToken };
    }

    /**
     * Cadastro de novo usuário - MÉTODO PRINCIPAL
     */
    async register(data: RegisterData): Promise<{ user: User; token: string }> {
        const isOnline = await NetworkService.isConnected();

        if (!isOnline) {
            throw new Error('Cadastro requer conexão com a internet');
        }

        try {
            // Criar usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            const firebaseUser = userCredential.user;

            // Atualizar perfil do Firebase
            await updateProfile(firebaseUser, {
                displayName: data.nome,
            });

            // Gerar IDs
            const userId = firebaseUser.uid;
            const tenantId = uuidv4();

            // Criar tenant primeiro
            const tenantData: CreateTenantData = {
                nome: data.empresa || `Empresa de ${data.nome}`,
                slug: this.generateSlugFromName(data.empresa || data.nome),
                email_contato: data.email,
                telefone: data.telefone,
            };

            await this.createTenantInDatabase(tenantId, tenantData);

            // Criar usuário
            const userData = {
                uuid: userId,
                tenant_id: tenantId,
                nome: data.nome,
                email: data.email,
                telefone: data.telefone,
                perfil: 'admin' as UserProfile, // Primeiro usuário é admin
                perfil_global: 'tenant_admin',
                is_tenant_owner: true,
                empresa: data.empresa,
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                email_verified: false,
                is_active: true,
            };

            // Salvar no Firestore
            await setDoc(
                doc(firestore, FirebaseConfig.collections.users, userId),
                {
                    ...userData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                }
            );

            // Salvar no banco local
            await this.saveUserToLocal(userData);

            // Enviar email de verificação
            await sendEmailVerification(firebaseUser);

            const token = await firebaseUser.getIdToken();

            const user: User = {
                id: 0,
                uuid: userId,
                tenant_id: tenantId,
                nome: data.nome,
                email: data.email,
                telefone: data.telefone,
                perfil: 'admin',
                perfil_global: 'tenant_admin',
                avatar_url: undefined,
                empresa: data.empresa,
                is_tenant_owner: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
                is_active: true,
            };

            // Salvar credenciais
            await SecureStorage.setItem('auth_token', token);
            await SecureStorage.setItem('user_credentials', JSON.stringify({
                email: data.email,
                passwordHash: await this.hashPassword(data.password),
            }));

            this.currentUser = user;

            return { user, token };
        } catch (error) {
            console.error('Erro no cadastro:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Logout
     */
    async logout(): Promise<void> {
        try {
            const isOnline = await NetworkService.isConnected();

            if (isOnline && !this.isOfflineMode) {
                await signOut(auth);
            }

            // Limpar dados locais
            await SecureStorage.removeItem('auth_token');
            await SecureStorage.removeItem('user_credentials');
            await SecureStorage.removeItem('remember_login');
            await SecureStorage.removeItem('current_tenant_id');

            this.currentUser = null;
            this.isOfflineMode = false;

            // Parar sincronização
            SyncService.getInstance().stopPeriodicSync();
        } catch (error) {
            console.error('Erro no logout:', error);
            throw error;
        }
    }

    /**
     * Recuperação de senha
     */
    async resetPassword(email: string): Promise<void> {
        const isOnline = await NetworkService.isConnected();

        if (!isOnline) {
            throw new Error('Recuperação de senha requer conexão com a internet');
        }

        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Erro na recuperação de senha:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Verificar se usuário está autenticado
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            const token = await SecureStorage.getItem('auth_token');
            return !!token;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obter usuário atual - MÉTODO PRINCIPAL CORRIGIDO
     */
    async getCurrentUser(): Promise<User | null> {
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const token = await SecureStorage.getItem('auth_token');
            if (!token) return null;

            // ✅ CORRIGIDO: Usar executeSelectQuery corretamente
            const result = await executeSelectQuery(
                'SELECT * FROM usuarios WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1'
            );

            if (result.length > 0) {
                const userData = result[0]; // ✅ CORRETO: result[0]

                // ✅ CORRIGIDO: Incluir todos os campos obrigatórios
                this.currentUser = {
                    id: userData.id,
                    uuid: userData.uuid,
                    tenant_id: userData.tenant_id,
                    nome: userData.nome,
                    email: userData.email,
                    telefone: userData.telefone,
                    perfil: userData.perfil,
                    perfil_global: userData.perfil_global,
                    avatar_url: userData.avatar_url,
                    empresa: userData.empresa,
                    is_tenant_owner: userData.is_tenant_owner === 1,
                    created_at: userData.created_at,
                    updated_at: userData.updated_at,
                    synced_at: userData.synced_at,
                    is_active: userData.is_active === 1,
                    last_login_at: userData.last_login_at,
                    email_verified: userData.email_verified === 1,
                };
            }

            return this.currentUser;
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }

    /**
     * Atualizar perfil do usuário
     */
    async updateUserProfile(data: Partial<User>): Promise<void> {
        if (!this.currentUser) throw new Error('Usuário não logado');

        try {
            const updates = [];
            const values = [];

            // Campos que podem ser atualizados
            const allowedFields = ['nome', 'telefone', 'avatar_url'];

            allowedFields.forEach(field => {
                if (data[field as keyof User] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(data[field as keyof User]);
                }
            });

            if (updates.length === 0) return;

            updates.push('updated_at = ?');
            values.push(new Date().toISOString());
            values.push(this.currentUser.uuid);

            await executeQuery(`
                UPDATE usuarios SET ${updates.join(', ')} WHERE uuid = ?
            `, values);

            // Atualizar estado local
            this.currentUser = {
                ...this.currentUser,
                ...data,
                updated_at: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    }

    /**
     * Utilities privadas
     */

    private async createTenantInDatabase(tenantId: string, data: CreateTenantData): Promise<void> {
        const now = new Date().toISOString();

        await executeQuery(`
            INSERT INTO tenants (
                id, nome, slug, email_contato, telefone, cnpj, 
                plano, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tenantId,
            data.nome,
            data.slug,
            data.email_contato,
            data.telefone || null,
            data.cnpj || null,
            'trial',
            'ativo',
            now,
            now
        ]);

        // Criar registro de usage
        await executeQuery(`
            INSERT INTO tenant_usage (tenant_id, ultimo_calculo)
            VALUES (?, ?)
        `, [tenantId, now]);
    }

    private async saveUserToLocal(userData: any): Promise<void> {
        try {
            await executeQuery(`
                INSERT OR REPLACE INTO usuarios (
                    uuid, tenant_id, nome, email, telefone, perfil, perfil_global,
                    avatar_url, empresa, is_tenant_owner, created_at, updated_at, 
                    synced_at, is_active, email_verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userData.uuid,
                userData.tenant_id,
                userData.nome,
                userData.email,
                userData.telefone,
                userData.perfil,
                userData.perfil_global || 'user',
                userData.avatar_url,
                userData.empresa,
                userData.is_tenant_owner ? 1 : 0,
                userData.created_at,
                userData.updated_at,
                userData.synced_at || new Date().toISOString(),
                userData.is_active ? 1 : 0,
                userData.email_verified ? 1 : 0,
            ]);
        } catch (error) {
            console.error('Erro ao salvar usuário local:', error);
            throw error;
        }
    }

    /**
     * getUserFromLocal - CORRIGIDO
     */
    private async getUserFromLocal(uuid?: string | null, email?: string): Promise<User | null> {
        try {
            let query = 'SELECT * FROM usuarios WHERE is_active = 1';
            let params: any[] = [];

            if (uuid) {
                query += ' AND uuid = ?';
                params.push(uuid);
            } else if (email) {
                query += ' AND email = ?';
                params.push(email);
            } else {
                return null;
            }

            // ✅ CORRIGIDO: Usar executeSelectQuery corretamente
            const result = await executeSelectQuery(query, params);

            if (result.length === 0) return null;

            const userData = result[0]; // ✅ CORRETO: result[0]

            // ✅ CORRIGIDO: Incluir todos os campos
            return {
                id: userData.id,
                uuid: userData.uuid,
                tenant_id: userData.tenant_id,
                nome: userData.nome,
                email: userData.email,
                telefone: userData.telefone,
                perfil: userData.perfil,
                perfil_global: userData.perfil_global,
                avatar_url: userData.avatar_url,
                empresa: userData.empresa,
                is_tenant_owner: userData.is_tenant_owner === 1,
                created_at: userData.created_at,
                updated_at: userData.updated_at,
                synced_at: userData.synced_at,
                is_active: userData.is_active === 1,
                last_login_at: userData.last_login_at,
                email_verified: userData.email_verified === 1,
            };
        } catch (error) {
            console.error('Erro ao buscar usuário local:', error);
            return null;
        }
    }

    private async createUserFromFirestore(firestoreData: any, uuid: string): Promise<User> {
        const userData = {
            uuid,
            tenant_id: firestoreData.tenant_id,
            nome: firestoreData.nome,
            email: firestoreData.email,
            telefone: firestoreData.telefone,
            perfil: firestoreData.perfil,
            perfil_global: firestoreData.perfil_global,
            avatar_url: firestoreData.avatar_url,
            empresa: firestoreData.empresa,
            is_tenant_owner: firestoreData.is_tenant_owner || false,
            created_at: firestoreData.created_at || new Date().toISOString(),
            updated_at: firestoreData.updated_at || new Date().toISOString(),
            synced_at: new Date().toISOString(),
            is_active: true,
            email_verified: firestoreData.email_verified || false,
        };

        await this.saveUserToLocal(userData);

        return {
            ...userData,
            id: 0,
        };
    }

    private async updateLastLogin(uuid: string): Promise<void> {
        try {
            await executeQuery(
                'UPDATE usuarios SET last_login_at = ?, updated_at = ? WHERE uuid = ?',
                [new Date().toISOString(), new Date().toISOString(), uuid]
            );
        } catch (error) {
            console.warn('Erro ao atualizar último login:', error);
        }
    }

    private generateSlugFromName(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private async hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'innoma_salt_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private handleAuthError(error: any): Error {
        let message = 'Erro desconhecido';

        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'Usuário não encontrado';
                    break;
                case 'auth/wrong-password':
                    message = 'Senha incorreta';
                    break;
                case 'auth/email-already-in-use':
                    message = 'Este email já está em uso';
                    break;
                case 'auth/weak-password':
                    message = 'A senha deve ter pelo menos 6 caracteres';
                    break;
                case 'auth/invalid-email':
                    message = 'Email inválido';
                    break;
                case 'auth/too-many-requests':
                    message = 'Muitas tentativas. Tente novamente mais tarde';
                    break;
                case 'auth/network-request-failed':
                    message = 'Erro de conexão. Verifique sua internet';
                    break;
                default:
                    message = error.message || 'Erro na autenticação';
            }
        } else {
            message = error.message || 'Erro na autenticação';
        }

        return new Error(message);
    }
}

export default AuthService;