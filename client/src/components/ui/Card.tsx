import React from 'react';
import { cn } from '../../lib/utils.js';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm transition-all duration-200',
        hoverEffect && 'hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
