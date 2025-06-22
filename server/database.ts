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
    `);
    
    console.log("Database tables created successfully");
    
    // Verify tables exist
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Created tables:", tables.map(t => t.name));
    
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}