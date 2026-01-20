'use client';

import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: Shortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Escape key in inputs
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const metaMatch = shortcut.meta ? event.metaKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // For Cmd/Ctrl shortcuts, check if the modifier is pressed
        const modifierRequired = shortcut.ctrl || shortcut.meta;
        const modifierPressed = event.ctrlKey || event.metaKey;

        if (modifierRequired && !modifierPressed) continue;
        if (!modifierRequired && modifierPressed) continue;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

// Common shortcuts for POS
export const POS_SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, description: 'Open quick search' },
  NEW_ORDER: { key: 'n', ctrl: true, description: 'New order' },
  PAYMENT: { key: 'p', ctrl: true, description: 'Process payment' },
  ESCAPE: { key: 'Escape', description: 'Close modal/dialog' },
  SAVE: { key: 's', ctrl: true, description: 'Save changes' },
} as const;
