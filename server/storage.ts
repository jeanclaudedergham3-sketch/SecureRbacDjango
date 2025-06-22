import { users, roles, permissions, userRoles, rolePermissions, equipment, type User, type Role, type Permission, type Equipment, type InsertUser, type InsertRole, type InsertPermission, type InsertEquipment, type UserWithRole, type RoleWithPermissions } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  private permissions: Map<number, Permission>;
  private userRoles: Map<number, { userId: number; roleId: number }>;
  private rolePermissions: Map<number, { roleId: number; permissionId: number }>;
  private equipment: Map<number, Equipment>;
  private currentUserId: number;
  private currentRoleId: number;
  private currentPermissionId: number;
  private currentUserRoleId: number;
  private currentRolePermissionId: number;
  private currentEquipmentId: number;

  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map();
    this.rolePermissions = new Map();
    this.equipment = new Map();
    this.currentUserId = 1;
    this.currentRoleId = 1;
    this.currentPermissionId = 1;
    this.currentUserRoleId = 1;
    this.currentRolePermissionId = 1;
    this.currentEquipmentId = 1;
    
    this.seedData();
  }

  private async seedData() {
    // Create permissions
    const permissions = [
      { name: "view_dashboard", description: "View dashboard" },
      { name: "view_users", description: "View users" },
      { name: "edit_users", description: "Edit users" },
      { name: "view_roles", description: "View roles" },
      { name: "assign_roles", description: "Assign roles" },
      { name: "view_equipment", description: "View equipment" },
      { name: "edit_equipment", description: "Edit equipment" },
    ];

    for (const perm of permissions) {
      await this.createPermission(perm);
    }

    // Create roles
    const adminRole = await this.createRole({ name: "admin", description: "Administrator with full access" });
    const managerRole = await this.createRole({ name: "manager", description: "Manager with limited access" });
    const viewerRole = await this.createRole({ name: "viewer", description: "Viewer with read-only access" });

    // Assign permissions to roles
    // Admin - all permissions
    for (let i = 1; i <= 7; i++) {
      await this.assignRolePermission(adminRole.id, i);
    }

    // Manager - limited permissions
    await this.assignRolePermission(managerRole.id, 1); // view_dashboard
    await this.assignRolePermission(managerRole.id, 2); // view_users
    await this.assignRolePermission(managerRole.id, 4); // view_roles
    await this.assignRolePermission(managerRole.id, 6); // view_equipment
    await this.assignRolePermission(managerRole.id, 7); // edit_equipment

    // Viewer - read-only permissions
    await this.assignRolePermission(viewerRole.id, 1); // view_dashboard
    await this.assignRolePermission(viewerRole.id, 2); // view_users

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
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<UserWithRole[]> {
    const usersArray = Array.from(this.users.values());
    const result: UserWithRole[] = [];

    for (const user of usersArray) {
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
    return this.roles.get(id);
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find(role => role.name === name);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.currentRoleId++;
    const role: Role = {
      ...insertRole,
      id,
      createdAt: new Date(),
    };
    this.roles.set(id, role);
    return role;
  }

  async updateRole(id: number, updateData: Partial<InsertRole>): Promise<Role | undefined> {
    const role = this.roles.get(id);
    if (!role) return undefined;

    const updatedRole = { ...role, ...updateData };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteRole(id: number): Promise<boolean> {
    return this.roles.delete(id);
  }

  async getAllRoles(): Promise<RoleWithPermissions[]> {
    const rolesArray = Array.from(this.roles.values());
    const result: RoleWithPermissions[] = [];

    for (const role of rolesArray) {
      const permissions = await this.getRolePermissions(role.id);
      result.push({ ...role, permissions });
    }

    return result;
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    return this.permissions.get(id);
  }

  async getPermissionByName(name: string): Promise<Permission | undefined> {
    return Array.from(this.permissions.values()).find(perm => perm.name === name);
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const id = this.currentPermissionId++;
    const permission: Permission = {
      ...insertPermission,
      id,
      createdAt: new Date(),
    };
    this.permissions.set(id, permission);
    return permission;
  }

  async getAllPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async assignUserRole(userId: number, roleId: number): Promise<boolean> {
    const id = this.currentUserRoleId++;
    this.userRoles.set(id, { userId, roleId });
    return true;
  }

  async removeUserRole(userId: number, roleId: number): Promise<boolean> {
    for (const [id, userRole] of this.userRoles.entries()) {
      if (userRole.userId === userId && userRole.roleId === roleId) {
        this.userRoles.delete(id);
        return true;
      }
    }
    return false;
  }

  async getUserRole(userId: number): Promise<Role | undefined> {
    for (const userRole of this.userRoles.values()) {
      if (userRole.userId === userId) {
        return this.roles.get(userRole.roleId);
      }
    }
    return undefined;
  }

  async assignRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    const id = this.currentRolePermissionId++;
    this.rolePermissions.set(id, { roleId, permissionId });
    return true;
  }

  async removeRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    for (const [id, rolePerm] of this.rolePermissions.entries()) {
      if (rolePerm.roleId === roleId && rolePerm.permissionId === permissionId) {
        this.rolePermissions.delete(id);
        return true;
      }
    }
    return false;
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const permissions: Permission[] = [];
    for (const rolePerm of this.rolePermissions.values()) {
      if (rolePerm.roleId === roleId) {
        const permission = this.permissions.get(rolePerm.permissionId);
        if (permission) {
          permissions.push(permission);
        }
      }
    }
    return permissions;
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return [];
    return this.getRolePermissions(userRole.id);
  }

  async getEquipment(id: number): Promise<Equipment | undefined> {
    return this.equipment.get(id);
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const id = this.currentEquipmentId++;
    const equipment: Equipment = {
      ...insertEquipment,
      id,
      createdAt: new Date(),
    };
    this.equipment.set(id, equipment);
    return equipment;
  }

  async updateEquipment(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const equipment = this.equipment.get(id);
    if (!equipment) return undefined;

    const updatedEquipment = { ...equipment, ...updateData };
    this.equipment.set(id, updatedEquipment);
    return updatedEquipment;
  }

  async deleteEquipment(id: number): Promise<boolean> {
    return this.equipment.delete(id);
  }

  async getAllEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }
}

export const storage = new MemStorage();
