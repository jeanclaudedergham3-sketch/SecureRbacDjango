import { db } from "./database";
import { 
  users, roles, permissions, userRoles, rolePermissions, equipment, technicians, technicianRatings,
  type User, type Role, type Permission, type Equipment, type Technician, type TechnicianRating,
  type InsertUser, type InsertRole, type InsertPermission, type InsertEquipment, 
  type InsertTechnician, type InsertRating, type UserWithRole, type RoleWithPermissions 
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<UserWithRole[]>;
  
  // Authentication
  verifyPassword(username: string, password: string): Promise<User | null>;
  
  // Role operations
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  getAllRoles(): Promise<RoleWithPermissions[]>;
  
  // Permission operations
  getPermission(id: number): Promise<Permission | undefined>;
  getPermissionByName(name: string): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  getAllPermissions(): Promise<Permission[]>;
  
  // User-Role operations
  assignUserRole(userId: number, roleId: number): Promise<boolean>;
  removeUserRole(userId: number, roleId: number): Promise<boolean>;
  getUserRole(userId: number): Promise<Role | undefined>;
  
  // Role-Permission operations
  assignRolePermission(roleId: number, permissionId: number): Promise<boolean>;
  removeRolePermission(roleId: number, permissionId: number): Promise<boolean>;
  getRolePermissions(roleId: number): Promise<Permission[]>;
  getUserPermissions(userId: number): Promise<Permission[]>;
  
  // Equipment operations
  getEquipment(id: number): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, equipment: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: number): Promise<boolean>;
  getAllEquipment(): Promise<Equipment[]>;
  
  // Technician operations
  getTechnician(id: number): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: number, technician: Partial<InsertTechnician>): Promise<Technician | undefined>;
  deleteTechnician(id: number): Promise<boolean>;
  getAllTechnicians(): Promise<Technician[]>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<TechnicianRating>;
  getTechnicianRatings(technicianId: number): Promise<TechnicianRating[]>;
  updateTechnicianAverageRating(technicianId: number): Promise<void>;
}

export class SqliteStorage implements IStorage {
  private initialized = false;

  constructor() {
    // Seed data immediately since database should be initialized by now
    this.seedData();
  }

