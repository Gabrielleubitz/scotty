import React from 'react';
import { cn } from '../../lib/utils';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md';
}

export const Tag: React.FC<TagProps> = ({
  children,
  className,
  variant = 'default',
  size = 'sm',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center rounded-pill font-medium';
  
  const variants = {
    default: 'bg-[#111827] text-[#E5E7EB]',
    success: 'bg-[#111827] text-status-success border border-status-success/30',
    warning: 'bg-[#111827] text-status-warning border border-status-warning/30',
    error: 'bg-[#111827] text-status-error border border-status-error/30',
    accent: 'bg-[#111827] text-accent border border-accent/30',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-caption',
    md: 'px-3 py-1.5 text-body',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {variant !== 'default' && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'success' && 'bg-status-success',
            variant === 'warning' && 'bg-status-warning',
            variant === 'error' && 'bg-status-error',
            variant === 'accent' && 'bg-accent'
          )}
        />
      )}
      {children}
    </span>
  );
};

