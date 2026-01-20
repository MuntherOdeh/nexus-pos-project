"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Ban,
  CheckCircle2,
  CreditCard,
  Send,
  ShoppingCart,
  Wallet,
  X,
  Plus,
  Minus,
  Search,
  Grid3X3,
  User,
  Percent,
  StickyNote,
  Trash2,
  LayoutGrid,
  Banknote,
  Clock,
  Receipt,
  Gift,
  Users,
  Package,
  Star,
  Heart,
  Coffee,
  UtensilsCrossed,
  ShoppingBag,
  Layers,
  DollarSign,
  ChevronsUpDown,
  Building2,
  Phone,
  Mail,
  Check,
  AlertCircle,
  Truck,
  Store,
  UserPlus,
  Printer,
  Pause,
  CircleDollarSign,
  ArrowLeft,
  Zap,
  // Product Icons
  Pizza,
  Sandwich,
  Soup,
  Salad,
  IceCream,
  Cake,
  Cookie,
  Croissant,
  Beer,
  Wine,
  Milk,
  Apple,
  Beef,
  Fish,
  Egg,
  Candy,
  Popcorn,
  Citrus,
  Cherry,
  Grape,
  Carrot,
  Wheat,
  CupSoda,
  GlassWater,
  Martini,
  Drumstick,
  Utensils,
  ChefHat,
  Flame,
  Snowflake,
  Leaf,
  Sparkles,
  Crown,
  Gem,
  CircleDot,
  Box,
  ListOrdered,
  PanelRightOpen,
  PanelRightClose,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/pos/format";

// ============================================================================
// TYPES
// ============================================================================

type Floor = {
  id: string;
  name: string;
  sortOrder: number;
  tables: Array<{
    id: string;
    name: string;
    capacity: number;
    x: number;
    y: number;
    width: number;
    height: number;
    shape: "RECT" | "ROUND";
  }>;
};

type CatalogProduct = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  categoryId: string | null;
  image?: string;
};

type CatalogCategory = {
  id: string;
  name: string;
  sortOrder: number;
  products: CatalogProduct[];
};

type OpenOrderSummary = {
  id: string;
  tableId: string | null;
  status: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
  openedAt: string;
};

type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  status: string;
  notes: string | null;
  discountPercent?: number;
};

type OrderPayment = {
  id: string;
  provider: string;
  status: string;
  amountCents: number;
};

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  points?: number;
};

type OrderDetail = {
  id: string;
  status: string;
  orderNumber: string;
  notes: string | null;
  subtotalCents: number;
  taxCents: number;
  discountCents?: number;
  totalCents: number;
  currency: string;
  openedAt: string;
  table: { id: string; name: string; capacity: number } | null;
  customer?: Customer | null;
  items: OrderItem[];
  payments: OrderPayment[];
};

type PayProvider = "CASH" | "CARD" | "BANK" | "PAYPAL";
type ViewMode = "floor" | "products" | "payment";
type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

type HeldOrder = {
  id: string;
  name: string;
  items: OrderItem[];
  customer?: Customer | null;
  orderType: OrderType;
  heldAt: string;
  totalCents: number;
};

