import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
// Note: ThemeToggle component may not exist yet, using placeholder
// import { ThemeToggle } from "@/components/theme-toggle";

interface CompanyAdminLayoutProps {
  children: React.ReactNode;
}

export function CompanyAdminLayout({ children }: CompanyAdminLayoutProps) {
  // Custom sidebar width for HR application
  const style = {
    "--sidebar-width": "20rem",       // 320px for better HR content
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
              <h1 className="text-lg font-semibold">Employee Management System</h1>
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