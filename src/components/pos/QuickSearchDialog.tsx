'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ShoppingCart, Package, Receipt, ChefHat, Settings, ArrowRight, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'invoice' | 'action';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
}

interface QuickSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
}

const typeIcons = {
  product: <Package className="w-4 h-4" />,
  order: <ShoppingCart className="w-4 h-4" />,
  invoice: <Receipt className="w-4 h-4" />,
  action: <ArrowRight className="w-4 h-4" />,
};

const quickActions: SearchResult[] = [
  {
    id: 'new-sale',
    type: 'action',
    title: 'New Sale',
    subtitle: 'Start a new transaction',
    icon: <ShoppingCart className="w-4 h-4 text-emerald-500" />,
  },
  {
    id: 'view-orders',
    type: 'action',
    title: 'View Active Orders',
    subtitle: 'See all pending orders',
    icon: <Hash className="w-4 h-4 text-cyan-500" />,
  },
  {
    id: 'kitchen-display',
    type: 'action',
    title: 'Kitchen Display',
    subtitle: 'Open KDS view',
    icon: <ChefHat className="w-4 h-4 text-orange-500" />,
  },
  {
    id: 'settings',
    type: 'action',
    title: 'Settings',
    subtitle: 'Configure POS settings',
    icon: <Settings className="w-4 h-4 text-gray-500" />,
  },
];

export function QuickSearchDialog({ isOpen, onClose, tenantSlug }: QuickSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(quickActions);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(quickActions);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search products when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults(quickActions);
      return;
    }

    const searchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/pos/tenants/${tenantSlug}/products?search=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();

        if (data.success && data.products) {
          const productResults: SearchResult[] = data.products.map((product: any) => ({
            id: product.id,
            type: 'product' as const,
            title: product.name,
            subtitle: `${(product.priceCents / 100).toFixed(2)} AED`,
            icon: <Package className="w-4 h-4 text-pink-500" />,
            href: `/t/${tenantSlug}/pos/inventory`,
          }));

          // Filter quick actions that match query
          const matchingActions = quickActions.filter(
            (action) =>
              action.title.toLowerCase().includes(query.toLowerCase()) ||
              action.subtitle?.toLowerCase().includes(query.toLowerCase())
          );

          setResults([...matchingActions, ...productResults]);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 200);
    return () => clearTimeout(debounce);
  }, [query, tenantSlug]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          handleSelect(results[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.action) {
        result.action();
      } else if (result.id === 'new-sale') {
        router.push(`/t/${tenantSlug}/pos/checkout`);
      } else if (result.id === 'view-orders') {
        router.push(`/t/${tenantSlug}/pos/orders`);
      } else if (result.id === 'kitchen-display') {
        router.push(`/t/${tenantSlug}/pos/kds`);
      } else if (result.id === 'settings') {
        router.push(`/t/${tenantSlug}/pos/settings`);
      } else if (result.href) {
        router.push(result.href);
      }
      onClose();
    },
    [router, tenantSlug, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-lg rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[color:var(--pos-border)]">
              <Search className="w-5 h-5 text-[var(--pos-muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, orders, or type a command..."
                className="flex-1 bg-transparent text-[var(--pos-text)] placeholder:text-[var(--pos-muted)] outline-none text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg hover:bg-[var(--pos-border)] text-[var(--pos-muted)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-[var(--pos-muted)] bg-[var(--pos-bg)] border border-[color:var(--pos-border)] rounded-lg">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[var(--pos-border)] border-t-[var(--pos-accent)] rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {!query && (
                    <p className="text-xs text-[var(--pos-muted)] px-3 py-2">Quick Actions</p>
                  )}
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors',
                        index === selectedIndex
                          ? 'bg-[var(--pos-accent)]/10 text-[var(--pos-accent)]'
                          : 'text-[var(--pos-text)] hover:bg-[var(--pos-border)]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          index === selectedIndex ? 'bg-[var(--pos-accent)]/20' : 'bg-[var(--pos-bg)]'
                        )}
                      >
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-[var(--pos-muted)] truncate">{result.subtitle}</p>
                        )}
                      </div>
                      {index === selectedIndex && (
                        <kbd className="text-xs px-2 py-1 bg-[var(--pos-bg)] border border-[color:var(--pos-border)] rounded-lg">
                          Enter
                        </kbd>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[var(--pos-muted)]">
                  <p>No results found for &quot;{query}&quot;</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[color:var(--pos-border)] bg-[var(--pos-bg)]">
              <div className="flex items-center gap-4 text-xs text-[var(--pos-muted)]">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[var(--pos-panel)] border border-[color:var(--pos-border)] rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-[var(--pos-panel)] border border-[color:var(--pos-border)] rounded">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[var(--pos-panel)] border border-[color:var(--pos-border)] rounded">↵</kbd>
                  Select
                </span>
              </div>
              <span className="text-xs text-[var(--pos-muted)]">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
