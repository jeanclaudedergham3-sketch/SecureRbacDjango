import { pgTable, text, integer, real, boolean, timestamp, serial, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("online"),
  cpuUsage: integer("cpu_usage").default(0),
  memoryUsage: integer("memory_usage").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  taxNumber: varchar("tax_number", { length: 50 }),
  hourlyRate: varchar("hourly_rate", { length: 50 }),
  specialties: text("specialties"),
  certifications: text("certifications"),
  status: varchar("status", { length: 50 }).default("available"),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),

  // Payment method fields
  bankAccount: varchar("bank_account", { length: 255 }),
  routingNumber: varchar("routing_number", { length: 50 }),
  bankName: varchar("bank_name", { length: 255 }),
  paypalEmail: varchar("paypal_email", { length: 255 }),
  paypalLink: text("paypal_link"),
  venmoHandle: varchar("venmo_handle", { length: 100 }),
  venmoQr: text("venmo_qr"),
  cashappHandle: varchar("cashapp_handle", { length: 100 }),
  cashappQr: text("cashapp_qr"),
  zelleInfo: text("zelle_info"),
  mailingAddress: text("mailing_address"),
  paymentMethods: text("payment_methods"), // JSON array of selected payment methods
  paymentDetails: text("payment_details"), // JSON object with payment method details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const technicianRatings = pgTable("technician_ratings", {
  id: serial("id").primaryKey(),
  technicianId: integer("technician_id").notNull().references(() => technicians.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  workOrderNumber: varchar("work_order_number", { length: 100 }).notNull().unique(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  street: text("street").notNull(),
  nte: varchar("nte", { length: 50 }).notNull(), // amount without tax
  tnte: varchar("tnte", { length: 50 }).notNull(), // amount including tax
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  assignedUserIds: text("assigned_user_ids").notNull(), // JSON array of user IDs
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, completed, cancelled
  isLocked: boolean("is_locked").default(false), // true when invoice is paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workOrderProposals = pgTable("work_order_proposals", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  laborData: text("labor_data"), // JSON array of labor entries
  partsData: text("parts_data"), // JSON array of parts entries
  servicesData: text("services_data"), // JSON array of services entries
  message: text("message"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workOrderPartsRequests = pgTable("work_order_parts_requests", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  requestedBy: integer("requested_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  parts: text("parts").notNull(), // JSON string of parts array
  reason: text("reason"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workOrderFiles = pgTable("work_order_files", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // image, pdf, etc
  category: varchar("category", { length: 50 }).notNull(), // before, after, signature
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const workOrderChats = pgTable("work_order_chats", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  fileUrl: text("file_url"),
  messageType: varchar("message_type", { length: 50 }).notNull().default("text"), // text, file, image
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workOrderTechnicianPayments = pgTable("work_order_technician_payments", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  technicianId: integer("technician_id").notNull().references(() => technicians.id, { onDelete: "cascade" }),
  paymentMethod: varchar("payment_method", { length: 100 }).notNull(),
  amountRequested: varchar("amount_requested", { length: 50 }).notNull(),
  amountApproved: varchar("amount_approved", { length: 50 }).default("0"),
  amountPaid: varchar("amount_paid", { length: 50 }).default("0"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, partially_paid, paid, rejected
  description: text("description"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
});

export const workOrderInvoices = pgTable("work_order_invoices", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  laborCost: varchar("labor_cost", { length: 50 }),
  materialCost: varchar("material_cost", { length: 50 }),
  taxRate: varchar("tax_rate", { length: 10 }),
  taxAmount: varchar("tax_amount", { length: 50 }),
  totalAmount: varchar("total_amount", { length: 50 }),
  status: varchar("status", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"), // info, success, warning, error
  isRead: boolean("is_read").default(false),
  relatedEntity: varchar("related_entity", { length: 100 }),
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  userRoles: many(userRoles),
  technicianRatings: many(technicianRatings),
  workOrderChats: many(workOrderChats),
  workOrderPartsRequests: many(workOrderPartsRequests),
  notifications: many(notifications),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const techniciansRelations = relations(technicians, ({ many }) => ({
  technicianRatings: many(technicianRatings),
  workOrderTechnicianPayments: many(workOrderTechnicianPayments),
}));

export const technicianRatingsRelations = relations(technicianRatings, ({ one }) => ({
  technician: one(technicians, {
    fields: [technicianRatings.technicianId],
    references: [technicians.id],
  }),
  user: one(users, {
    fields: [technicianRatings.userId],
    references: [users.id],
  }),
}));

export const workOrdersRelations = relations(workOrders, ({ many }) => ({
  workOrderProposals: many(workOrderProposals),
  workOrderPartsRequests: many(workOrderPartsRequests),
  workOrderFiles: many(workOrderFiles),
  workOrderChats: many(workOrderChats),
  workOrderTechnicianPayments: many(workOrderTechnicianPayments),
  workOrderInvoices: many(workOrderInvoices),
}));

export const workOrderProposalsRelations = relations(workOrderProposals, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderProposals.workOrderId],
    references: [workOrders.id],
  }),
}));

export const workOrderPartsRequestsRelations = relations(workOrderPartsRequests, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderPartsRequests.workOrderId],
    references: [workOrders.id],
  }),
  requestedByUser: one(users, {
    fields: [workOrderPartsRequests.requestedBy],
    references: [users.id],
  }),
}));

export const workOrderFilesRelations = relations(workOrderFiles, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderFiles.workOrderId],
    references: [workOrders.id],
  }),
}));

