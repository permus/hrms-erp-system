import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAuthenticatedAny } from "./replitAuth";
import { 
  loadUserData, 
  requireRole, 
  requireCompany, 
  requireSameCompany, 
  requireEmployeeAccess,
  type AuthenticatedRequest 
} from "./roleAuth";
import { insertEmployeeSchema, insertCompanySchema, insertDepartmentSchema, insertPositionSchema } from "@shared/schema";
import { PasswordService } from "./services/passwordService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  
  // Password authentication routes (before auth middleware)
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(1)
      }).parse(req.body);
      
      // Get user by email
      const user = await storage.getUserByEmail(email.toLowerCase());
      
      if (!user || !user.isActive || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Check if account is locked
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        return res.status(423).json({ 
          error: "Account temporarily locked due to failed login attempts" 
        });
      }
      
      // Verify password
      const isValidPassword = await PasswordService.verifyPassword(
        user.passwordHash, 
        password
      );
      
      if (!isValidPassword) {
        // Increment failed login count
        const failedCount = (user.failedLoginCount || 0) + 1;
        let lockedUntil = null;
        
        // Lock account after 5 failed attempts for 15 minutes
        if (failedCount >= 5) {
          lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        
        await storage.updateUserAuth(user.id, {
          failedLoginCount: failedCount,
          lockedUntil
        });
        
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Reset failed login count on successful login
      if (user.failedLoginCount && user.failedLoginCount > 0) {
        await storage.updateUserAuth(user.id, {
          failedLoginCount: 0,
          lockedUntil: null
        });
      }
      
      // Create session
      const sessionUser = {
        authMethod: 'password',
        claims: {
          sub: user.id,
          email: user.email || '',
          first_name: user.firstName || '',
          last_name: user.lastName || ''
        },
        role: user.role
      };
      
      req.login(sessionUser, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return res.status(500).json({ error: "Login failed" });
        }
        
        res.json({ 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            companyId: user.companyId,
            mustChangePassword: user.mustChangePassword
          }
        });
      });
      
    } catch (error) {
      console.error('Signin error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Signin failed" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.status(204).send();
    });
  });
  
  app.post("/api/auth/password/request-reset", async (req, res) => {
    try {
      const { email } = z.object({
        email: z.string().email()
      }).parse(req.body);
      
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user || !user.isActive) {
        // Always return success to prevent email enumeration
        return res.json({ success: true });
      }
      
      const { token, hash } = PasswordService.generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await storage.updateUserAuth(user.id, {
        resetTokenHash: hash,
        resetTokenExpiresAt: expiresAt
      });
      
      // TODO: Send email with reset token
      // For now, we'll just log it (remove in production)
      console.log(`Password reset token for ${email}: ${token}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Password reset request error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Password reset failed" });
    }
  });
  
  app.post("/api/auth/password/reset", async (req, res) => {
    try {
      const { token, newPassword } = z.object({
        token: z.string(),
        newPassword: z.string().min(8)
      }).parse(req.body);
      
      // Validate password strength
      const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Password does not meet requirements", 
          details: passwordValidation.errors 
        });
      }
      
      // Find user with valid reset token
      const users = await storage.listUsers();
      const user = users.find(u => 
        u.resetTokenHash && 
        u.resetTokenExpiresAt &&
        new Date(u.resetTokenExpiresAt) > new Date() &&
        PasswordService.verifyToken(token, u.resetTokenHash)
      );
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      // Hash new password and update user
      const passwordHash = await PasswordService.hashPassword(newPassword);
      await storage.updateUserAuth(user.id, {
        passwordHash,
        passwordUpdatedAt: new Date(),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Password reset error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Password reset failed" });
    }
  });
  
  app.post("/api/auth/password/change", isAuthenticatedAny, loadUserData, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      
      if (!user?.claims?.sub) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { currentPassword, newPassword } = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8)
      }).parse(req.body);
      
      // Get user from database
      const dbUser = await storage.getUser(user.claims.sub);
      if (!dbUser || !dbUser.passwordHash) {
        return res.status(400).json({ error: "User not found or invalid account" });
      }
      
      // Verify current password
      const isValidCurrentPassword = await PasswordService.verifyPassword(
        dbUser.passwordHash,
        currentPassword
      );
      
      if (!isValidCurrentPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Validate new password strength
      const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "New password does not meet requirements", 
          details: passwordValidation.errors 
        });
      }
      
      // Hash new password and update user
      const passwordHash = await PasswordService.hashPassword(newPassword);
      await storage.updateUserAuth(dbUser.id, {
        passwordHash,
        passwordUpdatedAt: new Date(),
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Password change error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Password change failed" });
    }
  });
  
  // Load user data middleware for all authenticated routes
  app.use('/api', isAuthenticatedAny, loadUserData);
  
  // Auth routes
  app.get("/api/auth/user", async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    if (!user?.claims?.sub) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const userData = await storage.getUser(user.claims.sub);
    
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(userData);
  });

  // Slug resolution endpoints
  app.get("/api/resolve/me", async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      
      if (!user?.claims?.sub) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userData = await storage.getUser(user.claims.sub);
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const companies = await storage.listCompaniesForUser(userData.id);
      const companySlugs = companies.map(c => c.slug).filter(Boolean);
      
      let employeeSlug: string | undefined;
      if (userData.role === 'EMPLOYEE' && userData.companyId) {
        // Find the employee record to get their slug
        const employees = await storage.getEmployees(userData.companyId);
        const employee = employees.find(emp => emp.userId === userData.id);
        employeeSlug = employee?.slug;
      }
      
      const response = {
        role: userData.role,
        companySlugs,
        employeeSlug
      };
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve user slugs" });
    }
  });
  
  // Company slug resolution - security-first approach
  app.get("/api/companies/by-slug/:slug", async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      
      if (!user?.claims?.sub) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userData = await storage.getUser(user.claims.sub);
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const company = await storage.getCompanyBySlug(req.params.slug);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      // Security: Only allow access to company if user has permission
      if (userData.role === 'SUPER_ADMIN' || userData.companyId === company.id) {
        res.json({ id: company.id, slug: company.slug, name: company.name });
      } else {
        res.status(404).json({ error: "Company not found" }); // Hide existence from unauthorized users
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve company slug" });
    }
  });
  
  // Employee slug resolution - security-first approach 
  app.get("/api/employees/by-slug/:companySlug/:employeeSlug", async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      
      if (!user?.claims?.sub) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userData = await storage.getUser(user.claims.sub);
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // First resolve company by slug
      const company = await storage.getCompanyBySlug(req.params.companySlug);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      // Security: Only allow access if user has permission to this company
      if (userData.role !== 'SUPER_ADMIN' && userData.companyId !== company.id) {
        return res.status(404).json({ error: "Employee not found" }); // Hide existence
      }
      
      // Resolve employee by slug within company
      const employee = await storage.getEmployeeBySlug(company.id, req.params.employeeSlug);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      // Additional security: employees can only see their own data
      if (userData.role === 'EMPLOYEE' && employee.userId !== userData.id) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.json({ id: employee.id, slug: employee.slug, companyId: employee.companyId });
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve employee slug" });
    }
  });

  // Company routes - Super Admin Only
  app.get("/api/companies", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Bin routes for soft-deleted companies
  app.get("/api/companies/bin", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const deletedCompanies = await storage.getDeletedCompanies();
      res.json(deletedCompanies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deleted companies" });
    }
  });

  app.post("/api/companies/:id/restore", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const { id } = req.params;
      const restoredCompany = await storage.restoreCompany(id);
      
      if (!restoredCompany) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json({ message: "Company restored successfully", company: restoredCompany });
    } catch (error) {
      res.status(500).json({ error: "Failed to restore company" });
    }
  });

  app.delete("/api/companies/:id/hard-delete", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCompany = await storage.hardDeleteCompany(id);
      
      if (!deletedCompany) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json({ message: "Company permanently deleted", company: deletedCompany });
    } catch (error) {
      res.status(500).json({ error: "Failed to permanently delete company" });
    }
  });

  app.post("/api/companies", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany({
        ...validatedData,
        isActive: validatedData.isActive ?? true,
        subdomain: validatedData.subdomain ?? null,
        settings: validatedData.settings ?? {},
      });
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.put("/api/companies/:id", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCompanySchema.partial().parse(req.body);
      
      // Check for slug conflicts if slug is being updated
      if (validatedData.slug) {
        const existingCompany = await storage.getCompanyBySlug(validatedData.slug);
        if (existingCompany && existingCompany.id !== id) {
          return res.status(409).json({ error: "Company slug already exists. Please choose a different slug." });
        }
      }
      
      const company = await storage.updateCompany(id, validatedData);
      
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const { id } = req.params;
      const company = await storage.deleteCompany(id);
      
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json({ message: "Company deleted successfully", company });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Get available modules for super admin
  app.get("/api/modules", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const modules = await storage.getAvailableModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  // Validation endpoints for real-time form validation
  app.post("/api/super-admin/validate/slug", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const { slug } = req.body;
      if (!slug) {
        return res.status(400).json({ error: "Slug is required" });
      }
      
      const isAvailable = await storage.isSlugAvailable(slug);
      res.json({ 
        isValid: isAvailable,
        message: isAvailable ? "Slug is available" : "This slug is already taken. Please choose a different one."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate slug" });
    }
  });

  app.post("/api/super-admin/validate/email", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      // Email is available if no user exists OR if the user exists but is inactive
      const isAvailable = !existingUser || !existingUser.isActive;
      
      res.json({ 
        isValid: isAvailable,
        message: isAvailable ? "Email is available" : "This email is already registered. Please use a different email address."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate email" });
    }
  });

  app.post("/api/super-admin/validate/company-name", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Company name is required" });
      }
      
      const existingCompany = await storage.getCompanyByName(name);
      const isAvailable = !existingCompany;
      res.json({ 
        isValid: isAvailable,
        message: isAvailable ? "Company name is available" : "A company with this name already exists. Please choose a different name."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate company name" });
    }
  });

  // Enhanced company creation with licensing and admin invitation
  app.post("/api/super-admin/create-company", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      // Basic validation of required fields
      const formData = req.body;
      
      if (!formData.companyName || !formData.slug || !formData.adminEmail || !formData.adminFirstName || !formData.adminLastName) {
        return res.status(400).json({ error: "Missing required fields: companyName, slug, adminEmail, adminFirstName, adminLastName" });
      }
      
      // Check for slug conflicts (including inactive companies)
      const slugAvailable = await storage.isSlugAvailable(formData.slug);
      if (!slugAvailable) {
        return res.status(409).json({ error: "Company slug already exists. Please choose a different slug." });
      }
      
      // Check for company name conflicts (case-insensitive, active companies only)
      const existingCompanyByName = await storage.getCompanyByName(formData.companyName.trim());
      if (existingCompanyByName) {
        return res.status(409).json({ error: "A company with this name already exists. Please choose a different name." });
      }
      
      // Check for admin email conflicts
      const existingUser = await storage.getUserByEmail(formData.adminEmail.trim().toLowerCase());
      if (existingUser) {
        return res.status(409).json({ error: "A user with this email already exists. Please use a different email address." });
      }
      
      // Calculate monthly cost
      const selectedModules = await storage.getAvailableModulesByKeys(formData.enabledModules);
      const modulesCost = selectedModules.reduce((total, module) => total + parseFloat(module.basePrice), 0);
      const userLicensesCost = formData.userLicenseCount * formData.userLicensePrice;
      const employeeLicensesCost = formData.employeeLicenseCount * formData.employeeLicensePrice;
      const subtotal = modulesCost + userLicensesCost + employeeLicensesCost;
      const total = subtotal * 1.05; // 5% VAT
      
      // Create company with enhanced data
      const company = await storage.createCompanyWithLicensing({
        name: formData.companyName,
        slug: formData.slug,
        industry: formData.industry,
        employeeCount: formData.employeeCount,
        country: formData.country,
        city: formData.city,
        subscriptionType: formData.subscriptionType,
        trialDays: formData.trialDays,
        monthlyCost: total.toFixed(2),
        status: 'trial',
        isActive: true,
        settings: {
          enabledModules: formData.enabledModules,
          licensing: {
            userLicenseCount: formData.userLicenseCount,
            userLicensePrice: formData.userLicensePrice,
            employeeLicenseCount: formData.employeeLicenseCount,
            employeeLicensePrice: formData.employeeLicensePrice,
          }
        }
      });
      
      // Create company admin user
      const tempPassword = await storage.generateSecurePassword(12);
      const adminUser = await storage.createCompanyAdminUser({
        firstName: formData.adminFirstName,
        lastName: formData.adminLastName,
        email: formData.adminEmail,
        companyId: company.id,
        tempPassword
      });
      
      // Skip email sending - provide password in response for manual sharing
      
      res.status(201).json({ 
        success: true, 
        company, 
        adminUser: { 
          ...adminUser, 
          tempPassword // Include password for manual sharing
        }, 
        message: `Company created successfully. Admin credentials generated.`
      });
    } catch (error) {
      console.error('Company creation error:', error);
      
      // Handle specific database constraint violations
      if ((error as any).code === '23505' && (error as any).constraint === 'companies_slug_unique') {
        return res.status(409).json({ error: "Company slug already exists. Please choose a different slug." });
      }
      
      // Handle duplicate email errors
      if ((error as any).code === '23505' && (error as any).constraint?.includes('email')) {
        return res.status(409).json({ error: "A user with this email already exists. Please use a different email address." });
      }
      
      res.status(500).json({ error: "Failed to create company and send invitation" });
    }
  });

  // Employee routes - Company Admins and HR only
  app.get("/api/employees", requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), requireCompany, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      let companyId = userData?.companyId;
      
      // For super admins, try to get company from query parameter or header
      if (userData?.role === 'SUPER_ADMIN' && !companyId) {
        const companySlug = req.query.companySlug as string || req.headers['x-company-slug'] as string;
        if (companySlug) {
          const company = await storage.getCompanyBySlug(companySlug);
          companyId = company?.id;
        }
      }
      
      if (!companyId) {
        return res.status(400).json({ error: "Company context required" });
      }
      
      const employees = await storage.getEmployees(companyId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", requireEmployeeAccess, async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'), requireCompany, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      let companyId = userData?.companyId;
      
      // For super admins, try to get company from request body or query
      if (userData?.role === 'SUPER_ADMIN' && !companyId) {
        const companySlug = req.body.companySlug || req.query.companySlug as string;
        if (companySlug) {
          const company = await storage.getCompanyBySlug(companySlug);
          companyId = company?.id;
        }
      }
      
      if (!companyId) {
        return res.status(400).json({ error: "Company context required" });
      }
      
      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        companyId: userData.companyId
      });
      
      const employee = await storage.createEmployee({
        ...validatedData,
        userId: validatedData.userId ?? null,
        probationInfo: validatedData.probationInfo ?? {},
        visaInfo: validatedData.visaInfo ?? {},
        emiratesIdInfo: validatedData.emiratesIdInfo ?? {},
        status: validatedData.status ?? 'ACTIVE',
      });
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  // Department routes - Company Admins and HR only
  app.get("/api/departments", requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), requireCompany, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      let companyId = userData?.companyId;
      
      // For super admins, try to get company from query parameter or header
      if (userData?.role === 'SUPER_ADMIN' && !companyId) {
        const companySlug = req.query.companySlug as string || req.headers['x-company-slug'] as string;
        if (companySlug) {
          const company = await storage.getCompanyBySlug(companySlug);
          companyId = company?.id;
        }
      }
      
      if (!companyId) {
        return res.status(400).json({ error: "Company context required" });
      }
      
      const departments = await storage.getDepartments(companyId);
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'), requireCompany, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      let companyId = userData?.companyId;
      
      // For super admins, try to get company from request body or query
      if (userData?.role === 'SUPER_ADMIN' && !companyId) {
        const companySlug = req.body.companySlug || req.query.companySlug as string;
        if (companySlug) {
          const company = await storage.getCompanyBySlug(companySlug);
          companyId = company?.id;
        }
      }
      
      if (!companyId) {
        return res.status(400).json({ error: "Company context required" });
      }
      
      const validatedData = insertDepartmentSchema.parse({
        ...req.body,
        companyId: userData.companyId
      });
      
      const department = await storage.createDepartment({
        ...validatedData,
        parentId: validatedData.parentId ?? null,
        managerId: validatedData.managerId ?? null,
        description: validatedData.description ?? null,
      });
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  // Position routes - Company Admins and HR only
  app.get("/api/positions", requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), requireCompany, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      let companyId = userData?.companyId;
      
      // For super admins, try to get company from query parameter or header
      if (userData?.role === 'SUPER_ADMIN' && !companyId) {
        const companySlug = req.query.companySlug as string || req.headers['x-company-slug'] as string;
        if (companySlug) {
          const company = await storage.getCompanyBySlug(companySlug);
          companyId = company?.id;
        }
      }
      
      if (!companyId) {
        return res.status(400).json({ error: "Company context required" });
      }
      
      const positions = await storage.getPositions(companyId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.post("/api/positions", requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'), requireCompany, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      let companyId = userData?.companyId;
      
      // For super admins, try to get company from request body or query
      if (userData?.role === 'SUPER_ADMIN' && !companyId) {
        const companySlug = req.body.companySlug || req.query.companySlug as string;
        if (companySlug) {
          const company = await storage.getCompanyBySlug(companySlug);
          companyId = company?.id;
        }
      }
      
      if (!companyId) {
        return res.status(400).json({ error: "Company context required" });
      }
      
      const validatedData = insertPositionSchema.parse({
        ...req.body,
        companyId: userData.companyId
      });
      
      const position = await storage.createPosition({
        ...validatedData,
        level: validatedData.level ?? null,
        jobDescription: validatedData.jobDescription ?? null,
      });
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create position" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
