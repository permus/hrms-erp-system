import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  date,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // ERP/HRMS specific fields
  companyId: varchar("company_id"),
  role: varchar("role").notNull().default("EMPLOYEE"), // SUPER_ADMIN, COMPANY_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
  isActive: boolean("is_active").default(true),
  mustChangePassword: boolean("must_change_password").default(false),
  invitedBy: varchar("invited_by"),
  // Password authentication fields
  passwordHash: text("password_hash"),
  passwordUpdatedAt: timestamp("password_updated_at"),
  resetTokenHash: text("reset_token_hash"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
  failedLoginCount: integer("failed_login_count").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies table (multi-tenant root)
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).unique(),
  slug: varchar("slug", { length: 100 }).unique().notNull(), // URL-friendly identifier
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  // Enhanced licensing and business fields
  industry: varchar("industry", { length: 100 }),
  employeeCount: varchar("employee_count", { length: 50 }),
  country: varchar("country", { length: 100 }).default("UAE"),
  city: varchar("city", { length: 100 }),
  subscriptionType: varchar("subscription_type", { length: 20 }).default("monthly"),
  trialDays: integer("trial_days").default(30),
  billingStartDate: date("billing_start_date"),
  monthlyCost: text("monthly_cost").default("0.00"), // Using text for decimal precision
  status: varchar("status", { length: 20 }).default("trial"), // trial, active, suspended, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: varchar("parent_id"),
  managerId: varchar("manager_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Positions
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  departmentId: varchar("department_id").notNull(),
  level: varchar("level", { length: 50 }),
  jobDescription: text("job_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees (UAE compliance focus)
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  userId: varchar("user_id").unique(),
  employeeCode: varchar("employee_code").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(), // URL-friendly identifier unique within company
  
  // Personal Information (UAE compliance - Enhanced for Phase 2)
  personalInfo: jsonb("personal_info").notNull(),
  // { 
  //   name, preferredName, fatherName, motherName, dob, age (calculated), 
  //   nationality, languages: string[], religion, maritalStatus,
  //   profilePhotoUrl: string, profileThumbnails: { small: string, medium: string, large: string },
  //   emergencyContact: { name, relation, phone, email }
  // }
  
  // Contact Information (Enhanced for Phase 2)
  contactInfo: jsonb("contact_info").notNull(),
  // { 
  //   personalEmail, companyEmail (auto-generated option), 
  //   uaePhone, homeCountryPhone,
  //   uaeAddress: { street, city, emirate, poBox }, 
  //   homeCountryAddress: { street, city, state, country, postalCode }
  // }
  
  // Employment Details (Enhanced for Phase 2)
  employmentDetails: jsonb("employment_details").notNull(),
  // { 
  //   position, departmentId, reportingManagerId, startDate, tenure (calculated),
  //   employmentStatus, probationEndDate (auto-calculated), employmentType: 'full-time'|'part-time'|'contract',
  //   workLocation: 'office'|'remote'|'hybrid', probationMonths
  // }
  
  // Probation Information
  probationInfo: jsonb("probation_info"),
  // { startDate, endDate, status, evaluationScores, confirmationDate, extensionDetails }
  
  // Compensation & Benefits (Enhanced for Phase 2)
  compensation: jsonb("compensation").notNull(),
  // { 
  //   basicSalary, housingAllowance, transportAllowance, otherAllowance, totalSalary,
  //   benefits: { medicalInsurance: boolean, lifeInsurance: boolean },
  //   bankDetails: { bankName, accountNumber, iban },
  //   endOfServiceGratuity: number (calculated)
  // }
  
  // UAE Legal & Compliance Documents (Enhanced for Phase 2)
  visaInfo: jsonb("visa_info"),
  // { 
  //   type, number, expiryDate, sponsor, status, currentStatus, 
  //   passportPlaceOfIssue, documents: { visaPageUrl, entryStampUrl }
  // }
  
  emiratesIdInfo: jsonb("emirates_id_info"),
  // { status, idNumber, expiryDate, documents: { frontUrl, backUrl } }
  
  passportInfo: jsonb("passport_info"),
  // { 
  //   number, nationality, expiryDate, placeOfIssue,
  //   documents: { biodataPageUrl, visaPagesUrls: string[] }
  // }
  
  workPermitInfo: jsonb("work_permit_info"),
  // { number, expiryDate, restrictions, documents: { workPermitUrl } }
  
  laborCardInfo: jsonb("labor_card_info"),
  // { number, expiryDate, profession, documents: { laborCardUrl } }
  
  status: varchar("status", { length: 50 }).default("ACTIVE"), // ACTIVE, INACTIVE, TERMINATED
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [index("unique_employee_slug_per_company").on(table.companyId, table.slug)]);

// Document Management
export const employeeDocuments = pgTable("employee_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  uploadDate: timestamp("upload_date").defaultNow(),
  expiryDate: date("expiry_date"),
  status: varchar("status", { length: 50 }).default("ACTIVE"),
  version: integer("version").default(1),
  uploadedBy: varchar("uploaded_by").notNull(),
  approvalStatus: varchar("approval_status", { length: 50 }).default("PENDING"),
  approvedBy: varchar("approved_by"),
  approvedDate: timestamp("approved_date"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Probation Notifications
export const probationNotifications = pgTable("probation_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  notificationType: varchar("notification_type", { length: 100 }).notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  sentDate: timestamp("sent_date"),
  status: varchar("status", { length: 50 }).default("SCHEDULED"),
  recipients: jsonb("recipients").notNull(),
  messageTemplate: text("message_template"),
  customMessage: text("custom_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave Types
export const leaveTypes = pgTable("leave_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  daysAllowed: integer("days_allowed").notNull(),
  rules: jsonb("rules").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave Requests
export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  leaveTypeId: varchar("leave_type_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  daysRequested: integer("days_requested").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 50 }).default("PENDING"),
  approvals: jsonb("approvals").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave Balances
export const leaveBalances = pgTable("leave_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  leaveTypeId: varchar("leave_type_id").notNull(),
  balance: integer("balance").notNull(),
  used: integer("used").default(0),
  carriedOver: integer("carried_over").default(0),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance Records
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  breakTime: integer("break_time"), // in minutes
  totalHours: integer("total_hours"), // in minutes
  status: varchar("status", { length: 50 }).default("PRESENT"),
  location: jsonb("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  employees: many(employees),
  departments: many(departments),
  positions: many(positions),
  leaveTypes: many(leaveTypes),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  documents: many(employeeDocuments),
  leaveRequests: many(leaveRequests),
  leaveBalances: many(leaveBalances),
  attendanceRecords: many(attendanceRecords),
  probationNotifications: many(probationNotifications),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  company: one(companies, {
    fields: [departments.companyId],
    references: [companies.id],
  }),
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
  }),
  children: many(departments),
  positions: many(positions),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  company: one(companies, {
    fields: [positions.companyId],
    references: [companies.id],
  }),
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
});
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true }).extend({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
});
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type InsertEmployeeDocument = z.infer<typeof insertEmployeeDocumentSchema>;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

export type Company = typeof companies.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Company Licenses Table
export const companyLicenses = pgTable("company_licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  licenseType: varchar("license_type", { length: 50 }).notNull(), // 'user' or 'employee'
  count: integer("count").notNull(),
  pricePerUnit: text("price_per_unit").notNull(), // AED per month
  totalPrice: text("total_price").notNull(), // count * pricePerUnit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Available Modules (Master Data)
export const availableModules = pgTable("available_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleKey: varchar("module_key", { length: 50 }).unique().notNull(), // 'hr', 'payroll', etc.
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  basePrice: text("base_price").notNull(), // AED per month
  isCore: boolean("is_core").default(false), // Always enabled modules
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Modules (Which modules each company has enabled)
export const companyModules = pgTable("company_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  moduleId: varchar("module_id").notNull(), // References available_modules.id
  isEnabled: boolean("is_enabled").default(true),
  enabledAt: timestamp("enabled_at").defaultNow(),
  disabledAt: timestamp("disabled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced types for new tables
export type CompanyLicense = typeof companyLicenses.$inferSelect;
export type AvailableModule = typeof availableModules.$inferSelect;
export type CompanyModule = typeof companyModules.$inferSelect;
