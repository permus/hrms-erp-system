interface CleanDashboardLayoutProps {
  children: React.ReactNode;
}

export function CleanDashboardLayout({ children }: CleanDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md font-semibold">
              ERP
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Business Management Platform</span>
              <span className="text-xs text-muted-foreground">Company Management</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Future: Theme toggle, user menu, notifications */}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}