  private async seedData() {
    try {
      if (this.initialized) return;
      
      // Add a small delay to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if data already exists
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        console.log("Database already seeded");
        this.initialized = true;
        return; // Data already seeded
      }

      // Create permissions
      const permissionsList = [
        { name: "view_dashboard", description: "View dashboard" },
        { name: "view_users", description: "View users" },
        { name: "edit_users", description: "Edit users" },
        { name: "view_roles", description: "View roles" },
        { name: "assign_roles", description: "Assign roles" },
        { name: "view_equipment", description: "View equipment" },
        { name: "edit_equipment", description: "Edit equipment" },
        { name: "manage_technicians", description: "Manage technicians" },
        { name: "rate_technicians", description: "Rate technicians" },
      ];

      const createdPermissions = [];
      for (const perm of permissionsList) {
        const created = await this.createPermission(perm);
        createdPermissions.push(created);
      }

      // Create roles
      const adminRole = await this.createRole({ name: "admin", description: "Administrator with full access" });
      const managerRole = await this.createRole({ name: "manager", description: "Manager with limited access" });
      const viewerRole = await this.createRole({ name: "viewer", description: "Viewer with read-only access" });

      // Assign permissions to roles
      // Admin - all permissions
      for (const perm of createdPermissions) {
        await this.assignRolePermission(adminRole.id, perm.id);
      }

      // Manager - limited permissions
      await this.assignRolePermission(managerRole.id, createdPermissions[0].id); // view_dashboard
      await this.assignRolePermission(managerRole.id, createdPermissions[1].id); // view_users
      await this.assignRolePermission(managerRole.id, createdPermissions[3].id); // view_roles
      await this.assignRolePermission(managerRole.id, createdPermissions[5].id); // view_equipment
      await this.assignRolePermission(managerRole.id, createdPermissions[6].id); // edit_equipment
      await this.assignRolePermission(managerRole.id, createdPermissions[7].id); // manage_technicians
      await this.assignRolePermission(managerRole.id, createdPermissions[8].id); // rate_technicians

      // Viewer - read-only permissions
      await this.assignRolePermission(viewerRole.id, createdPermissions[0].id); // view_dashboard
      await this.assignRolePermission(viewerRole.id, createdPermissions[1].id); // view_users
      await this.assignRolePermission(viewerRole.id, createdPermissions[3].id); // view_roles
      await this.assignRolePermission(viewerRole.id, createdPermissions[5].id); // view_equipment
      await this.assignRolePermission(viewerRole.id, createdPermissions[8].id); // rate_technicians

      // Create default users
      const adminUser = await this.createUser({
        username: "admin",
        email: "admin@example.com",
        password: await bcrypt.hash("admin123", 10),
        firstName: "John",
        lastName: "Doe",
        isActive: true,
      });

      const managerUser = await this.createUser({
        username: "manager",
        email: "manager@example.com",
        password: await bcrypt.hash("manager123", 10),
        firstName: "Sarah",
        lastName: "Wilson",
        isActive: true,
      });

      const viewerUser = await this.createUser({
        username: "viewer",
        email: "viewer@example.com",
        password: await bcrypt.hash("viewer123", 10),
        firstName: "Mike",
        lastName: "Johnson",
        isActive: false,
      });

      // Assign roles to users
      await this.assignUserRole(adminUser.id, adminRole.id);
      await this.assignUserRole(managerUser.id, managerRole.id);
      await this.assignUserRole(viewerUser.id, viewerRole.id);

      // Create sample equipment
      await this.createEquipment({
        name: "Server #01",
        type: "server",
        description: "Main Database Server",
        status: "online",
        cpuUsage: 45,
        memoryUsage: 67,
      });

      await this.createEquipment({
        name: "Network Switch",
        type: "network",
        description: "Core Network Device",
        status: "online",
        cpuUsage: 50,
        memoryUsage: 85,
      });

      await this.createEquipment({
        name: "Storage Array",
        type: "storage",
        description: "Backup Storage System",
        status: "offline",
        cpuUsage: 0,
        memoryUsage: 0,
      });

      // Create sample technicians
      await this.createTechnician({
        name: "John Smith",
        phoneNumber: "+1-555-0101",
        email: "john.smith@tech.com",
        address: "123 Tech Street, San Francisco, CA 94105",
        latitude: "37.7749",
        longitude: "-122.4194",
        taxNumber: "TAX123456",
        paymentMethods: JSON.stringify(["paypal", "bank_transfer"]),
        paymentDetails: JSON.stringify({
          paypal: { link: "https://paypal.me/johnsmith", qrCode: "" },
          bank_transfer: { iban: "US12345678901234567890", bankName: "Tech Bank", accountName: "John Smith" }
        }),
        averageRating: "4.5",
        totalRatings: 12,
      });

      await this.createTechnician({
        name: "Sarah Johnson",
        phoneNumber: "+1-555-0102",
        email: "sarah.johnson@tech.com", 
        address: "456 Innovation Ave, Austin, TX 78701",
        latitude: "30.2672",
        longitude: "-97.7431",
        taxNumber: "TAX789012",
        paymentMethods: JSON.stringify(["credit_card", "cash"]),
        paymentDetails: JSON.stringify({
          credit_card: { cardholderName: "Sarah Johnson", cardNumber: "**** **** **** 1234", expiryDate: "12/25" }
        }),
        averageRating: "4.8",
        totalRatings: 8,
      });

      console.log("Database seeded successfully");
      this.initialized = true;
    } catch (error) {
      console.error("Error seeding database:", error);
      // Retry after a delay if tables don't exist
      if (error instanceof Error && error.message?.includes('no such table')) {
        console.log("Tables don't exist yet, retrying in 2 seconds...");
        setTimeout(() => this.seedData(), 2000);
      }
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.changes > 0;
  }

