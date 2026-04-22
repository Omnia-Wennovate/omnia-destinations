'use client'

import { useEffect } from 'react'
import { getFirebaseAuth, getFirebaseDb, getFirebaseModules } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/auth'

// ── Session-cookie helpers (powers Edge middleware for /admin protection) ──────
const SESSION_COOKIE = 'omnia_session'

function setSessionCookie() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${SESSION_COOKIE}=1; Path=/; SameSite=Strict${secure}`
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setInitialized } = useAuthStore()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    async function setupAuth() {
      const auth = await getFirebaseAuth()
      const db = await getFirebaseDb()
      const modules = await getFirebaseModules()

      if (!auth || !modules.auth) {
        setInitialized(true)
        return
      }

      const { onAuthStateChanged } = modules.auth
      const { doc, getDoc } = modules.firestore || {}

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
        if (firebaseUser) {
          try {
            if (db && doc && getDoc) {
              const userDocRef  = doc(db, 'users',  firebaseUser.uid)
              const adminDocRef = doc(db, 'admins', firebaseUser.uid)

              const [userDocSnap, adminDocSnap] = await Promise.all([
                getDoc(userDocRef),
                getDoc(adminDocRef),
              ])

              const userData = userDocSnap.exists() ? userDocSnap.data() : null
              const role = adminDocSnap.exists() ? 'ADMIN' : (userData?.role || 'USER')

              setUser({
                id:        firebaseUser.uid,
                email:     firebaseUser.email || '',
                firstName: userData?.name?.split(' ')[0]                 || firebaseUser.displayName?.split(' ')[0]                 || '',
                lastName:  userData?.name?.split(' ').slice(1).join(' ') || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                role,
                photoURL:  firebaseUser.photoURL || '',
              })

              // Set/clear session cookie for Edge middleware (/admin route guard)
              if (role === 'ADMIN') {
                setSessionCookie()
              } else {
                clearSessionCookie()
              }
            } else {
              setUser({
                id:        firebaseUser.uid,
                email:     firebaseUser.email || '',
                firstName: firebaseUser.displayName || '',
                lastName:  '',
                role:      'USER',
                photoURL:  firebaseUser.photoURL || '',
              })
              clearSessionCookie()
            }
          } catch {
            setUser({
              id:        firebaseUser.uid,
              email:     firebaseUser.email || '',
              firstName: firebaseUser.displayName || '',
              lastName:  '',
              role:      'USER',
              photoURL:  firebaseUser.photoURL || '',
            })
            clearSessionCookie()
          }
        } else {
          const currentUser = useAuthStore.getState().user
          if (!currentUser || currentUser.id !== 'admin') {
            setUser(null)
          }
          clearSessionCookie() // Always clear on sign-out
        }
        setInitialized(true)
      })
    }

    setupAuth()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [setUser, setInitialized])

  return <>{children}</>
}
