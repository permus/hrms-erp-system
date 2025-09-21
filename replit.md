# ERP/HRMS System - UAE Compliant Multi-Tenant Platform

## Overview

This is a comprehensive multi-tenant ERP/HRMS system designed for UAE compliance and enterprise management. The system provides three distinct portal interfaces: Super Admin (platform management), Company Admin (company-specific operations), and Employee Self-Service. It handles complete employee lifecycle management including onboarding, document management, attendance tracking, payroll processing, and regulatory compliance with UAE labor laws.

## User Preferences

Preferred communication style: Simple, everyday language.

**CRITICAL FORM LAYOUT PREFERENCE:**
- **Page-level scrolling**: Forms should NEVER have scrollable areas within them. The entire page should scroll naturally.
- **Always-visible buttons**: Navigation buttons (Previous/Next/Submit) should always be visible at the bottom of the viewport, not hidden below scrollable content.
- **No max-height constraints**: Do not use max-height, overflow-hidden, or overflow-y-auto on form content areas. Let the page flow naturally.

## System Architecture

### Frontend Architecture
**React + TypeScript SPA**: Single-page application built with Vite, using modern React patterns with functional components and hooks. The UI is built on shadcn/ui components with Radix UI primitives for accessibility and consistency.

**Multi-Portal Routing**: Three distinct user interfaces managed through route-based separation:
- `/super-admin/*` - Platform owner portal for managing multiple companies
- `/company-admin/*` - Company-specific administration interface  
- `/employee/*` - Employee self-service portal

**Design System**: Material Design principles implemented through Tailwind CSS with custom color schemes for light/dark modes. Typography uses Inter for general text and JetBrains Mono for technical data display.

**State Management**: React Query for server state management with optimistic updates, form state handled by React Hook Form with Zod validation schemas.

### Backend Architecture
**Node.js + Express**: RESTful API server with middleware for authentication, request logging, and error handling. Built with TypeScript for type safety across the full stack.

**Multi-Tenant Data Isolation**: Company-scoped data access patterns ensure tenant separation at the database query level, with role-based access control enforcing permissions.

**Authentication Strategy**: Replit Auth integration with session-based authentication, supporting user roles (SUPER_ADMIN, COMPANY_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE).

### Data Storage Architecture
**PostgreSQL with Drizzle ORM**: Type-safe database operations with schema-first approach. Multi-tenant architecture with company-scoped tables and proper foreign key relationships.

**Document Storage**: Integration ready for AWS S3 via Uppy file upload system for handling employee documents, contracts, and compliance files.

**Session Management**: PostgreSQL-backed session storage for scalable authentication state management.

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database for primary data storage
- **Drizzle Kit**: Database migration and schema management tooling

### Authentication & Session Management
- **Replit Auth**: OpenID Connect authentication provider with session management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI & Component Libraries  
- **Radix UI**: Accessible component primitives for complex UI interactions
- **shadcn/ui**: Pre-built component library following design system standards
- **Lucide React**: Icon library for consistent iconography
- **next-themes**: Theme management for light/dark mode support

### Form & Data Management
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition
- **TanStack React Query**: Server state management with caching and synchronization

### File Upload & Processing
- **Uppy**: File upload library with AWS S3 integration
- **date-fns**: Date manipulation and formatting utilities

### Development & Build Tools
- **Vite**: Build tool and development server with HMR
- **TypeScript**: Static type checking across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework for styling
- **ESBuild**: Fast JavaScript bundler for production builds

## Recent Changes

### Systematic Module-Based Routing Implementation (Completed)
- **Module Architecture**: Implemented systematic /hr/*, /payroll/*, /finance/* routing patterns with dedicated layout components for each major functional area
- **Layout Standardization**: Each module has consistent 240px sidebar width and unified header structure across HRModuleLayout, PayrollModuleLayout, and FinanceModuleLayout
- **Route Scoping Fixes**: Fixed critical Wouter path scoping issues by using absolute paths (/hr/dashboard vs /dashboard) for proper navigation
- **SPA Navigation**: All module transitions use single-page app navigation instead of page reloads for optimal user experience
- **Comprehensive Route Coverage**: Supports top-level routes (/hr/*), company-scoped routes (/:companySlug/hr/*), and legacy fallback routes (/company-admin/hr/*)
- **Employee Route Consolidation**: Moved all employee management routes under HR module with automatic redirects from legacy paths
- **Future-Ready Foundation**: Payroll and Finance modules have complete routing structure with "Coming Soon" placeholder pages ready for feature development

### Employee Management Implementation
- **Add New Employee Form**: Complete employee onboarding form with personal details, employment information, and document upload capabilities
- **Department Auto-Creation**: System automatically creates 10 standard software company departments (Engineering, Product, Design, etc.) 
- **Position Management**: Integrated position/job title tracking with department associations
- **Document Upload Ready**: Form prepared for document attachments (contracts, IDs, etc.)
- **Validation & UX**: Comprehensive form validation with user-friendly error handling and success states