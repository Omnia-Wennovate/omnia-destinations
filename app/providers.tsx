'use client'

import React from "react"

import { useEffect } from 'react'
import { useThemeStore } from '@/store/theme'
import { AuthProvider } from '@/components/auth-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize theme from persisted store
    const state = useThemeStore.getState()
    const resolved = state.theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : state.theme
    useThemeStore.setState({ resolvedTheme: resolved })
    // Remove default class and add resolved theme
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
  }, [])

  return <AuthProvider>{children}</AuthProvider>
}
