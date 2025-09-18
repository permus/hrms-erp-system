import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEmployeeSchema, insertCompanySchema, insertDepartmentSchema, insertPositionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  
  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userData = await storage.getUser(user.claims.sub);
    
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(userData);
  });

  // Company routes
  app.get("/api/companies", isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", isAuthenticated, async (req, res) => {
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

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      if (!userData?.companyId) {
        return res.status(400).json({ error: "User not associated with a company" });
      }
      
      const employees = await storage.getEmployees(userData.companyId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      if (!userData?.companyId) {
        return res.status(400).json({ error: "User not associated with a company" });
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

  // Department routes
  app.get("/api/departments", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      if (!userData?.companyId) {
        return res.status(400).json({ error: "User not associated with a company" });
      }
      
      const departments = await storage.getDepartments(userData.companyId);
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      if (!userData?.companyId) {
        return res.status(400).json({ error: "User not associated with a company" });
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

  // Position routes
  app.get("/api/positions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      if (!userData?.companyId) {
        return res.status(400).json({ error: "User not associated with a company" });
      }
      
      const positions = await storage.getPositions(userData.companyId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.post("/api/positions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userData = await storage.getUser(user.claims.sub);
      
      if (!userData?.companyId) {
        return res.status(400).json({ error: "User not associated with a company" });
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