type POSSession = {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  closingBalance?: number;
  cashierName: string;
  status: "OPEN" | "CLOSED";
  salesCount: number;
  totalSales: number;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const PAY_PROVIDERS: Array<{
  key: PayProvider;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  light: string;
}> = [
  { key: "CASH", label: "Cash", icon: Banknote, color: "text-primary-500", bgColor: "bg-primary-500", light: "bg-primary-500/10" },
  { key: "CARD", label: "Card", icon: CreditCard, color: "text-blue-500", bgColor: "bg-blue-500", light: "bg-blue-500/10" },
  { key: "BANK", label: "Bank Transfer", icon: Building2, color: "text-purple-500", bgColor: "bg-purple-500", light: "bg-purple-500/10" },
  { key: "PAYPAL", label: "Digital Wallet", icon: Wallet, color: "text-secondary-500", bgColor: "bg-secondary-500", light: "bg-secondary-500/10" },
];

const CATEGORY_COLORS = [
  { bg: "bg-primary-500", text: "text-primary-500", light: "bg-primary-500/10", border: "border-primary-500" },
  { bg: "bg-secondary-500", text: "text-secondary-500", light: "bg-secondary-500/10", border: "border-secondary-500" },
  { bg: "bg-rose-500", text: "text-rose-500", light: "bg-rose-500/10", border: "border-rose-500" },
  { bg: "bg-orange-500", text: "text-orange-500", light: "bg-orange-500/10", border: "border-orange-500" },
  { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-500/10", border: "border-amber-500" },
  { bg: "bg-cyan-500", text: "text-cyan-500", light: "bg-cyan-500/10", border: "border-cyan-500" },
  { bg: "bg-blue-500", text: "text-blue-500", light: "bg-blue-500/10", border: "border-blue-500" },
  { bg: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-500/10", border: "border-indigo-500" },
  { bg: "bg-violet-500", text: "text-violet-500", light: "bg-violet-500/10", border: "border-violet-500" },
  { bg: "bg-purple-500", text: "text-purple-500", light: "bg-purple-500/10", border: "border-purple-500" },
  { bg: "bg-fuchsia-500", text: "text-fuchsia-500", light: "bg-fuchsia-500/10", border: "border-fuchsia-500" },
  { bg: "bg-pink-500", text: "text-pink-500", light: "bg-pink-500/10", border: "border-pink-500" },
];

const CATEGORY_ICONS = [
  UtensilsCrossed, Coffee, ShoppingBag, Package, Gift, Star, Heart, Layers,
];

// Product Icons for different categories
type ProductIconItem = {
  name: string;
  icon: LucideIcon;
  category: "food" | "drinks" | "bakery" | "desserts" | "other";
};

const PRODUCT_ICONS: ProductIconItem[] = [
  // Food
  { name: "Pizza", icon: Pizza, category: "food" },
  { name: "Sandwich", icon: Sandwich, category: "food" },
  { name: "Soup", icon: Soup, category: "food" },
  { name: "Salad", icon: Salad, category: "food" },
  { name: "Beef", icon: Beef, category: "food" },
  { name: "Fish", icon: Fish, category: "food" },
  { name: "Drumstick", icon: Drumstick, category: "food" },
  { name: "Egg", icon: Egg, category: "food" },
  { name: "Carrot", icon: Carrot, category: "food" },
  { name: "Utensils", icon: Utensils, category: "food" },
  { name: "ChefHat", icon: ChefHat, category: "food" },
  { name: "Flame", icon: Flame, category: "food" },

  // Drinks
  { name: "Coffee", icon: Coffee, category: "drinks" },
  { name: "Beer", icon: Beer, category: "drinks" },
  { name: "Wine", icon: Wine, category: "drinks" },
  { name: "Milk", icon: Milk, category: "drinks" },
  { name: "CupSoda", icon: CupSoda, category: "drinks" },
  { name: "GlassWater", icon: GlassWater, category: "drinks" },
  { name: "Martini", icon: Martini, category: "drinks" },

  // Bakery
  { name: "Croissant", icon: Croissant, category: "bakery" },
  { name: "Cookie", icon: Cookie, category: "bakery" },
  { name: "Wheat", icon: Wheat, category: "bakery" },

  // Desserts & Fruits
  { name: "Cake", icon: Cake, category: "desserts" },
  { name: "IceCream", icon: IceCream, category: "desserts" },
  { name: "Candy", icon: Candy, category: "desserts" },
  { name: "Apple", icon: Apple, category: "desserts" },
  { name: "Cherry", icon: Cherry, category: "desserts" },
  { name: "Grape", icon: Grape, category: "desserts" },
  { name: "Citrus", icon: Citrus, category: "desserts" },
  { name: "Popcorn", icon: Popcorn, category: "desserts" },

  // Other
  { name: "Box", icon: Box, category: "other" },
  { name: "Package", icon: Package, category: "other" },
  { name: "Leaf", icon: Leaf, category: "other" },
  { name: "Snowflake", icon: Snowflake, category: "other" },
  { name: "Sparkles", icon: Sparkles, category: "other" },
  { name: "Crown", icon: Crown, category: "other" },
  { name: "Gem", icon: Gem, category: "other" },
  { name: "Star", icon: Star, category: "other" },
  { name: "CircleDot", icon: CircleDot, category: "other" },
];

// Get icon for a product based on name matching or explicit icon name
function getProductIcon(productName: string, explicitIcon?: string): LucideIcon | null {
  // If explicit icon is set, use that
  if (explicitIcon) {
    const found = PRODUCT_ICONS.find((i) => i.name === explicitIcon);
    if (found) return found.icon;
  }

  // Try to auto-detect from product name
  const nameLower = productName.toLowerCase();

  // Check for keywords
  if (nameLower.includes("pizza")) return Pizza;
  if (nameLower.includes("sandwich") || nameLower.includes("burger")) return Sandwich;
  if (nameLower.includes("soup")) return Soup;
  if (nameLower.includes("salad")) return Salad;
  if (nameLower.includes("steak") || nameLower.includes("beef")) return Beef;
  if (nameLower.includes("fish") || nameLower.includes("salmon") || nameLower.includes("seafood")) return Fish;
  if (nameLower.includes("chicken") || nameLower.includes("wing")) return Drumstick;
  if (nameLower.includes("egg") || nameLower.includes("omelette")) return Egg;
  if (nameLower.includes("coffee") || nameLower.includes("espresso") || nameLower.includes("latte") || nameLower.includes("cappuccino")) return Coffee;
  if (nameLower.includes("beer") || nameLower.includes("ale")) return Beer;
  if (nameLower.includes("wine")) return Wine;
  if (nameLower.includes("milk") || nameLower.includes("shake")) return Milk;
  if (nameLower.includes("soda") || nameLower.includes("cola") || nameLower.includes("juice")) return CupSoda;
  if (nameLower.includes("water")) return GlassWater;
  if (nameLower.includes("cocktail") || nameLower.includes("martini")) return Martini;
  if (nameLower.includes("croissant") || nameLower.includes("pastry")) return Croissant;
  if (nameLower.includes("cookie") || nameLower.includes("biscuit")) return Cookie;
  if (nameLower.includes("bread") || nameLower.includes("roll")) return Wheat;
  if (nameLower.includes("cake") || nameLower.includes("cheesecake")) return Cake;
  if (nameLower.includes("ice cream") || nameLower.includes("gelato") || nameLower.includes("sorbet")) return IceCream;
  if (nameLower.includes("candy") || nameLower.includes("chocolate") || nameLower.includes("sweet")) return Candy;
  if (nameLower.includes("apple")) return Apple;
  if (nameLower.includes("orange") || nameLower.includes("lemon") || nameLower.includes("lime")) return Citrus;
  if (nameLower.includes("popcorn")) return Popcorn;
  if (nameLower.includes("vegan") || nameLower.includes("veggie") || nameLower.includes("vegetarian")) return Leaf;
  if (nameLower.includes("cold") || nameLower.includes("frozen") || nameLower.includes("iced")) return Snowflake;
  if (nameLower.includes("special") || nameLower.includes("premium")) return Crown;
  if (nameLower.includes("hot") || nameLower.includes("spicy") || nameLower.includes("grill")) return Flame;

  return null;
}

function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

function getCategoryIcon(index: number) {
  return CATEGORY_ICONS[index % CATEGORY_ICONS.length];
}

// ============================================================================
// UTILITIES
// ============================================================================

function getTableStatus(status?: string | null): { bg: string; text: string; label: string; border: string } {
  switch (status) {
    case "IN_KITCHEN":
      return { bg: "bg-amber-500", text: "text-white", label: "Cooking", border: "border-amber-500" };
    case "READY":
      return { bg: "bg-primary-500", text: "text-white", label: "Ready", border: "border-primary-500" };
    case "FOR_PAYMENT":
      return { bg: "bg-blue-500", text: "text-white", label: "Bill", border: "border-blue-500" };
    case "OPEN":
      return { bg: "bg-secondary-500", text: "text-white", label: "Busy", border: "border-secondary-500" };
    default:
      return { bg: "bg-[var(--pos-bg2)]", text: "text-[var(--pos-text)]", label: "Available", border: "border-[color:var(--pos-border)]" };
  }
}

function safeParseMoneyToCents(input: string): number | null {
  const normalized = input.replace(/,/g, ".").trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ============================================================================
// NUMPAD COMPONENT (Odoo-style)
// ============================================================================

function Numpad({
  value,
  onChange,
  onEnter,
  mode = "amount",
}: {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  mode?: "amount" | "quantity" | "discount";
}) {
  const handleKey = (key: string) => {
    if (key === "C") {
      onChange("");
    } else if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (key === ".") {
      if (mode === "quantity") return;
      if (!value.includes(".")) {
        onChange(value + key);
      }
    } else if (key === "ENTER") {
      onEnter?.();
    } else if (key === "+/-") {
      if (value.startsWith("-")) {
        onChange(value.slice(1));
      } else if (value) {
        onChange("-" + value);
      }
    } else {
      onChange(value + key);
    }
  };

  const numKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [mode === "amount" ? "." : "+/-", "0", "⌫"],
  ];

  return (
    <div className="grid gap-2">
      {numKeys.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-3 gap-2">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className={cn(
                "h-12 rounded-xl font-bold text-lg transition-all active:scale-95",
                key === "⌫"
                  ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                  : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] hover:border-primary-500"
              )}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleKey("C")}
          className="h-12 rounded-xl font-bold text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => handleKey("ENTER")}
          className="h-12 rounded-xl font-bold text-sm bg-primary-500 text-white hover:bg-primary-600 transition-all active:scale-95"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK AMOUNT BUTTONS
// ============================================================================

function QuickAmountButtons({
  currency,
  onSelect,
}: {
  currency: string;
  onSelect: (cents: number) => void;
}) {
  const amounts = [500, 1000, 2000, 5000, 10000, 20000];

  return (
    <div className="grid grid-cols-3 gap-2">
      {amounts.map((cents) => (
        <button
          key={cents}
          type="button"
          onClick={() => onSelect(cents)}
          className="h-10 rounded-xl font-semibold text-xs bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:bg-primary-500/10 hover:border-primary-500 transition-all"
        >
          {formatMoney({ cents, currency })}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// ICON SELECTOR COMPONENT
// ============================================================================

const ICON_CATEGORIES = [
  { key: "food" as const, label: "Food", color: "bg-orange-500" },
  { key: "drinks" as const, label: "Drinks", color: "bg-blue-500" },
  { key: "bakery" as const, label: "Bakery", color: "bg-amber-500" },
  { key: "desserts" as const, label: "Desserts", color: "bg-pink-500" },
  { key: "other" as const, label: "Other", color: "bg-gray-500" },
];

function IconSelector({
  selectedIcon,
  onSelect,
}: {
  selectedIcon: string | null;
  onSelect: (iconName: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"food" | "drinks" | "bakery" | "desserts" | "other">("food");

  const SelectedIconComponent = selectedIcon
    ? PRODUCT_ICONS.find((i) => i.name === selectedIcon)?.icon
    : null;

  const filteredIcons = PRODUCT_ICONS.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--pos-muted)]">
        Item Icon (Optional)
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-3 rounded-xl border bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center gap-3 transition-colors",
            isOpen ? "border-primary-500" : "border-[color:var(--pos-border)]"
          )}
        >
          {SelectedIconComponent ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <SelectedIconComponent className="w-5 h-5 text-primary-500" />
              </div>
              <span className="font-medium">{selectedIcon}</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-[var(--pos-border)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--pos-muted)]" />
              </div>
              <span className="text-[var(--pos-muted)]">Choose an icon...</span>
            </>
          )}
          <ChevronsUpDown className="w-5 h-5 text-[var(--pos-muted)] ml-auto" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[var(--pos-panel-solid)] border border-[color:var(--pos-border)] shadow-xl z-10 overflow-hidden">
            {/* Category Tabs */}
            <div className="flex border-b border-[color:var(--pos-border)] overflow-x-auto">
              {ICON_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === cat.key
                      ? "bg-primary-500/10 text-primary-500 border-b-2 border-primary-500"
                      : "text-[var(--pos-muted)] hover:bg-[var(--pos-border)]"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Icons Grid */}
            <div className="p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelect(null);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-105",
                    !selectedIcon
                      ? "bg-primary-500 text-white"
                      : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-primary-500"
                  )}
                >
                  <Ban className="w-5 h-5" />
                  <span className="text-[10px]">None</span>
                </button>

                {filteredIcons.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        onSelect(item.name);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-105",
                        isSelected
                          ? "bg-primary-500 text-white"
                          : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-primary-500"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] truncate max-w-full px-1">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ADD CUSTOM PRODUCT MODAL
// ============================================================================

function AddCustomProductModal({
  isOpen,
  onClose,
  onAdd,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, priceCents: number, icon?: string) => void;
  currency: string;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setPrice("");
      setSelectedIcon(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-detect icon from product name
  const detectedIcon = getProductIcon(name);
  const displayIcon = selectedIcon
    ? PRODUCT_ICONS.find((i) => i.name === selectedIcon)?.icon
    : detectedIcon;

  const handleAdd = () => {
    const priceCents = safeParseMoneyToCents(price);
    if (!name.trim() || !priceCents || priceCents < 1) return;
    onAdd(name.trim(), priceCents, selectedIcon ?? undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-[color:var(--pos-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                displayIcon ? "bg-primary-500" : "bg-primary-500/10"
              )}>
                {displayIcon ? (
                  React.createElement(displayIcon, { className: "w-6 h-6 text-white" })
                ) : (
                  <Plus className="w-6 h-6 text-primary-500" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-lg">Add Custom Item</h2>
                <p className="text-sm text-[var(--pos-muted)]">Add an item not in catalog</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--pos-border)] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--pos-muted)]">
              Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name..."
              className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
              autoFocus
            />
            {detectedIcon && !selectedIcon && (
              <p className="text-xs text-primary-500 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Icon auto-detected based on name
              </p>
            )}
          </div>

          {/* Icon Selector */}
          <IconSelector selectedIcon={selectedIcon} onSelect={setSelectedIcon} />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--pos-muted)]">
              Price ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pos-muted)] font-medium">{currency}</span>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg text-right font-bold"
              />
            </div>
          </div>

          <Numpad value={price} onChange={setPrice} onEnter={handleAdd} />

          <button
            onClick={handleAdd}
            disabled={!name.trim() || !safeParseMoneyToCents(price)}
            className="w-full py-4 rounded-xl font-bold text-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {displayIcon ? (
              React.createElement(displayIcon, { className: "w-5 h-5" })
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CUSTOMER SELECTOR MODAL
// ============================================================================

function CustomerSelectorModal({
  isOpen,
  onClose,
  onSelect,
  onCreateNew,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer | null) => void;
  onCreateNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Customers would be fetched from API in real app

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [customers, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-5 border-b border-[color:var(--pos-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Select Customer</h2>
              <p className="text-sm text-[var(--pos-muted)]">Choose a customer or continue as guest</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--pos-border)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-[color:var(--pos-border)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className="p-4 rounded-xl border-2 border-dashed border-[color:var(--pos-border)] hover:border-primary-500 hover:bg-primary-500/5 transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--pos-bg)] flex items-center justify-center">
                <User className="w-6 h-6 text-[var(--pos-muted)]" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Guest</div>
                <div className="text-sm text-[var(--pos-muted)]">No customer info</div>
              </div>
            </button>

            <button
              onClick={onCreateNew}
              className="p-4 rounded-xl bg-primary-500/10 border-2 border-primary-500/30 hover:bg-primary-500/20 transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-primary-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-primary-500">New Customer</div>
                <div className="text-sm text-[var(--pos-muted)]">Create new</div>
              </div>
            </button>
          </div>

          {filteredCustomers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-[var(--pos-muted)] px-1 mb-2">Recent Customers</p>
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    onSelect(customer);
                    onClose();
                  }}
                  className="w-full p-4 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-primary-500 hover:bg-primary-500/5 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-500">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{customer.name}</div>
                    <div className="flex items-center gap-4 text-sm text-[var(--pos-muted)]">
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  {customer.points !== undefined && customer.points > 0 && (
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {customer.points}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : search ? (
            <div className="text-center py-8 text-[var(--pos-muted)]">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No customers found matching &ldquo;{search}&rdquo;</p>
              <button
                onClick={onCreateNew}
                className="mt-4 px-6 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
              >
                Create New Customer
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--pos-muted)]">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No customers yet</p>
              <p className="text-sm mt-1">Add customers to build your database</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE CUSTOMER MODAL
// ============================================================================

function CreateCustomerModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setEmail("");
      setPhone("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: `customer-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      points: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[color:var(--pos-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h2 className="font-bold text-lg">New Customer</h2>
                <p className="text-sm text-[var(--pos-muted)]">Add customer details</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--pos-border)]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--pos-muted)]">
              Name *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer name"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--pos-muted)]">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--pos-muted)]">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              Save Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DISCOUNT MODAL
