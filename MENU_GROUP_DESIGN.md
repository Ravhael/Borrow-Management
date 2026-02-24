# User Role Menu Design - Updated

## Overview
This document outlines the menu structure for different user roles in the Loan Management System. Each role has specific access permissions and menu items tailored to their responsibilities.

## User Roles and Menu Structure

### 👤 User [nama user]
Basic user role with access to personal loan management features.

- **user/dashboard** - Personal dashboard showing loan status and recent activities
- **user/formpeminjaman** - Submit new loan requests
- **user/datapeminjaman** - View personal loan history and status
- **user/profile** - Manage personal profile and account settings

---

### 📊 Marketing [nama marketing]
Marketing team role responsible for loan approvals and borrower management.

- **marketing/dashboard** - Marketing dashboard with loan statistics and pending approvals
- **marketing/formpeminjaman** - Create loan requests on behalf of borrowers
- **marketing/persetujuan** - Approve/reject loan applications
- **marketing/datapeminjaman** - View all borrower loan data and history
- **marketing/profile** - Manage marketing team profile and settings

---

### 📦 Gudang [nama staf gudang]
Warehouse staff role managing physical loan items and inventory.

- **gudang/dashboard** - Warehouse dashboard with inventory status and loan pickups
- **gudang/formpeminjaman** - Create loan requests
- **gudang/peminjamangudang** - Manage warehouse loan operations and returns
- **gudang/profile** - Manage warehouse staff profile and settings

---

### ⚙️ Administrator [nama admin]
System administrator with full access to all system features and configurations.

- **admin/profile** - Manage administrator profile and settings
- **admin/administratordashboard** - System-wide dashboard with comprehensive analytics
- **admin/formpeminjaman** - Full access to all loan request forms and management
- **admin/datapeminjaman** - Complete access to all loan data across the system
- **admin/persetujuan** - Administrative approval and override capabilities
- **admin/peminjamangudang** - Full warehouse management and inventory control
- **admin/dataentitas** - Manage entity/organization data and configurations
- **admin/datacompany** - Manage company data and email mappings
- **admin/reminder** - Configure and manage automated reminder systems
- **admin/mailsetting** - Configure email settings and notification templates

## Menu Access Matrix

| Feature | User | Marketing | Gudang | Administrator |
|---------|------|-----------|--------|---------------|
| Dashboard | ✅ Personal | ✅ Marketing | ✅ Warehouse | ✅ System-wide |
| Form Peminjaman | ✅ Submit | ✅ Create | ✅ View | ✅ Full Access |
| Data Peminjaman | ✅ Personal | ✅ All | ❌ | ✅ Full Access |
| Persetujuan | ❌ | ✅ Approve | ❌ | ✅ Admin Override |
| Gudang Operations | ❌ | ❌ | ✅ Manage | ✅ Full Control |
| Entity Management | ❌ | ❌ | ❌ | ✅ Configure |
| Company Management | ❌ | ❌ | ❌ | ✅ Configure |
| Reminder System | ❌ | ❌ | ❌ | ✅ Configure |
| Mail Settings | ❌ | ❌ | ❌ | ✅ Configure |
| Profile Management | ✅ Personal | ✅ Team | ✅ Staff | ✅ Admin |

## URL Structure
All menu items follow the pattern: `/{role}/{feature}`

### Examples:
- User Dashboard: `/user/dashboard`
- Marketing Approval: `/marketing/persetujuan`
- Warehouse Operations: `/gudang/peminjamangudang`
- Admin Settings: `/admin/mailsetting`

## Implementation Notes

### Role-Based Access Control
- Each role has specific menu items based on their responsibilities
- Menu items should be conditionally rendered based on user authentication
- API endpoints should validate user permissions for each feature

### Navigation Structure
- Sidebar displays all role menus with clear grouping
- Each role section has a distinct header with emoji icon
- Active menu highlighting for current page navigation

### Future Enhancements
- Sub-menu grouping for complex features
- Quick action buttons in dashboard views
- Search functionality across menu items
- Keyboard shortcuts for power users
- Mobile-responsive menu design

## Technical Implementation

### File Structure
```
pages/
├── user/
│   ├── dashboard.tsx
│   ├── formpeminjaman.tsx
│   ├── datapeminjaman.tsx
│   └── profile.tsx
├── marketing/
│   ├── dashboard.tsx
│   ├── formpeminjaman.tsx
│   ├── persetujuan.tsx
│   ├── datapeminjaman.tsx
│   └── profile.tsx
├── gudang/
│   ├── dashboard.tsx
│   ├── formpeminjaman.tsx
│   ├── peminjamangudang.tsx
│   └── profile.tsx
└── admin/
    ├── profile.tsx
    ├── administratordashboard.tsx
    ├── formpeminjaman.tsx
    ├── datapeminjaman.tsx
    ├── persetujuan.tsx
    ├── peminjamangudang.tsx
    ├── dataentitas.tsx
    ├── datacompany.tsx
    ├── reminder.tsx
    └── mailsetting.tsx
```

### Component Structure
- `Sidebar.tsx` - Main navigation component with role-based menu display
- `Layout.tsx` - Page layout wrapper with sidebar integration
- Role-specific page components for each menu item

### Authentication Integration
- Implement user role detection in authentication context
- Pass role information to Sidebar component
- Conditionally render menu items based on user permissions