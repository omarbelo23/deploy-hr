import React from 'react'
import { Button } from '@/components/ui/shadcn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg'
  children?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, size = 'md', children }) => {
  if (!isOpen) return null

  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-2xl'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`${sizeClass} mx-4 relative z-10 bg-white rounded-lg shadow-lg overflow-auto max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export default Modal
