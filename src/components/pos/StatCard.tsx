'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  sparklineData?: number[];
  className?: string;
}

function MiniSparkline({ data, className }: { data: number[]; className?: string }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const height = 32;
  const width = 80;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  // Determine trend color
  const isPositive = data[data.length - 1] >= data[0];

  return (
    <svg
      width={width}
      height={height}
      className={cn('flex-shrink-0', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={`gradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill={`url(#gradient-${isPositive ? 'up' : 'down'})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  sparklineData,
  className,
}: StatCardProps) {
  const trendDirection = trend?.value ? (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral') : null;

  return (
    <div
      className={cn(
        'rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-5 transition-all hover:shadow-lg hover:border-[var(--pos-accent)]/30',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--pos-muted)] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[var(--pos-text)] truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-[var(--pos-muted)] mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--pos-accent), var(--pos-accent2))',
          }}
        >
          {icon}
        </div>
      </div>

      {(trend || sparklineData) && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[color:var(--pos-border)]">
          {trend && (
            <div className="flex items-center gap-1.5">
              {trendDirection === 'up' && (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              )}
              {trendDirection === 'down' && (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              {trendDirection === 'neutral' && (
                <Minus className="w-4 h-4 text-[var(--pos-muted)]" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trendDirection === 'up' && 'text-emerald-500',
                  trendDirection === 'down' && 'text-red-500',
                  trendDirection === 'neutral' && 'text-[var(--pos-muted)]'
                )}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-[var(--pos-muted)]">{trend.label}</span>
            </div>
          )}
          {sparklineData && (
            <MiniSparkline data={sparklineData} />
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function StatCardCompact({
  title,
  value,
  icon,
  trend,
  className,
}: Omit<StatCardProps, 'sparklineData' | 'subtitle'>) {
  const trendDirection = trend?.value ? (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral') : null;

  return (
    <div
      className={cn(
        'rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-4 transition-all hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--pos-accent), var(--pos-accent2))',
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--pos-muted)]">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-bold text-[var(--pos-text)]">{value}</p>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trendDirection === 'up' && 'text-emerald-500',
                  trendDirection === 'down' && 'text-red-500',
                  trendDirection === 'neutral' && 'text-[var(--pos-muted)]'
                )}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
