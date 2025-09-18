// Module Management System
// Configuration for available modules, pricing, and licensing

export interface ModuleConfig {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  basePrice: number; // AED per month
  isCore: boolean; // Always enabled
}

export interface LicenseConfig {
  userLicensePrice: number; // AED per user per month
  employeeLicensePrice: number; // AED per employee per month
}

// Default license pricing (AED)
export const LICENSE_PRICING: LicenseConfig = {
  userLicensePrice: 25.00,
  employeeLicensePrice: 15.00,
};

// UAE-specific dropdown options
export const UAE_CITIES = [
  'Dubai',
  'Abu Dhabi', 
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
  'Al Ain',
  'Other'
];

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'Construction',
  'Manufacturing',
  'Retail & E-commerce',
  'Education',
  'Hospitality & Tourism',
  'Real Estate',
  'Transportation & Logistics',
  'Oil & Gas',
  'Government',
  'Other'
];

export const EMPLOYEE_COUNT_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

// Pricing calculation utilities
export interface PricingBreakdown {
  modulesCost: number;
  userLicensesCost: number;
  employeeLicensesCost: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export function calculateMonthlyCost(
  selectedModules: ModuleConfig[],
  userLicenseCount: number,
  employeeLicenseCount: number,
  customPricing?: LicenseConfig
): PricingBreakdown {
  const pricing = customPricing || LICENSE_PRICING;
  
  const modulesCost = selectedModules.reduce((total, module) => total + module.basePrice, 0);
  const userLicensesCost = userLicenseCount * pricing.userLicensePrice;
  const employeeLicensesCost = employeeLicenseCount * pricing.employeeLicensePrice;
  
  const subtotal = modulesCost + userLicensesCost + employeeLicensesCost;
  const vatAmount = subtotal * 0.05; // 5% VAT in UAE
  const total = subtotal + vatAmount;
  
  return {
    modulesCost,
    userLicensesCost,
    employeeLicensesCost,
    subtotal,
    vatAmount,
    total
  };
}

// Slug generation utility
export function generateCompanySlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Company form data interface
export interface CompanyFormData {
  // Basic Company Info
  companyName: string;
  slug: string;
  industry: string;
  employeeCount: string;
  country: string;
  city: string;
  
  // Company Admin Details
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  
  // Licensing & Pricing
  userLicenseCount: number;
  userLicensePrice: number;
  employeeLicenseCount: number;
  employeeLicensePrice: number;
  
  // Module Selection
  enabledModules: string[]; // Array of module keys
  
  // Subscription Details
  subscriptionType: 'monthly' | 'annual';
  trialDays: number;
  billingStartDate: string;
}

export const DEFAULT_COMPANY_FORM: CompanyFormData = {
  companyName: '',
  slug: '',
  industry: '',
  employeeCount: '',
  country: 'UAE',
  city: '',
  adminFirstName: '',
  adminLastName: '', 
  adminEmail: '',
  userLicenseCount: 1,
  userLicensePrice: LICENSE_PRICING.userLicensePrice,
  employeeLicenseCount: 0,
  employeeLicensePrice: LICENSE_PRICING.employeeLicensePrice,
  enabledModules: ['hr'], // HR is always enabled as core
  subscriptionType: 'monthly',
  trialDays: 30,
  billingStartDate: '',
};