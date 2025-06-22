'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const LogoutButton = () => {
  const router = useRouter()

  const handleLogout = () => {
    router.push('/sign-in') 
  }

  return <Button onClick={handleLogout}>Log out</Button>
}

export default LogoutButton
