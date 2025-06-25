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

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types but validate size
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
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
  app.get("/api/users", requireAuth, requirePermission("users.view"), async (req, res) => {
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
      const { username, email, firstName, lastName, password } = req.body;
      if (!username || !email || !firstName || !lastName || !password) {
        throw new Error("Missing required fields");
      }
      
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userWithHashedPassword = { ...userData, password: hashedPassword };
      
      const user = await storage.createUser(userWithHashedPassword);
      console.log("User created:", user);
      
      // Assign role if provided
      if (req.body.roleId) {
        console.log("Assigning role:", req.body.roleId);
        await storage.assignUserRole(user.id, req.body.roleId);
      }
      
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
      const userData = { ...req.body };
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
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

  app.post("/api/users/:id/role", requireAuth, requirePermission("roles.view"), async (req, res) => {
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
  app.get("/api/roles", requireAuth, requirePermission("roles.view"), async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get roles" });
    }
  });

  app.post("/api/roles", requireAuth, requirePermission("roles.view"), async (req, res) => {
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

  app.get("/api/permissions", requireAuth, requirePermission("roles.view"), async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get permissions" });
    }
  });

  app.post("/api/roles/:id/permissions", requireAuth, requirePermission("roles.view"), async (req, res) => {
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
  app.get("/api/technicians", requireAuth, requirePermission("technicians.view"), async (req, res) => {
    try {
      const technicians = await storage.getAllTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to get technicians" });
    }
  });

  app.post("/api/technicians", requireAuth, requirePermission("technicians.view"), async (req, res) => {
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

  app.put("/api/technicians/:id", requireAuth, requirePermission("technicians.view"), async (req, res) => {
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

  app.delete("/api/technicians/:id", requireAuth, requirePermission("technicians.view"), async (req, res) => {
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

  // Rating routes
  app.post("/api/technician-ratings", requireAuth, requirePermission("technicians.view"), async (req, res) => {
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
  app.get("/api/work-orders", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      const workOrders = await storage.getAllWorkOrders();
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

  app.put("/api/work-orders/:id", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workOrderData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(id, workOrderData);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to update work order" });
    }
  });

  app.delete("/api/work-orders/:id", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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
  app.get("/api/work-orders/:id/proposal", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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

  app.post("/api/work-orders/:id/proposal", requireAuth, requirePermission("workorders.create"), async (req, res) => {
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

  app.put("/api/work-orders/:id/proposal", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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

  app.put("/api/work-orders/:id/proposal/status", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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
      
      console.log(`Proposal ${proposal.id} status updated to ${status} by user ${req.session.userId}`);
      res.json(proposal);
    } catch (error) {
      console.error("Error updating proposal status:", error);
      res.status(400).json({ message: "Failed to update proposal status" });
    }
  });

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
      
      res.json(updatedProposal);
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      res.status(500).json({ message: "Failed to reject proposal" });
    }
  });

  // Get all proposals with work order info
  app.get("/api/proposals", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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
  app.get("/api/work-orders-without-proposals", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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
  app.get("/api/work-orders/:id/parts-requests", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const partsRequests = await storage.getWorkOrderPartsRequests(workOrderId);
      res.json(partsRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get parts requests" });
    }
  });

  app.post("/api/work-orders/:id/parts-requests", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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

  app.put("/api/parts-requests/:id/status", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "approved", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const success = await storage.updateWorkOrderPartsRequestStatus(id, status);
      if (!success) {
        return res.status(404).json({ message: "Parts request not found" });
      }
      
      console.log(`Parts request ${id} status updated to ${status} by user ${req.session.userId}`);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating parts request status:", error);
      res.status(400).json({ message: "Failed to update parts request status" });
    }
  });

  // Get all parts requests with work order and user info
  app.get("/api/parts-requests", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      const workOrders = await storage.getAllWorkOrders();
      const users = await storage.getAllUsers();
      const partsRequestsWithInfo = [];
      
      for (const workOrder of workOrders) {
        const partsRequests = await storage.getWorkOrderPartsRequests(workOrder.id);
        for (const request of partsRequests) {
          const requestedByUser = users.find(u => u.id === request.requestedBy);
          partsRequestsWithInfo.push({
            ...request,
            workOrder: {
              workOrderNumber: workOrder.workOrderNumber,
              clientName: workOrder.clientName,
              street: workOrder.street,
              city: workOrder.city
            },
            requestedByUser: requestedByUser ? {
              firstName: requestedByUser.firstName,
              lastName: requestedByUser.lastName,
              email: requestedByUser.email
            } : {
              firstName: "Unknown",
              lastName: "User",
              email: "unknown@example.com"
            }
          });
        }
      }
      
      res.json(partsRequestsWithInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to get parts requests" });
    }
  });

  // Work Order File Management routes
  app.get("/api/work-orders/:id/files", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const category = req.query.category as string;
      const files = await storage.getWorkOrderFiles(workOrderId, category);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to get files" });
    }
  });

  app.post("/api/work-orders/:id/files", requireAuth, requirePermission("workorders.view"), upload.single('file'), async (req, res) => {
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
        fileType: req.file.mimetype,
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

  app.delete("/api/work-orders/files/:id", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Work Order Chat routes
  app.get("/api/work-orders/:id/chats", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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

  app.post("/api/work-orders/:id/chats", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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

  app.post("/api/work-orders/:id/chats/file", requireAuth, requirePermission("workorders.view"), upload.single('file'), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { messageType, userId, message } = req.body;
      
      const chatData = insertWorkOrderChatSchema.parse({
        workOrderId,
        userId: userId ? parseInt(userId) : req.user!.id,
        senderId: userId ? parseInt(userId) : req.user!.id,
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
  app.get("/api/work-orders/:id/payments", requireAuth, requirePermission("payments.view"), async (req, res) => {
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
  app.get("/api/payments/all", requireAuth, requirePermission("payments.view"), async (req, res) => {
    try {
      console.log("Fetching all payments...");
      // Get all payments with work order and technician details
      const allPayments = await storage.getWorkOrderTechnicianPayments(0); // 0 = all
      console.log("Found payments:", allPayments);
      
      const workOrders = await storage.getAllWorkOrders();
      const technicians = await storage.getAllTechnicians();
      
      const paymentsWithDetails = allPayments.map(payment => {
        const workOrder = workOrders.find(wo => wo.id === payment.workOrderId);
        const technician = technicians.find(t => t.id === payment.technicianId);
        
        return {
          ...payment,
          workOrderNumber: workOrder?.workOrderNumber || "Unknown",
          technicianName: technician?.name || "Unknown"
        };
      });
      
      console.log("Payments with details:", paymentsWithDetails);
      res.json(paymentsWithDetails);
    } catch (error) {
      console.error("Error fetching all payments:", error);
      res.status(500).json({ message: "Failed to get payments" });
    }
  });

  app.get("/api/payments/technician/:technicianId", requireAuth, requirePermission("payments.view"), async (req, res) => {
    try {
      const technicianId = parseInt(req.params.technicianId);
      console.log(`Fetching payment history for technician ${technicianId}`);
      
      const allPayments = await storage.getWorkOrderTechnicianPayments(0);
      const workOrders = await storage.getAllWorkOrders();
      
      console.log(`Total payments found: ${allPayments.length}`);
      console.log("All payments:", allPayments);
      
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

  app.patch("/api/payments/:id", requireAuth, requirePermission("manage_work_orders"), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const updates = req.body;
      
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

  app.post("/api/work-orders/:id/payments", requireAuth, requirePermission("payments.view"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const paymentData = insertWorkOrderTechnicianPaymentSchema.parse({
        ...req.body,
        workOrderId
      });
      
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

  app.patch("/api/work-orders/:workOrderId/payments/:paymentId", requireAuth, requirePermission("payments.view"), async (req, res) => {
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
  app.get("/api/payments", requireAuth, requirePermission("payments.view"), async (req, res) => {
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

  app.patch("/api/payments/:id", requireAuth, requirePermission("manage_work_orders"), async (req, res) => {
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
      console.log("Dashboard stats requested by user:", req.user.id);
      
      // Get counts safely with fallbacks
      let totalUsers = 0;
      let activeRoles = 0;
      let technicians = 0;
      let workOrders = 0;
      
      try {
        const users = await storage.getAllUsers();
        totalUsers = users.length;
      } catch (err) {
        console.error("Error fetching users:", err);
      }
      
      try {
        const roles = await storage.getAllRoles();
        activeRoles = roles.length;
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
      
      try {
        const techList = await storage.getAllTechnicians();
        technicians = techList.length;
      } catch (err) {
        console.error("Error fetching technicians:", err);
      }
      
      try {
        const orders = await storage.getAllWorkOrders();
        workOrders = orders.length;
      } catch (err) {
        console.error("Error fetching work orders:", err);
      }
      
      const stats = {
        totalUsers,
        activeRoles,
        technicians,
        workOrders,
        securityEvents: 0,
      };
      
      console.log("Dashboard stats:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats", error: error.message });
    }
  });

  // Invoice routes
  app.get("/api/work-orders/:id/invoice", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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

  app.post("/api/work-orders/:id/invoice", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      console.log(`API: Creating/updating invoice for work order ${workOrderId} with data:`, req.body);
      
      // Check if invoice already exists
      const existingInvoice = await storage.getWorkOrderInvoice(workOrderId);
      
      let savedInvoice;
      if (existingInvoice) {
        // Update existing invoice
        savedInvoice = await storage.updateWorkOrderInvoice(workOrderId, req.body);
        console.log(`API: Updated invoice:`, savedInvoice);
      } else {
        // Create new invoice
        savedInvoice = await storage.createWorkOrderInvoice({
          ...req.body,
          workOrderId
        });
        console.log(`API: Created invoice:`, savedInvoice);
      }
      
      res.json(savedInvoice);
    } catch (error: any) {
      console.error("API: Error creating/updating invoice:", error);
      res.status(500).json({ message: "Error creating/updating invoice: " + error.message });
    }
  });

  // Global invoice management routes
  app.get("/api/invoices/all", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      console.log("Fetching all invoices with work order details...");
      const allInvoices = await storage.getAllInvoices();
      const workOrders = await storage.getAllWorkOrders();
      
      const invoicesWithDetails = allInvoices.map(invoice => {
        const workOrder = workOrders.find(wo => wo.id === invoice.workOrderId);
        const isLocked = invoice.status === "paid" || workOrder?.isLocked || false;
        
        return {
          ...invoice,
          workOrderNumber: workOrder?.workOrderNumber || "Unknown",
          clientName: workOrder?.clientName || "Unknown",
          isLocked
        };
      });
      
      console.log("Invoices with details:", invoicesWithDetails);
      res.json(invoicesWithDetails);
    } catch (error) {
      console.error("Error fetching all invoices:", error);
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  app.post("/api/invoices", requireAuth, requirePermission("workorders.view"), async (req, res) => {
    try {
      console.log("Creating new invoice:", req.body);
      const invoice = await storage.createWorkOrderInvoice(req.body);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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

  app.delete("/api/invoices/:id", requireAuth, requirePermission("workorders.view"), async (req, res) => {
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
