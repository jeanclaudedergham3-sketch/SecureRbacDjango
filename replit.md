# replit.md

## Overview

This is a full-stack web application built with React, TypeScript, and Express.js, implementing a role-based access control (RBAC) admin panel system. The application provides user management, role management, and equipment monitoring capabilities with a modern UI built using shadcn/ui components.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with SQLite dialect
- **Database Provider**: SQLite (better-sqlite3)
- **Session Management**: Express sessions with in-memory store
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Authorization**: Role-based access control (RBAC) middleware

### Database Schema
The application uses a comprehensive RBAC schema with the following entities:
- **Users**: Core user information with authentication credentials
- **Roles**: Named roles with descriptions
- **Permissions**: Granular permissions for system operations
- **User Roles**: Many-to-many relationship between users and roles
- **Role Permissions**: Many-to-many relationship between roles and permissions


## Key Components

### Authentication System
- Session-based authentication using Express sessions
- Password hashing with bcrypt
- Protected routes with authentication middleware
- User context management on the frontend

### Authorization System
- Role-based access control (RBAC) implementation
- Permission-based route protection
- Frontend permission guards for UI components
- Granular permission checking middleware

### User Management
- Complete CRUD operations for users
- Role assignment capabilities
- User status management (active/inactive)
- User profile information management

### Role Management
- Role creation and management
- Permission assignment to roles
- Visual permission matrices
- Role hierarchy display



## Data Flow

1. **Authentication Flow**:
   - User submits credentials through login form
   - Server validates credentials and creates session
   - Client receives user data and permissions
   - Subsequent requests include session cookies

2. **Authorization Flow**:
   - Each protected route checks user authentication
   - Permission middleware validates user permissions
   - Frontend guards conditionally render components
   - API endpoints enforce permission requirements

