import Header from '../Header';

export default function HeaderExample() {
  // TODO: remove mock functionality
  const mockUser = {
    name: 'Ahmed Al Mansouri',
    email: 'ahmed.almansouri@company.com',
    role: 'COMPANY_ADMIN',
    companyName: 'Acme Corporation',
    profileImageUrl: undefined
  };

  const handleLogout = () => {
    console.log('User logout');
  };

  return (
    <div className="h-screen">
      <Header 
        user={mockUser}
        onLogout={handleLogout}
        pendingNotifications={5}
      />
      <div className="p-8">
        <h2 className="text-2xl font-semibold">Main Content Area</h2>
        <p className="text-muted-foreground mt-2">This is where the main application content would be displayed.</p>
      </div>
    </div>
  );
}