# Noviq — Platform Overview

> A full-stack work order management system with granular role-based access control (RBAC), built for field service operations. It covers the entire job lifecycle — from inspection and proposal to technician dispatch, payment, invoicing, and profit/loss analysis.

---

## Table of Contents

1. [How to Get In](#1-how-to-get-in)
2. [Dashboard](#2-dashboard)
3. [Work Orders](#3-work-orders)
4. [Proposals](#4-proposals)
5. [Job Inspections](#5-job-inspections)
6. [Parts Requests](#6-parts-requests)
7. [Technicians](#7-technicians)
8. [Teams](#8-teams)
9. [Client Payments](#9-client-payments)
10. [Technician Payments](#10-technician-payments)
11. [Payment Manager](#11-payment-manager)
12. [Invoices](#12-invoices)
13. [Financial Analysis](#13-financial-analysis)
14. [Analytics & Reports](#14-analytics--reports)
15. [Users & Roles (RBAC)](#15-users--roles-rbac)
16. [Notifications](#16-notifications)
17. [Architecture & Tech Stack](#17-architecture--tech-stack)

---

## 1. How to Get In

The platform uses **session-based authentication**. You log in with a username or email and password. Passwords are hashed using bcrypt — no plain-text passwords are ever stored.

- The default admin account is `admin` / `admin123`
- All routes are protected — you are redirected to login if your session expires
- Sessions are stored in PostgreSQL (`connect-pg-simple`), so they survive server restarts

---

## 2. Dashboard

The first screen you see after login. It gives a real-time operational snapshot.

### What's on it:

| Card | What it shows |
|---|---|
| Total Users | Number of system users |
| Active Roles | Roles currently in use |
| Technicians | Registered field technicians |
| Work Orders | Total work orders in the system |

- **Progress bar** — shows your personal completion progress based on your role (admin sees overall WO completion rate, managers see team metrics, others see their own tasks)
- **Recent Activity feed** — a timeline of system events: new users added, work orders created, roles updated, technicians added
- **Personalized greeting** — the dashboard adapts its language based on who is logged in

---

## 3. Work Orders

The core of the platform. A work order (WO) represents a job from start to finish.

### Work Order List

- Shows all WOs in a table with number, title, priority, status, assigned team, and technician
- Filter by status: `pending`, `in_progress`, `completed`, `rejected`, `cancelled`
- Search by work order number, title, or category
- Color-coded priority badges: 🔴 High, 🟡 Medium, 🟢 Low, ⚡ Urgent
- **⚡ FAST TRACK** amber badge on work orders that skip the proposal step

### Creating a Work Order

Fill in:
- Title, description, category, priority
- Location (address)
- Assign to a team and/or individual technician
- NTE (Not-To-Exceed) cost limit
- Option to mark as **Fast Work Order** (bypasses proposal, goes straight to active)

### Work Order Detail Modal (7 tabs)

Each WO opens a full-screen modal with tabs. Which tabs you see depends on your permissions.

#### Overview Tab
- Full job details: description, location, dates, assigned people
- **7-Step Progress Tracker** — color-coded circles showing exactly where the job is:
  1. ✅ Created
  2. 📋 Proposal
  3. 🔧 Parts
  4. 💰 Tech Payment
  5. 🧾 Invoice
  6. 💳 Client Payment
  7. 🏁 Completed
- Animated progress bar connecting the steps
- **Reject button** — opens a confirmation dialog; once rejected the WO is locked and all tabs go read-only
- **Fast Work Order button** — instantly promotes a pending WO to active, skipping proposal

#### Proposal Tab
- Shows the current proposal (if any): NTE, technician cost (TNTE), scope, status
- Approve / Reject proposal buttons
- If the WO is fast-tracked, shows a notice that proposal is skipped

#### Financial Tab
- Breakdown of client payments, technician costs, parts costs
- Shows profit/loss for this specific WO
- Revenue vs. cost summary

#### Invoice Tab
- View and manage the invoice linked to this WO
- Invoice details include line items, tax calculation, total amount
- Print/download invoice as HTML

#### Parts Tab
- All parts requested for this WO
- Status of each part request: `pending`, `ordered`, `received`, `cancelled`

#### Files Tab
- Upload and manage files associated with the WO
- Supports: photos, PDFs, documents, W9 forms
- File type labels and download links

#### Chat Tab
- Internal message thread for this WO
- Real-time conversation between staff members
- Timestamps on every message

#### Payment Tab
- Manage client payments for this specific WO
- Record down payments, full payments, or partial payments
- Choose payment method: cash, check, credit card, bank transfer, other
- Confirm received payments
- W9 requirement gate: if total technician payments exceed **$500**, a W9 document must be on file before payment can be processed

### Work Order Statuses

| Status | Meaning |
|---|---|
| `pending` | Created, waiting for proposal |
| `in_progress` | Active / being worked on |
| `completed` | Job done |
| `rejected` | Rejected and locked — no further changes |
| `cancelled` | Cancelled |

---

## 4. Proposals

A proposal is the cost estimate submitted before a job begins.

### Proposal List Page

Two tabs:
1. **Request Proposals** — WOs that need a proposal created
2. **Existing Proposals** — all proposals with their status

### Creating a Proposal

From the work order details or the proposals page. Fields include:
- Scope of work description
- NTE amount (Not-To-Exceed — the client-facing budget cap)
- TNTE amount (Technician NTE — the internal technician cost cap)
- Both NTE and TNTE can be left blank/null if unknown

### Proposal Statuses

| Status | Meaning |
|---|---|
| `pending` | Waiting for admin approval |
| `approved` | Approved — job can proceed |
| `rejected` | Rejected — needs revision |

### Summary Stats (top of page)

- Total proposals, pending count, approved count, rejected count
- Total approved value ($)

---

## 5. Job Inspections

A pre-job site assessment. Technicians or staff visit the site before work begins and fill out an inspection.

### What's Captured

- **Overview Status** — one of three outcomes:
  - `NT` — No work needed / Not taken
  - `Agreed on Site` — Agreement reached on-site
  - `Needs Proposal` — A formal proposal is required
- **Before Photos** — photo uploads attached to the inspection record
- **Scope of Work** — written description of what was observed
- **Technician Requirements** — notes on what resources or skills are needed
- **Admin Notes** — internal notes added by admin after reviewing

### Admin Workflow

- Admin can update the **Submission Status** of an inspection:
  - `pending`, `reviewed`, `approved`, `rejected`
- A dedicated panel shows all inspections that have `Needs Proposal` status — prompting the admin to create a proposal

---

## 6. Parts Requests

Track parts and materials needed for jobs.

### Features

- Linked to a specific work order
- Each request has: part name, quantity, estimated cost, status, supplier notes
- Status workflow: `pending` → `ordered` → `received` (or `cancelled`)
- Admin can update status and add notes at each stage
- Full history of all parts requests across all WOs

---

## 7. Technicians

Manage the field workforce.

### Technician Record

Each technician has:
- First name, last name, email, phone
- Specialization (e.g., HVAC, Electrical, Plumbing, Handyman)
- Experience level
- Hourly rate
- Location (latitude/longitude)
- Rating (1–5 stars)
- Certifications list
- Active/Inactive status

### Technician Map View

A separate page (`/technician-map`) that plots all active technicians on an interactive **OpenStreetMap**. Useful for dispatching the nearest available technician to a job site.

### Rating Technicians

A rating modal lets you give a star rating and written feedback per technician after a job.

### W9 Management

Each technician has a W9 status flag. The payment system enforces that a W9 must be on file before processing payments over the **$500 threshold**.

---

## 8. Teams

Organize users into teams for structured work order assignment.

### How Teams Work

- A **Team** has a name, description, and an optional **Team Lead** (a system user)
- **Members** are system users (not technicians)
- Teams can be assigned to work orders, scoping visibility and responsibility

### Team Management

- Create / Edit / Delete teams
- Add or remove members (users) from a team
- View all members with their username and display name
- Backward compatible: existing technician-based memberships still display correctly

---

## 9. Client Payments

Track what the client is paying for the work.

### Payment Types

- **Down Payment** — partial payment collected upfront
- **Full Payment** — complete payment at once
- **Partial Payment** — any amount less than the total

### Payment Methods

- Cash, Check, Credit Card, Bank Transfer, Other

### Payment Workflow

1. Record a new payment (amount, type, method, notes)
2. Mark it as **Received** (with timestamp)
3. Payment status updates: `pending` → `confirmed`
4. All payments visible in the Work Order's Payment tab

### W9 Gate

If the total of technician payments on a work order exceeds **$500**, a W9 must be uploaded before payment processing is allowed. The system checks this automatically.

---

## 10. Technician Payments

Manage what technicians are owed and paid for their work.

### Payment Request Flow

1. A payment request is created for a technician tied to a work order
2. Admin reviews and approves or rejects the request
3. Once approved, payment can be marked as disbursed
4. W9 enforcement applies at the $500 threshold

### Fields

- Amount, description, work order reference
- Status: `pending`, `approved`, `rejected`, `paid`
- Payment method used for disbursement

---

## 11. Payment Manager

A consolidated dashboard at `/payment-manager` for managing **all** technician payment requests across the entire system in one place.

- View all pending payment requests
- Filter by status, technician, work order
- Approve / reject in bulk
- See payment history with full audit trail

---

## 12. Invoices

Generate and manage invoices sent to clients.

### Invoice Features

- Linked to a work order
- Line items with description, quantity, unit price
- **Automatic tax calculation** — configurable tax rate
- Subtotal + tax + total displayed
- Invoice number auto-generated
- Status: `draft`, `sent`, `paid`

### Printing

- Invoices can be rendered as formatted HTML and printed/downloaded directly from the browser

---

## 13. Financial Analysis

A profit & loss view across all work orders.

### Summary Cards

| Metric | Description |
|---|---|
| Total Revenue | Sum of all confirmed client payments |
| Total Profit | Revenue minus all costs |
| Total Loss | Negative-margin jobs |
| Net Profit | Overall P&L across all WOs |

### Per-Work-Order Breakdown

Each WO shows:
- Client payment received
- Technician cost
- Parts cost
- Net margin (profit or loss)
- Color-coded: green for profit, red for loss

---

## 14. Analytics & Reports

A KPI dashboard with system-wide metrics.

### KPI Cards

| Metric | What it measures |
|---|---|
| Total Work Orders | All WOs in the system |
| Total Revenue | Sum of all payments |
| Active Technicians | Currently active field staff |
| Avg Completion Time | Average days from creation to completion |
| Customer Satisfaction | Based on technician ratings |
| Profit Margin | Overall margin percentage |
| Pending Work Orders | WOs not yet completed |
| System Users | Total user accounts |

### Charts & Tabs

- **Overview** — KPI summary
- **Work Orders** — WO trends and status breakdown
- **Revenue** — Revenue over time
- **Technicians** — Technician performance metrics

---

## 15. Users & Roles (RBAC)

### User Management

Every person in the system has a user account with:
- Username, email, first name, last name
- Password (bcrypt hashed)
- Role assignment (one role per user)
- Active / Inactive status

### Role-Based Access Control

The platform uses **granular RBAC** with over **150 individual permissions** organized into categories:

| Category | Examples |
|---|---|
| Dashboard | View dashboard stats |
| User Management | Create, edit, delete users |
| Role Management | Create roles, assign permissions |
| Work Orders | View, create, edit, reject, fast-track WOs |
| Proposals | View, create, approve, reject proposals |
| Parts | View, create, update parts requests |
| Payments | View, create, confirm client/tech payments |
| Invoices | View, create, manage invoices |
| Technicians | View, add, edit, rate technicians |
| Teams | View, create, manage teams |
| Financial | View financial analysis |
| Analytics | View analytics |
| Job Inspections | View, create, admin-update inspections |
| Files | Upload, view, delete files |
| Chat | Send and view messages |

### Permission Guards

The frontend enforces permissions at multiple levels:
- **PageGuard** — hides entire pages from the sidebar
- **TabGuard** — hides individual tabs inside work order details
- **ButtonGuard** — hides action buttons (approve, reject, create, etc.)
- **ModalGuard** — hides entire modals
- **SidebarGuard** — controls sidebar navigation links

### Built-in Roles

| Role | Description |
|---|---|
| `admin` | Full access to everything |
| `manager` | Most operational features |
| `dispatcher` | Work order and technician management |
| `technician` | Limited to own work and inspections |
| `accountant` | Financial, invoices, payments |
| `viewer` | Read-only access |

---

## 16. Notifications

An in-app notification system that alerts users to important events.

- Bell icon in the top navigation bar
- Unread count badge
- Notifications for: new work orders, proposal updates, payment confirmations, status changes
- Mark as read individually or all at once
- Notifications are user-specific (each user sees their own)

---

## 17. Architecture & Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Wouter | Client-side routing |
| TanStack Query (React Query v5) | Server state, caching, real-time sync |
| React Hook Form + Zod | Form management and validation |
| shadcn/ui + Radix UI | Component library |
| Tailwind CSS | Styling |
| Lucide React | Icons |
| OpenStreetMap | Technician map view |

### Backend

| Technology | Purpose |
|---|---|
| Express.js + TypeScript | REST API server |
| Drizzle ORM | Type-safe database queries |
| PostgreSQL | Primary database |
| bcrypt | Password hashing |
| express-session | Session management |
| connect-pg-simple | Session storage in PostgreSQL |
| multer | File upload handling |
| tsx / esbuild | TypeScript execution & bundling |

### Database

All data lives in a single PostgreSQL database with the following main tables:

| Table | Stores |
|---|---|
| `users` | System user accounts |
| `roles` | Role definitions |
| `permissions` | Permission keys |
| `role_permissions` | Many-to-many roles ↔ permissions |
| `technicians` | Field technician records |
| `teams` | Team definitions |
| `team_members` | Team ↔ user memberships |
| `work_orders` | Work order records |
| `work_order_proposals` | Proposals linked to WOs |
| `work_order_parts` | Parts requests per WO |
| `work_order_files` | File uploads per WO |
| `work_order_chats` | Chat messages per WO |
| `work_order_client_payments` | Client payment records |
| `work_order_technician_payments` | Technician payment records |
| `invoices` | Invoices linked to WOs |
| `job_inspections` | Pre-job site assessments |
| `notifications` | User notification records |

### Security

- All routes require authentication (`requireAuth` middleware)
- Permission checks run server-side on every sensitive operation
- Passwords never stored in plain text
- Session tokens stored server-side (not in client-readable cookies)
- File uploads restricted by MIME type

### Deployment

- **Frontend**: Built with Vite → served as static assets by Express
- **Backend**: Express server running on port 5000
- **Deployment Target**: Replit Autoscale
- **Database**: PostgreSQL (Replit-managed in development, external in production)
- **Domain**: `.replit.app` or custom domain via Replit deployment

---

*Platform: Noviq | Stack: React + Express + PostgreSQL | Auth: Session-based RBAC*
