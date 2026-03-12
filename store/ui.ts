import { create } from 'zustand'

interface UIStoreState {
  isMobileMenuOpen: boolean
  isBookingDialogOpen: boolean
  selectedPackageId: string | null
  openMobileMenu: () => void
  closeMobileMenu: () => void
  toggleMobileMenu: () => void
  openBookingDialog: (packageId: string) => void
  closeBookingDialog: () => void
}

export const useUIStore = create<UIStoreState>((set) => ({
  isMobileMenuOpen: false,
  isBookingDialogOpen: false,
  selectedPackageId: null,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openBookingDialog: (packageId: string) => set({ isBookingDialogOpen: true, selectedPackageId: packageId }),
  closeBookingDialog: () => set({ isBookingDialogOpen: false }),
}))
