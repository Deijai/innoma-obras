import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/types';
import React, { createContext, useContext, useMemo } from 'react';

// Definição de permissões por funcionalidade
export enum Permission {
  // Obras
  CREATE_OBRA = 'obras:create',
  EDIT_OBRA = 'obras:edit',
  DELETE_OBRA = 'obras:delete',
  VIEW_OBRA = 'obras:view',
  
  // Tarefas
  CREATE_TAREFA = 'tarefas:create',
  EDIT_TAREFA = 'tarefas:edit',
  DELETE_TAREFA = 'tarefas:delete',
  ASSIGN_TAREFA = 'tarefas:assign',
  COMPLETE_TAREFA = 'tarefas:complete',
  VIEW_TAREFA = 'tarefas:view',
  
  // Equipe
  MANAGE_EQUIPE = 'equipe:manage',
  INVITE_MEMBERS = 'equipe:invite',
  REMOVE_MEMBERS = 'equipe:remove',
  VIEW_EQUIPE = 'equipe:view',
  
  // Financeiro
  VIEW_FINANCEIRO = 'financeiro:view',
  EDIT_FINANCEIRO = 'financeiro:edit',
  APPROVE_EXPENSES = 'financeiro:approve',
  VIEW_DETAILED_COSTS = 'financeiro:view_detailed',
  
  // Diário
  CREATE_DIARIO = 'diario:create',
  EDIT_DIARIO = 'diario:edit',
  APPROVE_DIARIO = 'diario:approve',
  VIEW_DIARIO = 'diario:view',
  
  // Materiais
  MANAGE_MATERIAIS = 'materiais:manage',
  VIEW_ESTOQUE = 'materiais:view_estoque',
  EDIT_ESTOQUE = 'materiais:edit_estoque',
  
  // Documentos
  UPLOAD_DOCUMENTOS = 'documentos:upload',
  DELETE_DOCUMENTOS = 'documentos:delete',
  VIEW_DOCUMENTOS = 'documentos:view',
  
  // Relatórios
  VIEW_REPORTS = 'reports:view',
  EXPORT_REPORTS = 'reports:export',
  
  // Configurações
  MANAGE_OBRA_SETTINGS = 'settings:obra',
  MANAGE_SYSTEM_SETTINGS = 'settings:system',
}

// Mapeamento de perfis para permissões
const ROLE_PERMISSIONS: Record<UserProfile, Permission[]> = {
  admin: [
    // Admin tem todas as permissões
    ...Object.values(Permission),
  ],
  
  engenheiro: [
    // Obras
    Permission.CREATE_OBRA,
    Permission.EDIT_OBRA,
    Permission.DELETE_OBRA,
    Permission.VIEW_OBRA,
    
    // Tarefas
    Permission.CREATE_TAREFA,
    Permission.EDIT_TAREFA,
    Permission.DELETE_TAREFA,
    Permission.ASSIGN_TAREFA,
    Permission.COMPLETE_TAREFA,
    Permission.VIEW_TAREFA,
    
    // Equipe
    Permission.MANAGE_EQUIPE,
    Permission.INVITE_MEMBERS,
    Permission.REMOVE_MEMBERS,
    Permission.VIEW_EQUIPE,
    
    // Financeiro
    Permission.VIEW_FINANCEIRO,
    Permission.EDIT_FINANCEIRO,
    Permission.APPROVE_EXPENSES,
    Permission.VIEW_DETAILED_COSTS,
    
    // Diário
    Permission.CREATE_DIARIO,
    Permission.EDIT_DIARIO,
    Permission.APPROVE_DIARIO,
    Permission.VIEW_DIARIO,
    
    // Materiais
    Permission.MANAGE_MATERIAIS,
    Permission.VIEW_ESTOQUE,
    Permission.EDIT_ESTOQUE,
    
    // Documentos
    Permission.UPLOAD_DOCUMENTOS,
    Permission.DELETE_DOCUMENTOS,
    Permission.VIEW_DOCUMENTOS,
    
    // Relatórios
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    
    // Configurações
    Permission.MANAGE_OBRA_SETTINGS,
  ],
  
  mestre: [
    // Obras (apenas visualização)
    Permission.VIEW_OBRA,
    
    // Tarefas
    Permission.CREATE_TAREFA,
    Permission.EDIT_TAREFA,
    Permission.ASSIGN_TAREFA,
    Permission.COMPLETE_TAREFA,
    Permission.VIEW_TAREFA,
    
    // Equipe
    Permission.VIEW_EQUIPE,
    
    // Financeiro (limitado)
    Permission.VIEW_FINANCEIRO,
    
    // Diário
    Permission.CREATE_DIARIO,
    Permission.EDIT_DIARIO,
    Permission.VIEW_DIARIO,
    
    // Materiais
    Permission.VIEW_ESTOQUE,
    Permission.EDIT_ESTOQUE,
    
    // Documentos
    Permission.UPLOAD_DOCUMENTOS,
    Permission.VIEW_DOCUMENTOS,
    
    // Relatórios (limitado)
    Permission.VIEW_REPORTS,
  ],
  
  operador: [
    // Obras (apenas visualização)
    Permission.VIEW_OBRA,
    
    // Tarefas
    Permission.COMPLETE_TAREFA,
    Permission.VIEW_TAREFA,
    
    // Equipe
    Permission.VIEW_EQUIPE,
    
    // Diário
    Permission.CREATE_DIARIO,
    Permission.VIEW_DIARIO,
    
    // Materiais
    Permission.VIEW_ESTOQUE,
    
    // Documentos
    Permission.UPLOAD_DOCUMENTOS,
    Permission.VIEW_DOCUMENTOS,
  ],
  
  visitante: [
    // Apenas visualização limitada
    Permission.VIEW_OBRA,
    Permission.VIEW_TAREFA,
    Permission.VIEW_EQUIPE,
    Permission.VIEW_DIARIO,
    Permission.VIEW_DOCUMENTOS,
  ],
};

