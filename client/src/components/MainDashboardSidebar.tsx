import { Building2, BarChart3, Users, Settings, FileText, CreditCard, LogOut, PieChart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Navigation items for main company dashboard
const mainMenuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    url: "/dashboard",
  },
  {
    title: "Analytics", 
    icon: PieChart,
    url: "/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

export function MainDashboardSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Get user's company context for navigation
  const { data: userSlugs } = useQuery<{companySlugs?: string[]}>({
    queryKey: ['/api/resolve/me'],
    enabled: !!user,
  });
  
  // Determine the base path for navigation
  const companySlug = userSlugs?.companySlugs?.[0];
  const basePath = companySlug ? `/${companySlug}` : '/company-admin';
  
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Get user initials for avatar
  const userData = user as any;
  const userInitials = userData?.firstName && userData?.lastName 
    ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
    : userData?.email?.[0]?.toUpperCase() || 'U';

  return (
    <Sidebar data-testid="sidebar-main-navigation">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md font-semibold">
            ERP
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Business Platform</span>
            <span className="text-xs text-muted-foreground">Company Management</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const fullPath = `${basePath}${item.url}`;
                const isActive = location === fullPath;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <Link href={fullPath}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={userData?.profileImageUrl} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData?.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userData?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="w-full justify-start"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}