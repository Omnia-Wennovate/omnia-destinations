'use client'

import { useEffect } from 'react'
import { getFirebaseAuth, getFirebaseDb, getFirebaseModules } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/auth'

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
              const userDocRef = doc(db, 'users', firebaseUser.uid)
              const userDocSnap = await getDoc(userDocRef)
              const userData = userDocSnap.exists() ? userDocSnap.data() : null

              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                firstName: userData?.name?.split(' ')[0] || firebaseUser.displayName?.split(' ')[0] || '',
                lastName: userData?.name?.split(' ').slice(1).join(' ') || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                role: userData?.role || 'USER',
                photoURL: firebaseUser.photoURL || '',
              })
            } else {
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                firstName: firebaseUser.displayName || '',
                lastName: '',
                role: 'USER',
                photoURL: firebaseUser.photoURL || '',
              })
            }
          } catch {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: firebaseUser.displayName || '',
              lastName: '',
              role: 'USER',
              photoURL: firebaseUser.photoURL || '',
            })
          }
        } else {
          const currentUser = useAuthStore.getState().user
          if (!currentUser || currentUser.id !== 'admin') {
            setUser(null)
          }
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
