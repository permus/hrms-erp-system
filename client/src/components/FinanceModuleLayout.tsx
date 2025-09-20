import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FinanceSidebar } from "@/components/FinanceSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface FinanceModuleLayoutProps {
  children: React.ReactNode;
}

export function FinanceModuleLayout({ children }: FinanceModuleLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Get user's company context for back navigation
  const { data: userSlugs } = useQuery<{companySlugs?: string[]}>({
    queryKey: ['/api/resolve/me'],
    enabled: !!user,
  });
  
  const companySlug = userSlugs?.companySlugs?.[0];
  const mainDashboardPath = companySlug ? `/${companySlug}/dashboard` : '/company-admin/dashboard';

  // Custom sidebar width for Finance module (240px standard)
  const style = {
    "--sidebar-width": "15rem",       // 240px for consistency
    "--sidebar-width-icon": "3rem",   // standard icon width
  };

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <FinanceSidebar />
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
              <h1 className="text-lg font-semibold">Finance Management Module</h1>
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