// Context interface
interface PermissionsContextType {
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessRoute: (routeName: string) => boolean;
  getUserRole: () => UserProfile | null;
  isAdmin: () => boolean;
  isEngenheiro: () => boolean;
  isMestre: () => boolean;
  isOperador: () => boolean;
  isVisitante: () => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Mapeamento de rotas para permissões necessárias
const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // Obras
  '/obras': [Permission.VIEW_OBRA],
  '/obras/criar': [Permission.CREATE_OBRA],
  '/obras/[id]': [Permission.VIEW_OBRA],
  '/obras/[id]/editar': [Permission.EDIT_OBRA],
  '/obras/[id]/configuracoes': [Permission.MANAGE_OBRA_SETTINGS],
  
  // Tarefas
  '/obras/[id]/tarefas': [Permission.VIEW_TAREFA],
  '/obras/[id]/tarefas/criar': [Permission.CREATE_TAREFA],
  
  // Equipe
  '/obras/[id]/equipe': [Permission.VIEW_EQUIPE],
  '/equipe': [Permission.VIEW_EQUIPE],
  '/equipe/convidar': [Permission.INVITE_MEMBERS],
  
  // Financeiro
  '/obras/[id]/financeiro': [Permission.VIEW_FINANCEIRO],
  '/financeiro': [Permission.VIEW_FINANCEIRO],
  
  // Diário
  '/obras/[id]/diario': [Permission.VIEW_DIARIO],
  '/diario': [Permission.VIEW_DIARIO],
  
  // Materiais
  '/obras/[id]/materiais': [Permission.VIEW_ESTOQUE],
  '/materiais': [Permission.VIEW_ESTOQUE],
  
  // Documentos
  '/obras/[id]/documentos': [Permission.VIEW_DOCUMENTOS],
  '/documentos': [Permission.VIEW_DOCUMENTOS],
  
  // Relatórios
  '/relatorios': [Permission.VIEW_REPORTS],
  
  // Configurações
  '/configuracoes': [Permission.MANAGE_SYSTEM_SETTINGS],
  '/perfil': [], // Qualquer usuário logado pode acessar
};

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Calcular permissões baseadas no perfil do usuário
  const permissions = useMemo(() => {
    if (!user || !user.perfil) return [];
    return ROLE_PERMISSIONS[user.perfil] || [];
  }, [user?.perfil]);

  // Verificar se tem uma permissão específica
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  // Verificar se tem pelo menos uma das permissões
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  // Verificar se tem todas as permissões
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  // Verificar se pode acessar uma rota
  const canAccessRoute = (routeName: string): boolean => {
    if (!user) return false;
    
    const requiredPermissions = ROUTE_PERMISSIONS[routeName];
    if (!requiredPermissions) return true; // Rota sem restrições
    
    if (requiredPermissions.length === 0) return true; // Qualquer usuário logado
    
    return hasAnyPermission(requiredPermissions);
  };

  // Helpers para verificar roles
  const getUserRole = (): UserProfile | null => user?.perfil || null;
  const isAdmin = (): boolean => user?.perfil === 'admin';
  const isEngenheiro = (): boolean => user?.perfil === 'engenheiro';
  const isMestre = (): boolean => user?.perfil === 'mestre';
  const isOperador = (): boolean => user?.perfil === 'operador';
  const isVisitante = (): boolean => user?.perfil === 'visitante';

  const value: PermissionsContextType = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    getUserRole,
    isAdmin,
    isEngenheiro,
    isMestre,
    isOperador,
    isVisitante,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook para usar as permissões
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions deve ser usado dentro de um PermissionsProvider');
  }
  return context;
}

// HOC para proteger componentes
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermissions: Permission[]
) {
  return function ProtectedComponent(props: T) {
    const { hasAnyPermission } = usePermissions();
    
    if (!hasAnyPermission(requiredPermissions)) {
      return null; // ou component de acesso negado
    }
    
    return <Component {...props} />;
  };
}

export default PermissionsContext;