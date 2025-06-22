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
- **Equipment**: System equipment with monitoring capabilities

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

### Equipment Monitoring
- Equipment status tracking (online/offline/maintenance)
- Resource usage monitoring (CPU, memory, etc.)
- Equipment type categorization
- Real-time status updates

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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```