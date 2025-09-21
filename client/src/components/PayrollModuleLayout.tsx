import { SidebarProvider } from "@/components/ui/sidebar";
import { PayrollSidebar } from "@/components/PayrollSidebar";

interface PayrollModuleLayoutProps {
  children: React.ReactNode;
}

export function PayrollModuleLayout({ children }: PayrollModuleLayoutProps) {
  // Custom sidebar width for Payroll module (280px for more room)
  const style = {
    "--sidebar-width": "17.5rem",     // 280px for more room
    "--sidebar-width-icon": "3rem",   // standard icon width
  };

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <PayrollSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}