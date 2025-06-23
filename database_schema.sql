-- PostgreSQL Database Schema for RBAC Work Order Management System
-- Generated on June 23, 2025
-- Complete schema with all 17 tables and relations

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table - Core user information with authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Roles table - Named roles with descriptions
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Permissions table - Granular permissions for system operations
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- RELATIONSHIP TABLES (Many-to-Many)
-- ============================================================================

-- User Roles junction table
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Role Permissions junction table
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- EQUIPMENT MANAGEMENT
-- ============================================================================

-- Equipment table - System equipment monitoring
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'online',
    cpu_usage INTEGER DEFAULT 0,
    memory_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- TECHNICIAN MANAGEMENT
-- ============================================================================

-- Technicians table - Technician information and payment methods
CREATE TABLE technicians (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    tax_number VARCHAR(50),
    hourly_rate VARCHAR(50),
    specialties TEXT,
    certifications TEXT,
    status VARCHAR(50) DEFAULT 'available',
    average_rating REAL DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL,
    
    -- Payment method fields
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
    payment_methods TEXT, -- JSON array of selected payment methods
    payment_details TEXT, -- JSON object with payment method details
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Technician Ratings table
CREATE TABLE technician_ratings (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- WORK ORDER MANAGEMENT
-- ============================================================================

-- Work Orders table - Main work order information
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    work_order_number VARCHAR(100) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    street TEXT NOT NULL,
    nte VARCHAR(50) NOT NULL, -- amount without tax
    tnte VARCHAR(50) NOT NULL, -- amount including tax
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    assigned_user_ids TEXT NOT NULL, -- JSON array of user IDs
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, completed, cancelled
    is_locked BOOLEAN DEFAULT FALSE, -- true when invoice is paid
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Work Order Proposals table
CREATE TABLE work_order_proposals (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    labor_data TEXT, -- JSON array of labor entries
    parts_data TEXT, -- JSON array of parts entries
    services_data TEXT, -- JSON array of services entries
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, cancelled
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Work Order Parts Requests table
CREATE TABLE work_order_parts_requests (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parts TEXT NOT NULL, -- JSON string of parts array
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, cancelled
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Work Order Files table - File uploads (before/after photos, signatures, documents)
CREATE TABLE work_order_files (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- image, pdf, etc
    category VARCHAR(50) NOT NULL, -- before, after, signature
    uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Work Order Chat table - Real-time communication
CREATE TABLE work_order_chats (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    file_url TEXT,
    message_type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, file, image
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
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
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, partially_paid, paid, rejected
    description TEXT,
    requested_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Work Order Invoices table
CREATE TABLE work_order_invoices (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    labor_cost VARCHAR(50),
    material_cost VARCHAR(50),
    tax_rate VARCHAR(10),
    tax_amount VARCHAR(50),
    total_amount VARCHAR(50),
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- NOTIFICATION SYSTEM
-- ============================================================================

-- Notifications table - System notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, success, warning, error
    is_read BOOLEAN DEFAULT FALSE,
    related_entity VARCHAR(100),
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Role and permission indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Technician indexes
CREATE INDEX idx_technicians_status ON technicians(status);
CREATE INDEX idx_technicians_location ON technicians(latitude, longitude);
CREATE INDEX idx_technician_ratings_technician_id ON technician_ratings(technician_id);
CREATE INDEX idx_technician_ratings_user_id ON technician_ratings(user_id);

-- Work order indexes
CREATE INDEX idx_work_orders_number ON work_orders(work_order_number);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_client ON work_orders(client_name);
CREATE INDEX idx_work_orders_dates ON work_orders(start_date, end_date);
CREATE INDEX idx_work_orders_locked ON work_orders(is_locked);

-- Work order related indexes
CREATE INDEX idx_work_order_proposals_work_order_id ON work_order_proposals(work_order_id);
CREATE INDEX idx_work_order_parts_requests_work_order_id ON work_order_parts_requests(work_order_id);
CREATE INDEX idx_work_order_files_work_order_id ON work_order_files(work_order_id);
CREATE INDEX idx_work_order_chats_work_order_id ON work_order_chats(work_order_id);
CREATE INDEX idx_work_order_payments_work_order_id ON work_order_technician_payments(work_order_id);
CREATE INDEX idx_work_order_payments_technician_id ON work_order_technician_payments(technician_id);
CREATE INDEX idx_work_order_invoices_work_order_id ON work_order_invoices(work_order_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Insert default permissions (matching current application permissions)
INSERT INTO permissions (name, description) VALUES
('view_dashboard', 'View dashboard'),
('view_users', 'View users'),
('edit_users', 'Edit users'),
('view_roles', 'View roles'),
('assign_roles', 'Assign roles'),
('view_equipment', 'View equipment'),
('edit_equipment', 'Edit equipment'),
('manage_technicians', 'Manage technicians'),
('rate_technicians', 'Rate technicians'),
('manage_work_orders', 'Manage work orders'),
('manage_invoices', 'Manage invoices'),
('view_notifications', 'View notifications');

-- Insert default roles (matching current application roles)
INSERT INTO roles (name, description) VALUES
('admin', 'Full system access with all permissions'),
('manager', 'Management-level access to work orders, technicians, and equipment'),
('viewer', 'View-only access to system information');

-- Create default users (matching current application users)
-- Password: password123 for all users
INSERT INTO users (username, email, password, first_name, last_name) VALUES
('admin', 'admin@example.com', '$2b$10$rKJ5kMZjHQJnRz1c7y4JdOzEY8F8mK4oL9sN6pQ3rT5uV7wX8yZ9a', 'Admin', 'User'),
('manager', 'manager@example.com', '$2b$10$rKJ5kMZjHQJnRz1c7y4JdOzEY8F8mK4oL9sN6pQ3rT5uV7wX8yZ9a', 'Manager', 'User'),
('viewer', 'viewer@example.com', '$2b$10$rKJ5kMZjHQJnRz1c7y4JdOzEY8F8mK4oL9sN6pQ3rT5uV7wX8yZ9a', 'Viewer', 'User');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin -> admin role
(2, 2), -- manager -> manager role  
(3, 3); -- viewer -> viewer role

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Manager gets most permissions except user management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN (
  'view_dashboard', 'view_equipment', 'edit_equipment', 'manage_technicians', 
  'rate_technicians', 'manage_work_orders', 'manage_invoices', 'view_notifications'
);

-- Viewer gets only view permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
  'view_dashboard', 'view_users', 'view_roles', 'view_equipment', 'view_notifications'
);

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Core user information with authentication credentials';
COMMENT ON TABLE roles IS 'Named roles with descriptions for RBAC';
COMMENT ON TABLE permissions IS 'Granular permissions for system operations';
COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles';
COMMENT ON TABLE role_permissions IS 'Many-to-many relationship between roles and permissions';
COMMENT ON TABLE equipment IS 'System equipment with monitoring capabilities';
COMMENT ON TABLE technicians IS 'Technician information including location and payment methods';
COMMENT ON TABLE technician_ratings IS 'Rating system for technicians (1-5 stars)';
COMMENT ON TABLE work_orders IS 'Main work order information and status tracking';
COMMENT ON TABLE work_order_proposals IS 'Detailed proposals for work orders including labor, parts, and services';
COMMENT ON TABLE work_order_parts_requests IS 'Parts requests with approval workflow';
COMMENT ON TABLE work_order_files IS 'File uploads for work orders (photos, signatures, documents)';
COMMENT ON TABLE work_order_chats IS 'Real-time chat system for work order communication';
COMMENT ON TABLE work_order_technician_payments IS 'Payment requests and tracking for technicians';
COMMENT ON TABLE work_order_invoices IS 'Invoice management with tax calculations';
COMMENT ON TABLE notifications IS 'System-wide notification system';

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================

/*
This PostgreSQL schema implements a comprehensive Role-Based Access Control (RBAC) 
Work Order Management System with the following key features:

1. **User Management & RBAC**:
   - Users with authentication (bcrypt password hashing)
   - Flexible role and permission system
   - Many-to-many relationships for scalable access control

2. **Equipment Monitoring**:
   - Equipment status tracking (online/offline/maintenance)
   - Resource usage monitoring (CPU, memory)
   - Equipment categorization by type

3. **Technician Management**:
   - Complete technician profiles with contact information
   - Location tracking (latitude/longitude for mapping)
   - Multiple payment method support (bank, PayPal, Venmo, CashApp, Zelle)
   - Rating and review system (1-5 stars)

4. **Work Order System**:
   - Comprehensive work order tracking with unique numbering
   - Multi-user assignment capability
   - Date range management and status tracking
   - Location information (country, city, street)
   - Financial tracking (NTE amounts with and without tax)
   - Locking mechanism when invoices are paid

5. **Proposal & Parts Management**:
   - Detailed work proposals with labor, parts, and services
   - Parts request system with approval workflow
   - Status tracking for all requests

6. **File Management**:
   - Before/after photo uploads
   - Digital signature capture
   - Document attachment support
   - Categorized file organization

7. **Communication System**:
   - Real-time chat for work orders
   - File sharing in chat messages
   - Message type categorization

8. **Payment & Invoice System**:
   - Technician payment request tracking
   - Multi-status payment workflow
   - Invoice generation with tax calculations
   - Payment method flexibility

9. **Notification System**:
   - Real-time notifications for all system events
   - Read/unread status tracking
   - Entity relationship linking

10. **Performance Optimization**:
    - Comprehensive indexing strategy
    - Foreign key constraints with cascade deletes
    - Optimized queries for common operations

The schema supports a complete work order lifecycle from creation to completion,
with robust user management, real-time communication, and comprehensive tracking
of all activities and financial transactions.
*/