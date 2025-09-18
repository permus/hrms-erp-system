import EmployeeForm from '../EmployeeForm';

export default function EmployeeFormExample() {
  // TODO: remove mock functionality
  const mockDepartments = [
    { id: 'eng', name: 'Engineering' },
    { id: 'hr', name: 'Human Resources' },
    { id: 'fin', name: 'Finance' },
    { id: 'ops', name: 'Operations' },
  ];

  const mockPositions = [
    { id: 'senior-engineer', title: 'Senior Software Engineer' },
    { id: 'hr-manager', title: 'HR Manager' },
    { id: 'accountant', title: 'Senior Accountant' },
    { id: 'ops-manager', title: 'Operations Manager' },
  ];

  const mockManagers = [
    { id: 'john-doe', name: 'John Doe - Engineering Director' },
    { id: 'jane-smith', name: 'Jane Smith - HR Director' },
    { id: 'ahmed-ali', name: 'Ahmed Ali - Finance Director' },
  ];

  const handleSubmit = (data: any) => {
    console.log('Employee form submitted:', data);
  };

  const handleCancel = () => {
    console.log('Employee form cancelled');
  };

  return (
    <div className="p-6">
      <EmployeeForm
        departments={mockDepartments}
        positions={mockPositions}
        managers={mockManagers}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={false}
      />
    </div>
  );
}