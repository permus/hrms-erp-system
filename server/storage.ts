import {
  users,
  companies,
  employees,
  departments,
  positions,
  availableModules,
  companyModules,
  companyLicenses,
  type User,
  type UpsertUser,
  type Company,
  type Employee,
  type Department,
  type Position,
  type AvailableModule,
  type CompanyModule,
  type CompanyLicense,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  listCompaniesForUser(userId: string): Promise<Company[]>;
  createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company>;
  // Employee operations
  getEmployees(companyId: string): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeBySlug(companyId: string, slug: string): Promise<Employee | undefined>;
  createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Employee>;
  // Department operations
  getDepartments(companyId: string): Promise<Department[]>;
  createDepartment(department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department>;
  // Position operations
  getPositions(companyId: string): Promise<Position[]>;
  createPosition(position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): Promise<Position>;
  
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
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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
    try {
      // First try to insert the user
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      // If there's a unique constraint violation on email, update the existing user
      if (error.message?.includes('unique constraint') && error.message?.includes('email')) {
        console.log('Email conflict detected, updating existing user with email:', userData.email);
        
        // Find existing user by email and update with new data
        const [existingUser] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email!))
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
    const [company] = await db.select().from(companies).where(eq(companies.slug, slug));
    return company;
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

  // Employee operations
  async getEmployees(companyId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.companyId, companyId));
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

  async createCompanyAdminUser(data: any): Promise<User> {
    // Create a placeholder user record for invitation
    // Note: This creates an invited user record without auth credentials
    // The user will complete registration through Replit Auth when they accept the invitation
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
        isActive: false, // Inactive until they complete registration
      })
      .returning();
    
    return user;
  }
}

export const storage = new DatabaseStorage();
