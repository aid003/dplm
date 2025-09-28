import { useContext } from 'react'
import { ModalContext } from './context'
import type { ModalController } from './types'

export function useModal(): ModalController {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

