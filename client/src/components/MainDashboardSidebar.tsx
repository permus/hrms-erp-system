import { 
  Building2, 
  BarChart3, 
  Users, 
  Settings, 
  FileText, 
  CreditCard, 
  LogOut, 
  PieChart,
  DollarSign,
  FolderOpen,
  UserCheck,
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Navigation items for main company dashboard
const mainMenuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    url: "/dashboard",
  },
  {
    title: "Human Resources",
    icon: Users,
    url: "/hr/dashboard",
  },
  {
    title: "Payroll",
    icon: DollarSign,
    url: "/payroll/dashboard",
    comingSoon: true,
  },
  {
    title: "Finance",
    icon: CreditCard,
    url: "/finance/dashboard", 
    comingSoon: true,
  },
  {
    title: "CRM",
    icon: UserCheck,
    url: "/crm/dashboard",
    comingSoon: true,
  },
  {
    title: "Projects",
    icon: FolderOpen,
    url: "/projects/dashboard",
    comingSoon: true,
  },
  {
    title: "Reports",
    icon: FileText,
    url: "/reports/dashboard",
    comingSoon: true,
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
  const { state: sidebarState, setOpen, isMobile } = useSidebar();
  
  // Sidebar collapsed state - default to collapsed for cleaner interface
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Auto-collapse after navigation (except initial load)
  const [hasNavigated, setHasNavigated] = useState(false);
  useEffect(() => {
    if (hasNavigated) {
      setIsCollapsed(true);
    } else {
      setHasNavigated(true);
    }
  }, [location, hasNavigated]);
  
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Sidebar 
      data-testid="sidebar-main-navigation" 
      className={cn("transition-all duration-300", isCollapsed && !isMobile ? "w-16" : "")}
      collapsible="icon"
      variant={isCollapsed && !isMobile ? "floating" : "sidebar"}
    >
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md font-semibold">
              ERP
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Business Platform</span>
                <span className="text-xs text-muted-foreground">Company Management</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
            data-testid="button-toggle-sidebar"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Main Modules</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const fullPath = `${basePath}${item.url}`;
                const isActive = location === fullPath || (item.url === '/hr/dashboard' && location.includes('/hr'));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild={!item.comingSoon} 
                      isActive={isActive} 
                      data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                      disabled={item.comingSoon}
                      className={cn(
                        "justify-start",
                        isCollapsed && "justify-center px-2",
                        item.comingSoon && "opacity-60 cursor-not-allowed"
                      )}
                      size={isCollapsed ? "sm" : "default"}
                    >
                      {item.comingSoon ? (
                        <div className={cn(
                          "flex items-center gap-3 text-muted-foreground",
                          isCollapsed && "gap-0 justify-center"
                        )}>
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!isCollapsed && (
                            <>
                              <span>{item.title}</span>
                              <span className="text-xs">(Coming Soon)</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <Link href={fullPath} className={cn(
                          "flex items-center gap-3 w-full",
                          isCollapsed && "justify-center gap-0"
                        )}>
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <div className={cn(
          "flex items-center gap-3 mb-3",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={userData?.profileImageUrl} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userData?.role?.replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size={isCollapsed ? "icon" : "sm"}
          onClick={handleLogout}
          className={cn(
            "w-full",
            isCollapsed ? "justify-center" : "justify-start"
          )}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}