// ============================================================================

function DiscountModal({
  isOpen,
  onClose,
  onApply,
  currentDiscount,
  itemName,
  maxAmount,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (type: "percent" | "amount", value: number) => void;
  currentDiscount?: number;
  itemName?: string;
  maxAmount: number;
  currency: string;
}) {
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState(currentDiscount?.toString() || "");

  if (!isOpen) return null;

  const handleApply = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    if (discountType === "percent" && numValue > 100) return;
    if (discountType === "amount" && numValue * 100 > maxAmount) return;
    onApply(discountType, discountType === "percent" ? numValue : numValue * 100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[color:var(--pos-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Discount</h2>
                {itemName && <p className="text-sm text-[var(--pos-muted)]">{itemName}</p>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--pos-border)]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDiscountType("percent")}
              className={cn(
                "p-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                discountType === "percent"
                  ? "bg-primary-500 text-white"
                  : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)]"
              )}
            >
              <Percent className="w-5 h-5" />
              Percentage
            </button>
            <button
              onClick={() => setDiscountType("amount")}
              className={cn(
                "p-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                discountType === "amount"
                  ? "bg-primary-500 text-white"
                  : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)]"
              )}
            >
              <DollarSign className="w-5 h-5" />
              Fixed
            </button>
          </div>

          <div className="rounded-xl border border-[color:var(--pos-border)] p-4">
            <div className="text-sm text-[var(--pos-muted)] mb-2">
              {discountType === "percent" ? "Discount %" : `Discount (${currency})`}
            </div>
            <div className="text-4xl font-bold text-center text-amber-500">
              {discountType === "percent" ? `${value || "0"}%` : formatMoney({ cents: (parseFloat(value) || 0) * 100, currency })}
            </div>
          </div>

          <Numpad
            value={value}
            onChange={setValue}
            onEnter={handleApply}
            mode={discountType === "percent" ? "discount" : "amount"}
          />

          <div className="grid grid-cols-5 gap-2">
            {[5, 10, 15, 20, 25].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  setDiscountType("percent");
                  setValue(pct.toString());
                }}
                className={cn(
                  "py-3 rounded-xl font-medium transition-all",
                  discountType === "percent" && parseFloat(value) === pct
                    ? "bg-amber-500 text-white"
                    : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-amber-500"
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NOTE MODAL
// ============================================================================

function NoteModal({
  isOpen,
  onClose,
  onSave,
  currentNote,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  currentNote?: string | null;
  title: string;
}) {
  const [note, setNote] = useState(currentNote || "");

  useEffect(() => {
    if (isOpen) setNote(currentNote || "");
  }, [isOpen, currentNote]);

  if (!isOpen) return null;

  const quickNotes = [
    "No ice", "Extra spicy", "No sugar", "Less salt", "Well done",
    "Medium rare", "Allergies", "To go", "No onions", "Gluten free",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[color:var(--pos-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="font-bold text-lg">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--pos-border)]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your note here..."
            className="w-full h-32 p-4 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-lg"
            autoFocus
          />

          <div className="flex flex-wrap gap-2">
            {quickNotes.map((qn) => (
              <button
                key={qn}
                onClick={() => setNote((prev) => (prev ? prev + ", " + qn : qn))}
                className="px-3 py-2 rounded-lg text-sm bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-primary-500 transition-all"
              >
                {qn}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setNote("")}
              className="flex-1 py-3 rounded-xl font-medium bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)]"
            >
              Clear
            </button>
            <button
              onClick={() => {
                onSave(note);
                onClose();
              }}
              className="flex-1 py-3 rounded-xl font-medium bg-primary-500 text-white hover:bg-primary-600"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAYMENT MODAL (ODOO-STYLE)
// ============================================================================

function PaymentModal({
  isOpen,
  onClose,
  totalCents,
  paidCents,
  currency,
  onPay,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  totalCents: number;
  paidCents: number;
  currency: string;
  onPay: (provider: PayProvider, amountCents: number) => void;
  onComplete: () => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<PayProvider>("CASH");
  const [amount, setAmount] = useState("");
  const remainingCents = totalCents - paidCents;

  useEffect(() => {
    if (isOpen) {
      setAmount((remainingCents / 100).toFixed(2));
    }
  }, [isOpen, remainingCents]);

  if (!isOpen) return null;

  const handlePay = () => {
    const cents = safeParseMoneyToCents(amount);
    if (!cents || cents < 1) return;
    onPay(selectedProvider, cents);
  };

  const enteredCents = safeParseMoneyToCents(amount) || 0;
  const changeDue = selectedProvider === "CASH" ? Math.max(0, enteredCents - remainingCents) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[color:var(--pos-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <CircleDollarSign className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h2 className="font-bold text-xl">Payment</h2>
                <p className="text-sm text-[var(--pos-muted)]">
                  {paidCents > 0
                    ? `${formatMoney({ cents: paidCents, currency })} paid - ${formatMoney({ cents: remainingCents, currency })} remaining`
                    : `Total: ${formatMoney({ cents: totalCents, currency })}`
                  }
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--pos-border)]">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-6">
            {/* Left side - Amount and Numpad */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 p-6 text-white">
                <div className="text-sm opacity-80 mb-1">Amount to Pay</div>
                <div className="text-4xl font-bold">
                  {currency} {amount || "0.00"}
                </div>
                {selectedProvider === "CASH" && changeDue > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="text-sm opacity-80">Change Due</div>
                    <div className="text-2xl font-bold">{formatMoney({ cents: changeDue, currency })}</div>
                  </div>
                )}
              </div>

              <QuickAmountButtons currency={currency} onSelect={(cents) => setAmount((cents / 100).toFixed(2))} />

              <Numpad value={amount} onChange={setAmount} onEnter={handlePay} />
            </div>

            {/* Right side - Payment methods */}
            <div className="space-y-4">
              <div className="font-medium text-[var(--pos-muted)] text-sm uppercase tracking-wide">
                Payment Method
              </div>
              <div className="space-y-2">
                {PAY_PROVIDERS.map((provider) => {
                  const Icon = provider.icon;
                  const isSelected = selectedProvider === provider.key;
                  return (
                    <button
                      key={provider.key}
                      onClick={() => setSelectedProvider(provider.key)}
                      className={cn(
                        "w-full p-4 rounded-xl flex items-center gap-4 transition-all",
                        isSelected
                          ? `${provider.bgColor} text-white shadow-lg`
                          : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-primary-500"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        isSelected ? "bg-white/20" : provider.light
                      )}>
                        <Icon className={cn("w-6 h-6", isSelected ? "text-white" : provider.color)} />
                      </div>
                      <span className="font-semibold text-lg">{provider.label}</span>
                      {isSelected && <Check className="w-6 h-6 ml-auto" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handlePay}
                disabled={!enteredCents || enteredCents < 1}
                className="w-full py-5 rounded-xl font-bold text-xl bg-primary-500 text-white hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
              >
                <CheckCircle2 className="w-7 h-7" />
                Validate Payment
              </button>

              {paidCents > 0 && (
                <div className="rounded-xl bg-primary-500/10 p-4">
                  <div className="flex items-center gap-2 text-primary-500 font-medium mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Payment Received
                  </div>
                  <div className="text-sm text-[var(--pos-muted)]">
                    {formatMoney({ cents: paidCents, currency })} of {formatMoney({ cents: totalCents, currency })} paid
                  </div>
                  <div className="w-full bg-[var(--pos-bg)] rounded-full h-2 mt-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${(paidCents / totalCents) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RECEIPT PREVIEW MODAL
// ============================================================================

function ReceiptPreviewModal({
  isOpen,
  onClose,
  order,
  tenantName,
  onPrint,
  onNewOrder,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetail | null;
  tenantName: string;
  onPrint: () => void;
  onNewOrder: () => void;
}) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[color:var(--pos-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-500" />
            </div>
            <h2 className="font-bold text-lg">Payment Complete!</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--pos-border)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt */}
        <div className="p-6 bg-white text-black font-mono text-sm">
          <div className="text-center mb-4">
            <div className="text-lg font-bold">{tenantName}</div>
            <div className="text-xs text-gray-500">Thank you for your visit!</div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Order #{order.orderNumber.slice(-6)}</span>
            <span suppressHydrationWarning>{new Date(order.openedAt).toLocaleString()}</span>
          </div>

          {order.table && (
            <div className="text-xs text-gray-500 mb-2">
              Table: {order.table.name}
            </div>
          )}

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Items */}
          <div className="space-y-2">
            {order.items.filter(i => i.status !== "VOID").map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <span>{item.quantity}x </span>
                  <span>{item.productName}</span>
                </div>
                <span>{formatMoney({ cents: item.unitPriceCents * item.quantity, currency: order.currency })}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney({ cents: order.subtotalCents, currency: order.currency })}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatMoney({ cents: order.taxCents, currency: order.currency })}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-300">
              <span>TOTAL</span>
              <span>{formatMoney({ cents: order.totalCents, currency: order.currency })}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="text-center text-xs text-gray-500">
            <div>Thank you!</div>
            <div className="mt-1">Please come again</div>
          </div>
        </div>

        <div className="p-4 border-t border-[color:var(--pos-border)] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onPrint}
              className="py-3 rounded-xl font-medium bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => {
                // Would send via email
              }}
              className="py-3 rounded-xl font-medium bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
          <button
            onClick={onNewOrder}
            className="w-full py-4 rounded-xl font-bold bg-primary-500 text-white hover:bg-primary-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELD ORDERS PANEL
// ============================================================================

function HeldOrdersPanel({
  isOpen,
  onClose,
  heldOrders,
  currency,
  onRecall,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  currency: string;
  onRecall: (order: HeldOrder) => void;
  onDelete: (id: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4">
      <div className="w-full sm:w-96 h-[80vh] sm:h-full sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-5 border-b border-[color:var(--pos-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Pause className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Held Orders</h2>
                <p className="text-sm text-[var(--pos-muted)]">{heldOrders.length} orders on hold</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--pos-border)]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {heldOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--pos-muted)]">
              <Pause className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Held Orders</p>
              <p className="text-sm mt-1">Orders you put on hold will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {heldOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{order.name}</div>
                    <span className="text-xs text-[var(--pos-muted)]" suppressHydrationWarning>
                      {formatTime(order.heldAt)}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--pos-muted)] mb-3">
                    {order.items.length} items - {formatMoney({ cents: order.totalCents, currency })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRecall(order)}
                      className="flex-1 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 text-sm"
                    >
                      Recall
                    </button>
                    <button
                      onClick={() => onDelete(order.id)}
                      className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTIVE ORDERS PANEL - Shows all active orders across the restaurant
// ============================================================================

function ActiveOrdersPanel({
  isOpen,
  onClose,
  openOrders,
  activeOrderId,
  currency,
  onSelectOrder,
}: {
  isOpen: boolean;
  onClose: () => void;
  openOrders: OpenOrderSummary[];
  activeOrderId: string | null;
  currency: string;
  onSelectOrder: (orderId: string, tableId: string | null) => void;
}) {
  if (!isOpen) return null;

  // Group orders by status
  const inKitchenOrders = openOrders.filter(o => o.status === "IN_KITCHEN");
  const readyOrders = openOrders.filter(o => o.status === "READY");
  const forPaymentOrders = openOrders.filter(o => o.status === "FOR_PAYMENT");
  const openOrdersList = openOrders.filter(o => o.status === "OPEN");

  const orderGroups = [
    { title: "Ready to Serve", orders: readyOrders, color: "bg-primary-500", icon: CheckCircle2 },
    { title: "For Payment", orders: forPaymentOrders, color: "bg-blue-500", icon: CreditCard },
    { title: "In Kitchen", orders: inKitchenOrders, color: "bg-amber-500", icon: Clock },
    { title: "New Orders", orders: openOrdersList, color: "bg-secondary-500", icon: ShoppingCart },
  ].filter(g => g.orders.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4">
      <div className="w-full sm:w-[450px] h-[85vh] sm:h-full sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-5 border-b border-[color:var(--pos-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
                <ListOrdered className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Active Orders</h2>
                <p className="text-sm text-[var(--pos-muted)]">{openOrders.length} orders in progress</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--pos-border)]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {openOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--pos-muted)]">
              <ListOrdered className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Active Orders</p>
              <p className="text-sm mt-1">Start a new order to see it here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orderGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.title}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", group.color)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-sm">{group.title}</span>
                      <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--pos-bg)]">
                        {group.orders.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.orders.map((order) => {
                        const isActive = order.id === activeOrderId;
                        return (
                          <button
                            key={order.id}
                            onClick={() => onSelectOrder(order.id, order.tableId)}
                            className={cn(
                              "w-full p-4 rounded-xl text-left transition-all",
                              isActive
                                ? "bg-primary-500 text-white shadow-lg"
                                : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-primary-500"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">
                                {order.tableId ? `Table Order` : "Quick Sale"}
                              </span>
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                isActive ? "bg-white/20" : "bg-[var(--pos-border)]"
                              )}>
                                #{order.orderNumber.slice(-6)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={cn("text-sm", isActive ? "text-white/80" : "text-[var(--pos-muted)]")} suppressHydrationWarning>
                                {formatTime(order.openedAt)}
                              </span>
                              <span className="font-bold">
                                {formatMoney({ cents: order.totalCents, currency })}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="p-4 border-t border-[color:var(--pos-border)] bg-[var(--pos-bg2)]">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[var(--pos-panel-solid)]">
              <div className="text-lg font-bold text-primary-500">{readyOrders.length}</div>
              <div className="text-xs text-[var(--pos-muted)]">Ready</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--pos-panel-solid)]">
              <div className="text-lg font-bold text-blue-500">{forPaymentOrders.length}</div>
              <div className="text-xs text-[var(--pos-muted)]">Payment</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--pos-panel-solid)]">
              <div className="text-lg font-bold text-amber-500">{inKitchenOrders.length}</div>
              <div className="text-xs text-[var(--pos-muted)]">Kitchen</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--pos-panel-solid)]">
              <div className="text-lg font-bold text-secondary-500">{openOrdersList.length}</div>
              <div className="text-xs text-[var(--pos-muted)]">New</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ORDER TYPE SELECTOR
// ============================================================================

const ORDER_TYPES: Array<{
  key: OrderType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = [
  { key: "DINE_IN", label: "Dine In", icon: UtensilsCrossed, color: "text-primary-500", bgColor: "bg-primary-500" },
  { key: "TAKEAWAY", label: "Takeaway", icon: ShoppingBag, color: "text-amber-500", bgColor: "bg-amber-500" },
  { key: "DELIVERY", label: "Delivery", icon: Truck, color: "text-blue-500", bgColor: "bg-blue-500" },
];

function OrderTypeSelector({
  selected,
  onChange,
  disabled,
}: {
  selected: OrderType;
  onChange: (type: OrderType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--pos-bg)] rounded-xl">
      {ORDER_TYPES.map((type) => {
        const Icon = type.icon;
        const isSelected = selected === type.key;
        return (
          <button
            key={type.key}
            onClick={() => onChange(type.key)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              isSelected
                ? `${type.bgColor} text-white`
                : "hover:bg-[var(--pos-border)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// ORDER LINE ITEM
// ============================================================================

function OrderLineItem({
  item,
  currency,
  isSelected,
  onSelect,
  onQuantityChange,
  onDelete,
  onDiscount,
  onNote,
  editable,
  busy,
}: {
  item: OrderItem;
  currency: string;
  isSelected: boolean;
  onSelect: () => void;
  onQuantityChange: (delta: number) => void;
  onDelete: () => void;
  onDiscount: () => void;
  onNote: () => void;
  editable: boolean;
  busy: boolean;
}) {
  const lineTotal = item.unitPriceCents * item.quantity;
  const discountAmount = item.discountPercent ? Math.round(lineTotal * item.discountPercent / 100) : 0;
  const finalTotal = lineTotal - discountAmount;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 cursor-pointer transition-all border-l-4",
        isSelected
          ? "bg-primary-500/10 border-l-primary-500"
          : "border-l-transparent hover:bg-[var(--pos-bg)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] mb-1">{item.productName}</div>
          <div className="flex items-center gap-2 text-sm text-[var(--pos-muted)]">
            <span>{formatMoney({ cents: item.unitPriceCents, currency })} x {item.quantity}</span>
            {item.discountPercent && item.discountPercent > 0 && (
              <span className="text-amber-500 font-medium">-{item.discountPercent}%</span>
            )}
          </div>
          {item.notes && (
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-500">
              <StickyNote className="w-3 h-3" />
              {item.notes}
            </div>
          )}
        </div>
        <div className="text-right">
          {discountAmount > 0 && (
            <div className="text-xs text-[var(--pos-muted)] line-through">
              {formatMoney({ cents: lineTotal, currency })}
            </div>
          )}
          <div className="font-bold text-[15px]">
            {formatMoney({ cents: finalTotal, currency })}
          </div>
        </div>
      </div>

      {/* Actions when selected */}
      {isSelected && editable && (
        <div className="mt-3 pt-3 border-t border-[color:var(--pos-border)] flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); onQuantityChange(-1); }}
              disabled={busy}
              className="p-2.5 hover:bg-[var(--pos-border)] disabled:opacity-40 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="px-4 font-bold text-sm min-w-[48px] text-center">{item.quantity}</div>
            <button
              onClick={(e) => { e.stopPropagation(); onQuantityChange(1); }}
              disabled={busy}
              className="p-2.5 hover:bg-[var(--pos-border)] disabled:opacity-40 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onDiscount(); }}
            className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
            title="Discount"
          >
            <Percent className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onNote(); }}
            className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
            title="Note"
          >
            <StickyNote className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={busy}
            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-40 ml-auto"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PRODUCT CARD
// ============================================================================

function ProductCard({
  product,
  categoryColor,
  onClick,
  disabled,
  isBusy,
}: {
  product: CatalogProduct;
  categoryColor: { bg: string; text: string; light: string; border: string };
  onClick: () => void;
  disabled: boolean;
  isBusy?: boolean;
}) {
  const ProductIcon = getProductIcon(product.name);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl p-4 text-left transition-all shadow-md",
        categoryColor.bg,
        "text-white relative overflow-hidden",
        disabled && !isBusy && "opacity-60 cursor-not-allowed grayscale-[30%]",
        isBusy && "opacity-70 cursor-wait animate-pulse",
        !disabled && "hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-white/10" />

      {/* Product Icon */}
      {ProductIcon && (
        <div className="absolute top-3 right-3 opacity-30">
          <ProductIcon className="w-10 h-10" />
        </div>
      )}

      <div className="relative">
        {/* Icon badge */}
        {ProductIcon && (
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
            <ProductIcon className="w-5 h-5" />
          </div>
        )}
        <div className="font-semibold text-sm line-clamp-2 mb-3 min-h-[40px]">
          {product.name}
        </div>
        <div className="text-xl font-bold">
          {formatMoney({ cents: product.priceCents, currency: product.currency })}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// EMPTY PRODUCT STATE
// ============================================================================

function EmptyProductState({
  onAddProduct,
  tenantSlug,
  onSampleLoaded,
}: {
  onAddProduct: () => void;
  tenantSlug: string;
  onSampleLoaded: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadSuccess, setLoadSuccess] = useState<string | null>(null);

  const loadAllSampleData = async () => {
    setLoading("all");
    setLoadError(null);
    setLoadSuccess(null);
    try {
      // Load products first
      const productsRes = await fetch(`/api/pos/tenants/${tenantSlug}/products/sample`, {
        method: "POST",
      });
      const productsData = await productsRes.json();

      // Load tables
      const tablesRes = await fetch(`/api/pos/tenants/${tenantSlug}/tables/sample`, {
        method: "POST",
      });
      const tablesData = await tablesRes.json();

      // Load orders (needs products)
      const ordersRes = await fetch(`/api/pos/tenants/${tenantSlug}/orders/sample`, {
        method: "POST",
      });
      const ordersData = await ordersRes.json();

      const messages = [];
      if (productsData.success) messages.push(`${productsData.productsCreated || "sample"} products`);
      if (tablesData.success) messages.push(`${tablesData.tablesCreated} tables`);
      if (ordersData.success) messages.push(`${ordersData.ordersCreated} orders`);

      if (messages.length > 0) {
        setLoadSuccess(`Loaded ${messages.join(", ")}`);
        setTimeout(() => onSampleLoaded(), 1000);
      } else {
        setLoadError("Sample data may already exist");
      }
    } catch {
      setLoadError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const loadSampleProducts = async () => {
    setLoading("products");
    setLoadError(null);
    setLoadSuccess(null);
    try {
      const response = await fetch(`/api/pos/tenants/${tenantSlug}/products/sample`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLoadSuccess(`Loaded ${data.productsCreated || "sample"} products`);
        setTimeout(() => onSampleLoaded(), 1000);
      } else {
        setLoadError(data.error || "Failed to load sample products");
      }
    } catch {
      setLoadError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6 border border-[var(--pos-border)]">
        <div className="w-20 h-20 rounded-2xl bg-[var(--pos-panel)] flex items-center justify-center shadow-lg">
          <Package className="w-10 h-10 text-amber-500" />
        </div>
      </div>
      <h3 className="font-bold text-2xl mb-2">No Products Yet</h3>
      <p className="text-[var(--pos-muted)] max-w-md mb-8">
        Load sample data to explore the POS, or create products manually.
      </p>

      {loadError && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {loadError}
        </div>
      )}

      {loadSuccess && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
          {loadSuccess}
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={loadAllSampleData}
          disabled={loading !== null}
          className="px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
        >
          {loading === "all" ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Load All Sample Data
            </>
          )}
        </button>
        <div className="flex gap-3">
          <button
            onClick={loadSampleProducts}
            disabled={loading !== null}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-panel)] text-[var(--pos-text)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pos-bg)] transition-colors disabled:opacity-50"
          >
            {loading === "products" ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Products Only
          </button>
          <button
            onClick={onAddProduct}
            disabled={loading !== null}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-panel)] text-[var(--pos-text)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pos-bg)] transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CHECKOUT VIEW
// ============================================================================

export function CheckoutView({
  tenant,
  floors,
  catalog,
  initialOpenOrders,
}: {
  tenant: { id: string; slug: string; name: string; currency: string; industry: string };
  floors: Floor[];
  catalog: { categories: CatalogCategory[]; uncategorized: CatalogProduct[] };
  initialOpenOrders: OpenOrderSummary[];
}) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("floor");
  const [activeFloorId, setActiveFloorId] = useState<string>(() => floors[0]?.id ?? "");
  const [activeOrder, setActiveOrder] = useState<OrderDetail | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrderSummary[]>(initialOpenOrders);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [menuQuery, setMenuQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Modal states
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [createCustomerModalOpen, setCreateCustomerModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [heldOrdersOpen, setHeldOrdersOpen] = useState(false);
  const [addCustomProductOpen, setAddCustomProductOpen] = useState(false);
  const [activeOrdersOpen, setActiveOrdersOpen] = useState(false);
  const [discountTarget, setDiscountTarget] = useState<"order" | "item">("order");
  const [noteTarget, setNoteTarget] = useState<"order" | "item">("order");

  // Order state
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Computed values
  const activeFloor = useMemo(
    () => floors.find((f) => f.id === activeFloorId) ?? floors[0],
    [floors, activeFloorId]
  );

  const openOrderByTable = useMemo(() => {
    const map = new Map<string, OpenOrderSummary>();
    for (const order of openOrders) {
      if (order.tableId) map.set(order.tableId, order);
    }
    return map;
  }, [openOrders]);

  const paidCents = useMemo(() => {
    if (!activeOrder) return 0;
    return (activeOrder.payments || [])
      .filter((p) => p.status === "CAPTURED")
      .reduce((sum, p) => sum + p.amountCents, 0);
  }, [activeOrder]);

  const outstandingCents = useMemo(() => {
    if (!activeOrder) return 0;
    return Math.max(0, activeOrder.totalCents - paidCents);
  }, [activeOrder, paidCents]);

  const canSendToKitchen = useMemo(() => {
    if (!activeOrder) return false;
    return activeOrder.items.some((i) => i.status === "NEW") && activeOrder.items.some((i) => i.status !== "VOID");
  }, [activeOrder]);

  const canPay = useMemo(() => {
    if (!activeOrder) return false;
    if (activeOrder.status === "PAID" || activeOrder.status === "CANCELLED") return false;
    return outstandingCents > 0;
  }, [activeOrder, outstandingCents]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId || !activeOrder) return null;
    return activeOrder.items.find((i) => i.id === selectedItemId) ?? null;
  }, [selectedItemId, activeOrder]);

  const filteredProducts = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    let products: CatalogProduct[] = [];

    if (activeCategoryId) {
      const category = catalog.categories.find((c) => c.id === activeCategoryId);
      products = category?.products ?? [];
    } else {
      products = [
        ...catalog.categories.flatMap((c) => c.products),
        ...catalog.uncategorized,
      ];
    }

    if (q) {
      products = products.filter((p) => p.name.toLowerCase().includes(q));
    }

    return products;
  }, [catalog, menuQuery, activeCategoryId]);

  const hasProducts = catalog.categories.some(c => c.products.length > 0) || catalog.uncategorized.length > 0;

  // API functions
  const refreshOpenOrders = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/pos/tenants/${tenant.slug}/orders?statusIn=OPEN,IN_KITCHEN,READY,FOR_PAYMENT`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.orders)) {
        setOpenOrders(data.orders);
      }
    } catch {
      // Ignore polling failures
    }
  }, [tenant.slug]);

  const refreshOrder = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${orderId}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data?.success && data?.order?.id === orderId) {
        setActiveOrder(data.order);
      }
    } catch {
      // Ignore polling failures
    }
  }, [tenant.slug]);

  useEffect(() => {
    let mounted = true;
    const orderId = activeOrder?.id;
    const tick = async () => {
      if (!mounted) return;
      await refreshOpenOrders();
      if (orderId) await refreshOrder(orderId);
    };

    tick();
    const interval = window.setInterval(tick, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [activeOrder?.id, refreshOpenOrders, refreshOrder]);

  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Escape") {
        if (paymentModalOpen) setPaymentModalOpen(false);
        else if (discountModalOpen) setDiscountModalOpen(false);
        else if (noteModalOpen) setNoteModalOpen(false);
        else if (customerModalOpen) setCustomerModalOpen(false);
        else if (viewMode === "products") closeOrder();
      }

      if (e.key === "/" && !paymentModalOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key === "p" && e.ctrlKey && canPay) {
        e.preventDefault();
        setPaymentModalOpen(true);
      }

      if (e.key === "k" && e.ctrlKey && canSendToKitchen) {
        e.preventDefault();
        sendToKitchen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, paymentModalOpen, discountModalOpen, noteModalOpen, customerModalOpen, canPay, canSendToKitchen]);

  // Order operations
  const openTable = async (tableId: string) => {
    setError(null);
    setToast(null);
    setBusyKey(`table:${tableId}`);

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to open table");
        return;
      }

      const id: string | undefined = data?.order?.id || data?.orderId;
      if (!id) {
        setError("Unable to open order");
        return;
      }

      if (data?.order) setActiveOrder(data.order);
      else await refreshOrder(id);

      setViewMode("products");
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const startQuickSale = async () => {
    setError(null);
    setToast(null);
    setBusyKey("quick-sale");

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: null }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.order?.id) {
        setError(data?.error || "Unable to start quick sale");
        return;
      }
      setActiveOrder(data.order);
      setViewMode("products");
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const selectExistingOrder = async (orderId: string) => {
    setError(null);
    setBusyKey(`select:${orderId}`);
    try {
      await refreshOrder(orderId);
      setViewMode("products");
      setActiveOrdersOpen(false);
    } finally {
      setBusyKey(null);
    }
  };
  const addProduct = async (productId: string) => {
    if (!activeOrder?.id) {
      setError("Select a table or start a quick sale first.");
      return;
    }

    // Find product name for toast feedback
    const productName = catalog.categories
      .flatMap(c => c.products)
      .concat(catalog.uncategorized)
      .find(p => p.id === productId)?.name || "Item";

    setError(null);
    setBusyKey(`add:${productId}`);
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to add item");
        return;
      }
      setActiveOrder(data.order);
      setToast(`Added: ${productName}`);
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const addCustomProduct = async (name: string, priceCents: number) => {
    if (!activeOrder?.id) {
      setError("Select a table or start a quick sale first.");
      return;
    }

    setError(null);
    setBusyKey("add-custom");
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: name, unitPriceCents: priceCents, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to add custom item");
        return;
      }
      setActiveOrder(data.order);
      setToast(`Added: ${name}`);
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const patchItem = async (itemId: string, patch: Record<string, unknown>) => {
    if (!activeOrder?.id) return;
    setBusyKey(`item:${itemId}`);
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to update item");
        return;
      }
      setActiveOrder(data.order);
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const sendToKitchen = async () => {
    if (!activeOrder?.id) return;
    setError(null);
    setBusyKey("send");

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/send`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to send to kitchen");
        return;
      }
      setActiveOrder(data.order);
      setToast("Order sent to kitchen!");
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const cancelOrder = async () => {
    if (!activeOrder?.id) return;
    setError(null);
    setBusyKey("cancel");

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/cancel`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to cancel order");
        return;
      }
      setActiveOrder(null);
      setViewMode("floor");
      setToast("Order cancelled");
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const holdOrder = () => {
    if (!activeOrder || activeOrder.items.filter(i => i.status !== "VOID").length === 0) return;

    const held: HeldOrder = {
      id: generateOrderId(),
      name: activeOrder.table ? `Table ${activeOrder.table.name}` : `Order #${activeOrder.orderNumber.slice(-4)}`,
      items: activeOrder.items.filter(i => i.status !== "VOID"),
      customer: activeOrder.customer,
      orderType,
      heldAt: new Date().toISOString(),
      totalCents: activeOrder.totalCents,
    };

    setHeldOrders(prev => [...prev, held]);
    setActiveOrder(null);
    setViewMode("floor");
    setToast("Order held");
  };

  const recallOrder = (held: HeldOrder) => {
    // In a real app, this would restore the order
    setHeldOrders(prev => prev.filter(o => o.id !== held.id));
    setToast(`Recalled: ${held.name}`);
    setHeldOrdersOpen(false);
  };

  const closeOrder = () => {
    setActiveOrder(null);
    setSelectedItemId(null);
    setViewMode("floor");
    setMenuQuery("");
    setActiveCategoryId(null);
  };

  const handlePayment = async (provider: PayProvider, amountCents: number) => {
    if (!activeOrder?.id || !canPay) return;
    setError(null);
    setBusyKey("pay");

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, amountCents }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.order) {
        setError(data?.error || "Payment failed");
        return;
      }

      setActiveOrder(data.order);
      const changeDueCents = typeof data.changeDueCents === "number" ? data.changeDueCents : 0;

      if (data.order.status === "PAID") {
        setPaymentModalOpen(false);
        setReceiptModalOpen(true);
        setToast(
          changeDueCents > 0
            ? `Payment complete! Change: ${formatMoney({ cents: changeDueCents, currency: data.order.currency })}`
            : "Payment complete!"
        );
      } else {
        setToast(
          changeDueCents > 0
            ? `Partial payment! Change: ${formatMoney({ cents: changeDueCents, currency: data.order.currency })}`
            : "Partial payment received"
        );
      }
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const loadSampleData = async () => {
    setBusyKey("load-sample");
    setError(null);

    try {
      // Load sample products
      const productsRes = await fetch(`/api/pos/tenants/${tenant.slug}/products/sample`, {
        method: "POST",
      });
      if (!productsRes.ok) {
        throw new Error("Failed to load sample products");
      }

      // Load sample tables
      const tablesRes = await fetch(`/api/pos/tenants/${tenant.slug}/tables/sample`, {
        method: "POST",
      });
      if (!tablesRes.ok) {
        throw new Error("Failed to load sample tables");
      }

      // Load sample orders
      const ordersRes = await fetch(`/api/pos/tenants/${tenant.slug}/orders/sample`, {
        method: "POST",
      });
      if (!ordersRes.ok) {
        throw new Error("Failed to load sample orders");
      }

      setToast("Sample data loaded! Refreshing...");

      // Refresh the page to reload all data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sample data");
    } finally {
      setBusyKey(null);
    }
  };

  const getItemTotal = (item: OrderItem) => item.unitPriceCents * item.quantity;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl bg-primary-500 text-white font-medium shadow-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {toast}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl bg-red-500 text-white font-medium shadow-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* ================================================================ */}
        {/* LEFT SIDE - Categories Sidebar (Odoo style) */}
        {/* ================================================================ */}
        {viewMode === "products" && (
          <div className="w-20 flex-shrink-0 bg-[var(--pos-panel-solid)] border-r border-[color:var(--pos-border)] flex flex-col py-3 overflow-y-auto">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={cn(
                "mx-2 mb-2 p-3 rounded-xl flex flex-col items-center gap-1 transition-all",
                !activeCategoryId
                  ? "bg-primary-500 text-white shadow-lg"
                  : "hover:bg-[var(--pos-bg)]"
              )}
            >
              <LayoutGrid className="w-6 h-6" />
              <span className="text-[10px] font-medium">All</span>
            </button>

            {catalog.categories.map((category, index) => {
              const colors = getCategoryColor(index);
              const Icon = getCategoryIcon(index);
              const isActive = activeCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                  className={cn(
                    "mx-2 mb-2 p-3 rounded-xl flex flex-col items-center gap-1 transition-all",
                    isActive
                      ? `${colors.bg} text-white shadow-lg`
                      : `hover:${colors.light} ${colors.text}`
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium text-center line-clamp-2 leading-tight">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ================================================================ */}
        {/* MAIN CONTENT AREA */}
        {/* ================================================================ */}
        <div className="flex-1 flex flex-col bg-[var(--pos-bg)] overflow-hidden">
          {viewMode === "floor" ? (
            <>
              {/* Floor View Header */}
              <div className="p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h1 className="font-bold text-xl">{tenant.name}</h1>
                      <p className="text-sm text-[var(--pos-muted)]">Select a table or start quick sale</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Active Orders Button - always show when there are open orders */}
                    {openOrders.length > 0 && (
                      <button
                        onClick={() => setActiveOrdersOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-primary-500/10 text-primary-500 font-medium flex items-center gap-2 hover:bg-primary-500/20 transition-colors"
                      >
                        <ListOrdered className="w-4 h-4" />
                        {openOrders.length} Active
                      </button>
                    )}

                    {heldOrders.length > 0 && (
                      <button
                        onClick={() => setHeldOrdersOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 font-medium flex items-center gap-2 hover:bg-amber-500/20 transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                        {heldOrders.length} Held
                      </button>
                    )}

                    {floors.length > 1 && (
                      <div className="flex items-center bg-[var(--pos-bg)] rounded-xl p-1 border border-[color:var(--pos-border)]">
                        {floors.map((floor) => (
                          <button
                            key={floor.id}
                            onClick={() => setActiveFloorId(floor.id)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                              floor.id === activeFloor?.id
                                ? "bg-primary-500 text-white shadow"
                                : "hover:bg-[var(--pos-border)]"
                            )}
                          >
                            {floor.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={loadSampleData}
                      disabled={busyKey === "load-sample"}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {busyKey === "load-sample" ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                      Load Demo
                    </button>

                    <button
                      onClick={startQuickSale}
                      disabled={busyKey === "quick-sale"}
                      className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold text-sm flex items-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-lg"
                    >
                      <Zap className="w-5 h-5" />
                      Quick Sale
                    </button>
                  </div>
                </div>
              </div>

              {/* Tables Grid */}
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {activeFloor?.tables.map((table) => {
                    const order = openOrderByTable.get(table.id);
                    const status = getTableStatus(order?.status);
                    const isBusy = busyKey === `table:${table.id}`;
                    const hasOrder = !!order;

                    return (
                      <button
                        key={table.id}
                        onClick={() => openTable(table.id)}
                        disabled={isBusy}
                        className={cn(
                          "aspect-square rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-wait shadow-lg border-2 relative overflow-hidden",
                          hasOrder ? status.bg : "bg-[var(--pos-panel-solid)]",
                          hasOrder ? status.border : "border-[color:var(--pos-border)]",
                          hasOrder ? "text-white" : "text-[var(--pos-text)]"
                        )}
                      >
                        {hasOrder && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                        )}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="text-3xl font-bold mb-1">{table.name}</div>
                          <div className={cn("text-sm mb-2", hasOrder ? "opacity-80" : "text-[var(--pos-muted)]")}>
                            {table.capacity} seats
                          </div>
                          {order && (
                            <div className="text-lg font-bold">
                              {formatMoney({ cents: order.totalCents, currency: order.currency })}
                            </div>
                          )}
                          <div className={cn(
                            "text-xs font-semibold mt-2 px-3 py-1 rounded-full",
                            hasOrder ? "bg-black/20" : "bg-[var(--pos-bg)]"
                          )}>
                            {status.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {(!activeFloor?.tables || activeFloor.tables.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--pos-muted)]">
                    <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                      <Grid3X3 className="w-12 h-12 text-amber-500" />
                    </div>
                    <p className="text-xl font-semibold mb-2">No Tables Configured</p>
                    <p className="text-sm mb-6">Load sample data to get started, or use Quick Sale mode</p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={loadSampleData}
                        disabled={busyKey === "load-sample"}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                      >
                        {busyKey === "load-sample" ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            Load Sample Data
                          </>
                        )}
                      </button>
                      <button
                        onClick={startQuickSale}
                        disabled={busyKey === "quick-sale"}
                        className="px-8 py-4 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-panel)] text-[var(--pos-text)] font-semibold flex items-center justify-center gap-3 hover:bg-[var(--pos-bg)] transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Start Quick Sale
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Products View Header */}
              <div className="p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={closeOrder}
                    className="p-3 rounded-xl border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)]" />
                    <input
                      ref={searchInputRef}
                      value={menuQuery}
                      onChange={(e) => setMenuQuery(e.target.value)}
                      placeholder="Search products... (Press /)"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                    />
                    {menuQuery && (
                      <button
                        onClick={() => setMenuQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--pos-border)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <OrderTypeSelector
                    selected={orderType}
                    onChange={setOrderType}
                    disabled={activeOrder?.status !== "OPEN"}
                  />

                  {/* Active Orders Toggle */}
                  {openOrders.length > 1 && (
                    <button
                      onClick={() => setActiveOrdersOpen(true)}
                      className="px-4 py-3 rounded-xl bg-primary-500/10 text-primary-500 font-medium flex items-center gap-2 hover:bg-primary-500/20 transition-colors relative"
                    >
                      <ListOrdered className="w-5 h-5" />
                      <span className="hidden lg:inline">Orders</span>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                        {openOrders.length}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setAddCustomProductOpen(true)}
                    className="px-4 py-3 rounded-xl bg-secondary-500/10 text-secondary-500 font-medium flex items-center gap-2 hover:bg-secondary-500/20 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden lg:inline">Custom Item</span>
                  </button>
                </div>
              </div>

              {/* No Active Order Banner */}
              {!activeOrder && (
                <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Start an order to add products
                    </span>
                  </div>
                  <button
                    onClick={startQuickSale}
                    disabled={busyKey === "quick-sale"}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {busyKey === "quick-sale" ? "Starting..." : "Quick Sale"}
                  </button>
                </div>
              )}

              {/* Products Grid */}
              <div className="flex-1 overflow-auto p-4">
                {!hasProducts && filteredProducts.length === 0 ? (
                  <EmptyProductState
                    onAddProduct={() => setAddCustomProductOpen(true)}
                    tenantSlug={tenant.slug}
                    onSampleLoaded={() => window.location.reload()}
                  />
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-[var(--pos-muted)]">
                    <Search className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm mt-1">Try a different search or category</p>
                    <button
                      onClick={() => setAddCustomProductOpen(true)}
                      className="mt-4 px-4 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600"
                    >
                      Add Custom Item
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filteredProducts.map((product) => {
                      const categoryIndex = catalog.categories.findIndex(
                        (c) => c.products.some((p) => p.id === product.id)
                      );
                      const colors = categoryIndex >= 0 ? getCategoryColor(categoryIndex) : CATEGORY_COLORS[0];
                      const isBusy = busyKey === `add:${product.id}`;

                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          categoryColor={colors}
                          onClick={() => addProduct(product.id)}
                          disabled={isBusy || !activeOrder}
                          isBusy={isBusy}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ================================================================ */}
        {/* RIGHT PANEL - Order Summary (Odoo style) */}
        {/* ================================================================ */}
        <div className="w-[400px] flex-shrink-0 flex flex-col border-l border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
          {/* Order Header */}
          <div className="p-4 border-b border-[color:var(--pos-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  activeOrder ? "bg-primary-500/10" : "bg-[var(--pos-bg)]"
                )}>
                  <ShoppingCart className={cn("w-6 h-6", activeOrder ? "text-primary-500" : "text-[var(--pos-muted)]")} />
                </div>
                <div>
                  <div className="font-bold text-lg">
                    {activeOrder?.table ? `Table ${activeOrder.table.name}` : activeOrder ? "Quick Sale" : "Current Order"}
                  </div>
                  <div className="text-sm text-[var(--pos-muted)]">
                    {activeOrder ? (
                      <span className="flex items-center gap-2" suppressHydrationWarning>
                        <span>#{activeOrder.orderNumber.slice(-6)}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--pos-muted)]" />
                        <Clock className="w-3 h-3" />
                        {formatTime(activeOrder.openedAt)}
                      </span>
                    ) : (
                      "Select a table to start"
                    )}
                  </div>
                </div>
              </div>
              {activeOrder && (
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold",
                  activeOrder.status === "PAID" ? "bg-primary-500/10 text-primary-500" :
                  activeOrder.status === "IN_KITCHEN" ? "bg-amber-500/10 text-amber-500" :
                  activeOrder.status === "READY" ? "bg-blue-500/10 text-blue-500" :
                  activeOrder.status === "CANCELLED" ? "bg-red-500/10 text-red-500" :
                  "bg-secondary-500/10 text-secondary-500"
                )}>
                  {activeOrder.status.replace("_", " ")}
                </span>
              )}
            </div>

            {/* Customer Selection */}
            {activeOrder && (
              <button
                onClick={() => setCustomerModalOpen(true)}
                className="w-full p-3 rounded-xl border border-dashed border-[color:var(--pos-border)] hover:border-primary-500 hover:bg-primary-500/5 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--pos-bg)] flex items-center justify-center">
                  {activeOrder.customer ? (
                    <span className="font-bold text-primary-500">
                      {activeOrder.customer.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-[var(--pos-muted)]" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">
                    {activeOrder.customer?.name || "Guest"}
                  </div>
                  <div className="text-xs text-[var(--pos-muted)]">
                    {activeOrder.customer?.email || "Tap to select customer"}
                  </div>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-[var(--pos-muted)]" />
              </button>
            )}
          </div>

          {/* Order Items */}
          <div className="flex-1 overflow-auto">
            {!activeOrder ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--pos-bg)] flex items-center justify-center mb-6">
                  <ShoppingCart className="w-12 h-12 text-[var(--pos-muted)]" />
                </div>
                <h3 className="font-bold text-xl mb-2">No Active Order</h3>
                <p className="text-[var(--pos-muted)] mb-6">
                  Select a table or start a quick sale
                </p>
                <button
                  onClick={startQuickSale}
                  disabled={busyKey === "quick-sale"}
                  className="px-8 py-4 rounded-xl bg-primary-500 text-white font-semibold flex items-center gap-3 hover:bg-primary-600 transition-colors shadow-lg"
                >
                  <Plus className="w-6 h-6" />
                  New Order
                </button>
              </div>
            ) : activeOrder.items.filter((i) => i.status !== "VOID").length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--pos-bg)] flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-[var(--pos-muted)]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Empty Order</h3>
                <p className="text-sm text-[var(--pos-muted)]">
                  Select products to add to the order
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[color:var(--pos-border)]">
                {activeOrder.items
                  .filter((i) => i.status !== "VOID")
                  .map((item) => (
                    <OrderLineItem
                      key={item.id}
                      item={item}
                      currency={activeOrder.currency}
                      isSelected={selectedItemId === item.id}
                      onSelect={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                      onQuantityChange={(delta) => {
                        const newQty = item.quantity + delta;
                        if (newQty < 1) {
                          patchItem(item.id, { status: "VOID" });
                        } else {
                          patchItem(item.id, { quantity: newQty });
                        }
                      }}
                      onDelete={() => patchItem(item.id, { status: "VOID" })}
                      onDiscount={() => {
                        setDiscountTarget("item");
                        setDiscountModalOpen(true);
                      }}
                      onNote={() => {
                        setNoteTarget("item");
                        setNoteModalOpen(true);
                      }}
                      editable={item.status === "NEW"}
                      busy={busyKey === `item:${item.id}`}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Order Totals & Actions */}
          {activeOrder && (
            <div className="border-t border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
              {/* Quick Actions */}
              <div className="p-3 border-b border-[color:var(--pos-border)] grid grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    setDiscountTarget("order");
                    setDiscountModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-amber-500 hover:bg-amber-500/5 transition-all flex flex-col items-center gap-1"
                >
                  <Percent className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-medium">Discount</span>
                </button>
                <button
                  onClick={() => {
                    setNoteTarget("order");
                    setNoteModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-1"
                >
                  <StickyNote className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-medium">Note</span>
                </button>
                <button
                  onClick={() => setCustomerModalOpen(true)}
                  className="p-2.5 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-purple-500 hover:bg-purple-500/5 transition-all flex flex-col items-center gap-1"
                >
                  <User className="w-4 h-4 text-purple-500" />
                  <span className="text-[10px] font-medium">Customer</span>
                </button>
                <button
                  onClick={holdOrder}
                  disabled={activeOrder.items.filter(i => i.status !== "VOID").length === 0}
                  className="p-2.5 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:border-secondary-500 hover:bg-secondary-500/5 transition-all flex flex-col items-center gap-1 disabled:opacity-50"
                >
                  <Pause className="w-4 h-4 text-secondary-500" />
                  <span className="text-[10px] font-medium">Hold</span>
                </button>
              </div>

              {/* Totals */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--pos-muted)]">Subtotal</span>
                  <span className="font-medium">{formatMoney({ cents: activeOrder.subtotalCents, currency: activeOrder.currency })}</span>
                </div>
                {activeOrder.discountCents && activeOrder.discountCents > 0 && (
                  <div className="flex items-center justify-between text-sm text-amber-500">
                    <span>Discount</span>
                    <span className="font-medium">-{formatMoney({ cents: activeOrder.discountCents, currency: activeOrder.currency })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--pos-muted)]">Tax (5%)</span>
                  <span className="font-medium">{formatMoney({ cents: activeOrder.taxCents, currency: activeOrder.currency })}</span>
                </div>
                <div className="flex items-center justify-between text-2xl font-bold pt-3 border-t border-[color:var(--pos-border)]">
                  <span>Total</span>
                  <span className="text-primary-500">
                    {formatMoney({ cents: activeOrder.totalCents, currency: activeOrder.currency })}
                  </span>
                </div>
                {paidCents > 0 && paidCents < activeOrder.totalCents && (
                  <div className="flex items-center justify-between text-lg font-semibold text-primary-500">
                    <span>Remaining</span>
                    <span>{formatMoney({ cents: outstandingCents, currency: activeOrder.currency })}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={sendToKitchen}
                    disabled={!canSendToKitchen || busyKey === "send"}
                    className="px-4 py-4 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    Kitchen
                  </button>
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    disabled={!canPay}
                    className="px-4 py-4 rounded-xl bg-primary-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Banknote className="w-5 h-5" />
                    Payment
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={cancelOrder}
                    disabled={activeOrder.status === "PAID" || busyKey === "cancel"}
                    className="px-4 py-3 rounded-xl border border-red-500/30 text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={closeOrder}
                    className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pos-bg)] transition-colors"
                  >
                    <Receipt className="w-4 h-4" />
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODALS */}
      {/* ================================================================ */}

      <CustomerSelectorModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelect={(customer) => {
          if (activeOrder) {
            setActiveOrder({ ...activeOrder, customer });
          }
          setCustomerModalOpen(false);
        }}
        onCreateNew={() => {
          setCustomerModalOpen(false);
          setCreateCustomerModalOpen(true);
        }}
      />

      <CreateCustomerModal
        isOpen={createCustomerModalOpen}
        onClose={() => setCreateCustomerModalOpen(false)}
        onSave={(customer) => {
          if (activeOrder) {
            setActiveOrder({ ...activeOrder, customer });
          }
          setToast(`Customer ${customer.name} created`);
        }}
      />

      <DiscountModal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        onApply={(type, value) => {
          if (discountTarget === "item" && selectedItem) {
            const percent = type === "percent" ? value : Math.round((value / getItemTotal(selectedItem)) * 100);
            patchItem(selectedItem.id, { discountPercent: percent });
          } else {
            setToast("Order discount applied");
          }
        }}
        currentDiscount={discountTarget === "item" && selectedItem ? selectedItem.discountPercent : undefined}
        itemName={discountTarget === "item" && selectedItem ? selectedItem.productName : undefined}
        maxAmount={discountTarget === "item" && selectedItem ? getItemTotal(selectedItem) : activeOrder?.totalCents || 0}
        currency={activeOrder?.currency || tenant.currency}
      />

      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSave={(note) => {
          if (noteTarget === "item" && selectedItem) {
            patchItem(selectedItem.id, { notes: note || null });
          } else if (activeOrder) {
            setActiveOrder({ ...activeOrder, notes: note || null });
            setToast("Note saved");
          }
        }}
        currentNote={noteTarget === "item" && selectedItem ? selectedItem.notes : activeOrder?.notes}
        title={noteTarget === "item" ? "Item Note" : "Order Note"}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        totalCents={activeOrder?.totalCents || 0}
        paidCents={paidCents}
        currency={activeOrder?.currency || tenant.currency}
        onPay={handlePayment}
        onComplete={() => {
          setPaymentModalOpen(false);
          setReceiptModalOpen(true);
        }}
      />

      <ReceiptPreviewModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          closeOrder();
        }}
        order={activeOrder}
        tenantName={tenant.name}
        onPrint={() => {
          setToast("Receipt sent to printer");
        }}
        onNewOrder={() => {
          setReceiptModalOpen(false);
          closeOrder();
          startQuickSale();
        }}
      />

      <HeldOrdersPanel
        isOpen={heldOrdersOpen}
        onClose={() => setHeldOrdersOpen(false)}
        heldOrders={heldOrders}
        currency={tenant.currency}
        onRecall={recallOrder}
        onDelete={(id) => setHeldOrders(prev => prev.filter(o => o.id !== id))}
      />

      <ActiveOrdersPanel
        isOpen={activeOrdersOpen}
        onClose={() => setActiveOrdersOpen(false)}
        openOrders={openOrders}
        activeOrderId={activeOrder?.id || null}
        currency={tenant.currency}
        onSelectOrder={(orderId) => selectExistingOrder(orderId)}
      />

      <AddCustomProductModal
        isOpen={addCustomProductOpen}
        onClose={() => setAddCustomProductOpen(false)}
        onAdd={addCustomProduct}
        currency={tenant.currency}
      />
    </div>
  );
}
