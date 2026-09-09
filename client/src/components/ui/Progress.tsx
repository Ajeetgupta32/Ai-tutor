import React from 'react';
import { cn } from '../../lib/utils.js';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  colorClass?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  colorClass = 'bg-blue-600',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full bg-slate-100 rounded-full h-2.5 overflow-hidden', className)}>
      <div
        className={cn('h-full transition-all duration-500 rounded-full', colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
