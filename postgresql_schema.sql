-- PostgreSQL Schema for UVG-CMMS System
-- Generated on June 25, 2025
-- Complete database schema with all tables, relationships, and constraints

-- Users table - Core user management
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Roles table - Role-based access control
CREATE TABLE "roles" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Permissions table - Granular permissions system
CREATE TABLE "permissions" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "category" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Roles junction table - Many-to-many relationship
CREATE TABLE "user_roles" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role_id" INTEGER NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "assigned_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Role Permissions junction table - Many-to-many relationship
CREATE TABLE "role_permissions" (
    "id" SERIAL PRIMARY KEY,
    "role_id" INTEGER NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "permission_id" INTEGER NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    "assigned_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Technicians table - Technician management and tracking
CREATE TABLE "technicians" (
    "id" SERIAL PRIMARY KEY,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "phone" VARCHAR(50) NOT NULL,
    "specialization" VARCHAR(255) NOT NULL,
    "experience" INTEGER NOT NULL,
    "hourly_rate" DECIMAL(10,2) NOT NULL,
    "availability" VARCHAR(50) NOT NULL DEFAULT 'available',
    "location" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "payment_methods" TEXT NOT NULL,
    "average_rating" DECIMAL(3,2) DEFAULT 0,
    "total_ratings" INTEGER DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Technician Ratings table - Rating and review system
CREATE TABLE "technician_ratings" (
    "id" SERIAL PRIMARY KEY,
    "technician_id" INTEGER NOT NULL REFERENCES "technicians"("id") ON DELETE CASCADE,
    "work_order_id" INTEGER REFERENCES "work_orders"("id") ON DELETE SET NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "rated_by" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work Orders table - Core work order management
CREATE TABLE "work_orders" (
    "id" SERIAL PRIMARY KEY,
    "work_order_number" VARCHAR(255) NOT NULL UNIQUE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" VARCHAR(50) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "category" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "requested_by" INTEGER NOT NULL REFERENCES "users"("id"),
    "assigned_to" INTEGER REFERENCES "users"("id"),
    "technician_id" INTEGER REFERENCES "technicians"("id"),
    "estimated_hours" DECIMAL(8,2),
    "actual_hours" DECIMAL(8,2),
    "scheduled_date" TIMESTAMP,
    "completed_date" TIMESTAMP,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work Order Proposals table - Cost estimation and approval
CREATE TABLE "work_order_proposals" (
    "id" SERIAL PRIMARY KEY,
    "work_order_id" INTEGER NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "labor_cost" DECIMAL(10,2) NOT NULL,
    "material_cost" DECIMAL(10,2) NOT NULL,
    "additional_costs" DECIMAL(10,2) DEFAULT 0,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "estimated_duration" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "approved_at" TIMESTAMP
);

-- Work Order Parts Requests table - Parts and materials management
CREATE TABLE "work_order_parts_requests" (
    "id" SERIAL PRIMARY KEY,
    "work_order_id" INTEGER NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "part_name" VARCHAR(255) NOT NULL,
    "part_number" VARCHAR(255),
    "quantity" INTEGER NOT NULL,
    "estimated_cost" DECIMAL(10,2),
    "supplier" VARCHAR(255),
    "urgency" VARCHAR(50) NOT NULL DEFAULT 'normal',
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "requested_by" INTEGER NOT NULL REFERENCES "users"("id"),
    "approved_by" INTEGER REFERENCES "users"("id"),
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "approved_at" TIMESTAMP
);

-- Work Order Files table - Document and image management
CREATE TABLE "work_order_files" (
    "id" SERIAL PRIMARY KEY,
    "work_order_id" INTEGER NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL DEFAULT 'general',
    "uploaded_by" INTEGER NOT NULL REFERENCES "users"("id"),
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work Order Chats table - Communication and messaging
CREATE TABLE "work_order_chats" (
    "id" SERIAL PRIMARY KEY,
    "work_order_id" INTEGER NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "sender_id" INTEGER NOT NULL REFERENCES "users"("id"),
    "message" TEXT NOT NULL,
    "message_type" VARCHAR(50) NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work Order Technician Payments table - Payment tracking and management
CREATE TABLE "work_order_technician_payments" (
    "id" SERIAL PRIMARY KEY,
    "work_order_id" INTEGER NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "technician_id" INTEGER NOT NULL REFERENCES "technicians"("id") ON DELETE CASCADE,
    "payment_method" TEXT NOT NULL,
    "amount_requested" DECIMAL(10,2) NOT NULL,
    "amount_approved" DECIMAL(10,2) DEFAULT 0,
    "amount_paid" DECIMAL(10,2) DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "requested_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "approved_at" TIMESTAMP,
    "paid_at" TIMESTAMP
);

-- Work Order Invoices table - Invoice generation and tracking
CREATE TABLE "work_order_invoices" (
    "id" SERIAL PRIMARY KEY,
    "work_order_id" INTEGER NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "invoice_number" VARCHAR(255) NOT NULL UNIQUE,
    "labor_cost" DECIMAL(10,2) NOT NULL,
    "material_cost" DECIMAL(10,2) NOT NULL,
    "additional_costs" DECIMAL(10,2) DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.1,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "sent_at" TIMESTAMP,
    "paid_at" TIMESTAMP
);

-- Notifications table - System notifications and alerts
CREATE TABLE "notifications" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "read_at" TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX "idx_users_username" ON "users"("username");
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_user_roles_user_id" ON "user_roles"("user_id");
CREATE INDEX "idx_user_roles_role_id" ON "user_roles"("role_id");
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions"("role_id");
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");
CREATE INDEX "idx_technicians_email" ON "technicians"("email");
CREATE INDEX "idx_technicians_location" ON "technicians"("location");
CREATE INDEX "idx_technician_ratings_technician_id" ON "technician_ratings"("technician_id");
CREATE INDEX "idx_work_orders_status" ON "work_orders"("status");
CREATE INDEX "idx_work_orders_priority" ON "work_orders"("priority");
CREATE INDEX "idx_work_orders_requested_by" ON "work_orders"("requested_by");
CREATE INDEX "idx_work_orders_assigned_to" ON "work_orders"("assigned_to");
CREATE INDEX "idx_work_orders_technician_id" ON "work_orders"("technician_id");
CREATE INDEX "idx_work_order_proposals_work_order_id" ON "work_order_proposals"("work_order_id");
CREATE INDEX "idx_work_order_parts_requests_work_order_id" ON "work_order_parts_requests"("work_order_id");
CREATE INDEX "idx_work_order_files_work_order_id" ON "work_order_files"("work_order_id");
CREATE INDEX "idx_work_order_chats_work_order_id" ON "work_order_chats"("work_order_id");
CREATE INDEX "idx_work_order_technician_payments_work_order_id" ON "work_order_technician_payments"("work_order_id");
CREATE INDEX "idx_work_order_technician_payments_technician_id" ON "work_order_technician_payments"("technician_id");
CREATE INDEX "idx_work_order_invoices_work_order_id" ON "work_order_invoices"("work_order_id");
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id");
CREATE INDEX "idx_notifications_is_read" ON "notifications"("is_read");

-- Sample data for initial setup
INSERT INTO "roles" ("name", "description") VALUES 
('admin', 'Full system access with all permissions'),
('manager', 'Management access with most permissions'),
('technician', 'Technician access for work orders and tasks'),
('viewer', 'Read-only access to view data');

INSERT INTO "permissions" ("name", "description", "category") VALUES 
('user:read', 'View users', 'User Management'),
('user:write', 'Create and edit users', 'User Management'),
('user:delete', 'Delete users', 'User Management'),
('role:read', 'View roles', 'Role Management'),
('role:write', 'Create and edit roles', 'Role Management'),
('role:delete', 'Delete roles', 'Role Management'),
('technician:read', 'View technicians', 'Technician Management'),
('technician:write', 'Create and edit technicians', 'Technician Management'),
('technician:delete', 'Delete technicians', 'Technician Management'),
('workorder:read', 'View work orders', 'Work Order Management'),
('workorder:write', 'Create and edit work orders', 'Work Order Management'),
('workorder:delete', 'Delete work orders', 'Work Order Management'),
('payment:read', 'View payments', 'Payment Management'),
('payment:write', 'Process payments', 'Payment Management'),
('analytics:read', 'View analytics and reports', 'Analytics'),
('notification:read', 'View notifications', 'Notifications'),
('notification:write', 'Create notifications', 'Notifications');

-- Database schema version and metadata
COMMENT ON DATABASE current_database() IS 'UVG-CMMS System Database - Version 1.0 - Created June 25, 2025';