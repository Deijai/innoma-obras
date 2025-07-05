// src/contexts/TenantContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '@/contexts/AuthContext';
import { executeQuery, executeSelectQuery } from '@/services/database/sqlite';
import { SecureStorage } from '@/services/storage/SecureStorage';
import type {
    CreateTenantData,
    Tenant,
    TenantContextType,
    TenantLimits,
    UserTenant,
    UserTenantRole
} from '@/types/tenant';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [userTenants, setUserTenants] = useState<UserTenant[]>([]);
    const [tenantLimits, setTenantLimits] = useState<TenantLimits | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Inicializar tenant quando usuário logar
    useEffect(() => {
        if (isAuthenticated && user?.tenant_id) {
            initializeTenant();
        } else {
            setIsLoading(false);
            setCurrentTenant(null);
            setUserTenants([]);
        }
    }, [isAuthenticated, user?.tenant_id]);

    /**
     * Inicializa o tenant do usuário logado
     */
    const initializeTenant = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!user?.tenant_id) {
                throw new Error('Usuário não possui tenant associado');
            }

            // Carregar tenant atual
            const tenant = await getTenantById(user.tenant_id);
            if (!tenant) {
                throw new Error('Tenant não encontrado');
            }

            // Carregar todos os tenants do usuário (para multi-tenant)
            const tenants = await getUserTenants(user.uuid);

            // Carregar limites
            const limits = await calculateTenantLimits(tenant.id);

            setCurrentTenant(tenant);
            setUserTenants(tenants);
            setTenantLimits(limits);

            // Salvar tenant atual no storage
            await SecureStorage.setItem('current_tenant_id', tenant.id);

            console.log('✅ Tenant inicializado:', tenant.nome);
        } catch (error) {
            console.error('❌ Erro ao inicializar tenant:', error);
            setError(error instanceof Error ? error.message : 'Erro ao carregar tenant');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Buscar tenant por ID
     */
    const getTenantById = async (tenantId: string): Promise<Tenant | null> => {
        try {
            const result = await executeSelectQuery(
                'SELECT * FROM tenants WHERE id = ? AND is_active = 1',
                [tenantId]
            );

            if (result.length === 0) return null;

            const tenantData = result[0];
            return {
                // ✅ CORRIGIDO: id e uuid como string
                id: tenantData.id,
                uuid: tenantData.id, // Para compatibilidade
                nome: tenantData.nome,
                slug: tenantData.slug,
                cnpj: tenantData.cnpj,
                email_contato: tenantData.email_contato,
                telefone: tenantData.telefone,
                endereco: tenantData.endereco,
                logo_url: tenantData.logo_url,
                website: tenantData.website,
                plano: tenantData.plano,
                status: tenantData.status,
                limite_usuarios: tenantData.limite_usuarios,
                limite_obras: tenantData.limite_obras,
                limite_storage_gb: tenantData.limite_storage_gb,
                configuracoes: tenantData.configuracoes ? JSON.parse(tenantData.configuracoes) : null,
                trial_end_date: tenantData.trial_end_date,
                subscription_end_date: tenantData.subscription_end_date,
                billing_email: tenantData.billing_email,
                billing_address: tenantData.billing_address,
                created_at: tenantData.created_at,
                updated_at: tenantData.updated_at,
                synced_at: tenantData.synced_at,
                is_active: tenantData.is_active === 1,
            };
        } catch (error) {
            console.error('Erro ao buscar tenant:', error);
            return null;
        }
    };

    /**
     * Buscar todos os tenants do usuário
     */
    const getUserTenants = async (userId: string): Promise<UserTenant[]> => {
        try {
            const result = await executeSelectQuery(`
                SELECT ut.*, t.nome as tenant_nome, t.slug as tenant_slug
                FROM usuarios ut
                JOIN tenants t ON ut.tenant_id = t.id
                WHERE ut.uuid = ? AND ut.is_active = 1 AND t.is_active = 1
            `, [userId]);

            return result.map(row => ({
                id: row.id,
                uuid: row.uuid,
                user_id: row.uuid,
                tenant_id: row.tenant_id,
                role: row.perfil_tenant,
                is_active: row.is_active === 1,
                joined_at: row.created_at,
                last_access_at: row.last_login_at,
                created_at: row.created_at,
                updated_at: row.updated_at,
                synced_at: row.synced_at,
            }));
        } catch (error) {
            console.error('Erro ao buscar tenants do usuário:', error);
            return [];
        }
    };

    /**
     * Calcular limites e uso do tenant
     */
    const calculateTenantLimits = async (tenantId: string): Promise<TenantLimits> => {
        try {
            // Buscar dados atuais de uso
            const [usersResult, obrasResult, usageResult] = await Promise.all([
                executeSelectQuery('SELECT COUNT(*) as count FROM usuarios WHERE tenant_id = ? AND is_active = 1', [tenantId]),
                executeSelectQuery('SELECT COUNT(*) as count FROM obras WHERE tenant_id = ? AND is_active = 1', [tenantId]),
                executeSelectQuery('SELECT * FROM tenant_usage WHERE tenant_id = ?', [tenantId])
            ]);

            const tenant = currentTenant || await getTenantById(tenantId);
            if (!tenant) throw new Error('Tenant não encontrado');

            const usuariosUsados = usersResult[0]?.count || 0;
            const obrasUsadas = obrasResult[0]?.count || 0;
            const storageUsado = usageResult[0]?.storage_usado_mb || 0;

            return {
                usuarios: {
                    usado: usuariosUsados,
                    limite: tenant.limite_usuarios,
                    percentual: Math.round((usuariosUsados / tenant.limite_usuarios) * 100),
                },
                obras: {
                    usado: obrasUsadas,
                    limite: tenant.limite_obras,
                    percentual: Math.round((obrasUsadas / tenant.limite_obras) * 100),
                },
                storage: {
                    usado_mb: storageUsado,
                    limite_gb: tenant.limite_storage_gb,
                    percentual: Math.round((storageUsado / (tenant.limite_storage_gb * 1024)) * 100),
                },
            };
        } catch (error) {
            console.error('Erro ao calcular limites:', error);
            return {
                usuarios: { usado: 0, limite: 0, percentual: 0 },
                obras: { usado: 0, limite: 0, percentual: 0 },
                storage: { usado_mb: 0, limite_gb: 0, percentual: 0 },
            };
        }
    };

    /**
     * Trocar de tenant (para usuários multi-tenant)
     */
    const switchTenant = async (tenantId: string): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            // Verificar se usuário tem acesso a este tenant
            const hasAccess = userTenants.some(ut => ut.tenant_id === tenantId);
            if (!hasAccess) {
                throw new Error('Você não tem acesso a este tenant');
            }

            // Carregar novo tenant
            const tenant = await getTenantById(tenantId);
            if (!tenant) {
                throw new Error('Tenant não encontrado');
            }

            // Atualizar estado
            setCurrentTenant(tenant);
            const limits = await calculateTenantLimits(tenantId);
            setTenantLimits(limits);

            // Salvar no storage
            await SecureStorage.setItem('current_tenant_id', tenantId);

            console.log('✅ Tenant alterado para:', tenant.nome);
        } catch (error) {
            console.error('❌ Erro ao trocar tenant:', error);
            setError(error instanceof Error ? error.message : 'Erro ao trocar tenant');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Criar novo tenant
     */
    const createTenant = async (data: CreateTenantData): Promise<Tenant> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');

            const tenantId = uuidv4();
            const now = new Date().toISOString();

            // Criar tenant
            await executeQuery(`
                INSERT INTO tenants (
                    id, nome, slug, email_contato, telefone, cnpj, plano,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                tenantId,
                data.nome,
                data.slug,
                data.email_contato,
                data.telefone || null,
                data.cnpj || null,
                data.plano || 'basico',
                now,
                now
            ]);

            // Criar usage record
            await executeQuery(`
                INSERT INTO tenant_usage (tenant_id, ultimo_calculo)
                VALUES (?, ?)
            `, [tenantId, now]);

            // Buscar tenant criado
            const tenant = await getTenantById(tenantId);
            if (!tenant) throw new Error('Erro ao criar tenant');

            console.log('✅ Tenant criado:', tenant.nome);
            return tenant;
        } catch (error) {
            console.error('❌ Erro ao criar tenant:', error);
            throw error;
        }
    };

    /**
     * Atualizar tenant
     */
    const updateTenant = async (data: Partial<Tenant>): Promise<void> => {
        try {
            if (!currentTenant) throw new Error('Nenhum tenant ativo');

            const updates = [];
            const values = [];

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && key !== 'id') {
                    updates.push(`${key} = ?`);
                    values.push(typeof value === 'object' ? JSON.stringify(value) : value);
                }
            });

            if (updates.length === 0) return;

            updates.push('updated_at = ?');
            values.push(new Date().toISOString());
            values.push(currentTenant.id);

            await executeQuery(`
                UPDATE tenants SET ${updates.join(', ')} WHERE id = ?
            `, values);

            // Recarregar tenant
            await initializeTenant();

            console.log('✅ Tenant atualizado');
        } catch (error) {
            console.error('❌ Erro ao atualizar tenant:', error);
            throw error;
        }
    };

    /**
     * Deletar tenant
     */
    const deleteTenant = async (tenantId: string): Promise<void> => {
        try {
            // Soft delete
            await executeQuery(`
                UPDATE tenants SET is_active = 0, updated_at = ? WHERE id = ?
            `, [new Date().toISOString(), tenantId]);

            console.log('✅ Tenant deletado');
        } catch (error) {
            console.error('❌ Erro ao deletar tenant:', error);
            throw error;
        }
    };

    /**
     * Convidar usuário
     */
    const inviteUser = async (email: string, role: UserTenantRole, message?: string): Promise<void> => {
        try {
            if (!currentTenant) throw new Error('Nenhum tenant ativo');
            if (!user) throw new Error('Usuário não autenticado');

            // Verificar limites
            if (!canAddUser()) {
                throw new Error('Limite de usuários atingido para seu plano');
            }

            // Verificar se email já está no tenant
            const existingUser = await executeSelectQuery(
                'SELECT id FROM usuarios WHERE tenant_id = ? AND email = ?',
                [currentTenant.id, email]
            );

            if (existingUser.length > 0) {
                throw new Error('Este email já está associado a este tenant');
            }

            // Verificar convite pendente
            const existingInvite = await executeSelectQuery(
                'SELECT id FROM convites_tenant WHERE tenant_id = ? AND email = ? AND status = ?',
                [currentTenant.id, email, 'pendente']
            );

            if (existingInvite.length > 0) {
                throw new Error('Já existe um convite pendente para este email');
            }

            // Criar convite
            const inviteId = uuidv4();
            const token = uuidv4();
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7); // 7 dias

            await executeQuery(`
                INSERT INTO convites_tenant (
                    uuid, tenant_id, email, perfil_tenant, token, enviado_por,
                    data_expiracao, mensagem, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                inviteId,
                currentTenant.id,
                email,
                role,
                token,
                user.uuid,
                expirationDate.toISOString(),
                message || null,
                new Date().toISOString()
            ]);

            console.log('✅ Convite enviado para:', email);
        } catch (error) {
            console.error('❌ Erro ao enviar convite:', error);
            throw error;
        }
    };

    /**
     * Aceitar convite
     */
    const acceptInvite = async (token: string, userData: any): Promise<void> => {
        try {
            // Buscar convite
            const inviteResult = await executeSelectQuery(
                'SELECT * FROM convites_tenant WHERE token = ? AND status = ?',
                [token, 'pendente']
            );

            if (inviteResult.length === 0) {
                throw new Error('Convite não encontrado ou já utilizado');
            }

            const invite = inviteResult[0];

            // Verificar expiração
            const now = new Date();
            const expiration = new Date(invite.data_expiracao);
            if (now > expiration) {
                throw new Error('Convite expirado');
            }

            // Marcar convite como aceito
            await executeQuery(`
                UPDATE convites_tenant SET status = 'aceito', updated_at = ?
                WHERE uuid = ?
            `, [new Date().toISOString(), invite.uuid]);

            console.log('✅ Convite aceito');
        } catch (error) {
            console.error('❌ Erro ao aceitar convite:', error);
            throw error;
        }
    };

    /**
     * Cancelar convite
     */
    const cancelInvite = async (inviteId: string): Promise<void> => {
        try {
            await executeQuery(`
                UPDATE convites_tenant SET status = 'cancelado', updated_at = ?
                WHERE uuid = ?
            `, [new Date().toISOString(), inviteId]);

            console.log('✅ Convite cancelado');
        } catch (error) {
            console.error('❌ Erro ao cancelar convite:', error);
            throw error;
        }
    };

    /**
     * Verificar limites - ✅ CORRIGIDO
     */
    const checkLimits = async (): Promise<TenantLimits> => {
        if (!currentTenant) throw new Error('Nenhum tenant ativo');
        return await calculateTenantLimits(currentTenant.id); // ✅ currentTenant.id já é string
    };

    /**
     * Verificar se pode adicionar usuário
     */
    const canAddUser = (): boolean => {
        if (!tenantLimits) return false;
        return tenantLimits.usuarios.usado < tenantLimits.usuarios.limite;
    };

    /**
     * Verificar se pode adicionar obra
     */
    const canAddObra = (): boolean => {
        if (!tenantLimits) return false;
        return tenantLimits.obras.usado < tenantLimits.obras.limite;
    };

    /**
     * Verificar se pode fazer upload
     */
    const canUploadFile = (sizeInMB: number): boolean => {
        if (!tenantLimits) return false;
        const newTotal = tenantLimits.storage.usado_mb + sizeInMB;
        const limitInMB = tenantLimits.storage.limite_gb * 1024;
        return newTotal <= limitInMB;
    };

    /**
     * Verificar se tem feature
     */
    const hasFeature = (feature: string): boolean => {
        if (!currentTenant) return false;

        // Definir features por plano
        const planFeatures = {
            basico: {
                modulo_financeiro: false,
                modulo_materiais: false,
                modulo_qualidade: false,
                relatorios_avancados: false,
                api_access: false,
                white_label: false,
                suporte_prioritario: false,
                backup_automatico: false,
                integracao_erp: false,
            },
            pro: {
                modulo_financeiro: true,
                modulo_materiais: true,
                modulo_qualidade: true,
                relatorios_avancados: true,
                api_access: true,
                white_label: false,
                suporte_prioritario: false,
                backup_automatico: true,
                integracao_erp: false,
            },
            enterprise: {
                modulo_financeiro: true,
                modulo_materiais: true,
                modulo_qualidade: true,
                relatorios_avancados: true,
                api_access: true,
                white_label: true,
                suporte_prioritario: true,
                backup_automatico: true,
                integracao_erp: true,
            },
        };

        const features = planFeatures[currentTenant.plano as keyof typeof planFeatures];
        return features ? (features as any)[feature] || false : false;
    };

    /**
     * Verificar se pode gerenciar usuários - ✅ CORRIGIDO
     */
    const canManageUsers = (): boolean => {
        if (!user) return false;
        return ['admin'].includes(user.perfil || '') || (user.is_tenant_owner ?? false);
    };

    /**
     * Verificar se pode gerenciar configurações - ✅ CORRIGIDO
     */
    const canManageSettings = (): boolean => {
        if (!user) return false;
        return ['admin'].includes(user.perfil || '') || (user.is_tenant_owner ?? false);
    };

    const value: TenantContextType = {
        currentTenant,
        userTenants,
        tenantLimits,
        isLoading,
        error,
        switchTenant,
        createTenant,
        updateTenant,
        deleteTenant,
        inviteUser,
        acceptInvite,
        cancelInvite,
        checkLimits,
        canAddUser,
        canAddObra,
        canUploadFile,
        hasFeature,
        canManageUsers,
        canManageSettings,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant deve ser usado dentro de um TenantProvider');
    }
    return context;
}

export default TenantContext;