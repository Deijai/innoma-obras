// src/contexts/index.ts
// ========================================
// EXPORTAÇÃO CENTRALIZADA DE CONTEXTS
// ========================================

// Autenticação
export { AuthProvider, useAuth } from './AuthContext';

// Rede
export { NetworkProvider, useNetwork } from './NetworkContext';

// Tema
export { ThemeProvider, useTheme } from './ThemeContext';

// Permissões
export {
    Permission,
    PermissionsProvider,
    usePermissions,
    withPermissions
} from './PermissionsContext';

// Tenant (multi-empresa) - quando implementado
// export { TenantProvider, useTenant } from './TenantContext';