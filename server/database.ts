import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@shared/schema";
import path from "path";

// Create SQLite database connection
const sqlite = new Database("database.sqlite");

// Enable foreign key constraints
sqlite.pragma("foreign_keys = ON");

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Run migrations
export function runMigrations() {
  try {
    // Check if migrations folder exists first
    const fs = require("fs");
    if (fs.existsSync("./drizzle")) {
      migrate(db, { migrationsFolder: "./drizzle" });
      console.log("Database migrations completed successfully");
    } else {
      console.log("No migration folder found, using manual table creation");
    }
  } catch (error) {
    console.error("Database migration failed:", error);
  }
}

// Initialize database and create tables if they don't exist
export function initializeDatabase() {
  try {
    console.log("Initializing SQLite database...");
    
    // Create tables manually
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
      );

      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'online' NOT NULL,
        cpu_usage INTEGER DEFAULT 0,
        memory_usage INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS technicians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        email TEXT,
        address TEXT,
        latitude TEXT,
        longitude TEXT,
        tax_number TEXT,
        payment_methods TEXT,
        payment_details TEXT,
        average_rating TEXT DEFAULT '0',
        total_ratings INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS technician_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        technician_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (technician_id) REFERENCES technicians(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS work_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_order_number TEXT NOT NULL UNIQUE,
        client_name TEXT NOT NULL,
        country TEXT NOT NULL,
        city TEXT NOT NULL,
        street TEXT NOT NULL,
        nte TEXT NOT NULL,
        tnte TEXT NOT NULL,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        assigned_user_ids TEXT NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS work_order_proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_order_id INTEGER NOT NULL,
        labor_data TEXT,
        parts_data TEXT,
        services_data TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
      );

      CREATE TABLE IF NOT EXISTS work_order_parts_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_order_id INTEGER NOT NULL,
        part_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price TEXT NOT NULL,
        total_price TEXT NOT NULL,
        store_name TEXT,
        remark TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        requested_at INTEGER NOT NULL,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
      );

      CREATE TABLE IF NOT EXISTS work_order_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_order_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        category TEXT NOT NULL,
        uploaded_at INTEGER NOT NULL,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
      );

      CREATE TABLE IF NOT EXISTS work_order_chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_order_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT,
        file_url TEXT,
        message_type TEXT DEFAULT 'text' NOT NULL,
        sent_at INTEGER NOT NULL,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS work_order_technician_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_order_id INTEGER NOT NULL,
        technician_id INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        amount_requested TEXT NOT NULL,
        amount_approved TEXT DEFAULT '0',
        amount_paid TEXT DEFAULT '0',
        status TEXT DEFAULT 'pending' NOT NULL,
        requested_at INTEGER NOT NULL,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
        FOREIGN KEY (technician_id) REFERENCES technicians(id)
      );

      CREATE TABLE IF NOT EXISTS work_order_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_order_id INTEGER NOT NULL,
        parts_total TEXT DEFAULT '0' NOT NULL,
        technician_total TEXT DEFAULT '0' NOT NULL,
        extra_charges TEXT DEFAULT '0' NOT NULL,
        final_total TEXT NOT NULL,
        invoice_data TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
      );
    `);
    
    console.log("Database tables created successfully");
    
    // Verify tables exist
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Created tables:", tables.map(t => t.name));
    
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}