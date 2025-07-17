import DashboardLayout from '@/components/dashboard/shared/DashboardLayout';

export default function SupplierDashboardLayout({ children }: { children: React.ReactNode }) {
  // In a real app, fetch supplier info from session or context
  const supplier = { name: 'TechCorp Supplies', email: 'supplier@techcorp.com' };
  return (
    <DashboardLayout userRole="supplier" user={supplier}>
      {children}
    </DashboardLayout>
  );
} 