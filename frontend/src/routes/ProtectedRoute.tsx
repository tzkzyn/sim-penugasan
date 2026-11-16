import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

type RequiredRole = 'super-admin' | 'admin' | 'anggota' | 'approval' | 'user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: RequiredRole;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const normalizedRole = user?.role?.toUpperCase() || 'USER';
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';
  const isAdmin = normalizedRole === 'ADMIN';
  const isApproval = normalizedRole === 'APPROVAL';
  const isUser = normalizedRole === 'USER' || normalizedRole === 'PEGAWAI';

  const getRoleDashboard = () => {
    if (isSuperAdmin) return '/super-admin/dashboard';
    if (isAdmin) return '/admin/dashboard';
    if (isApproval) return '/approval/dashboard';
    return '/user/dashboard';
  };

  if (requiredRole === 'super-admin' && !isSuperAdmin) {
    return <Navigate to={getRoleDashboard()} replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to={getRoleDashboard()} replace />;
  }

  if (requiredRole === 'approval' && !isApproval) {
    return <Navigate to={getRoleDashboard()} replace />;
  }

  if ((requiredRole === 'user' || requiredRole === 'anggota') && !isUser) {
    return <Navigate to={getRoleDashboard()} replace />;
  }

  return <>{children}</>;
};
