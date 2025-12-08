import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onCheckedChange,
  className,
  id,
  ...props
}) => {
  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="sr-only"
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          'flex items-center justify-center w-5 h-5 border-2 rounded-input cursor-pointer transition-colors',
          checked
            ? 'bg-accent border-accent'
            : 'bg-bg-card border-border hover:border-accent/50',
          className
        )}
      >
        {checked && <Check size={14} className="text-text-primary" />}
      </label>
    </div>
  );
};

