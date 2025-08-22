// Updated File: app/admin/_layout.tsx
import { AdminProtectedRoute } from '../../core/auth/AdminProtectedRoute';
import { StableAdminLayout } from '../../core/auth/StableAdminLayout';

export default function AdminTabLayout() {
  return (
    <AdminProtectedRoute>
      <StableAdminLayout />
    </AdminProtectedRoute>
  );
}
