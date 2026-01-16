"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Banknote,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileText,
  User,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/pos/format";

type CashSession = {
  id: string;
  status: string;
  openingCashCents: number;
  closingCashCents?: number | null;
  expectedCashCents?: number | null;
  cashDifferenceCents?: number | null;
  currency: string;
  notes?: string | null;
  closingNotes?: string | null;
  openedAt: string;
  closedAt?: string | null;
  openedBy: { id: string; firstName: string; lastName: string };
  closedBy?: { id: string; firstName: string; lastName: string } | null;
};

type OpeningControlDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  currency: string;
  currentSession: CashSession | null;
  onSessionChange: (session: CashSession | null) => void;
};

function Numpad({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const handleKey = (key: string) => {
    if (key === "C") {
      onChange("");
    } else if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (key === ".") {
      if (!value.includes(".")) {
        onChange(value + key);
      }
    } else {
      onChange(value + key);
    }
  };

  const numKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "⌫"],
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
                  : "bg-[var(--pos-bg)] border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)]"
              )}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => handleKey("C")}
        className="h-12 rounded-xl font-bold text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
      >
        Clear
      </button>
    </div>
  );
}

export function OpeningControlDialog({
  isOpen,
  onClose,
  tenantSlug,
  currency,
  currentSession,
  onSessionChange,
}: OpeningControlDialogProps) {
  const [mode, setMode] = useState<"open" | "close">("open");
  const [cashAmount, setCashAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentSession) {
      setMode("close");
    } else {
      setMode("open");
    }
    setCashAmount("");
    setNotes("");
    setError(null);
  }, [currentSession, isOpen]);

  const handleOpenSession = async () => {
    const cents = Math.round(parseFloat(cashAmount || "0") * 100);
    if (isNaN(cents) || cents < 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pos/tenants/${tenantSlug}/cash-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingCashCents: cents,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to open session");
        return;
      }

      onSessionChange(data.session);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!currentSession) return;

    const cents = Math.round(parseFloat(cashAmount || "0") * 100);
    if (isNaN(cents) || cents < 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/pos/tenants/${tenantSlug}/cash-sessions/${currentSession.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            closingCashCents: cents,
            closingNotes: notes.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to close session");
        return;
      }

      onSessionChange(null);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const amountCents = Math.round(parseFloat(cashAmount || "0") * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--pos-panel-solid)] rounded-3xl shadow-2xl border border-[color:var(--pos-border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[color:var(--pos-border)]">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                mode === "open"
                  ? "bg-gradient-to-br from-emerald-500 to-green-500"
                  : "bg-gradient-to-br from-amber-500 to-orange-500"
              )}
            >
              <Banknote className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {mode === "open" ? "Opening Control" : "Closing Control"}
              </h2>
              <p className="text-sm text-[var(--pos-muted)]">
                {mode === "open"
                  ? "Start a new cash session"
                  : "Close the current session"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--pos-border)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Session Info (when closing) */}
        {mode === "close" && currentSession && (
          <div className="px-6 py-4 bg-[var(--pos-bg)] border-b border-[color:var(--pos-border)]">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-4 h-4 text-[var(--pos-muted)]" />
              <span className="text-sm text-[var(--pos-muted)]">
                Opened by {currentSession.openedBy.firstName} {currentSession.openedBy.lastName}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-4 h-4 text-[var(--pos-muted)]" />
              <span className="text-sm text-[var(--pos-muted)]">
                {new Date(currentSession.openedAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">
                Opening: {formatMoney({ cents: currentSession.openingCashCents, currency })}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="text-center">
            <div className="text-sm text-[var(--pos-muted)] mb-2">
              {mode === "open" ? "Opening Cash Amount" : "Closing Cash Amount"}
            </div>
            <div className="text-4xl font-bold">
              {formatMoney({ cents: amountCents || 0, currency })}
            </div>
          </div>

          {/* Numpad */}
          <Numpad value={cashAmount} onChange={setCashAmount} />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={mode === "open" ? "Add opening notes..." : "Add closing notes..."}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[color:var(--pos-border)] bg-[var(--pos-bg)]">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border border-[color:var(--pos-border)] font-semibold hover:bg-[var(--pos-border)] transition-colors"
              >
                {mode === "open" ? "Skip for Now" : "Cancel"}
              </button>
              <button
                onClick={mode === "open" ? handleOpenSession : handleCloseSession}
                disabled={loading}
                className={cn(
                  "flex-1 px-6 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50",
                  mode === "open"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-amber-500 hover:bg-amber-600"
                )}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {mode === "open" ? "Open Session" : "Close Session"}
                  </>
                )}
              </button>
            </div>
            {mode === "open" && (
              <p className="text-xs text-center text-[var(--pos-muted)]">
                You can open a cash session later from the sidebar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
