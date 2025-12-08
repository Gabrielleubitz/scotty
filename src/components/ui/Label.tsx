import React from 'react';
import { cn } from '../../lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ children, className, ...props }) => {
  return (
    <label
      className={cn('block text-caption font-medium text-text-muted mb-1', className)}
      {...props}
    >
      {children}
    </label>
  );
};

