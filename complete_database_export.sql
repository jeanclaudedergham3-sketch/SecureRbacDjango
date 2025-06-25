-- PostgreSQL Database Export
-- Complete schema and data for external PostgreSQL setup
-- Generated: June 25, 2025
-- Database: RBAC Work Order Management System

-- =============================================================================
-- DROP EXISTING TABLES (if they exist)
-- =============================================================================

DROP TABLE IF EXISTS work_order_technician_payments CASCADE;
DROP TABLE IF EXISTS work_order_invoices CASCADE;
DROP TABLE IF EXISTS work_order_files CASCADE;
DROP TABLE IF EXISTS work_order_chats CASCADE;
DROP TABLE IF EXISTS work_order_parts_requests CASCADE;
DROP TABLE IF EXISTS work_order_proposals CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS technician_ratings CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Roles junction table
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Role Permissions junction table
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Technicians table
CREATE TABLE technicians (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    specialization VARCHAR(255),
    experience INTEGER DEFAULT 0,
    hourly_rate VARCHAR(255),
    tax_number VARCHAR(50),
    specialties TEXT,
    certifications TEXT,
    status VARCHAR(50) DEFAULT 'available',
    availability VARCHAR(50) DEFAULT 'available',
    location VARCHAR(255),
    average_rating REAL DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL,
    bank_account VARCHAR(255),
    routing_number VARCHAR(50),
    bank_name VARCHAR(255),
    paypal_email VARCHAR(255),
    paypal_link TEXT,
    venmo_handle VARCHAR(100),
    venmo_qr TEXT,
    cashapp_handle VARCHAR(100),
    cashapp_qr TEXT,
    zelle_info TEXT,
    mailing_address TEXT,
    payment_methods TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technician Ratings table
CREATE TABLE technician_ratings (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders table
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    work_order_number VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    category VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL,
    estimated_hours VARCHAR(20),
    actual_hours DECIMAL(8,2),
    scheduled_date VARCHAR(20),
    completed_date TIMESTAMP,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Client information
    client_name VARCHAR(255),
    client_phone VARCHAR(50),
    client_email VARCHAR(255),
    -- Address information
    country VARCHAR(100),
    city VARCHAR(100),
    street TEXT,
    zip_code VARCHAR(20),
    -- Financial information
    nte DECIMAL(10,2),
    tnte DECIMAL(10,2),
    -- Project timeline
    start_date VARCHAR(20),
    end_date VARCHAR(20),
    urgency VARCHAR(20),
    -- Equipment and instructions
    equipment_type VARCHAR(255),
    problem_description TEXT,
    special_instructions TEXT,
    access_instructions TEXT,
    safety_requirements TEXT,
    assigned_user_ids TEXT
);

-- Work Order Proposals table
CREATE TABLE work_order_proposals (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    labor_data TEXT,
    parts_data TEXT,
    services_data TEXT,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    material_cost DECIMAL(10,2) DEFAULT 0,
    additional_costs DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    estimated_duration VARCHAR(255) DEFAULT 'TBD',
    description TEXT,
    approved_at TIMESTAMP,
    UNIQUE(work_order_id)
);

-- Work Order Parts Requests table
CREATE TABLE work_order_parts_requests (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parts TEXT,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    -- Individual part fields
    part_name VARCHAR(255),
    part_number VARCHAR(255),
    quantity INTEGER,
    estimated_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    urgency VARCHAR(50) DEFAULT 'normal',
    notes TEXT
);

-- Work Order Files table
CREATE TABLE work_order_files (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type VARCHAR(100) DEFAULT 'application/octet-stream',
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Chats table
CREATE TABLE work_order_chats (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message TEXT,
    file_url TEXT,
    message_type VARCHAR(50) NOT NULL DEFAULT 'text',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Technician Payments table
CREATE TABLE work_order_technician_payments (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    payment_method VARCHAR(100) NOT NULL,
    amount_requested VARCHAR(50) NOT NULL,
    amount_approved VARCHAR(50) DEFAULT '0',
    amount_paid VARCHAR(50) DEFAULT '0',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    description TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP
);

-- Work Order Invoices table
CREATE TABLE work_order_invoices (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE,
    labor_cost VARCHAR(50),
    material_cost VARCHAR(50),
    additional_costs TEXT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_rate VARCHAR(10),
    tax_amount VARCHAR(50),
    total_amount VARCHAR(50),
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    UNIQUE(work_order_id)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    is_read BOOLEAN DEFAULT false,
    related_entity VARCHAR(100),
    related_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_technician_id ON work_orders(technician_id);
CREATE INDEX idx_work_orders_requested_by ON work_orders(requested_by);
CREATE INDEX idx_work_orders_created_at ON work_orders(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_technicians_status ON technicians(status);
CREATE INDEX idx_technicians_location ON technicians(location);

-- =============================================================================
-- INSERT SAMPLE DATA
-- =============================================================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Full system administrator with all permissions'),
('Manager', 'Manager with most permissions except system administration'),
('Viewer', 'Read-only access to most system components'),
('Technician', 'Technician with work order focused permissions'),
('Client', 'Client with limited access to their work orders');

-- Insert comprehensive permissions (73 total)
INSERT INTO permissions (name, description, category) VALUES
-- Dashboard permissions
('dashboard.view', 'View main dashboard', 'Dashboard'),
('dashboard.stats', 'View dashboard statistics', 'Dashboard'),
('dashboard.analytics', 'View dashboard analytics', 'Dashboard'),

-- User Management permissions
('users.view', 'View users list', 'User Management'),
('users.create', 'Create new users', 'User Management'),
('users.edit', 'Edit user information', 'User Management'),
('users.delete', 'Delete users', 'User Management'),
('users.manage_status', 'Activate/deactivate users', 'User Management'),
('users.view_details', 'View detailed user information', 'User Management'),
('users.assign_roles', 'Assign roles to users', 'User Management'),
('users.export', 'Export user data', 'User Management'),

-- Role Management permissions
('roles.view', 'View roles list', 'Role Management'),
('roles.create', 'Create new roles', 'Role Management'),
('roles.edit', 'Edit role information', 'Role Management'),
('roles.delete', 'Delete roles', 'Role Management'),
('roles.assign_permissions', 'Assign permissions to roles', 'Role Management'),
('roles.view_permissions', 'View role permissions', 'Role Management'),
('roles.export', 'Export role data', 'Role Management'),

-- Technician Management permissions
('technicians.view', 'View technicians list', 'Technician Management'),
('technicians.create', 'Create new technicians', 'Technician Management'),
('technicians.edit', 'Edit technician information', 'Technician Management'),
('technicians.delete', 'Delete technicians', 'Technician Management'),
('technicians.view_details', 'View detailed technician information', 'Technician Management'),
('technicians.view_ratings', 'View technician ratings', 'Technician Management'),
('technicians.manage_status', 'Manage technician availability status', 'Technician Management'),
('technicians.view_location', 'View technician locations on map', 'Technician Management'),
('technicians.export', 'Export technician data', 'Technician Management'),

-- Work Order permissions
('workorders.view', 'View work orders list', 'Work Orders'),
('workorders.create', 'Create new work orders', 'Work Orders'),
('workorders.edit', 'Edit work order information', 'Work Orders'),
('workorders.delete', 'Delete work orders', 'Work Orders'),
('workorders.assign', 'Assign work orders to technicians', 'Work Orders'),
('workorders.change_status', 'Change work order status', 'Work Orders'),
('workorders.view_details', 'View detailed work order information', 'Work Orders'),
('workorders.lock', 'Lock/unlock work orders', 'Work Orders'),
('workorders.export', 'Export work order data', 'Work Orders'),

-- Proposal permissions
('proposals.view', 'View proposals list', 'Proposals'),
('proposals.create', 'Create new proposals', 'Proposals'),
('proposals.edit', 'Edit proposal information', 'Proposals'),
('proposals.delete', 'Delete proposals', 'Proposals'),
('proposals.approve', 'Approve or reject proposals', 'Proposals'),
('proposals.view_details', 'View detailed proposal information', 'Proposals'),
('proposals.export', 'Export proposal data', 'Proposals'),

-- Parts Management permissions
('parts.view', 'View parts requests list', 'Parts Management'),
('parts.create', 'Create new parts requests', 'Parts Management'),
('parts.edit', 'Edit parts request information', 'Parts Management'),
('parts.delete', 'Delete parts requests', 'Parts Management'),
('parts.approve', 'Approve or reject parts requests', 'Parts Management'),
('parts.view_details', 'View detailed parts request information', 'Parts Management'),
('parts.export', 'Export parts request data', 'Parts Management'),

-- File Management permissions
('files.view', 'View file attachments', 'File Management'),
('files.upload', 'Upload new files', 'File Management'),
('files.download', 'Download file attachments', 'File Management'),
('files.delete', 'Delete file attachments', 'File Management'),
('files.manage_categories', 'Manage file categories', 'File Management'),

-- Communication permissions
('chat.view', 'View chat messages', 'Communication'),
('chat.send', 'Send chat messages', 'Communication'),
('chat.delete', 'Delete chat messages', 'Communication'),
('chat.export', 'Export chat history', 'Communication'),

-- Payment permissions
('payments.view', 'View payment requests', 'Payments'),
('payments.create', 'Create payment requests', 'Payments'),
('payments.edit', 'Edit payment information', 'Payments'),
('payments.approve', 'Approve payment requests', 'Payments'),
('payments.process', 'Process approved payments', 'Payments'),
('payments.view_details', 'View detailed payment information', 'Payments'),
('payments.export', 'Export payment data', 'Payments'),

-- Invoice permissions
('invoices.view', 'View invoices list', 'Invoices'),
('invoices.create', 'Create new invoices', 'Invoices'),
('invoices.edit', 'Edit invoice information', 'Invoices'),
('invoices.delete', 'Delete invoices', 'Invoices'),
('invoices.send', 'Send invoices to clients', 'Invoices'),
('invoices.mark_paid', 'Mark invoices as paid', 'Invoices'),
('invoices.export', 'Export invoice data', 'Invoices'),

-- Financial Analysis permissions
('financial.view_analysis', 'View financial analysis reports', 'Financial Analysis'),
('financial.export_reports', 'Export financial reports', 'Financial Analysis'),
('financial.view_profit_loss', 'View profit/loss analysis', 'Financial Analysis'),

-- System Administration permissions
('system.admin', 'Full system administration access', 'System Administration'),
('system.view_logs', 'View system logs', 'System Administration'),
('system.manage_settings', 'Manage system settings', 'System Administration'),
('system.backup', 'Create system backups', 'System Administration'),
('system.restore', 'Restore system from backup', 'System Administration');

-- Insert default users with hashed passwords (bcrypt)
INSERT INTO users (username, email, password, first_name, last_name) VALUES
('admin', 'admin@example.com', '$2b$10$rQZ8kHGzJ5J5J5J5J5J5JOeK1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K', 'Admin', 'User'),
('manager', 'manager@example.com', '$2b$10$rQZ8kHGzJ5J5J5J5J5J5JOeK1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K', 'Manager', 'User'),
('viewer', 'viewer@example.com', '$2b$10$rQZ8kHGzJ5J5J5J5J5J5JOeK1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K', 'Viewer', 'User'),
('technician', 'tech@example.com', '$2b$10$rQZ8kHGzJ5J5J5J5J5J5JOeK1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K', 'Tech', 'User');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin -> Admin
(2, 2), -- manager -> Manager
(3, 3), -- viewer -> Viewer
(4, 4); -- technician -> Technician

-- Assign all permissions to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Assign most permissions to Manager role (exclude system admin)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE category != 'System Administration';

-- Assign view permissions to Viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name LIKE '%.view%' OR name LIKE '%.view_%';

-- Assign work-focused permissions to Technician role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE 
    name IN ('workorders.view', 'workorders.edit', 'workorders.view_details',
             'files.view', 'files.upload', 'files.download',
             'chat.view', 'chat.send',
             'payments.view', 'payments.create');

-- Insert sample technicians
INSERT INTO technicians (first_name, last_name, email, phone, specialization, hourly_rate, status, location) VALUES
('John', 'Doe', 'john@example.com', '555-0101', 'HVAC', '50', 'available', 'New York, NY'),
('Jane', 'Smith', 'jane@example.com', '555-0102', 'Electrical', '55', 'available', 'Los Angeles, CA'),
('Mike', 'Johnson', 'mike@example.com', '555-0103', 'Plumbing', '45', 'busy', 'Chicago, IL'),
('Sarah', 'Williams', 'sarah@example.com', '555-0104', 'General Maintenance', '40', 'available', 'Houston, TX'),
('David', 'Brown', 'david@example.com', '555-0105', 'HVAC', '52', 'available', 'Phoenix, AZ'),
('Lisa', 'Davis', 'lisa@example.com', '555-0106', 'Electrical', '58', 'unavailable', 'Philadelphia, PA'),
('Robert', 'Miller', 'robert@example.com', '555-0107', 'Plumbing', '48', 'available', 'San Antonio, TX');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, related_entity, related_id) VALUES
(1, 'info', 'Welcome to the System', 'Welcome to the RBAC Work Order Management System. You have been assigned the Admin role.', 'user', 1),
(1, 'success', 'Role Created', 'New role "Admin" has been successfully created with full permissions.', 'role', 1),
(1, 'warning', 'User Activity Alert', 'High number of login attempts detected for your account. Please verify your security settings.', 'user', 1),
(1, 'info', 'Permission Update', 'Your role permissions have been updated. You now have access to all system features.', 'role', 1),
(1, 'info', 'System Status', 'All system components are operational. Database connection stable.', 'system', 1);

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================

-- To use this export with an external PostgreSQL database:
-- 1. Create a new PostgreSQL database
-- 2. Connect to the database using psql or your preferred client
-- 3. Run this entire script to create tables and insert sample data
-- 4. Update your DATABASE_URL environment variable to point to the new database
-- 5. The default login credentials are:
--    - admin/admin123 (Admin role - all permissions)
--    - manager/manager123 (Manager role - most permissions)
--    - viewer/viewer123 (Viewer role - read-only permissions)
--    - technician/technician123 (Technician role - work-focused permissions)

-- Note: The password hashes shown above are placeholders. 
-- The actual system uses bcrypt hashing. Use the seeded accounts or create new ones through the application.

-- =============================================================================
-- END OF EXPORT
-- =============================================================================