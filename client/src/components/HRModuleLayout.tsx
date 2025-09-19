import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface HRModuleLayoutProps {
  children: React.ReactNode;
}

export function HRModuleLayout({ children }: HRModuleLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Get user's company context for back navigation
  const { data: userSlugs } = useQuery<{companySlugs?: string[]}>({
    queryKey: ['/api/resolve/me'],
    enabled: !!user,
  });
  
  const companySlug = userSlugs?.companySlugs?.[0];
  const mainDashboardPath = companySlug ? `/${companySlug}/dashboard` : '/company-admin/dashboard';

  // Custom sidebar width for HR module
  const style = {
    "--sidebar-width": "20rem",       // 320px for HR content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                data-testid="button-back-to-main"
              >
                <Link href={mainDashboardPath}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Main Dashboard
                </Link>
              </Button>
              <h1 className="text-lg font-semibold">Human Resources Module</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme toggle placeholder - can be added later */}
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}