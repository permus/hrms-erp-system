import Dashboard from '../Dashboard';

export default function DashboardExample() {
  // TODO: remove mock functionality
  const mockStats = {
    totalEmployees: 156,
    activeEmployees: 142,
    onProbation: 8,
    pendingDocuments: 12,
    expiringDocuments: 5,
    pendingLeave: 7,
    totalCompanies: 24,
    recentActivities: [
      {
        id: '1',
        type: 'employee_added',
        description: 'New employee Ahmed Al Mansouri added to Engineering department',
        timestamp: '2 hours ago',
        user: 'HR Manager'
      },
      {
        id: '2',
        type: 'document_approved',
        description: 'Passport document approved for Sara Abdullah',
        timestamp: '4 hours ago',
        user: 'Document Reviewer'
      },
      {
        id: '3',
        type: 'leave_approved',
        description: 'Annual leave request approved for Mohammed Hassan',
        timestamp: '1 day ago',
        user: 'Department Manager'
      },
      {
        id: '4',
        type: 'probation_completed',
        description: 'Probation period completed for Fatima Al Zahra',
        timestamp: '2 days ago',
        user: 'HR Manager'
      }
    ]
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl">
      {/* Company Admin Dashboard */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Company Admin Dashboard</h2>
        <Dashboard userRole="COMPANY_ADMIN" stats={mockStats} />
      </div>
      
      {/* Employee Dashboard */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Employee Dashboard</h2>
        <Dashboard userRole="EMPLOYEE" stats={mockStats} />
      </div>
    </div>
  );
}