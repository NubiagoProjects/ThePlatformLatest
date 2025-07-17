import Sidebar from './Sidebar';

export default function DashboardLayout({ children, userRole, user }: {
  children: React.ReactNode;
  userRole: 'user' | 'supplier' | 'admin';
  user?: { name?: string; email?: string };
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 