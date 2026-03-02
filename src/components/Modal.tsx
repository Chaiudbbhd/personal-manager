import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  variant?: 'danger' | 'primary';
  size?: 'md' | 'lg' | 'xl';
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  confirmLabel = 'Confirm', 
  onConfirm,
  variant = 'primary',
  size = 'md'
}: ModalProps) {
  const maxWidthClass = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full ${maxWidthClass} bg-bg-sidebar border border-border-main rounded-xl shadow-2xl overflow-hidden`}
          >
            <div className="flex items-center justify-between p-4 border-b border-border-main">
              <h3 className="text-lg font-bold text-text-primary">{title}</h3>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-text-secondary">
              {children}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 bg-bg-sidebar border-t border-border-main">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
                    variant === 'danger' 
                      ? 'bg-accent-red hover:bg-accent-red/90' 
                      : 'bg-accent-blue hover:bg-accent-blue/90'
                  }`}
                >
                  {confirmLabel}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
