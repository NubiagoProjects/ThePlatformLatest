import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DashboardLayout as DashboardLayoutComponent } from '@/components/layouts/DashboardLayout'

export const metadata: Metadata = {
  title: 'Dashboard - Nubiago',
  description: 'Manage your account, orders, and preferences on Nubiago.',
  robots: {
    index: false,
    follow: false,
  },
}

// Mock auth check - replace with real authentication
const getUserRole = () => {
  // In a real app, this would check the user's authentication status
  // and return their role from the session/token
  return 'user' // 'user' | 'supplier' | 'admin'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userRole = getUserRole()
  
  // Redirect to login if not authenticated
  if (!userRole) {
    redirect('/login')
  }

  return (
    <DashboardLayoutComponent userRole={userRole}>
      {children}
    </DashboardLayoutComponent>
  )
} 