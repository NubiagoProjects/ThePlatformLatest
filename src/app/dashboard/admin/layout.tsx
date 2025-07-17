import DashboardLayout from '@/components/dashboard/shared/DashboardLayout';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // In a real app, fetch admin info from session or context
  const admin = { name: 'Admin User', email: 'admin@nubiago.com' };
  return (
    <DashboardLayout userRole="admin" user={admin}>
      {children}
    </DashboardLayout>
  );
} 