import { ReactNode } from 'react'
import { ModalProvider } from '../../shared/ui/modal'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ModalProvider>
      {children}
    </ModalProvider>
  )
}
