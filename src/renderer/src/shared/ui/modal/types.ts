export type ModalId = string

export type ModalOptions = {
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  ariaLabel?: string
  width?: number | string
}

export type OpenModalParams = {
  id?: ModalId
  content: React.ReactNode
  options?: ModalOptions
}

export type ModalController = {
  open: (params: OpenModalParams) => ModalId
  close: (id: ModalId) => void
  closeAll: () => void
  confirm: (content: React.ReactNode, options?: ModalOptions) => Promise<boolean>
  /** Set loading state for the topmost modal. When true, modal cannot be closed. */
  setLoadingTopmost: (loading: boolean, opts?: { showSpinner?: boolean; text?: string; fullscreen?: boolean }) => void
}

export type ModalEntry = {
  id: ModalId
  content: React.ReactNode
  options: Required<Pick<ModalOptions, 'closeOnBackdrop' | 'closeOnEsc'>> & ModalOptions
  loading?: boolean
  showSpinner?: boolean
  loadingText?: string
  fullscreenLoading?: boolean
}
