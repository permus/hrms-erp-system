import Sidebar from '../Sidebar';

export default function SidebarExample() {
  return (
    <div className="h-screen flex">
      <Sidebar userRole="COMPANY_ADMIN" companyName="Acme Corporation" />
      <div className="flex-1 p-8 bg-background">
        <h2 className="text-2xl font-semibold">Main Content Area</h2>
        <p className="text-muted-foreground mt-2">This is where the main application content would be displayed.</p>
      </div>
    </div>
  );
}