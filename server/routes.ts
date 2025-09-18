import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  loadUserData, 
  requireRole, 
  requireCompany, 
  requireSameCompany, 
  requireEmployeeAccess,
  type AuthenticatedRequest 
} from "./roleAuth";
import { insertEmployeeSchema, insertCompanySchema, insertDepartmentSchema, insertPositionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  
  // Load user data middleware for all authenticated routes
  app.use('/api', isAuthenticated, loadUserData);
  
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

  // Get available modules for super admin
  app.get("/api/modules", requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const modules = await storage.getAvailableModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
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
      
      // Check for slug conflicts
      const existingCompany = await storage.getCompanyBySlug(formData.slug);
      if (existingCompany) {
        return res.status(409).json({ error: "Company slug already exists. Please choose a different slug." });
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
