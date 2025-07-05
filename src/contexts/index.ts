// src/contexts/index.ts
// Exportar todos os contexts para facilitar imports

export { AuthProvider, useAuth } from './AuthContext';
export { NetworkProvider, useNetwork } from './NetworkContext';
export {
    Permission, PermissionsProvider,
    usePermissions, withPermissions
} from './PermissionsContext';
export { ThemeProvider, useTheme } from './ThemeContext';
