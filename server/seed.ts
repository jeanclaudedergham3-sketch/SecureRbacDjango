import { db } from "./db";
import { users, roles, permissions, userRoles, rolePermissions, technicians } from "@shared/schema";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
    console.log("Starting database seed...");

    // Check if already seeded
    try {
      const existingUsers = await db.select().from(users);
      if (existingUsers.length > 0) {
        console.log("Database already seeded");
        return;
      }
    } catch (error) {
      console.log("Users table doesn't exist yet, continuing with seed...");
    }

    // Create roles
    const [adminRole] = await db.insert(roles).values({
      name: "admin",
      description: "Full system access with all permissions"
    }).returning();

    const [managerRole] = await db.insert(roles).values({
      name: "manager",
      description: "Management access with most permissions"
    }).returning();

    const [technicianRole] = await db.insert(roles).values({
      name: "technician",
      description: "Technician access for work orders and tasks"
    }).returning();

    const [viewerRole] = await db.insert(roles).values({
      name: "viewer",
      description: "Read-only access to view data"
    }).returning();

    // Create permissions
    const permissionData = [
      { name: "user:read", description: "View users", category: "User Management" },
      { name: "user:write", description: "Create and edit users", category: "User Management" },
      { name: "user:delete", description: "Delete users", category: "User Management" },
      { name: "role:read", description: "View roles", category: "Role Management" },
      { name: "role:write", description: "Create and edit roles", category: "Role Management" },
      { name: "role:delete", description: "Delete roles", category: "Role Management" },
      { name: "technician:read", description: "View technicians", category: "Technician Management" },
      { name: "technician:write", description: "Create and edit technicians", category: "Technician Management" },
      { name: "technician:delete", description: "Delete technicians", category: "Technician Management" },
      { name: "workorder:read", description: "View work orders", category: "Work Order Management" },
      { name: "workorder:write", description: "Create and edit work orders", category: "Work Order Management" },
      { name: "workorder:delete", description: "Delete work orders", category: "Work Order Management" },
      { name: "payment:read", description: "View payments", category: "Payment Management" },
      { name: "payment:write", description: "Process payments", category: "Payment Management" },
      { name: "analytics:read", description: "View analytics and reports", category: "Analytics" },
      { name: "notification:read", description: "View notifications", category: "Notifications" },
      { name: "notification:write", description: "Create notifications", category: "Notifications" }
    ];

    const createdPermissions = await db.insert(permissions).values(permissionData).returning();

    // Create default users
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User"
    }).returning();

    const managerHash = await bcrypt.hash("manager123", 10);
    const [managerUser] = await db.insert(users).values({
      username: "manager",
      email: "manager@example.com",
      password: managerHash,
      firstName: "Manager",
      lastName: "User"
    }).returning();

    const viewerHash = await bcrypt.hash("viewer123", 10);
    const [viewerUser] = await db.insert(users).values({
      username: "viewer",
      email: "viewer@example.com",
      password: viewerHash,
      firstName: "Viewer",
      lastName: "User"
    }).returning();

    // Assign roles to users
    await db.insert(userRoles).values([
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: managerUser.id, roleId: managerRole.id },
      { userId: viewerUser.id, roleId: viewerRole.id }
    ]);

    // Assign permissions to roles
    const allPermissionIds = createdPermissions.map(p => p.id);
    
    // Admin gets all permissions
    await db.insert(rolePermissions).values(
      allPermissionIds.map(permId => ({ roleId: adminRole.id, permissionId: permId }))
    );

    // Manager gets most permissions except delete
    const managerPermissions = createdPermissions.filter(p => !p.name.includes("delete"));
    await db.insert(rolePermissions).values(
      managerPermissions.map(perm => ({ roleId: managerRole.id, permissionId: perm.id }))
    );

    // Viewer gets only read permissions
    const viewerPermissions = createdPermissions.filter(p => p.name.includes("read"));
    await db.insert(rolePermissions).values(
      viewerPermissions.map(perm => ({ roleId: viewerRole.id, permissionId: perm.id }))
    );

    // Create sample technicians
    await db.insert(technicians).values([
      {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0101",
        specialization: "HVAC",
        experience: 5,
        hourlyRate: "75.00",
        location: "Downtown",
        latitude: "40.7128",
        longitude: "-74.0060",
        paymentMethods: JSON.stringify(["bank_transfer", "check"]),
        averageRating: "4.5",
        totalRatings: 12
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@example.com",
        phone: "+1-555-0102",
        specialization: "Electrical",
        experience: 3,
        hourlyRate: "65.00",
        location: "Uptown",
        latitude: "40.7831",
        longitude: "-73.9712",
        paymentMethods: JSON.stringify(["bank_transfer", "paypal"]),
        averageRating: "4.8",
        totalRatings: 8
      }
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}