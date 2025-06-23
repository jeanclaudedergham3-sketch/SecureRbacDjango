import { db } from "./database";
import { 
  users, roles, permissions, userRoles, rolePermissions, technicians, technicianRatings,
  workOrders, workOrderProposals, workOrderPartsRequests, workOrderFiles, workOrderChats, 
  workOrderTechnicianPayments, workOrderInvoices, notifications,
  type User, type Role, type Permission, type Technician, type TechnicianRating,
  type WorkOrder, type WorkOrderProposal, type WorkOrderPartsRequest, type WorkOrderFile, 
  type WorkOrderChat, type WorkOrderTechnicianPayment, type WorkOrderInvoice, type Notification,
  type InsertUser, type InsertRole, type InsertPermission, 
  type InsertTechnician, type InsertRating, type InsertWorkOrder, type InsertWorkOrderProposal,
  type InsertWorkOrderPartsRequest, type InsertWorkOrderFile, type InsertWorkOrderChat,
  type InsertWorkOrderTechnicianPayment, type InsertWorkOrderInvoice, type InsertNotification,
  type UserWithRole, type RoleWithPermissions, type WorkOrderWithUsers
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
  
  // Work Order operations
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  deleteWorkOrder(id: number): Promise<boolean>;
  getAllWorkOrders(): Promise<WorkOrderWithUsers[]>;
  getUserWorkOrders(userId: number): Promise<WorkOrderWithUsers[]>;
  generateWorkOrderNumber(): Promise<string>;
  
  // Work Order Proposal operations
  getWorkOrderProposal(workOrderId: number): Promise<WorkOrderProposal | undefined>;
  createWorkOrderProposal(proposal: InsertWorkOrderProposal): Promise<WorkOrderProposal>;
  updateWorkOrderProposal(workOrderId: number, proposal: Partial<InsertWorkOrderProposal>): Promise<WorkOrderProposal | undefined>;
  
  // Work Order Parts Request operations
  getWorkOrderPartsRequests(workOrderId: number): Promise<WorkOrderPartsRequest[]>;
  createWorkOrderPartsRequest(partsRequest: InsertWorkOrderPartsRequest): Promise<WorkOrderPartsRequest>;
  updateWorkOrderPartsRequestStatus(id: number, status: string): Promise<boolean>;
  
  // Work Order File operations
  getWorkOrderFiles(workOrderId: number, category?: string): Promise<WorkOrderFile[]>;
  createWorkOrderFile(file: InsertWorkOrderFile): Promise<WorkOrderFile>;
  deleteWorkOrderFile(id: number): Promise<boolean>;
  
  // Work Order Chat operations
  getWorkOrderChats(workOrderId: number): Promise<WorkOrderChat[]>;
  createWorkOrderChat(chat: InsertWorkOrderChat): Promise<WorkOrderChat>;
  
  // Work Order Technician Payment operations
  getWorkOrderTechnicianPayments(workOrderId: number): Promise<WorkOrderTechnicianPayment[]>;
  createWorkOrderTechnicianPayment(payment: InsertWorkOrderTechnicianPayment): Promise<WorkOrderTechnicianPayment>;
  updateWorkOrderTechnicianPayment(id: number, payment: Partial<InsertWorkOrderTechnicianPayment>): Promise<WorkOrderTechnicianPayment | undefined>;
  
  // Work Order Invoice operations
  getWorkOrderInvoice(workOrderId: number): Promise<WorkOrderInvoice | undefined>;
  createWorkOrderInvoice(invoice: InsertWorkOrderInvoice): Promise<WorkOrderInvoice>;
  updateWorkOrderInvoice(workOrderId: number, invoice: Partial<InsertWorkOrderInvoice>): Promise<WorkOrderInvoice | undefined>;
  getAllInvoices(): Promise<WorkOrderInvoice[]>;
  getInvoiceById(id: number): Promise<WorkOrderInvoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  lockWorkOrder(workOrderId: number): Promise<boolean>;
  
  // Proposal operations for financial analysis
  getAllProposals(): Promise<WorkOrderProposal[]>;
  
  // Notification operations
  getNotifications(userId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
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
        { name: "manage_work_orders", description: "Manage work orders" },
        { name: "view_work_orders", description: "View work orders" },
        { name: "manage_payments", description: "Manage technician payments" },
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
      await this.assignRolePermission(managerRole.id, createdPermissions[9].id); // manage_work_orders
      await this.assignRolePermission(managerRole.id, createdPermissions[10].id); // view_work_orders
      await this.assignRolePermission(managerRole.id, createdPermissions[11].id); // manage_payments

      // Viewer - read-only permissions
      await this.assignRolePermission(viewerRole.id, createdPermissions[0].id); // view_dashboard
      await this.assignRolePermission(viewerRole.id, createdPermissions[1].id); // view_users
      await this.assignRolePermission(viewerRole.id, createdPermissions[3].id); // view_roles
      await this.assignRolePermission(viewerRole.id, createdPermissions[5].id); // view_equipment
      await this.assignRolePermission(viewerRole.id, createdPermissions[8].id); // rate_technicians
      await this.assignRolePermission(viewerRole.id, createdPermissions[10].id); // view_work_orders

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



      // Create sample technicians
      await this.createTechnician({
        name: "John Smith",
        phoneNumber: "+1-555-0123",
        email: "john@example.com",
        address: "123 Main St, New York, NY 10001",
        taxNumber: "12-3456789",
        hourlyRate: "75",
        specialties: "HVAC, Electrical",
        certifications: "EPA Certified",
        status: "available",
        latitude: 40.7128,
        longitude: -74.0060,
        bankAccount: "1234567890",
        routingNumber: "021000021",
        bankName: "Chase Bank",
        paypalEmail: "john.smith@paypal.com",
        paypalLink: "https://paypal.me/johnsmith",
        venmoHandle: "@johnsmith",
        venmoQr: "",
        cashappHandle: "$johnsmith",
        cashappQr: "",
        zelleInfo: "john.smith@chase.com",
        mailingAddress: "123 Main St, New York, NY 10001",
        paymentMethods: JSON.stringify(["paypal", "bank_transfer", "cash"]),
        paymentDetails: JSON.stringify({
          paypal: { link: "https://paypal.me/johnsmith", qrCode: "" },
          bank_transfer: { iban: "US64SVBKUS6S123456789", bankName: "Chase Bank", accountName: "John Smith" },
          cash: {}
        })
      });

      await this.createTechnician({
        name: "Sarah Johnson",
        phoneNumber: "+1-555-0124",
        specialties: "Plumbing, General Maintenance",
        certifications: "Licensed Plumber",
        status: "available",
        latitude: 40.7580,
        longitude: -73.9855,

        bankAccount: "9876543210",
        routingNumber: "011000015",
        bankName: "Bank of America",
        paypalEmail: "sarah.johnson@paypal.com",
        venmoHandle: "@sarahjohnson",
        cashappHandle: "$sarahjohnson",
        zelleInfo: "sarah.johnson@example.com",
        mailingAddress: "456 Oak Ave, Brooklyn, NY 11201",
      });

      // Create sample work orders
      await this.createWorkOrder({
        clientName: "ABC Corporation",
        country: "United States", 
        city: "New York",
        street: "123 Business Ave",
        nte: "5000.00",
        tnte: "5500.00",
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-02-15"),
        assignedUserIds: JSON.stringify([adminUser.id, managerUser.id]),
        status: "active",
      });

      await this.createWorkOrder({
        clientName: "XYZ Industries",
        country: "Canada",
        city: "Toronto", 
        street: "789 Tech Boulevard",
        nte: "8000.00",
        tnte: "8800.00",
        startDate: new Date("2025-01-20"),
        endDate: new Date("2025-03-20"),
        assignedUserIds: JSON.stringify([managerUser.id]),
        status: "active",
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





  // Technician operations
  async getTechnician(id: number): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.id, id));
    return result[0];
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const result = await db.insert(technicians).values(insertTechnician).returning();
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
        averageRating: average,
        totalRatings: ratings.length,
      })
      .where(eq(technicians.id, technicianId));
  }

  // Work Order operations
  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const result = await db.select().from(workOrders).where(eq(workOrders.id, id));
    return result[0];
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const workOrderNumber = await this.generateWorkOrderNumber();
    const result = await db.insert(workOrders).values({
      ...insertWorkOrder,
      workOrderNumber,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateWorkOrder(id: number, updateData: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const result = await db.update(workOrders)
      .set(updateData)
      .where(eq(workOrders.id, id))
      .returning();
    return result[0];
  }

  async deleteWorkOrder(id: number): Promise<boolean> {
    const result = await db.delete(workOrders).where(eq(workOrders.id, id));
    return result.changes > 0;
  }

  async getAllWorkOrders(): Promise<WorkOrderWithUsers[]> {
    const workOrdersData = await db.select().from(workOrders);
    const allUsers = await db.select().from(users);
    
    return workOrdersData.map(workOrder => {
      try {
        const assignedUserIds = JSON.parse(workOrder.assignedUserIds || "[]");
        const assignedUsers = allUsers.filter(user => assignedUserIds.includes(user.id));
        
        return {
          ...workOrder,
          assignedUsers
        };
      } catch (error) {
        console.error("Error parsing assigned user IDs:", error);
        return {
          ...workOrder,
          assignedUsers: []
        };
      }
    });
  }

  async getUserWorkOrders(userId: number): Promise<WorkOrderWithUsers[]> {
    const allWorkOrders = await this.getAllWorkOrders();
    
    return allWorkOrders.filter(workOrder => {
      try {
        const assignedUserIds = JSON.parse(workOrder.assignedUserIds || "[]");
        return assignedUserIds.includes(userId);
      } catch (error) {
        console.error("Error parsing assigned user IDs:", error);
        return false;
      }
    });
  }

  async generateWorkOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `WO-${year}-`;
    
    // Get the latest work order number for this year
    const latestWorkOrder = await db.select()
      .from(workOrders)
      .where(sql`${workOrders.workOrderNumber} LIKE ${prefix + '%'}`)
      .orderBy(sql`${workOrders.workOrderNumber} DESC`)
      .limit(1);
    
    let nextNumber = 1;
    if (latestWorkOrder.length > 0) {
      const lastNumber = latestWorkOrder[0].workOrderNumber.split('-').pop();
      nextNumber = parseInt(lastNumber || '0') + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  // Work Order Proposal operations
  async getWorkOrderProposal(workOrderId: number): Promise<WorkOrderProposal | undefined> {
    const result = await db.select().from(workOrderProposals).where(eq(workOrderProposals.workOrderId, workOrderId));
    return result[0];
  }

  async createWorkOrderProposal(insertProposal: InsertWorkOrderProposal): Promise<WorkOrderProposal> {
    const result = await db.insert(workOrderProposals).values({
      ...insertProposal,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateWorkOrderProposal(workOrderId: number, updateData: Partial<InsertWorkOrderProposal>): Promise<WorkOrderProposal | undefined> {
    const result = await db.update(workOrderProposals)
      .set(updateData)
      .where(eq(workOrderProposals.workOrderId, workOrderId))
      .returning();
    return result[0];
  }

  // Work Order Parts Request operations
  async getWorkOrderPartsRequests(workOrderId: number): Promise<WorkOrderPartsRequest[]> {
    return await db.select().from(workOrderPartsRequests).where(eq(workOrderPartsRequests.workOrderId, workOrderId));
  }

  async createWorkOrderPartsRequest(insertPartsRequest: InsertWorkOrderPartsRequest): Promise<WorkOrderPartsRequest> {
    const result = await db.insert(workOrderPartsRequests).values(insertPartsRequest).returning();
    return result[0];
  }

  async updateWorkOrderPartsRequestStatus(id: number, status: string): Promise<boolean> {
    const result = await db.update(workOrderPartsRequests)
      .set({ status })
      .where(eq(workOrderPartsRequests.id, id));
    return result.changes > 0;
  }

  // Work Order File operations
  async getWorkOrderFiles(workOrderId: number, category?: string): Promise<WorkOrderFile[]> {
    if (category) {
      return await db.select().from(workOrderFiles)
        .where(sql`${workOrderFiles.workOrderId} = ${workOrderId} AND ${workOrderFiles.category} = ${category}`);
    }
    return await db.select().from(workOrderFiles).where(eq(workOrderFiles.workOrderId, workOrderId));
  }

  async createWorkOrderFile(insertFile: InsertWorkOrderFile): Promise<WorkOrderFile> {
    const result = await db.insert(workOrderFiles).values({
      ...insertFile,
      uploadedAt: new Date(),
    }).returning();
    return result[0];
  }

  async deleteWorkOrderFile(id: number): Promise<boolean> {
    const result = await db.delete(workOrderFiles).where(eq(workOrderFiles.id, id));
    return result.changes > 0;
  }

  // Work Order Chat operations
  async getWorkOrderChats(workOrderId: number): Promise<WorkOrderChat[]> {
    return await db.select().from(workOrderChats)
      .where(eq(workOrderChats.workOrderId, workOrderId))
      .orderBy(workOrderChats.createdAt);
  }

  async createWorkOrderChat(insertChat: InsertWorkOrderChat): Promise<WorkOrderChat> {
    const result = await db.insert(workOrderChats).values(insertChat).returning();
    return result[0];
  }

  // Work Order Technician Payment operations
  async getWorkOrderTechnicianPayments(workOrderId: number): Promise<WorkOrderTechnicianPayment[]> {
    if (workOrderId === 0) {
      // Get all payments
      return await db.select().from(workOrderTechnicianPayments);
    }
    return await db.select()
      .from(workOrderTechnicianPayments)
      .where(eq(workOrderTechnicianPayments.workOrderId, workOrderId));
  }

  async createWorkOrderTechnicianPayment(insertPayment: InsertWorkOrderTechnicianPayment): Promise<WorkOrderTechnicianPayment> {
    const result = await db.insert(workOrderTechnicianPayments).values(insertPayment).returning();
    return result[0];
  }

  async updateWorkOrderTechnicianPayment(id: number, updateData: Partial<InsertWorkOrderTechnicianPayment>): Promise<WorkOrderTechnicianPayment | undefined> {
    const result = await db.update(workOrderTechnicianPayments)
      .set(updateData)
      .where(eq(workOrderTechnicianPayments.id, id))
      .returning();
    return result[0];
  }

  // Work Order Invoice operations
  async getWorkOrderInvoice(workOrderId: number): Promise<WorkOrderInvoice | undefined> {
    console.log(`Storage: Getting invoice for work order ${workOrderId}`);
    const result = await db.select().from(workOrderInvoices).where(eq(workOrderInvoices.workOrderId, workOrderId));
    console.log(`Storage: Found invoice result:`, result);
    return result[0];
  }

  async createWorkOrderInvoice(insertInvoice: InsertWorkOrderInvoice): Promise<WorkOrderInvoice> {
    console.log("Storage: Creating invoice with data:", insertInvoice);
    const result = await db.insert(workOrderInvoices).values({
      ...insertInvoice,
      createdAt: new Date(),
    }).returning();
    console.log("Storage: Created invoice result:", result[0]);
    return result[0];
  }

  async updateWorkOrderInvoice(workOrderId: number, updateData: Partial<InsertWorkOrderInvoice>): Promise<WorkOrderInvoice | undefined> {
    const result = await db.update(workOrderInvoices)
      .set(updateData)
      .where(eq(workOrderInvoices.workOrderId, workOrderId))
      .returning();
    return result[0];
  }

  async getAllInvoices(): Promise<WorkOrderInvoice[]> {
    const result = await db.select().from(workOrderInvoices);
    return result;
  }

  async getInvoiceById(id: number): Promise<WorkOrderInvoice | undefined> {
    const result = await db.select().from(workOrderInvoices).where(eq(workOrderInvoices.id, id));
    return result[0];
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(workOrderInvoices).where(eq(workOrderInvoices.id, id));
    return result.changes > 0;
  }

  async lockWorkOrder(workOrderId: number): Promise<boolean> {
    console.log(`Storage: Locking work order ${workOrderId}`);
    const result = await db.update(workOrders)
      .set({ isLocked: true })
      .where(eq(workOrders.id, workOrderId));
    console.log(`Storage: Work order ${workOrderId} lock result:`, result.changes > 0);
    return result.changes > 0;
  }

  async getAllProposals(): Promise<WorkOrderProposal[]> {
    return await db.select().from(workOrderProposals);
  }

  async getNotifications(userId?: number): Promise<Notification[]> {
    if (userId) {
      return await db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(sql`${notifications.createdAt} DESC`);
    }
    return await db.select()
      .from(notifications)
      .orderBy(sql`${notifications.createdAt} DESC`);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId))
      .returning();
    return result.length > 0;
  }

  private async createSampleNotifications() {
    try {
      const existingNotifications = await db.select().from(notifications).limit(1);
      if (existingNotifications.length > 0) return;

      const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
      if (adminUser.length === 0) return;

      const sampleNotifications = [
        {
          userId: adminUser[0].id,
          title: "New Work Order Created",
          message: "Work order #WO-2025-001 has been created and assigned to technician Sarah Johnson",
          type: "info" as const,
          relatedEntity: "work_order",
          relatedId: 1
        },
        {
          userId: adminUser[0].id,
          title: "Payment Request Submitted", 
          message: "Technician John Smith has submitted a payment request for $450.00",
          type: "warning" as const,
          relatedEntity: "payment",
          relatedId: 1
        },
        {
          userId: adminUser[0].id,
          title: "Invoice Generated",
          message: "Invoice #INV-2025-001 has been generated for work order #WO-2025-001",
          type: "success" as const,
          relatedEntity: "invoice", 
          relatedId: 1
        },
        {
          userId: adminUser[0].id,
          title: "Equipment Maintenance Due",
          message: "Server #01 is due for scheduled maintenance inspection within 7 days",
          type: "warning" as const,
          relatedEntity: "equipment",
          relatedId: 1
        },
        {
          userId: adminUser[0].id,
          title: "New Technician Registered",
          message: "Mike Wilson has been registered as a new technician and is available for assignments",
          type: "success" as const,
          relatedEntity: "technician",
          relatedId: 3
        }
      ];

      for (const notification of sampleNotifications) {
        await db.insert(notifications).values(notification);
      }

      console.log('Sample notifications created');
    } catch (error) {
      console.error('Error creating sample notifications:', error);
    }
  }
}

export const storage = new SqliteStorage();
