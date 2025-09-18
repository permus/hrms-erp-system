import EmployeeCard from '../EmployeeCard';

export default function EmployeeCardExample() {
  // TODO: remove mock functionality
  const mockEmployee = {
    id: 'emp-001',
    employeeCode: 'EMP2024001',
    personalInfo: {
      name: 'Ahmed Al Mansouri',
      nationality: 'UAE',
      dob: '1990-05-15'
    },
    contactInfo: {
      email: 'ahmed.almansouri@company.com',
      uaePhone: '+971 50 123 4567',
      uaeAddress: 'Marina District, Dubai, UAE'
    },
    employmentDetails: {
      position: 'Senior Software Engineer',
      department: 'Engineering',
      startDate: '2024-01-15',
      employmentStatus: 'PROBATION' as const
    },
    probationInfo: {
      endDate: '2024-07-15',
      status: 'ACTIVE' as const
    },
    visaInfo: {
      expiryDate: '2024-12-31',
      visaType: 'Employment Visa'
    },
    emiratesIdInfo: {
      expiryDate: '2024-06-30'
    },
    profileImageUrl: undefined
  };

  const handleViewDetails = (id: string) => {
    console.log('View details for employee:', id);
  };

  const handleEditEmployee = (id: string) => {
    console.log('Edit employee:', id);
  };

  return (
    <div className="p-6 max-w-sm">
      <EmployeeCard 
        employee={mockEmployee}
        onViewDetails={handleViewDetails}
        onEditEmployee={handleEditEmployee}
      />
    </div>
  );
}