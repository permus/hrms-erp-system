import {
  users,
  companies,
  employees,
  departments,
  positions,
  availableModules,
  companyModules,
  companyLicenses,
  employeeDocuments,
  type User,
  type UpsertUser,
  type Company,
  type Employee,
  type Department,
  type Position,
  type AvailableModule,
  type CompanyModule,
  type CompanyLicense,
  type EmployeeDocument,
  type InsertEmployeeDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { PasswordService } from "./services/passwordService";
import { sendCompanyAdminInvitation } from "./services/emailService";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateUserAuth(userId: string, updates: {
    passwordHash?: string | null;
    passwordUpdatedAt?: Date | null;
    resetTokenHash?: string | null;
    resetTokenExpiresAt?: Date | null;
    failedLoginCount?: number | null;
    lockedUntil?: Date | null;
    mustChangePassword?: boolean | null;
  }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  getCompanyByName(name: string): Promise<Company | undefined>;
  isSlugAvailable(slug: string): Promise<boolean>;
  listCompaniesForUser(userId: string): Promise<Company[]>;
  createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<Company | undefined>;
  // Bin operations for soft-deleted companies
  getDeletedCompanies(): Promise<Company[]>;
  restoreCompany(id: string): Promise<Company | undefined>;
  hardDeleteCompany(id: string): Promise<Company | undefined>;
  // Employee operations
  getEmployees(companyId: string): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeBySlug(companyId: string, slug: string): Promise<Employee | undefined>;
  getEmployeesByDepartment(departmentId: string): Promise<Employee[]>;
  createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  generateNextEmployeeId(companyId: string): Promise<string>;
  isEmployeeCodeAvailable(companyId: string, employeeCode: string): Promise<boolean>;
  // Department operations
  getDepartments(companyId: string): Promise<Department[]>;
  getDepartmentById(id: string): Promise<Department | undefined>;
  createDepartment(department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department>;
  updateDepartment(id: string, data: Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<Department | undefined>;
  getEmployeeCountByDepartment(departmentId: string): Promise<number>;
  getChildDepartments(parentId: string): Promise<Department[]>;
  // Position operations
  getPositions(companyId: string): Promise<Position[]>;
  createPosition(position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): Promise<Position>;
  
  // Employee Document operations
  getEmployeeDocument(id: string): Promise<EmployeeDocument | undefined>;
  getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]>;
  createEmployeeDocument(document: Omit<EmployeeDocument, 'id' | 'uploadDate'>): Promise<EmployeeDocument>;
  updateEmployeeDocument(id: string, updates: Partial<Omit<EmployeeDocument, 'id' | 'uploadDate'>>): Promise<EmployeeDocument | undefined>;
  deleteEmployeeDocument(id: string): Promise<EmployeeDocument | undefined>;
  
  // Module operations
  getAvailableModules(): Promise<AvailableModule[]>;
  getAvailableModulesByKeys(keys: string[]): Promise<AvailableModule[]>;
  
  // Enhanced company operations
  createCompanyWithLicensing(data: any): Promise<Company>;
  generateSecurePassword(length: number): Promise<string>;
  createCompanyAdminUser(data: any): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(sql`LOWER(${users.email})`, email.toLowerCase()));
    return user;
  }

  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const normalizedData = {
      ...userData,
      email: userData.email?.toLowerCase()
    };
    const [user] = await db
      .insert(users)
      .values(normalizedData)
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const normalizedData = {
      ...userData,
      email: userData.email?.toLowerCase()
    };
    
    try {
      // First try to insert the user
      const [user] = await db
        .insert(users)
        .values(normalizedData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...normalizedData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      // If there's a unique constraint violation on email, update the existing user
      if (error.message?.includes('unique constraint') && error.message?.includes('email')) {
        console.log('Email conflict detected, updating existing user with email:', normalizedData.email);
        
        // Find existing user by email and update with new data
        const [existingUser] = await db
          .update(users)
          .set({
            ...normalizedData,
            updatedAt: new Date(),
          })
          .where(eq(sql`LOWER(${users.email})`, normalizedData.email!))
          .returning();
        
        if (existingUser) {
          console.log('Successfully updated existing user:', existingUser.id);
          return existingUser;
        }
      }
      
      // If it's not an email conflict or update failed, rethrow the error
      console.error('Error in upsertUser:', error.message);
      throw error;
    }
  }

  // Company operations
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.isActive, true));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(
      and(eq(companies.slug, slug), eq(companies.isActive, true))
    );
    return company;
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(
      and(eq(sql`LOWER(${companies.name})`, name.toLowerCase()), eq(companies.isActive, true))
    );
    return company;
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const [existingCompany] = await db.select().from(companies).where(eq(companies.slug, slug));
    return !existingCompany; // Returns true if slug is available (no company found)
  }

  async listCompaniesForUser(userId: string): Promise<Company[]> {
    // For now, users are associated with a single company via users.companyId
    // This method will support multi-company users in the future
    const user = await this.getUser(userId);
    if (!user || !user.companyId) {
      return [];
    }
    const company = await this.getCompany(user.companyId);
    return company ? [company] : [];
  }

  async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(companyData)
      .returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async deleteCompany(id: string): Promise<Company | undefined> {
    // Soft delete - set company as inactive instead of hard delete
    const [company] = await db
      .update(companies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  // Bin operations for soft-deleted companies
  async getDeletedCompanies(): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.isActive, false));
  }

  async restoreCompany(id: string): Promise<Company | undefined> {
    // Restore soft-deleted company by setting isActive back to true
    const [company] = await db
      .update(companies)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async hardDeleteCompany(id: string): Promise<Company | undefined> {
    // Permanently delete company from database
    // First delete all associated users (company admins, employees, etc.)
    await db
      .delete(users)
      .where(eq(users.companyId, id));
    
    // Then delete the company itself
    const [company] = await db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  // Employee operations
  async getEmployees(companyId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.companyId, companyId));
  }

  async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(eq(sql`${employees.employmentDetails}->>'departmentId'`, departmentId));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeBySlug(companyId: string, slug: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.companyId, companyId), eq(employees.slug, slug)));
    return employee;
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(employeeData)
      .returning();
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee;
  }

  async generateNextEmployeeId(companyId: string): Promise<string> {
    // Get all employee codes for this company
    const existingEmployees = await db
      .select({ employeeCode: employees.employeeCode })
      .from(employees)
      .where(eq(employees.companyId, companyId));

    // Extract numbers from existing codes (e.g., "EMP-001" -> 1)
    const existingNumbers = existingEmployees
      .map(emp => {
        const match = emp.employeeCode?.match(/^EMP-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    // Find the next available number
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    
    // Format as EMP-001, EMP-002, etc.
    return `EMP-${nextNumber.toString().padStart(3, '0')}`;
  }

  async isEmployeeCodeAvailable(companyId: string, employeeCode: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(
        eq(employees.companyId, companyId),
        eq(employees.employeeCode, employeeCode)
      ));
    return !existing;
  }

  // Department operations
  async getDepartments(companyId: string): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.companyId, companyId));
  }

  async createDepartment(departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(departmentData)
      .returning();
    return department;
  }

  async getDepartmentById(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async updateDepartment(id: string, data: Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Department | undefined> {
    const [department] = await db
      .update(departments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return department;
  }

  async deleteDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();
    return department;
  }

  async getEmployeeCountByDepartment(departmentId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(employees)
      .where(eq(sql`${employees.employmentDetails}->>'departmentId'`, departmentId));
    return result[0]?.count || 0;
  }

  async getChildDepartments(parentId: string): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.parentId, parentId));
  }

  // Position operations
  async getPositions(companyId: string): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.companyId, companyId));
  }

  async createPosition(positionData: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values(positionData)
      .returning();
    return position;
  }

  // Module operations
  async getAvailableModules(): Promise<AvailableModule[]> {
    return await db
      .select()
      .from(availableModules)
      .where(eq(availableModules.isActive, true));
  }

  async getAvailableModulesByKeys(keys: string[]): Promise<AvailableModule[]> {
    if (keys.length === 0) return [];
    return await db
      .select()
      .from(availableModules)
      .where(inArray(availableModules.moduleKey, keys));
  }

  // Enhanced company operations with proper licensing persistence
  async createCompanyWithLicensing(data: any): Promise<Company> {
    // Use transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // 1. Create the company
      const [company] = await tx
        .insert(companies)
        .values({
          name: data.name,
          slug: data.slug,
          industry: data.industry,
          employeeCount: data.employeeCount,
          country: data.country,
          city: data.city,
          subscriptionType: data.subscriptionType,
          trialDays: data.trialDays,
          monthlyCost: data.monthlyCost,
          status: data.status,
          isActive: data.isActive,
          settings: data.settings,
        })
        .returning();

      // 2. Create license records
      if (data.settings?.licensing) {
        const licensing = data.settings.licensing;
        
        // User licenses
        if (licensing.userLicenseCount > 0) {
          await tx.insert(companyLicenses).values({
            companyId: company.id,
            licenseType: 'user',
            count: licensing.userLicenseCount,
            pricePerUnit: licensing.userLicensePrice.toString(),
            totalPrice: (licensing.userLicenseCount * licensing.userLicensePrice).toString(),
          });
        }

        // Employee licenses  
        if (licensing.employeeLicenseCount > 0) {
          await tx.insert(companyLicenses).values({
            companyId: company.id,
            licenseType: 'employee',
            count: licensing.employeeLicenseCount,
            pricePerUnit: licensing.employeeLicensePrice.toString(),
            totalPrice: (licensing.employeeLicenseCount * licensing.employeeLicensePrice).toString(),
          });
        }
      }

      // 3. Enable selected modules
      if (data.settings?.enabledModules && data.settings.enabledModules.length > 0) {
        const modules = await this.getAvailableModulesByKeys(data.settings.enabledModules);
        const companyModuleValues = modules.map(module => ({
          companyId: company.id,
          moduleId: module.id,
          isEnabled: true,
        }));

        if (companyModuleValues.length > 0) {
          await tx.insert(companyModules).values(companyModuleValues);
        }
      }

      return company;
    });
  }

  async generateSecurePassword(length: number): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const bytes = randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      password += chars[bytes[i] % chars.length];
    }
    
    return password;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserAuth(userId: string, updates: {
    passwordHash?: string | null;
    passwordUpdatedAt?: Date | null;
    resetTokenHash?: string | null;
    resetTokenExpiresAt?: Date | null;
    failedLoginCount?: number | null;
    lockedUntil?: Date | null;
    mustChangePassword?: boolean | null;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createCompanyAdminUser(data: any): Promise<User & { tempPassword: string }> {
    // Generate a secure temporary password
    const tempPassword = PasswordService.generateSecurePassword(12);
    
    // Hash the password for secure storage
    const passwordHash = await PasswordService.hashPassword(tempPassword);
    
    // Create an active company admin user with password authentication
    const [user] = await db
      .insert(users)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        companyId: data.companyId,
        role: 'COMPANY_ADMIN',
        mustChangePassword: true,
        invitedBy: 'super_admin',
        isActive: true,
        passwordHash,
        passwordUpdatedAt: new Date(),
        failedLoginCount: 0,
      })
      .returning();
    
    // Send invitation email with temporary password
    try {
      const company = await this.getCompany(data.companyId);
      const companyName = company?.name || 'Your Company';
      const signinUrl = process.env.REPLIT_DOMAINS ? 
        `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/auth/signin` : 
        'http://localhost:5000/auth/signin';
      
      const emailSent = await sendCompanyAdminInvitation(
        data.email,
        companyName,
        tempPassword,
        signinUrl
      );
      
      if (!emailSent) {
        console.error('Failed to send invitation email to:', data.email);
      }
    } catch (error) {
      console.error('Error sending invitation email:', error);
    }
    
    // Return user with the temp password for the response
    return { ...user, tempPassword };
  }

  // Employee Document operations
  async getEmployeeDocument(id: string): Promise<EmployeeDocument | undefined> {
    const [document] = await db.select().from(employeeDocuments).where(eq(employeeDocuments.id, id));
    return document;
  }

  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    return await db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId));
  }

  async createEmployeeDocument(document: Omit<EmployeeDocument, 'id' | 'uploadDate'>): Promise<EmployeeDocument> {
    const [newDocument] = await db
      .insert(employeeDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateEmployeeDocument(id: string, updates: Partial<Omit<EmployeeDocument, 'id' | 'uploadDate'>>): Promise<EmployeeDocument | undefined> {
    const [document] = await db
      .update(employeeDocuments)
      .set(updates)
      .where(eq(employeeDocuments.id, id))
      .returning();
    return document;
  }

  async deleteEmployeeDocument(id: string): Promise<EmployeeDocument | undefined> {
    const [document] = await db
      .delete(employeeDocuments)
      .where(eq(employeeDocuments.id, id))
      .returning();
    return document;
  }

  // Get all employee documents for a company (for centralized document management)
  async getAllEmployeeDocuments(companyId: string): Promise<EmployeeDocument[]> {
    return await db
      .select()
      .from(employeeDocuments)
      .innerJoin(employees, eq(employeeDocuments.employeeId, employees.id))
      .where(eq(employees.companyId, companyId))
      .then(results => results.map(result => result.employee_documents));
  }
}

export const storage = new DatabaseStorage();
