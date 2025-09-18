import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, Shield, Clock, CheckCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ERP/HRMS</h1>
              <p className="text-sm text-muted-foreground">UAE Compliant</p>
            </div>
          </div>
          <Button onClick={handleLogin} data-testid="login-button">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Complete ERP/HRMS Solution
            </h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive multi-tenant system with UAE labor law compliance, 
              document management, and automated workflows for modern businesses.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleLogin} data-testid="hero-login">
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Built for UAE Businesses</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage employees, documents, and compliance 
            in one comprehensive platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Complete employee lifecycle management with UAE-specific fields 
                for Emirates ID, visa status, and probation tracking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Document Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Secure document storage with automated expiry tracking, 
                approval workflows, and category-based organization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>UAE Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Built-in compliance features for UAE labor law, visa renewals, 
                Emirates ID tracking, and end-of-service calculations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Probation Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automated probation period management with notifications, 
                evaluations, and confirmation workflows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Multi-Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Support for multiple companies with complete data isolation, 
                role-based access, and customizable workflows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Automated Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Streamlined processes for employee onboarding, leave approvals, 
                document reviews, and compliance monitoring.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Portal Types */}
      <section className="container mx-auto px-6 py-16 bg-muted/50 rounded-xl my-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Three Specialized Portals</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Role-based access ensures each user sees exactly what they need.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h4 className="text-xl font-semibold">Super Admin Portal</h4>
            <p className="text-muted-foreground">
              Platform-wide management, company oversight, billing, and system configuration.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-xl font-semibold">Company Admin Portal</h4>
            <p className="text-muted-foreground">
              Employee management, HR operations, compliance tracking, and reporting.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-secondary-foreground" />
            </div>
            <h4 className="text-xl font-semibold">Employee Self-Service</h4>
            <p className="text-muted-foreground">
              Personal profile, leave requests, document uploads, and attendance tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">ERP/HRMS System</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ERP/HRMS. Built for UAE compliance.
          </p>
        </div>
      </footer>
    </div>
  );
}