import { Building2, Users, FileText, Calendar, Clock, Settings, BarChart3, UserCheck, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: string;
  companyName?: string;
  companySlug?: string;
  employeeSlug?: string;
}

// Base menu structure without hardcoded hrefs
const getMenuItems = (userRole: string, companySlug?: string, employeeSlug?: string) => {
  console.log('getMenuItems called with:', { userRole, companySlug, employeeSlug });
  const menuItems = {
    SUPER_ADMIN: [
      { icon: Shield, label: "Platform Overview", path: "dashboard", badge: null },
      { icon: Building2, label: "Companies", path: "companies", badge: null },
      { icon: BarChart3, label: "Analytics", path: "analytics", badge: null },
      { icon: Settings, label: "System Settings", path: "settings", badge: null },
    ],
    COMPANY_ADMIN: [
      { icon: BarChart3, label: "Dashboard", path: "dashboard", badge: null },
      { icon: Users, label: "Employees", path: "employees", badge: null },
      { icon: Building2, label: "Departments", path: "departments", badge: null },
      { icon: FileText, label: "Documents", path: "documents", badge: "12" },
      { icon: Calendar, label: "Leave Management", path: "leave", badge: "3" },
      { icon: Clock, label: "Attendance", path: "attendance", badge: null },
      { icon: UserCheck, label: "Probation Tracking", path: "probation", badge: "5" },
      { icon: Settings, label: "Company Settings", path: "settings", badge: null },
    ],
    EMPLOYEE: [
      { icon: BarChart3, label: "My Dashboard", path: "dashboard", badge: null },
      { icon: Users, label: "My Profile", path: "profile", badge: null },
      { icon: FileText, label: "My Documents", path: "documents", badge: "2" },
      { icon: Calendar, label: "Leave Requests", path: "leave", badge: null },
      { icon: Clock, label: "My Attendance", path: "attendance", badge: null },
    ],
  };

  const items = menuItems[userRole as keyof typeof menuItems] || menuItems.EMPLOYEE;
  
  // Generate dynamic hrefs based on role and slugs
  return items.map(item => {
    let href = '';
    
    if (userRole === 'SUPER_ADMIN') {
      href = `/super-admin/${item.path}`;
    } else if (['COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(userRole)) {
      if (companySlug) {
        href = `/${companySlug}/${item.path}`;
        console.log(`Generated slug-based URL for ${item.label}: ${href}`);
      } else {
        // Fallback to old URLs if no slug available
        href = `/company-admin/${item.path}`;
        console.log(`Fallback URL for ${item.label} (no companySlug): ${href}`);
      }
    } else if (userRole === 'EMPLOYEE') {
      if (companySlug && employeeSlug) {
        href = `/${companySlug}/${employeeSlug}/${item.path}`;
      } else {
        // Fallback to old URLs if no slugs available
        href = `/employee/${item.path}`;
      }
    }
    
    return { ...item, href };
  });
};

export default function Sidebar({ userRole, companyName, companySlug, employeeSlug }: SidebarProps) {
  const [location] = useLocation();
  const items = getMenuItems(userRole, companySlug, employeeSlug);

  return (
    <div className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-sidebar-primary rounded-md flex items-center justify-center">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">ERP/HRMS</h1>
            {companyName && (
              <p className="text-sm text-muted-foreground">{companyName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Role Badge */}
      <div className="p-4 border-t border-sidebar-border">
        <Badge variant="outline" className="w-full justify-center">
          {userRole.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  );
}