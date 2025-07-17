import Link from 'next/link';

const navConfig = {
  user: [
    { label: 'Orders', href: '/dashboard/user/orders' },
    { label: 'Profile', href: '/dashboard/user/profile' },
    { label: 'Wishlist', href: '/dashboard/user/wishlist' },
    { label: 'Addresses', href: '/dashboard/user/addresses' },
    { label: 'Support', href: '/dashboard/user/support' },
  ],
  supplier: [
    { label: 'Products', href: '/dashboard/supplier/products' },
    { label: 'Inventory', href: '/dashboard/supplier/inventory' },
    { label: 'Orders', href: '/dashboard/supplier/orders' },
    { label: 'Analytics', href: '/dashboard/supplier/analytics' },
    { label: 'Profile', href: '/dashboard/supplier/profile' },
  ],
  admin: [
    { label: 'Users', href: '/dashboard/admin/users' },
    { label: 'Suppliers', href: '/dashboard/admin/suppliers' },
    { label: 'Products', href: '/dashboard/admin/products' },
    { label: 'Orders', href: '/dashboard/admin/orders' },
    { label: 'Tickets', href: '/dashboard/admin/tickets' },
    { label: 'Analytics', href: '/dashboard/admin/analytics' },
    { label: 'Settings', href: '/dashboard/admin/settings' },
  ],
};

export function Sidebar({ userRole }: { userRole: 'user' | 'supplier' | 'admin' }) {
  const navItems = navConfig[userRole] || [];
  return (
    <aside className="w-64 bg-white border-r h-full flex flex-col">
      <div className="h-16 flex items-center justify-center font-bold text-xl border-b">Dashboard</div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-2 rounded hover:bg-gray-100 text-gray-700 font-medium"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar; 