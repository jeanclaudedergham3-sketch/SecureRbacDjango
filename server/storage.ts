import { db } from "./db";
import { 
  users, roles, permissions, userRoles, rolePermissions, technicians, technicianRatings,
  teams, teamMembers,
  workOrders, workOrderProposals, workOrderPartsRequests, workOrderFiles, workOrderChats, 
  workOrderTechnicianPayments, workOrderClientPayments, workOrderInvoices, notifications,
  type User, type Role, type Permission, type Technician, type TechnicianRating,
  type Team, type TeamMember, type TeamWithDetails,
  type WorkOrder, type WorkOrderProposal, type WorkOrderPartsRequest, type WorkOrderFile, 
  type WorkOrderChat, type WorkOrderTechnicianPayment, type WorkOrderClientPayment, type WorkOrderInvoice, type Notification,
  type InsertUser, type InsertRole, type InsertPermission, 
  type InsertTechnician, type InsertRating, type InsertTeam, type InsertTeamMember,
  type InsertWorkOrder, type InsertWorkOrderProposal,
  type InsertWorkOrderPartsRequest, type InsertWorkOrderFile, type InsertWorkOrderChat,
  type InsertWorkOrderTechnicianPayment, type InsertWorkOrderClientPayment, type InsertWorkOrderInvoice, type InsertNotification,
  type UserWithRole, type RoleWithPermissions, type WorkOrderWithUsers
} from "@shared/schema";
import { eq, sql, and, desc, asc, or } from "drizzle-orm";
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
  
  // Team operations
  getAllTeams(): Promise<TeamWithDetails[]>;
  getTeam(id: number): Promise<TeamWithDetails | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  addTeamMember(teamId: number, technicianId: number): Promise<TeamMember>;
  removeTeamMember(teamId: number, technicianId: number): Promise<boolean>;
  
  // Work Order Client Payment operations
  getWorkOrderClientPayments(workOrderId: number): Promise<WorkOrderClientPayment[]>;
  createWorkOrderClientPayment(payment: InsertWorkOrderClientPayment): Promise<WorkOrderClientPayment>;
  updateWorkOrderClientPayment(id: number, payment: Partial<InsertWorkOrderClientPayment>): Promise<WorkOrderClientPayment | undefined>;
  deleteWorkOrderClientPayment(id: number): Promise<boolean>;
  
  // Notification operations
  getNotifications(userId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount! > 0;
  }

  async getAllUsers(): Promise<UserWithRole[]> {
    const usersData = await db.select().from(users);
    const result: UserWithRole[] = [];
    
    for (const user of usersData) {
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
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async updateRole(id: number, updateData: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db.update(roles).set(updateData).where(eq(roles.id, id)).returning();
    return role || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.rowCount! > 0;
  }

  async getAllRoles(): Promise<RoleWithPermissions[]> {
    const rolesData = await db.select().from(roles);
    const result: RoleWithPermissions[] = [];
    
    for (const role of rolesData) {
      const rolePermissions = await this.getRolePermissions(role.id);
      result.push({ ...role, permissions: rolePermissions });
    }
    
    return result;
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getPermissionByName(name: string): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.name, name));
    return permission || undefined;
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await db.insert(permissions).values(insertPermission).returning();
    return permission;
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async assignUserRole(userId: number, roleId: number): Promise<boolean> {
    try {
      await db.insert(userRoles).values({ userId, roleId });
      return true;
    } catch {
      return false;
    }
  }

  async removeUserRole(userId: number, roleId: number): Promise<boolean> {
    const result = await db.delete(userRoles).where(
      eq(userRoles.userId, userId) && eq(userRoles.roleId, roleId)
    );
    return result.rowCount! > 0;
  }

  async getUserRole(userId: number): Promise<Role | undefined> {
    const [userRole] = await db.select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    
    return userRole?.roles;
  }

  async assignRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    try {
      await db.insert(rolePermissions).values({ roleId, permissionId });
      return true;
    } catch {
      return false;
    }
  }

  async removeRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    const result = await db.delete(rolePermissions).where(
      eq(rolePermissions.roleId, roleId) && eq(rolePermissions.permissionId, permissionId)
    );
    return result.rowCount! > 0;
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const result = await db.select()
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    
    return result.map(r => r.permissions);
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return [];
    
    return await this.getRolePermissions(userRole.id);
  }

  async getTechnician(id: number): Promise<Technician | undefined> {
    const [technician] = await db.select().from(technicians).where(eq(technicians.id, id));
    return technician || undefined;
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const [technician] = await db.insert(technicians).values(insertTechnician).returning();
    return technician;
  }

  async updateTechnician(id: number, updateData: Partial<InsertTechnician>): Promise<Technician | undefined> {
    const [technician] = await db.update(technicians).set(updateData).where(eq(technicians.id, id)).returning();
    return technician || undefined;
  }

  async deleteTechnician(id: number): Promise<boolean> {
    const result = await db.delete(technicians).where(eq(technicians.id, id));
    return result.rowCount! > 0;
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return await db.select().from(technicians);
  }

  async createRating(insertRating: InsertRating): Promise<TechnicianRating> {
    const [rating] = await db.insert(technicianRatings).values(insertRating).returning();
    await this.updateTechnicianAverageRating(insertRating.technicianId);
    return rating;
  }

  async getTechnicianRatings(technicianId: number): Promise<TechnicianRating[]> {
    return await db.select().from(technicianRatings).where(eq(technicianRatings.technicianId, technicianId));
  }

  async updateTechnicianAverageRating(technicianId: number): Promise<void> {
    const ratings = await this.getTechnicianRatings(technicianId);
    if (ratings.length === 0) return;
    
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    await db.update(technicians)
      .set({ averageRating: averageRating.toString(), totalRatings: ratings.length })
      .where(eq(technicians.id, technicianId));
  }

  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const [workOrder] = await db.select().from(workOrders).where(eq(workOrders.id, id));
    return workOrder || undefined;
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const workOrderNumber = await this.generateWorkOrderNumber();
    const [workOrder] = await db.insert(workOrders).values({
      ...insertWorkOrder,
      workOrderNumber
    }).returning();
    return workOrder;
  }

  async updateWorkOrder(id: number, updateData: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const [workOrder] = await db.update(workOrders).set(updateData).where(eq(workOrders.id, id)).returning();
    return workOrder || undefined;
  }

  async deleteWorkOrder(id: number): Promise<boolean> {
    const result = await db.delete(workOrders).where(eq(workOrders.id, id));
    return result.rowCount! > 0;
  }

  async getAllWorkOrders(): Promise<WorkOrderWithUsers[]> {
    const workOrdersData = await db.select().from(workOrders);
    const result: WorkOrderWithUsers[] = [];
    
    for (const workOrder of workOrdersData) {
      const assignedUsers: User[] = [];
      if (workOrder.assignedTo) {
        const user = await this.getUser(workOrder.assignedTo);
        if (user) assignedUsers.push(user);
      }
      result.push({ ...workOrder, assignedUsers });
    }
    
    return result;
  }

  async getUserWorkOrders(userId: number): Promise<WorkOrderWithUsers[]> {
    const workOrdersData = await db.select().from(workOrders).where(
      or(eq(workOrders.requestedBy, userId), eq(workOrders.assignedTo, userId))
    );
    const result: WorkOrderWithUsers[] = [];
    
    for (const workOrder of workOrdersData) {
      const assignedUsers: User[] = [];
      if (workOrder.assignedTo) {
        const user = await this.getUser(workOrder.assignedTo);
        if (user) assignedUsers.push(user);
      }
      result.push({ ...workOrder, assignedUsers });
    }
    
    return result;
  }

  async generateWorkOrderNumber(): Promise<string> {
    const count = await db.select({ count: sql<number>`count(*)` }).from(workOrders);
    const currentYear = new Date().getFullYear();
    const orderCount = count[0]?.count || 0;
    return `WO-${currentYear}-${String(orderCount + 1).padStart(3, '0')}`;
  }

  async getWorkOrderProposal(workOrderId: number): Promise<WorkOrderProposal | undefined> {
    const [proposal] = await db.select().from(workOrderProposals).where(eq(workOrderProposals.workOrderId, workOrderId));
    return proposal || undefined;
  }

  async createWorkOrderProposal(insertProposal: InsertWorkOrderProposal): Promise<WorkOrderProposal> {
    const [proposal] = await db.insert(workOrderProposals).values(insertProposal).returning();
    return proposal;
  }

  async updateWorkOrderProposal(workOrderId: number, updateData: Partial<InsertWorkOrderProposal>): Promise<WorkOrderProposal | undefined> {
    const [proposal] = await db.update(workOrderProposals)
      .set(updateData)
      .where(eq(workOrderProposals.workOrderId, workOrderId))
      .returning();
    return proposal || undefined;
  }

  async getWorkOrderPartsRequests(workOrderId: number): Promise<WorkOrderPartsRequest[]> {
    return await db.select().from(workOrderPartsRequests).where(eq(workOrderPartsRequests.workOrderId, workOrderId));
  }

  async createWorkOrderPartsRequest(insertPartsRequest: InsertWorkOrderPartsRequest): Promise<WorkOrderPartsRequest> {
    const [partsRequest] = await db.insert(workOrderPartsRequests).values(insertPartsRequest).returning();
    return partsRequest;
  }

  async updateWorkOrderPartsRequestStatus(id: number, status: string): Promise<boolean> {
    const result = await db.update(workOrderPartsRequests)
      .set({ status })
      .where(eq(workOrderPartsRequests.id, id));
    return result.rowCount! > 0;
  }

  async getWorkOrderFiles(workOrderId: number, category?: string): Promise<WorkOrderFile[]> {
    if (category) {
      return await db.select().from(workOrderFiles)
        .where(eq(workOrderFiles.workOrderId, workOrderId) && eq(workOrderFiles.category, category));
    }
    return await db.select().from(workOrderFiles).where(eq(workOrderFiles.workOrderId, workOrderId));
  }

  async createWorkOrderFile(insertFile: InsertWorkOrderFile): Promise<WorkOrderFile> {
    const [file] = await db.insert(workOrderFiles).values(insertFile).returning();
    return file;
  }

  async deleteWorkOrderFile(id: number): Promise<boolean> {
    const result = await db.delete(workOrderFiles).where(eq(workOrderFiles.id, id));
    return result.rowCount! > 0;
  }

  async getWorkOrderChats(workOrderId: number): Promise<WorkOrderChat[]> {
    return await db.select().from(workOrderChats).where(eq(workOrderChats.workOrderId, workOrderId));
  }

  async createWorkOrderChat(insertChat: InsertWorkOrderChat): Promise<WorkOrderChat> {
    const [chat] = await db.insert(workOrderChats).values(insertChat).returning();
    return chat;
  }

  async getWorkOrderTechnicianPayments(workOrderId: number): Promise<WorkOrderTechnicianPayment[]> {
    return await db.select().from(workOrderTechnicianPayments).where(eq(workOrderTechnicianPayments.workOrderId, workOrderId));
  }

  async createWorkOrderTechnicianPayment(insertPayment: InsertWorkOrderTechnicianPayment): Promise<WorkOrderTechnicianPayment> {
    const [payment] = await db.insert(workOrderTechnicianPayments).values(insertPayment).returning();
    return payment;
  }

  async updateWorkOrderTechnicianPayment(id: number, updateData: Partial<InsertWorkOrderTechnicianPayment>): Promise<WorkOrderTechnicianPayment | undefined> {
    const [payment] = await db.update(workOrderTechnicianPayments)
      .set(updateData)
      .where(eq(workOrderTechnicianPayments.id, id))
      .returning();
    return payment || undefined;
  }

  async getWorkOrderInvoice(workOrderId: number): Promise<WorkOrderInvoice | undefined> {
    const [invoice] = await db.select().from(workOrderInvoices).where(eq(workOrderInvoices.workOrderId, workOrderId));
    return invoice || undefined;
  }

  async createWorkOrderInvoice(insertInvoice: InsertWorkOrderInvoice): Promise<WorkOrderInvoice> {
    const [invoice] = await db.insert(workOrderInvoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateWorkOrderInvoice(workOrderId: number, updateData: Partial<InsertWorkOrderInvoice>): Promise<WorkOrderInvoice | undefined> {
    const [invoice] = await db.update(workOrderInvoices)
      .set(updateData)
      .where(eq(workOrderInvoices.workOrderId, workOrderId))
      .returning();
    return invoice || undefined;
  }

  async getAllInvoices(): Promise<WorkOrderInvoice[]> {
    return await db.select().from(workOrderInvoices);
  }

  async getInvoiceById(id: number): Promise<WorkOrderInvoice | undefined> {
    const [invoice] = await db.select().from(workOrderInvoices).where(eq(workOrderInvoices.id, id));
    return invoice || undefined;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(workOrderInvoices).where(eq(workOrderInvoices.id, id));
    return result.rowCount! > 0;
  }

  async lockWorkOrder(workOrderId: number): Promise<boolean> {
    const result = await db.update(workOrders)
      .set({ isLocked: true })
      .where(eq(workOrders.id, workOrderId));
    return result.rowCount! > 0;
  }

  async getAllProposals(): Promise<WorkOrderProposal[]> {
    return await db.select().from(workOrderProposals);
  }

  async getAllTeams(): Promise<TeamWithDetails[]> {
    const teamsData = await db.select().from(teams);
    const result: TeamWithDetails[] = [];
    for (const team of teamsData) {
      const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, team.id));
      const membersWithTech: (TeamMember & { technician: Technician })[] = [];
      for (const member of members) {
        const [tech] = await db.select().from(technicians).where(eq(technicians.id, member.technicianId));
        if (tech) membersWithTech.push({ ...member, technician: tech });
      }
      let teamLead: Technician | undefined;
      if (team.teamLeadId) {
        const [lead] = await db.select().from(technicians).where(eq(technicians.id, team.teamLeadId));
        teamLead = lead;
      }
      result.push({ ...team, teamLead, members: membersWithTech });
    }
    return result;
  }

  async getTeam(id: number): Promise<TeamWithDetails | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    if (!team) return undefined;
    const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, id));
    const membersWithTech: (TeamMember & { technician: Technician })[] = [];
    for (const member of members) {
      const [tech] = await db.select().from(technicians).where(eq(technicians.id, member.technicianId));
      if (tech) membersWithTech.push({ ...member, technician: tech });
    }
    let teamLead: Technician | undefined;
    if (team.teamLeadId) {
      const [lead] = await db.select().from(technicians).where(eq(technicians.id, team.teamLeadId));
      teamLead = lead;
    }
    return { ...team, teamLead, members: membersWithTech };
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db.update(teams).set(updateData).where(eq(teams.id, id)).returning();
    return team || undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return result.rowCount! > 0;
  }

  async addTeamMember(teamId: number, technicianId: number): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values({ teamId, technicianId }).returning();
    return member;
  }

  async removeTeamMember(teamId: number, technicianId: number): Promise<boolean> {
    const result = await db.delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.technicianId, technicianId)));
    return result.rowCount! > 0;
  }

  async getWorkOrderClientPayments(workOrderId: number): Promise<WorkOrderClientPayment[]> {
    return await db.select().from(workOrderClientPayments)
      .where(eq(workOrderClientPayments.workOrderId, workOrderId))
      .orderBy(desc(workOrderClientPayments.createdAt));
  }

  async createWorkOrderClientPayment(payment: InsertWorkOrderClientPayment): Promise<WorkOrderClientPayment> {
    const [created] = await db.insert(workOrderClientPayments).values(payment).returning();
    return created;
  }

  async updateWorkOrderClientPayment(id: number, payment: Partial<InsertWorkOrderClientPayment>): Promise<WorkOrderClientPayment | undefined> {
    const [updated] = await db.update(workOrderClientPayments).set(payment).where(eq(workOrderClientPayments.id, id)).returning();
    return updated || undefined;
  }

  async deleteWorkOrderClientPayment(id: number): Promise<boolean> {
    const result = await db.delete(workOrderClientPayments).where(eq(workOrderClientPayments.id, id));
    return result.rowCount! > 0;
  }

  async getNotifications(userId?: number): Promise<Notification[]> {
    try {
      if (userId) {
        const result = await db.select().from(notifications)
          .where(eq(notifications.userId, userId))
          .orderBy(notifications.createdAt);
        console.log(`Found ${result.length} notifications for user ${userId}`);
        return result;
      }
      const result = await db.select().from(notifications).orderBy(notifications.createdAt);
      console.log(`Found ${result.length} total notifications`);
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));
    return result.rowCount! > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.userId, userId));
    return result.rowCount! > 0;
  }
}

export const storage = new DatabaseStorage();