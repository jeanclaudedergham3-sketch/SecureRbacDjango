import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import { requirePermission } from "./middleware/rbac";
import { insertUserSchema, insertTechnicianSchema, insertRatingSchema, insertWorkOrderSchema, insertWorkOrderProposalSchema, insertWorkOrderPartsRequestSchema, insertWorkOrderFileSchema, insertWorkOrderChatSchema, insertWorkOrderTechnicianPaymentSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Setup file upload middleware
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const workOrderId = req.params.id;
    const uploadPath = path.join(process.cwd(), 'uploads', workOrderId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const ALLOWED_UPLOAD_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.zip'];
const ALLOWED_UPLOAD_MIME = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain','text/csv','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip'];

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_UPLOAD_EXTENSIONS.includes(ext) && ALLOWED_UPLOAD_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')}`));
    }
  }
});

// W9 file upload middleware (stores under uploads/w9/{technicianId}/)
const w9Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const technicianId = req.params.id;
    const uploadPath = path.join(process.cwd(), 'uploads', 'w9', technicianId);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'w9-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadW9 = multer({
  storage: w9Storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, image, and Word documents are allowed for W9'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === 'production') {
    console.error('FATAL: SESSION_SECRET environment variable is not set in production. Refusing to start.');
    process.exit(1);
  }
  app.use(session({
    secret: sessionSecret || 'dev-only-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.verifyPassword(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }

      req.session.userId = user.id;
      
      const userRole = await storage.getUserRole(user.id);
      const userPermissions = await storage.getUserPermissions(user.id);
      
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive
        },
        role: userRole,
        permissions: userPermissions.map(p => p.name)
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.user.id);
      const userPermissions = await storage.getUserPermissions(req.user.id);
      
      res.json({
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          isActive: req.user.isActive
        },
        role: userRole,
        permissions: userPermissions.map(p => p.name)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, requirePermission("users.list.view"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.post("/api/users", requireAuth, requirePermission("users.create"), async (req, res) => {
    try {
      console.log("Creating user with data:", req.body);
      
      // Validate required fields manually since the schema might not catch everything
      const { username, email, firstName, lastName, password, roleId } = req.body;
      if (!username || !email || !firstName || !lastName || !password) {
        throw new Error("Missing required fields");
      }
      
      // Validate role is provided and has permissions
      if (!roleId) {
        throw new Error("Role is required. Please select a role for this user.");
      }
      
      // Check if the role exists and has permissions
      const rolePermissions = await storage.getRolePermissions(roleId);
      if (rolePermissions.length === 0) {
        console.log(`Role ${roleId} has no permissions - blocking user creation`);
        throw new Error("Selected role has no permissions. Please assign permissions to this role first, or choose a different role.");
      }
      
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userWithHashedPassword = { ...userData, password: hashedPassword };
      
      const user = await storage.createUser(userWithHashedPassword);
      console.log("User created:", user);
      
      // Assign role (now required)
      console.log("Assigning role:", roleId);
      await storage.assignUserRole(user.id, roleId);
      
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      let message = "Failed to create user";
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        if (error.message.includes('username')) {
          message = "Username already exists. Please choose a different username.";
        } else if (error.message.includes('email')) {
          message = "Email address already exists. Please use a different email.";
        } else {
          message = "User with this information already exists.";
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      res.status(400).json({ 
        message,
        error: error.code || error.message
      });
    }
  });

  app.put("/api/users/:id", requireAuth, requirePermission("users.edit"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Whitelist allowed fields to prevent mass assignment
      const { firstName, lastName, email, username, password, roleId, isActive, phone, department } = req.body;
      const userData: Record<string, any> = {};
      if (firstName !== undefined) userData.firstName = firstName;
      if (lastName !== undefined) userData.lastName = lastName;
      if (email !== undefined) userData.email = email;
      if (username !== undefined) userData.username = username;
      if (roleId !== undefined) userData.roleId = parseInt(roleId);
      if (isActive !== undefined) userData.isActive = isActive;
      if (phone !== undefined) userData.phone = phone;
      if (department !== undefined) userData.department = department;
      
      // Hash password if provided
      if (password) {
        userData.password = await bcrypt.hash(password, 10);
      }
      
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requirePermission("users.delete"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/users/:id/role", requireAuth, requirePermission("roles.assign"), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { roleId } = req.body;
      
      // Remove existing role first
      const existingRole = await storage.getUserRole(userId);
      if (existingRole) {
        await storage.removeUserRole(userId, existingRole.id);
      }
      
      // Assign new role
      await storage.assignUserRole(userId, roleId);
      res.json({ message: "Role assigned successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to assign role" });
    }
  });

  // Role routes
  app.get("/api/roles", requireAuth, requirePermission("roles.list.view"), async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get roles" });
    }
  });

  app.post("/api/roles", requireAuth, requirePermission("roles.create"), async (req, res) => {
    try {
      const { name, description, permissionIds = [] } = req.body;
      
      console.log("Creating role with data:", { name, description, permissionIds });
      
      // Create the role
      const role = await storage.createRole({ name, description });
      console.log("Role created:", role);
      
      // Assign permissions to the role
      for (const permissionId of permissionIds) {
        await storage.assignRolePermission(role.id, permissionId);
      }
      
      // Return the role with permissions
      const roleWithPermissions = await storage.getAllRoles();
      const createdRole = roleWithPermissions.find(r => r.id === role.id);
      
      res.status(201).json(createdRole || role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(400).json({ 
        message: "Failed to create role", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/permissions", requireAuth, requirePermission("permissions.view"), async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get permissions" });
    }
  });

  app.post("/api/roles/:id/permissions", requireAuth, requirePermission("permissions.assign"), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const { permissionIds } = req.body;
      
      console.log(`Updating permissions for role ${roleId}:`, permissionIds);
      
      // Remove existing permissions
      const existingPermissions = await storage.getRolePermissions(roleId);
      for (const perm of existingPermissions) {
        await storage.removeRolePermission(roleId, perm.id);
      }
      
      // Assign new permissions
      for (const permissionId of permissionIds) {
        await storage.assignRolePermission(roleId, permissionId);
      }
      
      res.json({ message: "Permissions updated successfully" });
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(400).json({ 
        message: "Failed to update permissions",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });



  // Technician routes
  app.get("/api/technicians", requireAuth, requirePermission("technicians.list.view"), async (req, res) => {
    try {
      const technicians = await storage.getAllTechnicians();
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ message: "Failed to get technicians", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/technicians", requireAuth, requirePermission("technicians.create"), async (req, res) => {
    try {
      const technicianData = insertTechnicianSchema.parse(req.body);
      const technician = await storage.createTechnician(technicianData);
      res.status(201).json(technician);
    } catch (error) {
      console.error("Error creating technician:", error);
      res.status(400).json({ 
        message: "Failed to create technician", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.put("/api/technicians/:id", requireAuth, requirePermission("technicians.edit"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technicianData = insertTechnicianSchema.partial().parse(req.body);
      const technician = await storage.updateTechnician(id, technicianData);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      res.json(technician);
    } catch (error) {
      res.status(400).json({ message: "Failed to update technician" });
    }
  });

  app.delete("/api/technicians/:id", requireAuth, requirePermission("technicians.delete"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTechnician(id);
      if (!deleted) {
        return res.status(404).json({ message: "Technician not found" });
      }
      res.json({ message: "Technician deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete technician" });
    }
  });

  // W9 upload endpoint
  app.post("/api/technicians/:id/w9", requireAuth, requirePermission("technicians.edit"), uploadW9.single('w9'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.file) {
        return res.status(400).json({ message: "No W9 file uploaded" });
      }
      const technician = await storage.getTechnician(id);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      // Remove old W9 file if it exists
      if (technician.w9FilePath) {
        const oldPath = path.join(process.cwd(), technician.w9FilePath.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      const filePath = `/uploads/w9/${id}/${req.file.filename}`;
      const updated = await storage.updateTechnician(id, {
        w9FilePath: filePath,
        w9FileName: req.file.originalname,
        w9SubmittedAt: new Date(),
        w9Status: 'submitted',
      } as any);
      res.json({ message: "W9 uploaded successfully", technician: updated });
    } catch (error) {
      console.error("Error uploading W9:", error);
      res.status(500).json({ message: "Failed to upload W9", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // W9 delete endpoint
  app.delete("/api/technicians/:id/w9", requireAuth, requirePermission("technicians.edit"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technician = await storage.getTechnician(id);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      if (technician.w9FilePath) {
        const oldPath = path.join(process.cwd(), technician.w9FilePath.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      const updated = await storage.updateTechnician(id, {
        w9FilePath: null,
        w9FileName: null,
        w9SubmittedAt: null,
        w9Status: null,
      } as any);
      res.json({ message: "W9 removed successfully", technician: updated });
    } catch (error) {
      console.error("Error deleting W9:", error);
      res.status(500).json({ message: "Failed to delete W9" });
    }
  });

  // W9 verify endpoint — marks the submitted W9 as verified
  app.post("/api/technicians/:id/w9/verify", requireAuth, requirePermission("technicians.edit"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technician = await storage.getTechnician(id);
      if (!technician) return res.status(404).json({ message: "Technician not found" });
      if (!technician.w9FilePath) return res.status(400).json({ message: "No W9 on file to verify" });
      const updated = await storage.updateTechnician(id, { w9Status: "verified" } as any);
      res.json({ message: "W9 verified successfully", technician: updated });
    } catch (error) {
      console.error("Error verifying W9:", error);
      res.status(500).json({ message: "Failed to verify W9" });
    }
  });

  // Rating routes
  app.post("/api/technician-ratings", requireAuth, requirePermission("technicians.rate"), async (req, res) => {
    try {
      const ratingData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating(ratingData);
      res.status(201).json(rating);
    } catch (error) {
      res.status(400).json({ message: "Failed to create rating" });
    }
  });

  app.get("/api/technicians/:id/ratings", requireAuth, async (req, res) => {
    try {
      const technicianId = parseInt(req.params.id);
      const ratings = await storage.getTechnicianRatings(technicianId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ratings" });
    }
  });

  // Work Order routes
  app.get("/api/work-orders", requireAuth, requirePermission("workorders.list.view"), async (req, res) => {
    try {
      // Check if user has admin permissions to see all work orders
      const userPermissions = await storage.getUserPermissions(req.user.id);
      const canViewAllWorkOrders = userPermissions.some(p => p.name === 'system.admin' || p.name === 'workorders.view_all');
      
      let workOrders;
      if (canViewAllWorkOrders) {
        // Admin users can see all work orders
        workOrders = await storage.getAllWorkOrders();
      } else {
        // Regular users can only see work orders assigned to them or created by them
        workOrders = await storage.getUserWorkOrders(req.user.id);
      }
      
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get work orders" });
    }
  });

  app.post("/api/work-orders", requireAuth, requirePermission("workorders.create"), async (req, res) => {
    try {
      const workOrderData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(workOrderData);
      res.status(201).json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      res.status(400).json({ 
        message: "Failed to create work order", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.put("/api/work-orders/:id", requireAuth, requirePermission("workorders.edit"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user has permission to edit this specific work order
      const userPermissions = await storage.getUserPermissions(req.user.id);
      const canEditAllWorkOrders = userPermissions.some(p => p.name === 'system.admin' || p.name === 'workorders.view_all');
      
      if (!canEditAllWorkOrders) {
        // Check if user is assigned to or created this work order
        const existingWorkOrder = await storage.getWorkOrder(id);
        if (!existingWorkOrder || (existingWorkOrder.requestedBy !== req.user.id && existingWorkOrder.assignedTo !== req.user.id)) {
          return res.status(403).json({ message: "Permission denied. You can only edit work orders assigned to you or created by you." });
        }
      }
      
      const workOrderData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(id, workOrderData);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      console.error("Error updating work order:", error);
      res.status(400).json({ 
        message: "Failed to update work order",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/work-orders/:id", requireAuth, requirePermission("workorders.delete"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWorkOrder(id);
      if (!deleted) {
        return res.status(404).json({ message: "Work order not found" });
      }
      res.json({ message: "Work order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete work order" });
    }
  });

  // Work Order Proposal routes
  app.get("/api/work-orders/:id/proposal", requireAuth, requirePermission("workorders.tab.proposal"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const proposal = await storage.getWorkOrderProposal(workOrderId);
      if (!proposal) {
        // Return empty proposal structure instead of 404 to allow creation
        return res.json(null);
      }
      res.json(proposal);
    } catch (error) {
      console.error("Error getting proposal:", error);
      res.status(500).json({ message: "Failed to get proposal" });
    }
  });

  app.post("/api/work-orders/:id/proposal", requireAuth, requirePermission("proposals.create"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const proposalData = insertWorkOrderProposalSchema.parse({
        ...req.body,
        workOrderId
      });
      const proposal = await storage.createWorkOrderProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(400).json({ 
        message: "Failed to create proposal", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.put("/api/work-orders/:id/proposal", requireAuth, requirePermission("proposals.create"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const proposalData = insertWorkOrderProposalSchema.partial().parse(req.body);
      const proposal = await storage.updateWorkOrderProposal(workOrderId, proposalData);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      res.status(400).json({ message: "Failed to update proposal" });
    }
  });

  app.put("/api/work-orders/:id/proposal/status", requireAuth, requirePermission("proposals.approve"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "approved", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const proposal = await storage.updateWorkOrderProposal(workOrderId, { status });
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      if (status === "approved" || status === "cancelled") {
        const workOrder = await storage.getWorkOrder(workOrderId);
        await notifyWorkOrderAssignees(workOrderId, {
          type: status === "approved" ? "proposal_approved" : "proposal_rejected",
          title: status === "approved" ? "Proposal Approved" : "Proposal Rejected",
          message: status === "approved"
            ? `The proposal for work order ${workOrder?.workOrderNumber || workOrderId} has been approved.`
            : `The proposal for work order ${workOrder?.workOrderNumber || workOrderId} has been rejected and needs to be revised.`,
          relatedEntity: "proposal",
          relatedId: workOrderId,
        });
      }

      console.log(`Proposal ${proposal.id} status updated to ${status} by user ${req.session.userId}`);
      res.json(proposal);
    } catch (error) {
      console.error("Error updating proposal status:", error);
      res.status(400).json({ message: "Failed to update proposal status" });
    }
  });

  // Helper: notify all users assigned to a work order
  async function notifyWorkOrderAssignees(workOrderId: number, notification: { type: string; title: string; message: string; relatedEntity: string; relatedId: number }) {
    try {
      const workOrder = await storage.getWorkOrder(workOrderId);
      if (!workOrder) return;
      const recipientIds = new Set<number>();
      if (workOrder.requestedBy) recipientIds.add(workOrder.requestedBy);
      if (workOrder.assignedTo) recipientIds.add(workOrder.assignedTo);
      try {
        if (workOrder.assignedUserIds) {
          const ids: number[] = JSON.parse(workOrder.assignedUserIds);
          ids.forEach(id => recipientIds.add(id));
        }
      } catch {}
      for (const userId of recipientIds) {
        await storage.createNotification({ userId, ...notification, isRead: false });
      }
    } catch (err) {
      console.error("Failed to send work order notifications:", err);
    }
  }

  // Approve proposal
  app.put("/api/proposals/:id/approve", requireAuth, requirePermission("proposals.approve"), async (req, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      
      // Get the proposal to find the work order ID
      const proposals = await storage.getAllProposals();
      const proposal = proposals.find(p => p.id === proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      const updatedProposal = await storage.updateWorkOrderProposal(proposal.workOrderId, { 
        status: "approved",
        approvedAt: new Date()
      });
      
      if (!updatedProposal) {
        return res.status(404).json({ message: "Failed to approve proposal" });
      }

      const workOrder = await storage.getWorkOrder(proposal.workOrderId);
      await notifyWorkOrderAssignees(proposal.workOrderId, {
        type: "proposal_approved",
        title: "Proposal Approved",
        message: `The proposal for work order ${workOrder?.workOrderNumber || proposal.workOrderId} has been approved.`,
        relatedEntity: "proposal",
        relatedId: proposal.workOrderId,
      });
      
      res.json(updatedProposal);
    } catch (error) {
      console.error("Error approving proposal:", error);
      res.status(500).json({ message: "Failed to approve proposal" });
    }
  });

  // Reject proposal
  app.put("/api/proposals/:id/reject", requireAuth, requirePermission("proposals.approve"), async (req, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      
      // Get the proposal to find the work order ID
      const proposals = await storage.getAllProposals();
      const proposal = proposals.find(p => p.id === proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      const updatedProposal = await storage.updateWorkOrderProposal(proposal.workOrderId, { 
        status: "cancelled"
      });
      
      if (!updatedProposal) {
        return res.status(404).json({ message: "Failed to reject proposal" });
      }

      const workOrder = await storage.getWorkOrder(proposal.workOrderId);
      await notifyWorkOrderAssignees(proposal.workOrderId, {
        type: "proposal_rejected",
        title: "Proposal Rejected",
        message: `The proposal for work order ${workOrder?.workOrderNumber || proposal.workOrderId} has been rejected and needs to be revised.`,
        relatedEntity: "proposal",
        relatedId: proposal.workOrderId,
      });
      
      res.json(updatedProposal);
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      res.status(500).json({ message: "Failed to reject proposal" });
    }
  });

  // Get all proposals with work order info
  app.get("/api/proposals", requireAuth, requirePermission("proposals.list.view"), async (req, res) => {
    try {
      const workOrders = await storage.getAllWorkOrders();
      const proposalsWithWorkOrders = [];
      
      for (const workOrder of workOrders) {
        const proposal = await storage.getWorkOrderProposal(workOrder.id);
        if (proposal) {
          proposalsWithWorkOrders.push({
            ...proposal,
            workOrder
          });
        }
      }
      
      res.json(proposalsWithWorkOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get proposals" });
    }
  });

  // Get work orders without proposals for proposal creation
  app.get("/api/work-orders-without-proposals", requireAuth, requirePermission("proposals.list.view"), async (req, res) => {
    try {
      const workOrders = await storage.getAllWorkOrders();
      const workOrdersWithoutProposals = [];
      
      for (const workOrder of workOrders) {
        const proposal = await storage.getWorkOrderProposal(workOrder.id);
        if (!proposal) {
          workOrdersWithoutProposals.push(workOrder);
        }
      }
      
      res.json(workOrdersWithoutProposals);
    } catch (error) {
      console.error("Error fetching work orders without proposals:", error);
      res.status(500).json({ message: "Failed to get work orders" });
    }
  });

  // Work Order Parts Request routes
  app.get("/api/work-orders/:id/parts-requests", requireAuth, requirePermission("workorders.tab.parts"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const partsRequests = await storage.getWorkOrderPartsRequests(workOrderId);
      res.json(partsRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get parts requests" });
    }
  });

  app.post("/api/work-orders/:id/parts-requests", requireAuth, requirePermission("parts.create"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const partsRequestData = insertWorkOrderPartsRequestSchema.parse({
        ...req.body,
        workOrderId
      });
      const partsRequest = await storage.createWorkOrderPartsRequest(partsRequestData);
      res.status(201).json(partsRequest);
    } catch (error) {
      console.error("Error creating parts request:", error);
      res.status(400).json({ 
        message: "Failed to create parts request", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Legacy status update (kept for compatibility)
  app.put("/api/parts-requests/:id/status", requireAuth, requirePermission("parts.approve"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const validStatuses = ["pending", "approved", "rejected", "ordered", "received", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const success = await storage.updateWorkOrderPartsRequestStatus(id, status);
      if (!success) return res.status(404).json({ message: "Parts request not found" });
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update parts request status" });
    }
  });

  // Helper: recalculate approved parts cost for a work order and sync the proposal
  async function syncWorkOrderPartsCost(workOrderId: number) {
    try {
      const allParts = await storage.getWorkOrderPartsRequests(workOrderId);
      const approvedParts = allParts.filter((r: any) =>
        ["approved", "ordered", "received"].includes(r.status)
      );
      const approvedPartsCost = approvedParts.reduce((sum: number, r: any) => {
        return sum + parseFloat(r.estimatedCost || "0") * (parseInt(r.quantity as any || "1"));
      }, 0);
      // Update the proposal's materialCost so the invoice and work order both reflect it
      await storage.updateWorkOrderProposal(workOrderId, {
        materialCost: approvedPartsCost.toFixed(2),
      });
    } catch (e) {
      console.error("syncWorkOrderPartsCost error:", e);
    }
  }

  // Approve a parts request
  app.post("/api/parts-requests/:id/approve", requireAuth, requirePermission("parts.approve"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const approvingUser = (req as any).user;
      const updated = await storage.updateWorkOrderPartsRequest(id, {
        status: "approved",
        approvedBy: approvingUser?.id,
        approvedAt: new Date(),
        rejectionReason: null,
      });
      if (!updated) return res.status(404).json({ message: "Parts request not found" });
      await syncWorkOrderPartsCost(updated.workOrderId);
      res.json(updated);
    } catch (error: any) {
      console.error("Error approving parts request:", error);
      res.status(500).json({ message: "Failed to approve parts request" });
    }
  });

  // Reject a parts request — notify the requester
  app.post("/api/parts-requests/:id/reject", requireAuth, requirePermission("parts.approve"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;

      const updated = await storage.updateWorkOrderPartsRequest(id, {
        status: "rejected",
        rejectionReason: reason || "No reason provided",
      });
      if (!updated) return res.status(404).json({ message: "Parts request not found" });

      await syncWorkOrderPartsCost(updated.workOrderId);

      // Notify the requester
      const workOrder = await storage.getWorkOrder(updated.workOrderId);
      if (updated.requestedBy) {
        await storage.createNotification({
          userId: updated.requestedBy,
          type: "parts_rejected",
          title: "Parts Request Rejected",
          message: `Your parts request for "${updated.partName}" (Work Order: ${workOrder?.workOrderNumber || updated.workOrderId}) was rejected. Reason: ${reason || "No reason provided"}. You can submit a new request.`,
          relatedEntity: "parts_request",
          relatedId: id,
          isRead: false,
        });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting parts request:", error);
      res.status(500).json({ message: "Failed to reject parts request" });
    }
  });

  // Mark a parts request as ordered
  app.post("/api/parts-requests/:id/order", requireAuth, requirePermission("parts.approve"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateWorkOrderPartsRequest(id, { status: "ordered" });
      if (!updated) return res.status(404).json({ message: "Parts request not found" });
      await syncWorkOrderPartsCost(updated.workOrderId);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to mark as ordered" });
    }
  });

  // Mark a parts request as received
  app.post("/api/parts-requests/:id/receive", requireAuth, requirePermission("parts.approve"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateWorkOrderPartsRequest(id, { status: "received" });
      if (!updated) return res.status(404).json({ message: "Parts request not found" });
      await syncWorkOrderPartsCost(updated.workOrderId);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to mark as received" });
    }
  });

  // Get all parts requests with work order and user info — filtered by assignment
  app.get("/api/parts-requests", requireAuth, requirePermission("parts.list.view"), async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const currentUserPermissions: string[] = (req as any).permissions || [];
      const isAdmin = currentUserPermissions.includes("system.admin");

      const workOrders = await storage.getAllWorkOrders();
      const users = await storage.getAllUsers();
      const partsRequestsWithInfo = [];
      
      for (const workOrder of workOrders) {
        // Assignment check
        let assignedUserIds: number[] = [];
        try {
          if (workOrder.assignedUserIds) assignedUserIds = JSON.parse(workOrder.assignedUserIds);
          if (workOrder.assignedTo) assignedUserIds.push(workOrder.assignedTo);
        } catch {}
        
        if (!isAdmin && !assignedUserIds.includes(currentUser?.id)) continue;

        const partsRequests = await storage.getWorkOrderPartsRequests(workOrder.id);
        for (const request of partsRequests) {
          const requestedByUser = users.find(u => u.id === request.requestedBy);
          partsRequestsWithInfo.push({
            ...request,
            workOrder: {
              workOrderNumber: workOrder.workOrderNumber,
              clientName: workOrder.clientName,
              street: workOrder.street,
              city: workOrder.city,
            },
            requestedByUser: requestedByUser ? {
              firstName: requestedByUser.firstName,
              lastName: requestedByUser.lastName,
              email: requestedByUser.email,
            } : { firstName: "Unknown", lastName: "User", email: "" },
          });
        }
      }
      
      res.json(partsRequestsWithInfo);
    } catch (error) {
      console.error("Error fetching parts requests:", error);
      res.status(500).json({ message: "Failed to get parts requests" });
    }
  });

  // Work Order File Management routes
  app.get("/api/work-orders/:id/files", requireAuth, requirePermission("workorders.tab.files"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const category = req.query.category as string;
      const files = await storage.getWorkOrderFiles(workOrderId, category);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to get files" });
    }
  });

  app.post("/api/work-orders/:id/files", requireAuth, requirePermission("files.upload"), upload.single('file'), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { category, description, uploadedBy } = req.body;
      
      const fileData = {
        workOrderId,
        fileName: req.file.originalname,
        filePath: `/uploads/${workOrderId}/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category: category || "document",
        description: description || "",
        uploadedBy: uploadedBy ? parseInt(uploadedBy) : req.session.userId || 1,
      };
      
      const file = await storage.createWorkOrderFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(400).json({ 
        message: "Failed to upload file", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.delete("/api/work-orders/files/:id", requireAuth, requirePermission("files.delete"), async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const success = await storage.deleteWorkOrderFile(fileId);
      
      if (!success) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete file" });
    }
  });

  // Serve uploaded files — requires authentication; W9 documents require admin/manager permission
  app.use('/uploads', requireAuth, (req: any, res, next) => {
    const filePath = req.path || '';
    if (filePath.startsWith('/w9/')) {
      const userPermissions: string[] = req.permissions || [];
      const canViewW9 = userPermissions.includes('system.admin') || userPermissions.includes('technicians.view') || userPermissions.includes('payments.list.view');
      if (!canViewW9) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions to view W9 documents' });
      }
    }
    next();
  }, express.static(path.join(process.cwd(), 'uploads')));

  // Work Order Chat routes
  app.get("/api/work-orders/:id/chats", requireAuth, requirePermission("workorders.tab.chat"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const chats = await storage.getWorkOrderChats(workOrderId);
      const users = await storage.getAllUsers();
      
      const chatsWithUsers = chats.map(chat => {
        const user = users.find(u => u.id === chat.userId);
        return {
          ...chat,
          user: user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          } : {
            firstName: "Unknown",
            lastName: "User",
            email: "unknown@example.com"
          }
        };
      });
      
      res.json(chatsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chats" });
    }
  });

  app.post("/api/work-orders/:id/chats", requireAuth, requirePermission("chat.send"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      
      const chatData = insertWorkOrderChatSchema.parse({
        ...req.body,
        workOrderId,
        userId: req.user!.id,
        senderId: req.user!.id
      });
      
      const chat = await storage.createWorkOrderChat(chatData);
      console.log(`Chat message created for work order ${workOrderId} by user ${req.user!.id}`);
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ 
        message: "Failed to create chat message", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/work-orders/:id/chats/file", requireAuth, requirePermission("chat.send"), upload.single('file'), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { messageType, message } = req.body;
      
      const chatData = insertWorkOrderChatSchema.parse({
        workOrderId,
        userId: req.user!.id,
        senderId: req.user!.id,
        message: message || req.file.originalname,
        messageType: messageType || 'file',
        fileUrl: `/uploads/${workOrderId}/${req.file.filename}`
      });
      
      const chat = await storage.createWorkOrderChat(chatData);
      console.log(`File message created for work order ${workOrderId} by user ${req.session.userId}`);
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating file message:", error);
      res.status(400).json({ 
        message: "Failed to create file message", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Work Order Technician Payment routes
  app.get("/api/work-orders/:id/payments", requireAuth, requirePermission("workorders.tab.payments"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      console.log(`Fetching payments for work order ${workOrderId}`);
      const payments = await storage.getWorkOrderTechnicianPayments(workOrderId);
      console.log(`Found ${payments.length} payments for work order ${workOrderId}:`, payments);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      res.status(500).json({ message: "Failed to get payment requests" });
    }
  });

  // Global payment manager routes
  app.get("/api/payments/all", requireAuth, requirePermission("payments.list.view"), async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const currentUserPermissions: string[] = (req as any).permissions || [];
      const isAdmin = currentUserPermissions.includes("system.admin");

      const allPayments = await storage.getAllTechnicianPayments();
      const allWorkOrders = await storage.getAllWorkOrders();
      const technicians = await storage.getAllTechnicians();
      
      const paymentsWithDetails = allPayments
        .map(payment => {
          const workOrder = allWorkOrders.find(wo => wo.id === payment.workOrderId);
          const technician = technicians.find(t => t.id === payment.technicianId);
          
          let assignedUserIds: number[] = [];
          try {
            if (workOrder?.assignedUserIds) assignedUserIds = JSON.parse(workOrder.assignedUserIds);
            if (workOrder?.assignedTo) assignedUserIds.push(workOrder.assignedTo);
          } catch {}

          return {
            ...payment,
            workOrderNumber: workOrder?.workOrderNumber || "Unknown",
            clientName: workOrder?.clientName || "Unknown",
            technicianName: technician ? `${technician.firstName} ${technician.lastName}` : "Unknown",
            technicianPaymentMethods: technician?.paymentMethods || "[]",
            technicianW9Status: technician?.w9Status || null,
            assignedUserIds,
          };
        })
        .filter(p => {
          if (isAdmin) return true;
          return p.assignedUserIds.includes(currentUser?.id);
        });
      
      res.json(paymentsWithDetails);
    } catch (error) {
      console.error("Error fetching all payments:", error);
      res.status(500).json({ message: "Failed to get payments" });
    }
  });

  // Approve a payment request
  app.post("/api/payments/:id/approve", requireAuth, requirePermission("payments.approve"), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { amountApproved } = req.body;

      const existing = await storage.getWorkOrderTechnicianPayment(paymentId);
      if (!existing) return res.status(404).json({ message: "Payment not found" });

      const approved = parseFloat(amountApproved || existing.amountRequested as string);

      // W9 check
      if (approved > 500) {
        const technician = await storage.getTechnician(existing.technicianId);
        if (!technician?.w9FilePath) {
          return res.status(400).json({
            message: `Cannot approve payment over $500. A W9 form must be on file.`,
            code: "W9_REQUIRED"
          });
        }
      }

      const updated = await storage.updateWorkOrderTechnicianPayment(paymentId, {
        status: "approved",
        amountApproved: amountApproved || existing.amountRequested,
        approvedAt: new Date(),
      } as any);

      res.json(updated);
    } catch (error: any) {
      console.error("Error approving payment:", error);
      res.status(500).json({ message: "Failed to approve payment" });
    }
  });

  // Reject a payment request
  app.post("/api/payments/:id/reject", requireAuth, requirePermission("payments.approve"), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { reason } = req.body;

      const existing = await storage.getWorkOrderTechnicianPayment(paymentId);
      if (!existing) return res.status(404).json({ message: "Payment not found" });

      const updated = await storage.updateWorkOrderTechnicianPayment(paymentId, {
        status: "rejected",
        rejectionReason: reason || "No reason provided",
      } as any);

      // Notify if there's a linked work order with an assignedTo user
      const workOrder = await storage.getWorkOrder(existing.workOrderId);
      if (workOrder?.assignedTo) {
        await storage.createNotification({
          userId: workOrder.assignedTo,
          type: "payment_rejected",
          title: "Payment Request Rejected",
          message: `Payment request for work order ${workOrder.workOrderNumber} was rejected. Reason: ${reason || "No reason provided"}.`,
          relatedEntity: "payment",
          relatedId: paymentId,
          isRead: false,
        });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting payment:", error);
      res.status(500).json({ message: "Failed to reject payment" });
    }
  });

  // Record a payment (partial or full) for an approved request
  app.post("/api/payments/:id/pay", requireAuth, requirePermission("payments.approve"), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { amountPaid } = req.body;

      const existing = await storage.getWorkOrderTechnicianPayment(paymentId);
      if (!existing) return res.status(404).json({ message: "Payment not found" });
      if (existing.status !== "approved" && existing.status !== "partially_paid") {
        return res.status(400).json({ message: "Payment must be approved before recording payment" });
      }

      const previouslyPaid = parseFloat(existing.amountPaid as string || "0");
      const newPaid = parseFloat(amountPaid || "0");
      const totalPaid = previouslyPaid + newPaid;
      const approved = parseFloat(existing.amountApproved as string || existing.amountRequested as string || "0");
      const remaining = approved - totalPaid;

      const newStatus = remaining <= 0.001 ? "paid" : "partially_paid";

      const updated = await storage.updateWorkOrderTechnicianPayment(paymentId, {
        amountPaid: totalPaid.toFixed(2),
        status: newStatus,
        paidAt: newStatus === "paid" ? new Date() : existing.paidAt,
      } as any);

      res.json({ ...updated, remaining: Math.max(0, remaining).toFixed(2) });
    } catch (error: any) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  app.get("/api/payments/technician/:technicianId", requireAuth, requirePermission("payments.technician.view"), async (req, res) => {
    try {
      const technicianId = parseInt(req.params.technicianId);
      console.log(`Fetching payment history for technician ${technicianId}`);
      
      const allPayments = await storage.getAllTechnicianPayments();
      const workOrders = await storage.getAllWorkOrders();
      
      const technicianPayments = allPayments
        .filter(payment => payment.technicianId === technicianId)
        .map(payment => {
          const workOrder = workOrders.find(wo => wo.id === payment.workOrderId);
          return {
            ...payment,
            workOrderNumber: workOrder?.workOrderNumber || "Unknown"
          };
        })
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      
      console.log(`Filtered payments for technician ${technicianId}:`, technicianPayments);
      res.json(technicianPayments);
    } catch (error) {
      console.error("Error fetching technician payments:", error);
      res.status(500).json({ message: "Failed to get technician payments" });
    }
  });

  app.patch("/api/payments/:id", requireAuth, requirePermission("payments.approve"), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const updates = req.body;

      // When approving/paying, enforce $500 limit for technicians without W9
      const isApprovalAction = updates.status === 'approved' || updates.status === 'partially_paid' || updates.status === 'paid';
      if (isApprovalAction) {
        const existingPayment = await storage.getWorkOrderTechnicianPayment(paymentId);
        if (existingPayment) {
          const W9_LIMIT = 500;
          const amountToCheck = parseFloat(updates.amountApproved || updates.amountPaid || existingPayment.amountRequested as string);
          if (!isNaN(amountToCheck) && amountToCheck > W9_LIMIT) {
            const technician = await storage.getTechnician(existingPayment.technicianId);
            if (!technician || !technician.w9FilePath) {
              return res.status(400).json({
                message: `Cannot approve payment over $${W9_LIMIT}. A W9 form must be on file for this technician.`,
                code: "W9_REQUIRED"
              });
            }
          }
        }
      }
      
      const payment = await storage.updateWorkOrderTechnicianPayment(paymentId, updates);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  app.post("/api/work-orders/:id/payments", requireAuth, requirePermission("payments.create"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const paymentData = insertWorkOrderTechnicianPaymentSchema.parse({
        ...req.body,
        workOrderId
      });

      // Enforce $500 limit for technicians without a W9 on file
      const W9_LIMIT = 500;
      const amountRequested = parseFloat(paymentData.amountRequested as string);
      if (!isNaN(amountRequested) && amountRequested > W9_LIMIT) {
        const technician = await storage.getTechnician(paymentData.technicianId);
        if (!technician || !technician.w9FilePath) {
          return res.status(400).json({
            message: `Payment amount exceeds $${W9_LIMIT}. A W9 form must be on file for this technician before payments over $${W9_LIMIT} can be requested.`,
            code: "W9_REQUIRED"
          });
        }
      }
      
      const payment = await storage.createWorkOrderTechnicianPayment(paymentData);
      console.log(`Payment request created for work order ${workOrderId} by user ${req.session.userId}`);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment request:", error);
      res.status(400).json({ 
        message: "Failed to create payment request", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Direct payment creation endpoint (used by work order modal)
  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      console.log("Creating payment request:", req.body);
      const validatedData = insertWorkOrderTechnicianPaymentSchema.parse(req.body);
      const payment = await storage.createWorkOrderTechnicianPayment(validatedData);
      console.log("Payment created:", payment);
      res.json(payment);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: fromZodError(error).toString() });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  app.patch("/api/work-orders/:workOrderId/payments/:paymentId", requireAuth, requirePermission("payments.approve"), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      const updateData = req.body;
      
      const payment = await storage.updateWorkOrderTechnicianPayment(paymentId, updateData);
      if (!payment) {
        return res.status(404).json({ message: "Payment request not found" });
      }
      
      console.log(`Payment request ${paymentId} updated by user ${req.session.userId}`);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment request:", error);
      res.status(400).json({ 
        message: "Failed to update payment request", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Global Payment routes for the payments page
  app.get("/api/payments", requireAuth, requirePermission("payments.list.view"), async (req, res) => {
    try {
      // Get all payment requests across all work orders
      const allWorkOrders = await storage.getAllWorkOrders();
      const allPayments = [];
      
      for (const workOrder of allWorkOrders) {
        const payments = await storage.getWorkOrderTechnicianPayments(workOrder.id);
        allPayments.push(...payments);
      }
      
      // Sort by request date (most recent first)
      allPayments.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      
      res.json(allPayments);
    } catch (error) {
      console.error("Error fetching all payment requests:", error);
      res.status(500).json({ message: "Failed to get payment requests" });
    }
  });

  app.patch("/api/payments/:id", requireAuth, requirePermission("payments.approve"), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const updateData = req.body;
      
      const payment = await storage.updateWorkOrderTechnicianPayment(paymentId, updateData);
      if (!payment) {
        return res.status(404).json({ message: "Payment request not found" });
      }
      
      console.log(`Payment request ${paymentId} updated by user ${req.session.userId}`);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment request:", error);
      res.status(400).json({ 
        message: "Failed to update payment request", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const [users, roles, techList, orders, invoices, payments] = await Promise.all([
        storage.getAllUsers().catch(() => []),
        storage.getAllRoles().catch(() => []),
        storage.getAllTechnicians().catch(() => []),
        storage.getAllWorkOrders().catch(() => []),
        storage.getAllInvoices().catch(() => []),
        storage.getAllTechnicianPayments().catch(() => []),
      ]);

      const workOrdersCompleted = orders.filter((o: any) => o.status === 'completed').length;
      const workOrdersPending = orders.filter((o: any) => o.status === 'pending' || o.status === 'active').length;
      const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
      const pendingInvoices = invoices.filter((i: any) => i.status === 'pending' || i.status === 'draft').length;
      const totalRevenue = invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + parseFloat(i.totalAmount || '0'), 0);

      res.json({
        totalUsers: users.length,
        activeRoles: roles.length,
        techniciansCount: techList.length,
        workOrdersCount: orders.length,
        workOrdersCompleted,
        workOrdersPending,
        pendingPayments,
        pendingInvoices,
        totalRevenue,
        securityEvents: 0,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/dashboard/activity", requireAuth, async (req, res) => {
    try {
      const [orders, users, payments, invoices] = await Promise.all([
        storage.getAllWorkOrders().catch(() => []),
        storage.getAllUsers().catch(() => []),
        storage.getAllTechnicianPayments().catch(() => []),
        storage.getAllInvoices().catch(() => []),
      ]);

      const events: Array<{ id: string; type: string; description: string; time: Date; category: string }> = [];

      // Recent work orders (last 30)
      const recentOrders = [...orders]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      for (const wo of recentOrders) {
        events.push({
          id: `wo-${wo.id}`,
          type: 'work_order',
          description: `Work order ${wo.workOrderNumber} created${wo.clientName ? ` for ${wo.clientName}` : ''}`,
          time: new Date(wo.createdAt),
          category: wo.status,
        });
      }

      // Recent user registrations
      const recentUsers = [...users]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      for (const u of recentUsers) {
        events.push({
          id: `usr-${u.id}`,
          type: 'user',
          description: `User ${u.firstName} ${u.lastName} (${u.email}) added`,
          time: new Date(u.createdAt),
          category: 'user',
        });
      }

      // Recent payments
      const recentPayments = [...payments]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      for (const p of recentPayments) {
        const wo = orders.find((o: any) => o.id === p.workOrderId);
        events.push({
          id: `pay-${p.id}`,
          type: 'payment',
          description: `Payment request $${parseFloat(p.amountRequested || '0').toFixed(2)} for ${wo?.workOrderNumber || 'work order'} — ${p.status}`,
          time: new Date(p.createdAt),
          category: p.status,
        });
      }

      // Recent invoices
      const recentInvoices = [...invoices]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      for (const inv of recentInvoices) {
        const wo = orders.find((o: any) => o.id === inv.workOrderId);
        events.push({
          id: `inv-${inv.id}`,
          type: 'invoice',
          description: `Invoice ${inv.invoiceNumber} ${inv.status} for ${wo?.workOrderNumber || 'work order'}`,
          time: new Date(inv.createdAt),
          category: inv.status,
        });
      }

      // Sort all events by time desc, take top 20
      const sorted = events.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20);
      res.json(sorted);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get activity feed" });
    }
  });

  // Invoice routes
  app.get("/api/work-orders/:id/invoice", requireAuth, requirePermission("workorders.tab.invoice"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      console.log(`API: Fetching invoice for work order ${workOrderId}`);
      const invoice = await storage.getWorkOrderInvoice(workOrderId);
      console.log(`API: Found invoice:`, invoice);
      res.json(invoice || null);
    } catch (error: any) {
      console.error("API: Error fetching invoice:", error);
      res.status(500).json({ message: "Error fetching invoice: " + error.message });
    }
  });

  app.post("/api/work-orders/:id/invoice", requireAuth, requirePermission("workorders.tab.invoice"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const requestingUser = (req as any).user;
      console.log(`API: Creating/updating invoice for work order ${workOrderId} with data:`, req.body);
      
      // Check if invoice already exists
      const existingInvoice = await storage.getWorkOrderInvoice(workOrderId);
      
      let savedInvoice;
      if (existingInvoice) {
        // Update existing invoice (re-request after rejection resets to pending_approval)
        savedInvoice = await storage.updateWorkOrderInvoice(workOrderId, {
          ...req.body,
          status: "pending_approval",
          requestedBy: requestingUser?.id,
          rejectionReason: null,
        });
        console.log(`API: Updated invoice:`, savedInvoice);
      } else {
        const workOrder = await storage.getWorkOrder(workOrderId);
        const invoiceNumber = `INV-${workOrder?.workOrderNumber || workOrderId}-${Date.now()}`;
        const laborCost = parseFloat(req.body.laborCost || '0');
        const materialCost = parseFloat(req.body.materialCost || '0');
        const additionalCosts = parseFloat(req.body.additionalCosts || '0');
        const subtotal = laborCost + materialCost + additionalCosts;
        savedInvoice = await storage.createWorkOrderInvoice({
          ...req.body,
          workOrderId,
          invoiceNumber,
          subtotal: subtotal.toString(),
          status: "pending_approval",
          requestedBy: requestingUser?.id,
        });
        console.log(`API: Created invoice:`, savedInvoice);
      }
      
      res.json(savedInvoice);
    } catch (error: any) {
      console.error("API: Error creating/updating invoice:", error);
      res.status(500).json({ message: "Error creating/updating invoice: " + error.message });
    }
  });

  // Approve an invoice request — locks the work order
  app.post("/api/invoices/:id/approve", requireAuth, requirePermission("invoices.edit"), async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const approvingUser = (req as any).user;
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const updated = await storage.updateWorkOrderInvoice(invoice.workOrderId, {
        status: "approved",
        approvedBy: approvingUser?.id,
        approvedAt: new Date(),
      } as any);

      // Lock the work order
      await storage.lockWorkOrder(invoice.workOrderId);
      console.log(`Invoice ${invoiceId} approved — work order ${invoice.workOrderId} locked`);
      res.json(updated);
    } catch (error: any) {
      console.error("Error approving invoice:", error);
      res.status(500).json({ message: "Failed to approve invoice" });
    }
  });

  // Reject an invoice request — notifies the requester
  app.post("/api/invoices/:id/reject", requireAuth, requirePermission("invoices.edit"), async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { reason } = req.body;
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const updated = await storage.updateWorkOrderInvoice(invoice.workOrderId, {
        status: "rejected",
        rejectionReason: reason || "No reason provided",
      } as any);

      // Notify the user who requested the invoice
      if (invoice.requestedBy) {
        const workOrder = await storage.getWorkOrder(invoice.workOrderId);
        await storage.createNotification({
          userId: invoice.requestedBy,
          type: "invoice_rejected",
          title: "Invoice Request Rejected",
          message: `Your invoice request for work order ${workOrder?.workOrderNumber || invoice.workOrderId} was rejected. Reason: ${reason || "No reason provided"}. You can submit a new request.`,
          relatedEntity: "invoice",
          relatedId: invoiceId,
          isRead: false,
        });
      }

      console.log(`Invoice ${invoiceId} rejected`);
      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting invoice:", error);
      res.status(500).json({ message: "Failed to reject invoice" });
    }
  });

  // Global invoice management routes
  app.get("/api/invoices/all", requireAuth, requirePermission("invoices.list.view"), async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const currentUserPermissions: string[] = (req as any).permissions || [];
      const isAdmin = currentUserPermissions.includes("system.admin");

      const allInvoices = await storage.getAllInvoices();
      const allWorkOrders = await storage.getAllWorkOrders();
      
      const invoicesWithDetails = allInvoices
        .map(invoice => {
          const workOrder = allWorkOrders.find(wo => wo.id === invoice.workOrderId);
          const isLocked = invoice.status === "paid" || invoice.status === "approved" || workOrder?.isLocked || false;
          
          // Parse assigned user IDs from the work order
          let assignedUserIds: number[] = [];
          try {
            if (workOrder?.assignedUserIds) {
              assignedUserIds = JSON.parse(workOrder.assignedUserIds);
            }
            if (workOrder?.assignedTo) assignedUserIds.push(workOrder.assignedTo);
          } catch {}

          return {
            ...invoice,
            workOrderNumber: workOrder?.workOrderNumber || "Unknown",
            clientName: workOrder?.clientName || "Unknown",
            assignedUserIds,
            isLocked
          };
        })
        // Filter: only show invoices where the current user is assigned (unless admin)
        .filter(inv => {
          if (isAdmin) return true;
          return inv.assignedUserIds.includes(currentUser?.id);
        });
      
      res.json(invoicesWithDetails);
    } catch (error) {
      console.error("Error fetching all invoices:", error);
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  app.post("/api/invoices", requireAuth, requirePermission("invoices.create"), async (req, res) => {
    try {
      console.log("Creating new invoice:", req.body);
      
      // Generate invoice number if not provided
      if (!req.body.invoiceNumber) {
        const workOrder = await storage.getWorkOrder(req.body.workOrderId);
        req.body.invoiceNumber = `INV-${workOrder?.workOrderNumber || req.body.workOrderId}-${Date.now()}`;
      }
      
      // Calculate subtotal if not provided
      if (!req.body.subtotal) {
        const laborCost = parseFloat(req.body.laborCost || '0');
        const materialCost = parseFloat(req.body.materialCost || '0');
        const additionalCosts = parseFloat(req.body.additionalCosts || '0');
        req.body.subtotal = (laborCost + materialCost + additionalCosts).toString();
      }
      
      const invoice = await storage.createWorkOrderInvoice(req.body);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, requirePermission("invoices.edit"), async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      console.log(`Updating invoice ${invoiceId}:`, req.body);
      
      // Get the invoice to find the work order
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateWorkOrderInvoice(invoice.workOrderId, req.body);
      
      // If status changed to "paid", lock the work order
      if (req.body.status === "paid") {
        await storage.lockWorkOrder(invoice.workOrderId);
        console.log(`Work order ${invoice.workOrderId} has been LOCKED due to paid invoice`);
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(400).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, requirePermission("invoices.delete"), async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      console.log(`Deleting invoice ${invoiceId}`);
      
      // Get the invoice to find the work order
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check if invoice is locked (paid status)
      if (invoice.status === "paid") {
        return res.status(403).json({ message: "Cannot delete paid invoice - work order is locked" });
      }
      
      const deleted = await storage.deleteInvoice(invoiceId);
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(400).json({ message: "Failed to delete invoice" });
    }
  });

  // ── Global Search ──────────────────────────────────────────────────────────
  app.get("/api/search", requireAuth, async (req, res) => {
    try {
      const q = ((req.query.q as string) || "").toLowerCase().trim();
      if (!q || q.length < 2) return res.json([]);

      const [workOrders, users, technicians, invoices, payments] = await Promise.all([
        storage.getAllWorkOrders(),
        storage.getAllUsers(),
        storage.getAllTechnicians(),
        storage.getAllInvoices(),
        storage.getAllTechnicianPayments(),
      ]);

      const results: Array<{
        id: string; type: string; title: string; subtitle: string; href: string; badge?: string;
      }> = [];

      // Work orders
      for (const wo of workOrders) {
        if (
          wo.workOrderNumber?.toLowerCase().includes(q) ||
          wo.clientName?.toLowerCase().includes(q) ||
          wo.title?.toLowerCase().includes(q) ||
          wo.description?.toLowerCase().includes(q) ||
          wo.street?.toLowerCase().includes(q) ||
          wo.city?.toLowerCase().includes(q)
        ) {
          results.push({
            id: `wo-${wo.id}`, type: "Work Order",
            title: wo.workOrderNumber,
            subtitle: `${wo.clientName || "—"} · ${wo.city || wo.street || ""}`,
            href: "/work-orders",
            badge: wo.status,
          });
        }
      }

      // Users
      for (const u of users) {
        if (
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)
        ) {
          results.push({
            id: `usr-${u.id}`, type: "User",
            title: `${u.firstName} ${u.lastName}`,
            subtitle: u.email,
            href: "/users",
            badge: u.role?.name,
          });
        }
      }

      // Technicians
      for (const t of technicians) {
        if (
          t.firstName?.toLowerCase().includes(q) ||
          t.lastName?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.specialty?.toLowerCase().includes(q)
        ) {
          results.push({
            id: `tech-${t.id}`, type: "Technician",
            title: `${t.firstName} ${t.lastName}`,
            subtitle: t.specialty || t.email || "",
            href: "/technicians",
            badge: t.status,
          });
        }
      }

      // Invoices
      for (const inv of invoices) {
        const wo = workOrders.find(w => w.id === inv.workOrderId);
        if (
          inv.invoiceNumber?.toLowerCase().includes(q) ||
          wo?.workOrderNumber?.toLowerCase().includes(q) ||
          wo?.clientName?.toLowerCase().includes(q)
        ) {
          results.push({
            id: `inv-${inv.id}`, type: "Invoice",
            title: inv.invoiceNumber,
            subtitle: `${wo?.workOrderNumber || ""} · ${wo?.clientName || ""}`,
            href: "/payment-manager",
            badge: inv.status,
          });
        }
      }

      // Payments
      for (const p of payments) {
        const wo = workOrders.find(w => w.id === p.workOrderId);
        if (wo?.workOrderNumber?.toLowerCase().includes(q) || wo?.clientName?.toLowerCase().includes(q)) {
          results.push({
            id: `pay-${p.id}`, type: "Payment",
            title: `Payment #${p.id}`,
            subtitle: `${wo?.workOrderNumber || ""} · ${wo?.clientName || ""}`,
            href: "/technician-payments",
            badge: p.status,
          });
        }
      }

      res.json(results.slice(0, 20));
    } catch (error: any) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // ── Analytics ──────────────────────────────────────────────────────────────
  app.get("/api/analytics", requireAuth, requirePermission("analytics.view"), async (req, res) => {
    try {
      const [workOrders, invoices, payments, technicians, users, proposals] = await Promise.all([
        storage.getAllWorkOrders(),
        storage.getAllInvoices(),
        storage.getAllTechnicianPayments(),
        storage.getAllTechnicians(),
        storage.getAllUsers(),
        storage.getAllProposals(),
      ]);

      // ── Work order stats ──────────────────────────────────────
      const woStats = {
        total: workOrders.length,
        completed: workOrders.filter(w => w.status === "completed").length,
        pending: workOrders.filter(w => w.status === "pending").length,
        inProgress: workOrders.filter(w => w.status === "in_progress" || w.status === "in-progress").length,
        cancelled: workOrders.filter(w => w.status === "cancelled").length,
        urgentCount: workOrders.filter(w => w.urgency === "urgent" || w.priority === "urgent").length,
        avgCompletionTime: 8, // placeholder hours
      };

      // ── Financial stats ───────────────────────────────────────
      const approvedInvoices = invoices.filter(i => i.status === "approved" || i.status === "paid");
      const totalRevenue = approvedInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0);
      const totalPayments = payments
        .filter(p => ["approved", "paid", "partially_paid"].includes(p.status))
        .reduce((s, p) => s + parseFloat(p.amountApproved || p.amountRequested || "0"), 0);

      const financialStats = {
        totalRevenue: Math.round(totalRevenue),
        totalCosts: Math.round(totalPayments),
        profit: Math.round(totalRevenue - totalPayments),
        avgProjectValue: approvedInvoices.length > 0 ? Math.round(totalRevenue / approvedInvoices.length) : 0,
        outstandingInvoices: invoices.filter(i => i.status === "pending_approval" || i.status === "draft").length,
        paidInvoices: invoices.filter(i => i.status === "paid").length,
        approvedInvoices: invoices.filter(i => i.status === "approved").length,
        totalLaborCost: Math.round(approvedInvoices.reduce((s, i) => s + parseFloat(i.laborCost || "0"), 0)),
        totalMaterialCost: Math.round(approvedInvoices.reduce((s, i) => s + parseFloat(i.materialCost || "0"), 0)),
      };

      // ── Technician stats ──────────────────────────────────────
      const ratingsData = technicians.filter(t => t.rating !== null);
      const avgRating = ratingsData.length > 0
        ? ratingsData.reduce((s, t) => s + parseFloat(t.rating || "0"), 0) / ratingsData.length
        : 0;

      const topPerformers = technicians
        .sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"))
        .slice(0, 8)
        .map(t => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`,
          rating: parseFloat(t.rating || "0"),
          completedJobs: workOrders.filter(w => w.technicianId === t.id && w.status === "completed").length,
        }));

      const technicianStats = {
        totalTechnicians: technicians.length,
        activeTechnicians: technicians.filter(t => t.status === "active").length,
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: technicians.filter(t => t.rating !== null).length,
        topPerformers,
      };

      // ── User stats ────────────────────────────────────────────
      const roleMap: Record<string, number> = {};
      for (const u of users) {
        const role = u.role?.name || "unknown";
        roleMap[role] = (roleMap[role] || 0) + 1;
      }
      const userStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive !== false).length,
        roleDistribution: Object.entries(roleMap).map(([role, count]) => ({ role, count })),
      };

      // ── Monthly data (last 12 months) ─────────────────────────
      const now = new Date();
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
        const monthWOs = workOrders.filter(w => {
          const cd = new Date(w.createdAt);
          return cd >= d && cd < next;
        });
        const monthInvoices = approvedInvoices.filter(iv => {
          const cd = new Date(iv.createdAt);
          return cd >= d && cd < next;
        });
        const monthPayments = payments.filter(p => {
          const cd = new Date(p.createdAt);
          return cd >= d && cd < next && ["approved","paid","partially_paid"].includes(p.status);
        });
        const rev = monthInvoices.reduce((s, iv) => s + parseFloat(iv.totalAmount || "0"), 0);
        const costs = monthPayments.reduce((s, p) => s + parseFloat(p.amountApproved || p.amountRequested || "0"), 0);
        return {
          month: label,
          workOrders: monthWOs.length,
          revenue: Math.round(rev),
          costs: Math.round(costs),
          profit: Math.round(rev - costs),
        };
      });

      // ── Category data ─────────────────────────────────────────
      const catMap: Record<string, number[]> = {};
      for (const w of workOrders) {
        const cat = w.category || "Other";
        if (!catMap[cat]) catMap[cat] = [];
        catMap[cat].push(parseFloat(w.actualHours as any || "0"));
      }
      const categoryData = Object.entries(catMap)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 8)
        .map(([category, hours]) => ({
          category,
          count: hours.length,
          avgTime: hours.length > 0 ? parseFloat((hours.reduce((s, h) => s + h, 0) / hours.length).toFixed(1)) : 0,
          revenue: Math.round(
            approvedInvoices
              .filter(iv => workOrders.find(w => w.id === iv.workOrderId)?.category === category)
              .reduce((s, iv) => s + parseFloat(iv.totalAmount || "0"), 0)
          ),
        }));

      // ── Priority / urgency data ───────────────────────────────
      const urgencies = ["urgent", "high", "normal", "low"];
      const priorityData = urgencies.map(u => {
        const count = workOrders.filter(w => w.urgency === u || w.priority === u).length;
        return { priority: u, count, percentage: workOrders.length > 0 ? Math.round((count / workOrders.length) * 100) : 0 };
      }).filter(p => p.count > 0);

      // ── Status data ───────────────────────────────────────────
      const statusColors: Record<string, string> = {
        pending: "#FFBB28", in_progress: "#0088FE", "in-progress": "#0088FE",
        completed: "#00C49F", cancelled: "#FF8042",
      };
      const statusMap: Record<string, number> = {};
      for (const w of workOrders) {
        const s = w.status || "unknown";
        statusMap[s] = (statusMap[s] || 0) + 1;
      }
      const statusData = Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
        color: statusColors[status] || "#8884D8",
        percentage: workOrders.length > 0 ? Math.round((count / workOrders.length) * 100) : 0,
      }));

      // ── All payments list ─────────────────────────────────────
      const allPaymentsList = payments.map(p => {
        const wo = workOrders.find(w => w.id === p.workOrderId);
        return {
          id: p.id,
          workOrderNumber: wo?.workOrderNumber || `WO-${p.workOrderId}`,
          clientName: wo?.clientName || "—",
          amountRequested: parseFloat(p.amountRequested || "0"),
          amountApproved: parseFloat(p.amountApproved || "0"),
          status: p.status,
          createdAt: p.createdAt,
        };
      });

      // ── Proposal vs Invoice comparison ────────────────────────
      const proposalVsInvoice = workOrders
        .map(wo => {
          const proposal = proposals.find(p => p.workOrderId === wo.id);
          const invoice = invoices.find(i => i.workOrderId === wo.id);
          if (!proposal && !invoice) return null;
          const proposalTotal = parseFloat(proposal?.totalCost || "0");
          const invoiceTotal = parseFloat(invoice?.totalAmount || "0");
          const diff = proposalTotal - invoiceTotal;
          return {
            workOrderId: wo.id,
            workOrderNumber: wo.workOrderNumber,
            clientName: wo.clientName || "—",
            status: wo.status,
            proposalTotal,
            invoiceTotal,
            diff: Math.abs(diff),
            // diff > 0: proposal was higher → invoice cost less → we saved (under budget)
            // diff < 0: invoice was higher → went over proposal → over budget
            result: diff > 0.01 ? "under_budget" : diff < -0.01 ? "over_budget" : "exact",
            hasProposal: !!proposal,
            hasInvoice: !!invoice,
            invoiceStatus: invoice?.status || null,
          };
        })
        .filter(Boolean);

      const underBudgetItems = proposalVsInvoice.filter(i => i!.result === "under_budget");
      const overBudgetItems  = proposalVsInvoice.filter(i => i!.result === "over_budget");
      const totalSaved  = underBudgetItems.reduce((s, i) => s + i!.diff, 0);
      const totalOverspent = overBudgetItems.reduce((s, i) => s + i!.diff, 0);

      // ── Recent activity ───────────────────────────────────────
      const recentActivity = workOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(w => ({
          id: w.id,
          type: "work_order",
          description: `Work order ${w.workOrderNumber} — ${w.title || w.description || w.category}`,
          timestamp: new Date(w.createdAt).toLocaleDateString(),
          user: w.clientName || "—",
        }));

      res.json({
        workOrderStats: woStats,
        financialStats,
        technicianStats,
        userStats,
        monthlyData,
        categoryData,
        priorityData,
        statusData,
        allPaymentsList,
        proposalVsInvoice,
        proposalVsSummary: {
          totalCompared: proposalVsInvoice.length,
          underBudgetCount: underBudgetItems.length,
          overBudgetCount: overBudgetItems.length,
          exactCount: proposalVsInvoice.filter(i => i!.result === "exact").length,
          totalSaved: Math.round(totalSaved),
          totalOverspent: Math.round(totalOverspent),
          netResult: Math.round(totalSaved - totalOverspent),
        },
        recentActivity,
      });
    } catch (error: any) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to generate analytics", error: error.message });
    }
  });

  // Get all proposals for financial analysis
  app.get("/api/proposals", requireAuth, async (req, res) => {
    try {
      const proposals = await storage.getAllProposals();
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      console.log("Fetching notifications for user:", req.user.id);
      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      console.error("Notifications error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      if (success) {
        res.json({ message: "Notification marked as read" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      const success = await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
