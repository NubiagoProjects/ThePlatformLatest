import { LoginSignUp } from '@/components/LoginSignUp'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex-grow">
        <LoginSignUp />
      </main>
      <Footer />
    </>
  )
} 