import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export interface AuthenticatedRequest extends Request {
  user?: {
    authMethod?: 'oidc' | 'password';
    claims: {
      sub: string;
      email: string;
      first_name?: string;
      last_name?: string;
    };
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    role?: string;
  };
  dbUser?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    companyId?: string | null;
    role: string;
    isActive?: boolean | null;
  };
}

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'HR_MANAGER' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE';

/**
 * Middleware to load user data from database and attach to request
 */
export async function loadUserData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.claims?.sub) {
      return next();
    }

    const dbUser = await storage.getUser(req.user.claims.sub);
    if (dbUser) {
      req.dbUser = dbUser;
    }
    
    next();
  } catch (error) {
    console.error('Error loading user data:', error);
    next(error);
  }
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!req.dbUser) {
      return res.status(403).json({ error: "User not found in database" });
    }

    if (!req.dbUser.isActive) {
      return res.status(403).json({ error: "User account is inactive" });
    }

    if (!allowedRoles.includes(req.dbUser.role as UserRole)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: allowedRoles,
        current: req.dbUser.role
      });
    }

    next();
  };
}

/**
 * Middleware to require user to belong to a company
 */
export function requireCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Super admins can access any company's data
  if (req.dbUser?.role === 'SUPER_ADMIN') {
    return next();
  }
  
  if (!req.dbUser?.companyId) {
    return res.status(400).json({ error: "User not associated with a company" });
  }
  next();
}

/**
 * Middleware to ensure user can only access their own company's data
 */
export function requireSameCompany() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.dbUser?.companyId) {
      return res.status(400).json({ error: "User not associated with a company" });
    }

    // Skip company check for super admins
    if (req.dbUser.role === 'SUPER_ADMIN') {
      return next();
    }

    // For company-specific endpoints, verify the company matches
    const companyId = req.params.companyId || req.body.companyId;
    if (companyId && companyId !== req.dbUser.companyId) {
      return res.status(403).json({ error: "Access denied to this company's data" });
    }

    next();
  };
}

/**
 * Middleware to check if user can access specific employee data
 */
export async function requireEmployeeAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.params.id;
    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID required" });
    }

    if (!req.dbUser) {
      return res.status(403).json({ error: "User not found" });
    }

    // Super admins can access any employee
    if (req.dbUser.role === 'SUPER_ADMIN') {
      return next();
    }

    // Get employee data to check company
    const employee = await storage.getEmployee(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Company admins and HR can access employees in their company
    if (['COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(req.dbUser.role)) {
      if (employee.companyId === req.dbUser.companyId) {
        return next();
      }
    }

    // Employees can only access their own data
    if (req.dbUser.role === 'EMPLOYEE' && employee.userId === req.dbUser.id) {
      return next();
    }

    return res.status(403).json({ error: "Access denied to this employee's data" });
  } catch (error) {
    console.error('Error checking employee access:', error);
    return res.status(500).json({ error: "Failed to verify access" });
  }
}

/**
 * Seed super admin user if not exists
 */
export async function seedSuperAdmin() {
  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "omar@omeda.io";
    const existingUser = await storage.getUserByEmail?.(superAdminEmail);
    
    if (!existingUser) {
      console.log(`Creating super admin user: ${superAdminEmail}`);
      await storage.createUser({
        id: `super_admin_${Date.now()}`,
        email: superAdminEmail,
        firstName: "Omar",
        lastName: "Admin",
        profileImageUrl: null,
        role: "SUPER_ADMIN",
        isActive: true,
        mustChangePassword: false,
        invitedBy: null,
        companyId: null
      });
      console.log("Super admin user created successfully");
    } else if (existingUser.role !== 'SUPER_ADMIN') {
      console.log("Updating existing user to super admin");
      await storage.updateUserRole?.(existingUser.id, 'SUPER_ADMIN');
    }
  } catch (error) {
    console.error('Error seeding super admin:', error);
  }
}