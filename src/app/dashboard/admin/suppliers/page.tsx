import Link from 'next/link';

export default function AdminSuppliersPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Suppliers</h1>
      <p className="mb-4">View and manage all suppliers. To manage supplier details, go to the Supplier Dashboard.</p>
      <Link href="/dashboard/supplier">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Go to Supplier Dashboard</button>
      </Link>
    </div>
  );
} 