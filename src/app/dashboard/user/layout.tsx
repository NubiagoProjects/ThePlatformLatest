import DashboardLayout from '@/components/dashboard/shared/DashboardLayout';

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  // In a real app, fetch user info from session or context
  const user = { name: 'Jane Doe', email: 'jane@example.com' };
  return (
    <DashboardLayout userRole="user" user={user}>
      {children}
    </DashboardLayout>
  );
} 