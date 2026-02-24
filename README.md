<div align="center">

# 📋 Borrow Management System

**A full-featured borrowing & asset management platform built with Next.js**

[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![MUI](https://img.shields.io/badge/MUI-7.x-007FFF?style=for-the-badge&logo=mui)](https://mui.com/)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

**Borrow Management System** is an enterprise-grade web application for managing
asset borrowing workflows within an organization. It supports multi-role access
control, automated email notifications, Google Sheets integration, and a
complete approval pipeline — from loan submission to warehouse processing and
return management.

---

## ✨ Features

| Feature                          | Description                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| 📝 **Loan Submission**           | Users can submit borrowing requests with complete form validation                    |
| ✅ **Approval Workflow**         | Multi-stage approval: Marketing → Warehouse → Admin                                  |
| 📧 **Email Notifications**       | Automated emails for every status change (submit, approve, reject, reminder, return) |
| 📊 **Google Sheets Integration** | Form data automatically synced to Google Spreadsheet via Apps Script                 |
| 🔐 **Role-Based Access Control** | Granular permissions per user role                                                   |
| 📦 **Warehouse Management**      | Dedicated warehouse dashboard for processing returns and stock                       |
| 📈 **Reporting & Analytics**     | Loan statistics, export to Excel, and visual charts                                  |
| 🔔 **Reminder System**           | Automated due-date reminders before and after loan deadlines                         |
| 🌐 **Responsive Design**         | Fully responsive UI built with Material UI + Tailwind CSS                            |

---

## 🛠️ Tech Stack

### Frontend

- **[Next.js 15](https://nextjs.org/)** — React framework with SSR/SSG
- **[React 18](https://react.dev/)** — UI library
- **[Material UI (MUI) v7](https://mui.com/)** — Component library
- **[Chakra UI v3](https://chakra-ui.com/)** — Supplementary UI components
- **[Framer Motion](https://www.framer.com/motion/)** — Animations
- **[Recharts](https://recharts.org/)** — Data visualization
- **[Tailwind CSS v3](https://tailwindcss.com/)** — Utility-first CSS

### Backend

- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** —
  Serverless API endpoints
- **[NextAuth.js v4](https://next-auth.js.org/)** — Authentication & session
  management
- **[Prisma ORM v5](https://www.prisma.io/)** — Database access layer
- **[Nodemailer](https://nodemailer.com/)** — Email delivery (SMTP)
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** — Password hashing

### Integrations

- **[Google Apps Script](https://developers.google.com/apps-script)** — Google
  Sheets data sync
- **[Google Sheets API](https://developers.google.com/sheets/api)** —
  Spreadsheet read/write

---

## 👥 User Roles

| Role                 | Access Level                                                    |
| -------------------- | --------------------------------------------------------------- |
| 🔴 **Super Admin**   | Full system access, user management, system settings            |
| 🟠 **Administrator** | Admin dashboard, Mail settings, Google Sheets config, approvals |
| 🟡 **Marketing**     | Loan submission, approval review, loan tracking                 |
| 🟢 **Warehouse**     | Warehouse dashboard, return processing, inventory view          |
| 🔵 **User**          | Basic loan form access and personal loan history                |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** >= 18.x
- **npm** >= 9.x
- A supported **SQL database** (configured via `DATABASE_URL`)
- An **SMTP mail server** for email notifications

### 1. Clone the Repository

```bash
git clone https://github.com/Ravhael/Borrow-Management.git
cd Borrow-Management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

> ⚠️ **Important:** Never commit `.env` files to version control.

Key environment variables:

```env
# Database
DATABASE_URL="your-database-connection-string"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email (SMTP)
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT=587
SMTP_USER="your@email.com"
SMTP_PASS="your-password"

# App
BASE_URL="http://localhost:3000"
```

### 4. Set Up the Database

Run database migrations and seed initial data:

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed the database with default data
npm run seed-db
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Available Scripts

| Command                             | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| `npm run dev`                       | Start development server                       |
| `npm run build`                     | Build for production                           |
| `npm run start`                     | Start production server                        |
| `npm run start:prod`                | Start production server on port 3002           |
| `npm run seed-db`                   | Seed database from `data/*.json` snapshots     |
| `npm run checkpoint-db`             | Export current DB into `data/*.json` snapshots |
| `npm run checkpoint-and-commit`     | Export + auto-commit DB snapshots              |
| `npm run restore-default-db`        | Restore database from `data/*.json` snapshots  |
| `npm run hash-passwords`            | Hash existing plain-text passwords in DB       |
| `npm run reset-superadmin-password` | Reset super admin password                     |
| `npm run migrate:deploy`            | Run Prisma migrations in production            |

---

## 🔌 API Reference

### Authentication

| Method | Endpoint                  | Description                |
| ------ | ------------------------- | -------------------------- |
| `POST` | `/api/auth/[...nextauth]` | NextAuth.js authentication |
| `POST` | `/api/forgot-password`    | Request password reset     |
| `POST` | `/api/reset-password`     | Reset password with token  |

### Loans

| Method    | Endpoint          | Description               |
| --------- | ----------------- | ------------------------- |
| `POST`    | `/api/submit`     | Submit a new loan request |
| `GET`     | `/api/loans`      | Get all loans             |
| `GET/PUT` | `/api/loans/[id]` | Get or update a loan      |

### Admin

| Method     | Endpoint               | Description                 |
| ---------- | ---------------------- | --------------------------- |
| `GET/POST` | `/api/google-settings` | Manage Google Sheets config |
| `GET/POST` | `/api/mail-settings`   | Manage SMTP mail settings   |
| `GET/POST` | `/api/users`           | User management             |

### Data

| Method | Endpoint             | Description              |
| ------ | -------------------- | ------------------------ |
| `GET`  | `/api/company`       | Get company list         |
| `GET`  | `/api/entitas`       | Get entity/division list |
| `GET`  | `/api/notifications` | Get notifications        |

---

## 🔗 Google Sheets Integration

To enable automatic data sync to Google Sheets:

1. Follow the detailed guide in
   [`GOOGLE_SHEETS_SETUP.md`](./GOOGLE_SHEETS_SETUP.md)
2. Deploy your **Google Apps Script** from
   [`google-apps-script-example.js`](./google-apps-script-example.js)
3. Log in as **Administrator** and navigate to `/admin/appscript-config`
4. Configure your **Spreadsheet ID** and **Apps Script Web App URL**
5. Enable the integration — form submissions will now sync automatically

---

## 🗄️ Database Management

### Data Snapshots

The project maintains JSON snapshots under `data/*.json` for bootstrapping:

```
data/
├── users.json           # User accounts
├── roles.json           # Role definitions
├── directorates.json    # Directorate data
├── entitas.json         # Entity/division data
├── mail-settings.json   # SMTP configuration snapshot
└── appscript-config.json # Google Sheets config snapshot
```

> ⚠️ These snapshot files are **read-only at runtime**. The database is the
> source of truth. Regenerate snapshots using `npm run checkpoint-db`.

### Checkpoint Workflow

```bash
# 1. Export live DB → snapshot files
npm run checkpoint-db

# 2. Export + commit to git automatically
npm run checkpoint-and-commit

# 3. Restore DB from snapshots
npm run restore-default-db
```

---

## 📧 Email System

The app sends automated emails for the following events:

- 📨 **Loan Submitted** — confirmation to borrower
- ✅ **Loan Approved** — notification to borrower
- ❌ **Loan Rejected** — notification with reason
- 🔄 **Extension Requested / Approved / Rejected** — for loan extensions
- 📦 **Return Processed** — warehouse return confirmation
- ⏰ **Reminder Before Due** — automated pre-deadline reminder
- ⚠️ **Reminder After Due** — overdue notification

### Email Minification

HTML emails are minified in production to reduce payload size. Control this via:

```env
EMAIL_MINIFY=false   # Disable minification (useful for debugging)
```

> If `EMAIL_MINIFY` is not set, minification is **enabled in production** and
> **disabled in development** by default.

---

## 📁 Project Structure

```
├── components/          # Reusable React components
│   ├── peminjaman/      # Loan-related components
│   ├── dashboard/       # Dashboard components (per role)
│   └── ...
├── pages/               # Next.js page routes
│   ├── api/             # API route handlers
│   ├── admin/           # Admin pages
│   ├── gudang/          # Warehouse pages
│   ├── marketing/       # Marketing pages
│   └── ...
├── prisma/              # Prisma schema & migrations
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Database seeder
│   └── migrations/      # Migration history
├── utils/               # Utility functions & email templates
│   └── email-templates/ # HTML email templates
├── types/               # TypeScript type definitions
├── themes/              # MUI theme configurations (per role)
├── data/                # JSON data snapshots
├── scripts/             # DevOps & maintenance scripts
├── public/              # Static assets
└── styles/              # Global CSS
```

---

## 🔒 Security

- Passwords are hashed using **bcryptjs** before storage
- Session management via **NextAuth.js** with JWT/database sessions
- Route-level protection via **Next.js middleware**
- Role-based API authorization on every protected endpoint
- Environment variables for all sensitive configuration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is **private** and proprietary. All rights reserved.

---

<div align="center">

Made with ❤️ by **Ravhael**

</div>
