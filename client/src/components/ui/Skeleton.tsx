import React from 'react';
import { cn } from '../../lib/utils.js';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('animate-pulse rounded-xl bg-slate-200/80', className)} />
  );
};
