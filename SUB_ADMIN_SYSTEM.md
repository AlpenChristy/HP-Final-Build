# Sub-Admin Management System

This document describes the sub-admin management system implemented in the HP Gas app.

## Overview

The sub-admin system allows main administrators to create and manage sub-administrator accounts with granular permissions. Sub-admins use the same admin interface but can only access the modules they have been granted permission for.

## Features

### For Admins:
- Create sub-admin accounts with email and password
- Set granular permissions for each sub-admin
- Edit existing sub-admin permissions
- Deactivate/delete sub-admin accounts
- View all created sub-admins
- Full access to sub-admin management

### For Sub-Admins:
- Login with email and password
- Access the same admin interface with filtered permissions
- Only see tabs for permitted modules
- Automatically routed to their first available module
- Profile management with logout functionality
- No access to sub-admin management features
- No access to dashboard (reserved for full admins)

## Permissions System

Sub-admins can be granted access to the following modules:

1. **Orders Management** - Manage customer orders
2. **Products Management** - Manage product catalog
3. **Delivery Management** - Manage delivery agents

**Note:** Dashboard access is reserved for full administrators only. Sub-admins are automatically routed to their first available permitted module.

## File Structure

```
core/
├── auth/
│   └── AdminProtectedRoute.tsx       # Updated to allow both admin and sub-admin
├── services/
│   └── subAdminService.ts            # Sub-admin CRUD operations
└── session/
    └── sessionManager.ts             # Updated with permissions support

app/
├── admin/
│   ├── _layout.tsx                   # Updated with permission-based tab filtering
│   ├── admindashboard.tsx            # Dashboard (admin only)
│   ├── adminprofile.tsx              # Updated with sub-admin management
│   ├── adminordersmanagement.tsx     # Accessible with orders permission
│   ├── adminproductmanagement.tsx    # Accessible with products permission
│   └── admindeliverymanagement.tsx   # Accessible with delivery permission
└── index.tsx                         # Updated routing for sub-admins
```

## Database Structure

### Users Collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'sub-admin',
  phoneNumber?: string,
  createdAt: number,
  updatedAt: number
}
```

### SubAdmins Collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  phoneNumber?: string,
  role: 'sub-admin',
  permissions: {
    dashboard: boolean,
    orders: boolean,
    delivery: boolean,
    products: boolean
  },
  createdBy: string,        // Admin UID who created this sub-admin
  createdAt: number,
  updatedAt: number,
  isActive: boolean
}
```

## Usage

### Creating a Sub-Admin (Admin Interface)

1. Navigate to Admin Profile
2. Click "Sub-admin Management"
3. Click "Add New Sub-admin"
4. Fill in details:
   - Name (required)
   - Email (required)
   - Phone Number (optional)
   - Password (required for new accounts)
5. Set permissions using toggles
6. Click "Create Sub-admin"

### Sub-Admin Login

Sub-admins login using the same authentication screen as other users. The system automatically redirects them to the admin interface where they are routed to their first available permitted module.

### Permission-Based Access

- Sub-admins use the same admin interface but with filtered navigation
- Only tabs for permitted modules are visible in the tab bar
- Dashboard tab is hidden from sub-admins (admin only)
- Sub-admins are routed to their first available permitted module
- Sub-admin management is hidden from sub-admin users
- Profile screen is always accessible for logout functionality

## Security Features

- Firebase Authentication for secure login
- Role-based access control
- Permission-based route protection
- Session management with permissions
- Soft delete for sub-admin accounts (deactivation)

## API Methods

### SubAdminService

- `createSubAdmin(adminUid, subAdminData)` - Create new sub-admin
- `getSubAdminsByAdmin(adminUid)` - Get all sub-admins created by an admin
- `getSubAdminById(uid)` - Get sub-admin data by UID
- `updateSubAdminPermissions(uid, permissions)` - Update permissions
- `updateSubAdminProfile(uid, profileData)` - Update profile
- `deactivateSubAdmin(uid)` - Soft delete sub-admin
- `deleteSubAdmin(uid)` - Hard delete sub-admin
- `hasPermission(subAdmin, permission)` - Check permission
- `getAllowedScreens(permissions)` - Get allowed screens

### Admin Layout (`_layout.tsx`)

- `hasPermission(permission)` - Check if current user has specific permission
- Dynamic tab filtering based on user role and permissions
- Full admin sees all tabs, sub-admin sees only permitted tabs

## Testing

A test script is provided at `scripts/createTestSubAdmin.js` to create a test sub-admin account for development purposes.

## Future Enhancements

- Password reset functionality for sub-admins
- Audit logs for sub-admin actions
- Time-based access restrictions
- IP-based access controls
- Bulk permission management
- Sub-admin activity monitoring