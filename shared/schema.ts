import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const userRoles = sqliteTable("user_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => roles.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const rolePermissions = sqliteTable("role_permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roleId: integer("role_id").notNull().references(() => roles.id),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const equipment = sqliteTable("equipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  status: text("status").notNull().default("online"),
  cpuUsage: integer("cpu_usage").default(0),
  memoryUsage: integer("memory_usage").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const technicians = sqliteTable("technicians", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  taxNumber: text("tax_number"),
  paymentMethods: text("payment_methods"), // JSON string for multiple payment methods
  paymentDetails: text("payment_details"), // JSON string for payment method details
  averageRating: text("average_rating").default("0"),
  totalRatings: integer("total_ratings").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const technicianRatings = sqliteTable("technician_ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  technicianId: integer("technician_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const workOrders = sqliteTable("work_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderNumber: text("work_order_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  street: text("street").notNull(),
  nte: text("nte").notNull(), // amount without tax
  tnte: text("tnte").notNull(), // amount including tax
  startDate: integer("start_date", { mode: 'timestamp' }).notNull(),
  endDate: integer("end_date", { mode: 'timestamp' }).notNull(),
  assignedUserIds: text("assigned_user_ids").notNull(), // JSON array of user IDs
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const workOrderProposals = sqliteTable("work_order_proposals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").notNull(),
  laborData: text("labor_data"), // JSON array of labor entries
  partsData: text("parts_data"), // JSON array of parts entries
  servicesData: text("services_data"), // JSON array of services entries
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, approved, cancelled
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const workOrderPartsRequests = sqliteTable("work_order_parts_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").notNull(),
  requestedBy: integer("requested_by").notNull(),
  parts: text("parts").notNull(), // JSON string of parts array
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, cancelled
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const workOrderFiles = sqliteTable("work_order_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // image, pdf, etc
  category: text("category").notNull(), // before, after, signature
  uploadedAt: integer("uploaded_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const workOrderChats = sqliteTable("work_order_chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").notNull(),
  userId: integer("user_id").notNull(),
  message: text("message"),
  fileUrl: text("file_url"),
  messageType: text("message_type").notNull().default("text"), // text, file, image
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const workOrderTechnicianPayments = sqliteTable("work_order_technician_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").notNull(),
  technicianId: integer("technician_id").notNull(),
  paymentMethod: text("payment_method").notNull(),
  amountRequested: text("amount_requested").notNull(),
  amountApproved: text("amount_approved").default("0"),
  amountPaid: text("amount_paid").default("0"),
  status: text("status").notNull().default("pending"), // pending, approved, partially_paid, paid, rejected
  description: text("description"),
  requestedAt: integer("requested_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const workOrderInvoices = sqliteTable("work_order_invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").notNull(),
  partsTotal: text("parts_total").notNull().default("0"),
  technicianTotal: text("technician_total").notNull().default("0"),
  extraCharges: text("extra_charges").notNull().default("0"),
  finalTotal: text("final_total").notNull(),
  invoiceData: text("invoice_data"), // JSON with detailed breakdown
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

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
  email: z.string().email().optional().or(z.literal("")),
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
  approvedAt: true,
  paidAt: true
});

export const insertWorkOrderInvoiceSchema = createInsertSchema(workOrderInvoices).omit({
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