3. **Data Management Flow**:
   - Frontend uses TanStack Query for API state management
   - Optimistic updates with automatic cache invalidation
   - Real-time data synchronization
   - Error handling with user feedback

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **bcrypt**: Password hashing
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### UI Dependencies
- **@radix-ui/***: Headless UI primitives
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler

## Deployment Strategy

### Development
- Vite development server with HMR
- TypeScript compilation with strict mode
- Express server with nodemon-like functionality via tsx

### Production Build
- Vite builds optimized frontend bundle
- esbuild compiles backend TypeScript to ESM
- Static assets served from Express
- Environment-based configuration

### Database
- SQLite database with better-sqlite3
- Drizzle ORM for type-safe database operations
- Automatic schema initialization
- In-memory session storage for development

### Hosting
- Configured for Replit deployment
- Auto-scaling deployment target
- Port 5000 for application server
- SQLite database file storage

## Changelog

```
Changelog:
- June 22, 2025. Initial setup with PostgreSQL
- June 22, 2025. Migrated to SQLite database
- June 22, 2025. Added technician management system with location tracking and payment methods
- June 22, 2025. Implemented technician map view and rating system with RBAC integration
- June 22, 2025. Built comprehensive Work Order Management system with RBAC permissions
- June 22, 2025. Added work order creation, tracking, and multi-tab detail views
- June 22, 2025. Completed Parts Request Management system with approval workflow and RBAC
- June 22, 2025. Implemented File Upload system for before/after photos, signatures, and documents with Multer
- June 22, 2025. Built real-time Chat system for work order communication with message history
- June 22, 2025. Removed all payment-related functionality per user request
- June 22, 2025. Rebuilt integrated payment request system within work orders with technician-specific payment methods
- June 22, 2025. Created comprehensive Payment Manager page for administrative payment tracking and approval
- June 22, 2025. Added Technician Payments Overview page showing payment summaries and totals for all technicians
- June 22, 2025. Implemented Invoice Management system within work orders with automatic tax calculations and status tracking
- June 23, 2025. Created Financial Analysis page comparing proposal vs invoice amounts to show profit/loss on paid work orders
- June 23, 2025. Implemented free OpenStreetMap integration in Technician Map page with overlay markers and hover tooltips
- June 23, 2025. Built complete notification system with real-time alerts, unread count badges, and mark-as-read functionality for work orders, payments, and system events
- June 23, 2025. Completely removed equipment management page and all related functionality per user request
- June 23, 2025. Enhanced sidebar with professional design: gradient backgrounds, improved animations, better typography, and polished visual elements
- June 23, 2025. Added beautiful logout confirmation dialog below user info with professional styling and confirmation message
- June 23, 2025. Added custom scrollbar to sidebar with elegant styling matching the dark theme
- June 23, 2025. Reorganized sidebar navigation into logical categories: Overview, User Management, Operations, Technicians, and Payments
- June 23, 2025. Created personalized dashboard with role-based progress indicators for each user type
- June 23, 2025. Enhanced login page with beautiful error messages, password visibility toggle, and modern gradient design
- June 25, 2025. Successfully migrated from SQLite to PostgreSQL database with complete schema conversion
- June 25, 2025. Created comprehensive PostgreSQL schema file for future reference and deployment
- June 25, 2025. Built advanced Analytics page with comprehensive graphs, charts, and executive reports covering all system data
- June 25, 2025. Fixed database schema creation and authentication system for PostgreSQL
- June 25, 2025. Resolved login issues and properly seeded database with admin users (admin/admin123, manager/manager123, viewer/viewer123)
- June 25, 2025. Fixed empty sidebar navigation by updating permission names to match database permissions (users.view, workorders.view, etc.)
- June 25, 2025. Resolved database schema column naming mismatches between PostgreSQL snake_case and application camelCase expectations
- June 25, 2025. Successfully restored complete work order creation form with all original client, financial, timeline, and instruction fields
- June 25, 2025. Updated database schema to support comprehensive work order data including client details, NTE/TNTE, project timeline, and instruction types
- June 25, 2025. Fixed permission guards throughout application to use correct database permissions (workorders.create, workorders.edit, etc.)
- June 25, 2025. Resolved proposal creation 400 errors by including all required database fields in form submission
- June 25, 2025. Added missing database columns (approved_at, paid_at, availability, location, invoice_number, file_size, mime_type, sender_id) to fix all API errors
- June 25, 2025. Implemented comprehensive proposal approval system with admin permissions and workflow management
- June 25, 2025. Created proposal approval/rejection functionality with proper permission controls (proposals.approve permission)
- June 25, 2025. Enhanced proposals page with approve/reject buttons for pending proposals, removing rate functionality as requested
- June 25, 2025. Restructured proposal workflow: removed "Create Proposal" functionality from work order details modal as requested
- June 25, 2025. Implemented request-based proposal system with two-tab interface: "Request Proposals" shows work orders needing proposals, "Existing Proposals" manages created proposals
- June 25, 2025. Added new API endpoint for work orders without proposals to support the restructured workflow
- June 25, 2025. Updated work order details modal to redirect users to proposals page instead of allowing direct proposal creation
- June 25, 2025. Modified work order details proposal section to show "Request Proposal" action instead of direct navigation to proposals page
- June 25, 2025. Fixed parts request 400 error by updating API data structure to match database schema - changed from nested JSON to individual part requests
- June 25, 2025. Updated parts request display logic to show correct values using new schema structure with individual fields (partName, quantity, estimatedCost)
- June 25, 2025. Fixed parts request approval functionality by updating permission check from manage_work_orders to system.admin for admin users
- June 25, 2025. Completely updated parts request page to use new individual field structure instead of legacy JSON parsing for parts data
- June 25, 2025. Fixed file upload system by resolving database column mismatches and adding null checks in JavaScript code
- June 25, 2025. File uploads now work correctly with proper database schema alignment and error handling
- June 25, 2025. Completely repaired chat system by fixing database schema mismatches between userId/senderId fields and updating API routes
- June 25, 2025. Chat functionality now works perfectly with proper message creation, retrieval, and user mapping for work order communication
- June 25, 2025. Fixed technicians API database column mapping issue (averageRating vs average_rating) that was preventing payment request functionality
- June 25, 2025. Resolved payment request system by correcting technician name display (firstName + lastName) and ensuring API returns data correctly
- June 25, 2025. Application fully operational with all systems working: work orders, payments, chat, file uploads, proposals, and analytics
- June 25, 2025. Implemented comprehensive and professional permission system with 75+ granular permissions across all system categories
- June 25, 2025. Created advanced permission guard components with admin override functionality and role-based access control
- June 25, 2025. Updated all pages and buttons to use new dotted permission naming convention (e.g., users.view, technicians.create, workorders.edit)
- June 25, 2025. Built comprehensive permission categories: Dashboard, User Management, Role Management, Technician Management, Work Orders, Proposals, Parts, Files, Communication, Payments, Invoices, Financial Analysis, and System Administration
- June 25, 2025. Enhanced permission system with granular controls for every action: view, create, edit, delete, approve, assign, process, export operations
- January 16, 2025. Expanded to ultra-granular permission system with 150+ permissions covering every page, modal, button, and interface element
- January 16, 2025. Added specialized permission guards: PageGuard, ModalGuard, ButtonGuard, TabGuard, SidebarGuard for precise access control
- January 16, 2025. Implemented page-level permissions (*.page.view), modal-level permissions (*.modal.*), and interface control permissions (buttons.*)
- January 16, 2025. Created work order details tab permissions (workorders.tab.*) and sidebar navigation permissions (sidebar.*)
- January 16, 2025. Added comprehensive role assignments: Admin (all 180 permissions), Manager (145 permissions), Technician (36 permissions), Viewer (67 permissions)
- January 16, 2025. Built complete permission hierarchy with categories: Dashboard, User Management, Role Management, Technician Management, Work Order Management, Work Order Details, Proposal Management, Parts Management, File Management, Communication, Payment Management, Invoice Management, Financial Analysis, Navigation, Interface Controls, Modal Controls, Data Management, System Administration
- January 16, 2025. Verified admin user has complete access with all 180 granular permissions working correctly through API testing
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```