  async getAllUsers(): Promise<UserWithRole[]> {
    const allUsers = await db.select().from(users);
    const result: UserWithRole[] = [];

    for (const user of allUsers) {
      const role = await this.getUserRole(user.id);
      result.push({ ...user, role });
    }

    return result;
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getRole(id: number): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return result[0];
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    return result[0];
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const result = await db.insert(roles).values({
      ...insertRole,
      description: insertRole.description ?? null,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateRole(id: number, updateData: Partial<InsertRole>): Promise<Role | undefined> {
    const result = await db.update(roles)
      .set(updateData)
      .where(eq(roles.id, id))
      .returning();
    return result[0];
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.changes > 0;
  }

  async getAllRoles(): Promise<RoleWithPermissions[]> {
    const allRoles = await db.select().from(roles);
    const result: RoleWithPermissions[] = [];

    for (const role of allRoles) {
      const rolePermissions = await this.getRolePermissions(role.id);
      result.push({ ...role, permissions: rolePermissions });
    }

    return result;
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);
    return result[0];
  }

  async getPermissionByName(name: string): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1);
    return result[0];
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const result = await db.insert(permissions).values({
      ...insertPermission,
      description: insertPermission.description ?? null,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async assignUserRole(userId: number, roleId: number): Promise<boolean> {
    try {
      await db.insert(userRoles).values({
        userId,
        roleId,
        createdAt: new Date(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeUserRole(userId: number, roleId: number): Promise<boolean> {
    const result = await db.delete(userRoles)
      .where(sql`${userRoles.userId} = ${userId} AND ${userRoles.roleId} = ${roleId}`);
    return result.changes > 0;
  }

  async getUserRole(userId: number): Promise<Role | undefined> {
    const result = await db
      .select({ role: roles })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))
      .limit(1);
    
    return result[0]?.role;
  }

  async assignRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    try {
      await db.insert(rolePermissions).values({
        roleId,
        permissionId,
        createdAt: new Date(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    const result = await db.delete(rolePermissions)
      .where(sql`${rolePermissions.roleId} = ${roleId} AND ${rolePermissions.permissionId} = ${permissionId}`);
    return result.changes > 0;
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const result = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    
    return result.map(r => r.permission);
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return [];
    return this.getRolePermissions(userRole.id);
  }

  async getEquipment(id: number): Promise<Equipment | undefined> {
    const result = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);
    return result[0];
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const result = await db.insert(equipment).values({
      ...insertEquipment,
      status: insertEquipment.status ?? "online",
      description: insertEquipment.description ?? null,
      cpuUsage: insertEquipment.cpuUsage ?? null,
      memoryUsage: insertEquipment.memoryUsage ?? null,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateEquipment(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const result = await db.update(equipment)
      .set(updateData)
      .where(eq(equipment.id, id))
      .returning();
    return result[0];
  }

  async deleteEquipment(id: number): Promise<boolean> {
    const result = await db.delete(equipment).where(eq(equipment.id, id));
    return result.changes > 0;
  }

  async getAllEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment);
  }

  // Technician operations
  async getTechnician(id: number): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.id, id));
    return result[0];
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const result = await db.insert(technicians).values({
      ...insertTechnician,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateTechnician(id: number, updateData: Partial<InsertTechnician>): Promise<Technician | undefined> {
    const result = await db.update(technicians)
      .set(updateData)
      .where(eq(technicians.id, id))
      .returning();
    return result[0];
  }

  async deleteTechnician(id: number): Promise<boolean> {
    const result = await db.delete(technicians).where(eq(technicians.id, id));
    return result.changes > 0;
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return await db.select().from(technicians);
  }

  // Rating operations
  async createRating(insertRating: InsertRating): Promise<TechnicianRating> {
    const result = await db.insert(technicianRatings).values({
      ...insertRating,
      createdAt: new Date(),
    }).returning();
    
    // Update technician average rating
    await this.updateTechnicianAverageRating(insertRating.technicianId);
    
    return result[0];
  }

  async getTechnicianRatings(technicianId: number): Promise<TechnicianRating[]> {
    return await db.select().from(technicianRatings).where(eq(technicianRatings.technicianId, technicianId));
  }

  async updateTechnicianAverageRating(technicianId: number): Promise<void> {
    const ratings = await this.getTechnicianRatings(technicianId);
    if (ratings.length === 0) return;

    const average = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
    
    await db.update(technicians)
      .set({
        averageRating: average.toFixed(1),
        totalRatings: ratings.length,
      })
      .where(eq(technicians.id, technicianId));
  }
}

export const storage = new SqliteStorage();
