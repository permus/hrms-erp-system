import { Calendar, DollarSign, FileText, Calculator, TrendingUp } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

const payrollItems = [
  {
    title: "Payroll Dashboard",
    url: "/payroll/dashboard",
    icon: TrendingUp,
  },
  {
    title: "Salary Processing",
    url: "/payroll/salary-processing",
    icon: Calculator,
  },
  {
    title: "Payslips",
    url: "/payroll/payslips",
    icon: FileText,
  },
  {
    title: "Tax Management",
    url: "/payroll/tax-management",
    icon: DollarSign,
  },
];

export function PayrollSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="payroll-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Payroll Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {payrollItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.startsWith(item.url)}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}