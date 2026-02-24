# User Role Menu Design

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

## Implementation Notes

### URL Structure
- All menu items follow the pattern: `/{role}/{feature}`
- Administrator routes use `/admin/` prefix
- Other roles use their role name as prefix

### Access Control
- Role-based authentication required for all menu access
- Menu items should be conditionally rendered based on user role
- API endpoints should validate user permissions

### Navigation
- Sidebar should dynamically show menu items based on user role
- Breadcrumb navigation for better user experience
- Active menu highlighting for current page

### Future Enhancements
- Sub-menu grouping for complex features
- Quick action buttons in dashboard
- Search functionality across menu items
- Keyboard shortcuts for power users