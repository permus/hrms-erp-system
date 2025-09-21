import { SidebarProvider } from "@/components/ui/sidebar";
import { FinanceSidebar } from "@/components/FinanceSidebar";

interface FinanceModuleLayoutProps {
  children: React.ReactNode;
}

export function FinanceModuleLayout({ children }: FinanceModuleLayoutProps) {
  // Custom sidebar width for Finance module (280px for more room)
  const style = {
    "--sidebar-width": "17.5rem",     // 280px for more room
    "--sidebar-width-icon": "3rem",   // standard icon width
  };

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <FinanceSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}