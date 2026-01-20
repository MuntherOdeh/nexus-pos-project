'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const variantStyles: Record<ConfirmDialogVariant, {
  icon: string;
  button: string;
  iconBg: string;
}> = {
  danger: {
    icon: 'text-red-500',
    button: 'bg-red-500 hover:bg-red-600 text-white',
    iconBg: 'bg-red-500/10',
  },
  warning: {
    icon: 'text-amber-500',
    button: 'bg-amber-500 hover:bg-amber-600 text-white',
    iconBg: 'bg-amber-500/10',
  },
  info: {
    icon: 'text-blue-500',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
    iconBg: 'bg-blue-500/10',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant];

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Focus confirm button when dialog opens
      setTimeout(() => confirmButtonRef.current?.focus(), 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={isLoading ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            className="relative w-full max-w-md rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 rounded-xl text-[var(--pos-muted)] hover:bg-[var(--pos-border)] hover:text-[var(--pos-text)] transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              {/* Icon */}
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4', styles.iconBg)}>
                <AlertTriangle className={cn('w-6 h-6', styles.icon)} />
              </div>

              {/* Title */}
              <h2
                id="confirm-dialog-title"
                className="text-xl font-bold text-center text-[var(--pos-text)] mb-2"
              >
                {title}
              </h2>

              {/* Message */}
              <p
                id="confirm-dialog-description"
                className="text-center text-[var(--pos-muted)] mb-6"
              >
                {message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl border border-[color:var(--pos-border)] text-[var(--pos-text)] font-medium hover:bg-[var(--pos-border)] transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  ref={confirmButtonRef}
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
                    styles.button
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: ConfirmDialogVariant;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
  });

  const [isLoading, setIsLoading] = React.useState(false);

  const confirm = React.useCallback(
    (options: {
      title: string;
      message: string;
      variant?: ConfirmDialogVariant;
      confirmText?: string;
      cancelText?: string;
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title: options.title,
          message: options.message,
          variant: options.variant || 'danger',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          onConfirm: async () => {
            setIsLoading(true);
            try {
              resolve(true);
            } finally {
              setIsLoading(false);
              setState((prev) => ({ ...prev, isOpen: false }));
            }
          },
        });
      });
    },
    []
  );

  const close = React.useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const dialogProps: ConfirmDialogProps = {
    isOpen: state.isOpen,
    onClose: close,
    onConfirm: state.onConfirm,
    title: state.title,
    message: state.message,
    variant: state.variant,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    isLoading,
  };

  return { confirm, dialogProps, ConfirmDialog };
}
