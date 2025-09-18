import { Building2, Users, FileText, Calendar, Clock, Settings, BarChart3, UserCheck, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: string;
  companyName?: string;
}

const menuItems = {
  SUPER_ADMIN: [
    { icon: Shield, label: "Platform Overview", href: "/super-admin", badge: null },
    { icon: Building2, label: "Companies", href: "/super-admin/companies", badge: null },
    { icon: BarChart3, label: "Analytics", href: "/super-admin/analytics", badge: null },
    { icon: Settings, label: "System Settings", href: "/super-admin/settings", badge: null },
  ],
  COMPANY_ADMIN: [
    { icon: BarChart3, label: "Dashboard", href: "/company-admin", badge: null },
    { icon: Users, label: "Employees", href: "/company-admin/employees", badge: null },
    { icon: Building2, label: "Departments", href: "/company-admin/departments", badge: null },
    { icon: FileText, label: "Documents", href: "/company-admin/documents", badge: "12" },
    { icon: Calendar, label: "Leave Management", href: "/company-admin/leave", badge: "3" },
    { icon: Clock, label: "Attendance", href: "/company-admin/attendance", badge: null },
    { icon: UserCheck, label: "Probation Tracking", href: "/company-admin/probation", badge: "5" },
    { icon: Settings, label: "Company Settings", href: "/company-admin/settings", badge: null },
  ],
  EMPLOYEE: [
    { icon: BarChart3, label: "My Dashboard", href: "/employee", badge: null },
    { icon: Users, label: "My Profile", href: "/employee/profile", badge: null },
    { icon: FileText, label: "My Documents", href: "/employee/documents", badge: "2" },
    { icon: Calendar, label: "Leave Requests", href: "/employee/leave", badge: null },
    { icon: Clock, label: "My Attendance", href: "/employee/attendance", badge: null },
  ],
};

export default function Sidebar({ userRole, companyName }: SidebarProps) {
  const [location] = useLocation();
  const items = menuItems[userRole as keyof typeof menuItems] || menuItems.EMPLOYEE;

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