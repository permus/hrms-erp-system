import { SidebarProvider } from "@/components/ui/sidebar";
import { MainDashboardSidebar } from "@/components/MainDashboardSidebar";

interface MainDashboardLayoutProps {
  children: React.ReactNode;
}

export function MainDashboardLayout({ children }: MainDashboardLayoutProps) {
  // Custom sidebar width for main dashboard (280px for more room)
  const style = {
    "--sidebar-width": "17.5rem",     // 280px for more room
    "--sidebar-width-icon": "3rem",   // standard icon width
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <MainDashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}