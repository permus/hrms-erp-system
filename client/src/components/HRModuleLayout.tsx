import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface HRModuleLayoutProps {
  children: React.ReactNode;
}

export function HRModuleLayout({ children }: HRModuleLayoutProps) {
  // Custom sidebar width for HR module (280px for more room)
  const style = {
    "--sidebar-width": "17.5rem",     // 280px for more room
    "--sidebar-width-icon": "3rem",   // standard icon width
  };

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}