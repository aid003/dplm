import React from 'react'
import type { ModalController } from './types'

export const ModalContext = React.createContext<ModalController | null>(null)
