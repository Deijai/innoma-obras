import type { LoginCredentials, RegisterData, User, UserProfile } from '@/types';
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
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { executeQuery } from '../database/sqlite';
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
     * Login do usuário (online/offline)
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

        // Buscar dados completos do usuário no Firestore
        const userDoc = await getDoc(doc(firestore, FirebaseConfig.collections.users, firebaseUser.uid));

        if (!userDoc.exists()) {
            throw new Error('Dados do usuário não encontrados');
        }

        const userData = userDoc.data();
        const user: User = {
            id: 0, // Será atualizado pelo SQLite
            uuid: firebaseUser.uid,
            nome: userData.nome || firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            telefone: userData.telefone,
            perfil: userData.perfil || 'operador',
            avatar_url: userData.avatar_url || firebaseUser.photoURL,
            empresa: userData.empresa,
            created_at: userData.created_at || new Date().toISOString(),
            updated_at: userData.updated_at || new Date().toISOString(),
            synced_at: new Date().toISOString(),
            is_active: true,
        };

        // Salvar usuário no banco local
        await this.saveUserToLocal(user);

        // Salvar token e credenciais seguras
        await SecureStorage.setItem('auth_token', token);
        await SecureStorage.setItem('user_credentials', JSON.stringify({
            email: credentials.email,
            // Hash da senha para validação offline (nunca salvar senha plain text)
            passwordHash: await this.hashPassword(credentials.password),
        }));

        if (credentials.rememberMe) {
            await SecureStorage.setItem('remember_login', 'true');
        }

        // Atualizar último login no Firestore
        await updateDoc(doc(firestore, FirebaseConfig.collections.users, firebaseUser.uid), {
            last_login: serverTimestamp(),
            updated_at: serverTimestamp(),
        });

        this.currentUser = user;

        // Iniciar sincronização em background
        SyncService.getInstance().startPeriodicSync();

        return { user, token };
    }

    /**
     * Login offline (verificação local)
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

        // Buscar usuário no banco local
        const result = await executeQuery(
            'SELECT * FROM usuarios WHERE email = ? AND is_active = 1',
            [credentials.email]
        );

        if (result.rows.length === 0) {
            throw new Error('Usuário não encontrado no banco local');
        }

        const userData = result.rows.item(0);
        const user: User = {
            id: userData.id,
            uuid: userData.uuid,
            nome: userData.nome,
            email: userData.email,
            telefone: userData.telefone,
            perfil: userData.perfil,
            avatar_url: userData.avatar_url,
            empresa: userData.empresa,
            created_at: userData.created_at,
            updated_at: userData.updated_at,
            synced_at: userData.synced_at,
            is_active: userData.is_active === 1,
        };

        // Gerar token offline (UUID temporário)
        const offlineToken = `offline_${Date.now()}_${Math.random()}`;
        await SecureStorage.setItem('auth_token', offlineToken);

        this.currentUser = user;
        this.isOfflineMode = true;

        return { user, token: offlineToken };
    }

    /**
     * Cadastro de novo usuário
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

            // Enviar email de verificação
            await sendEmailVerification(firebaseUser);

            // Criar documento do usuário no Firestore
            const userData = {
                nome: data.nome,
                email: data.email,
                telefone: data.telefone,
                empresa: data.empresa,
                perfil: 'operador' as UserProfile, // Perfil padrão
                avatar_url: null,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                email_verified: false,
                is_active: true,
            };

            await setDoc(
                doc(firestore, FirebaseConfig.collections.users, firebaseUser.uid),
                userData
            );

            const token = await firebaseUser.getIdToken();

            const user: User = {
                id: 0,
                uuid: firebaseUser.uid,
                nome: data.nome,
                email: data.email,
                telefone: data.telefone,
                perfil: 'operador',
                avatar_url: undefined,
                empresa: data.empresa,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
                is_active: true,
            };

            // Salvar no banco local
            await this.saveUserToLocal(user);

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
     * Obter usuário atual
     */
    async getCurrentUser(): Promise<User | null> {
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const token = await SecureStorage.getItem('auth_token');
            if (!token) return null;

            // Tentar carregar do banco local
            const result = await executeQuery(
                'SELECT * FROM usuarios WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1'
            );

            if (result.rows.length > 0) {
                const userData = result.rows.item(0);
                this.currentUser = {
                    id: userData.id,
                    uuid: userData.uuid,
                    nome: userData.nome,
                    email: userData.email,
                    telefone: userData.telefone,
                    perfil: userData.perfil,
                    avatar_url: userData.avatar_url,
                    empresa: userData.empresa,
                    created_at: userData.created_at,
                    updated_at: userData.updated_at,
                    synced_at: userData.synced_at,
                    is_active: userData.is_active === 1,
                };
            }

            return this.currentUser;
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }

    /**
     * Salvar usuário no banco local
     */
    private async saveUserToLocal(user: User): Promise<void> {
        try {
            await executeQuery(
                `INSERT OR REPLACE INTO usuarios 
         (uuid, nome, email, telefone, perfil, avatar_url, empresa, created_at, updated_at, synced_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.uuid,
                    user.nome,
                    user.email,
                    user.telefone,
                    user.perfil,
                    user.avatar_url,
                    user.empresa,
                    user.created_at,
                    user.updated_at,
                    user.synced_at,
                    user.is_active ? 1 : 0,
                ]
            );
        } catch (error) {
            console.error('Erro ao salvar usuário local:', error);
            throw error;
        }
    }

    /**
     * Hash da senha para validação offline
     */
    private async hashPassword(password: string): Promise<string> {
        // Implementação simples - em produção use bcrypt ou similar
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'innoma_salt_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Tratar erros de autenticação
     */
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