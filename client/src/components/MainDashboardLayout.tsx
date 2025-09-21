import { SidebarProvider } from "@/components/ui/sidebar";
import { MainDashboardSidebar } from "@/components/MainDashboardSidebar";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";

interface MainDashboardLayoutProps {
  children: React.ReactNode;
}

export function MainDashboardLayout({ children }: MainDashboardLayoutProps) {
  const { user } = useAuth();
  
  // Custom sidebar width for main dashboard (280px for more room)
  const style = {
    "--sidebar-width": "17.5rem",     // 280px for more room
    "--sidebar-width-icon": "3rem",   // standard icon width
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Transform user data for header component
  const headerUser = user ? {
    name: (user as any)?.firstName && (user as any)?.lastName 
      ? `${(user as any).firstName} ${(user as any).lastName}`.trim() 
      : (user as any)?.email || 'User',
    email: (user as any)?.email || '',
    profileImageUrl: (user as any)?.profileImageUrl,
    role: (user as any)?.role || 'EMPLOYEE',
    companyName: (user as any)?.companyName
  } : null;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <MainDashboardSidebar />
        <div className="flex flex-col flex-1">
          {headerUser && (
            <Header 
              user={headerUser} 
              onLogout={handleLogout}
              pendingNotifications={0}
            />
          )}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}