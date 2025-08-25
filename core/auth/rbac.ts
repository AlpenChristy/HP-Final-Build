// File: core/auth/rbac.ts
// Note: keep types loose to avoid coupling; integrate with your actual Auth types if needed

// Define the known permission keys used in the app
export type AdminPermissionKey = 'orders' | 'products' | 'delivery' | 'users';

export type AdminRouteName =
  | 'admindashboard'
  | 'adminordersmanagement'
  | 'adminproductmanagement'
  | 'admindeliverymanagement'
  | 'adminprofile';

export const routePermissionMap: Partial<Record<AdminRouteName, AdminPermissionKey>> = {
  adminordersmanagement: 'orders',
  adminproductmanagement: 'products',
  admindeliverymanagement: 'delivery',
  // admindashboard and adminprofile are always allowed
};

export function isFullAdmin(session?: any | null) {
  return !!session && session.role === 'admin';
}

export function hasPermission(session: any | null | undefined, perm: AdminPermissionKey): boolean {
  if (!session) return false;
  if (isFullAdmin(session)) return true;
  const perms = (session as any).permissions as Record<string, boolean> | undefined;
  return !!perms && perms[perm] === true;
}

export function isRouteAllowed(session: any | null | undefined, route: AdminRouteName): boolean {
  if (!session) return false;
  if (isFullAdmin(session)) return true;
  const required = routePermissionMap[route];
  if (!required) return true; // routes without a mapping are public to admin/sub-admin
  return hasPermission(session, required);
}

export function firstAllowedAdminRoute(session: any | null | undefined): AdminRouteName {
  // Preference order for sub-admins
  const ordered: AdminRouteName[] = [
    'admindashboard',
    'adminordersmanagement',
    'adminproductmanagement',
    'admindeliverymanagement',
    'adminprofile',
  ];
  for (const r of ordered) {
    if (isRouteAllowed(session, r)) return r;
  }
  // Fallback (profile should always be available)
  return 'adminprofile';
}
