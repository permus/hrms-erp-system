import {
  users,
  companies,
  employees,
  departments,
  positions,
  type User,
  type UpsertUser,
  type Company,
  type Employee,
  type Department,
  type Position,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
