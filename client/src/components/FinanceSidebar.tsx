import { BarChart3, CreditCard, PieChart, FileBarChart, TrendingUp } from "lucide-react";
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

const financeItems = [
  {
    title: "Finance Dashboard",
    url: "/finance/dashboard",
    icon: TrendingUp,
  },
  {
    title: "Expenses",
    url: "/finance/expenses",
    icon: CreditCard,
  },
  {
    title: "Budgets",
    url: "/finance/budgets",
    icon: PieChart,
  },
  {
    title: "Financial Reports",
    url: "/finance/reports",
    icon: FileBarChart,
  },
];

export function FinanceSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="finance-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Finance Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map((item) => (
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