export const workOrderChatsRelations = relations(workOrderChats, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderChats.workOrderId],
    references: [workOrders.id],
  }),
  user: one(users, {
    fields: [workOrderChats.userId],
    references: [users.id],
  }),
}));

export const workOrderTechnicianPaymentsRelations = relations(workOrderTechnicianPayments, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderTechnicianPayments.workOrderId],
    references: [workOrders.id],
  }),
  technician: one(technicians, {
    fields: [workOrderTechnicianPayments.technicianId],
    references: [technicians.id],
  }),
}));

export const workOrderInvoicesRelations = relations(workOrderInvoices, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderInvoices.workOrderId],
    references: [workOrders.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
});

export const insertTechnicianSchema = createInsertSchema(technicians).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  latitude: z.union([z.number(), z.string().transform(Number)]).optional(),
  longitude: z.union([z.number(), z.string().transform(Number)]).optional(),
});

export const insertRatingSchema = createInsertSchema(technicianRatings).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().min(1).max(5),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  workOrderNumber: true,
  createdAt: true,
}).extend({
  clientName: z.string().min(1, "Client name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  street: z.string().min(1, "Street is required"),
  nte: z.string().min(1, "NTE amount is required"),
  tnte: z.string().min(1, "TNTE amount is required"),
  assignedUserIds: z.string().min(1, "At least one user must be assigned"),
  startDate: z.union([z.string(), z.date()]).transform((val) => typeof val === 'string' ? new Date(val) : val),
  endDate: z.union([z.string(), z.date()]).transform((val) => typeof val === 'string' ? new Date(val) : val),
});

export const insertWorkOrderProposalSchema = createInsertSchema(workOrderProposals).omit({
  id: true,
  createdAt: true,
});

export const insertWorkOrderPartsRequestSchema = createInsertSchema(workOrderPartsRequests).omit({
  id: true,
  createdAt: true,
});

export const insertWorkOrderFileSchema = createInsertSchema(workOrderFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertWorkOrderChatSchema = createInsertSchema(workOrderChats).omit({
  id: true,
  createdAt: true,
});



export const insertWorkOrderTechnicianPaymentSchema = createInsertSchema(workOrderTechnicianPayments).omit({
  id: true,
  requestedAt: true,
});

export const insertWorkOrderInvoiceSchema = createInsertSchema(workOrderInvoices).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type Technician = typeof technicians.$inferSelect;
export type TechnicianRating = typeof technicianRatings.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type WorkOrderProposal = typeof workOrderProposals.$inferSelect;
export type WorkOrderPartsRequest = typeof workOrderPartsRequests.$inferSelect;
export type WorkOrderFile = typeof workOrderFiles.$inferSelect;
export type WorkOrderChat = typeof workOrderChats.$inferSelect;
export type WorkOrderTechnicianPayment = typeof workOrderTechnicianPayments.$inferSelect;
export type WorkOrderInvoice = typeof workOrderInvoices.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type InsertWorkOrderProposal = z.infer<typeof insertWorkOrderProposalSchema>;
export type InsertWorkOrderPartsRequest = z.infer<typeof insertWorkOrderPartsRequestSchema>;
export type InsertWorkOrderFile = z.infer<typeof insertWorkOrderFileSchema>;
export type InsertWorkOrderChat = z.infer<typeof insertWorkOrderChatSchema>;
export type InsertWorkOrderTechnicianPayment = z.infer<typeof insertWorkOrderTechnicianPaymentSchema>;
export type InsertWorkOrderInvoice = z.infer<typeof insertWorkOrderInvoiceSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type UserWithRole = User & {
  role?: Role;
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export type WorkOrderWithUsers = WorkOrder & {
  assignedUsers?: User[];
};
