export function Header({ user }: { user?: { name?: string; email?: string } }) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
      <div className="font-bold text-lg">Nubiago Dashboard</div>
      <div className="flex items-center space-x-4">
        {/* Notifications placeholder */}
        <button className="relative p-2 rounded hover:bg-gray-100">
          <span className="sr-only">Notifications</span>
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        {/* User info */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="text-sm text-gray-700">
            {user?.name || 'User'}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header; 