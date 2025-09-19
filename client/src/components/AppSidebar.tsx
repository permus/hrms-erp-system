import { Users, Building2, UserPlus, Settings, BarChart3, Calendar, FileText, LogOut, User } from "lucide-react";
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

// Navigation items for company admin
const hrMenuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    url: "/dashboard",
  },
  {
    title: "Employees",
    icon: Users,
    url: "/employees",
  },
  {
    title: "Add Employee",
    icon: UserPlus,
    url: "/employees/new",
  },
  {
    title: "Departments",
    icon: Building2,
    url: "/departments",
  },
  {
    title: "Attendance",
    icon: Calendar,
    url: "/attendance",
  },
  {
    title: "Reports",
    icon: FileText,
    url: "/reports",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

export function AppSidebar() {
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
    <Sidebar data-testid="sidebar-navigation">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md font-semibold">
            HR
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">HR Management</span>
            <span className="text-xs text-muted-foreground">Employee Portal</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>HR Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hrMenuItems.map((item) => {
                const fullPath = `${basePath}${item.url}`;
                const isActive = location === fullPath || 
                  (item.url === '/employees' && location.startsWith(`${basePath}/employees`));
                
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