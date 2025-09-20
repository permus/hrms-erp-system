import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MainDashboardSidebar } from "@/components/MainDashboardSidebar";
import { Button } from "@/components/ui/button";

interface MainDashboardLayoutProps {
  children: React.ReactNode;
}

export function MainDashboardLayout({ children }: MainDashboardLayoutProps) {
  // Custom sidebar width for main dashboard (240px standard)
  const style = {
    "--sidebar-width": "15rem",       // 240px for consistency
    "--sidebar-width-icon": "3rem",   // standard icon width
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <MainDashboardSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-lg font-semibold">Business Management Platform</h1>
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