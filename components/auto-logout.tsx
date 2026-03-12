'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoLogout() {
  const router = useRouter()

  useEffect(() => {
    let timer: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timer)

      timer = setTimeout(() => {
        localStorage.removeItem('user')
        router.push('/login')
      }, 3 * 60 * 1000) // 3 minutes
    }

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)

    resetTimer()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('click', resetTimer)
    }
  }, [router])

  return null
}