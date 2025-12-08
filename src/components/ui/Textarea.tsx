import React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-caption font-medium text-text-muted">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full px-3 py-2.5 bg-bg-card border border-border rounded-input text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:bg-bg-card disabled:cursor-not-allowed resize-vertical transition-colors',
          error && 'border-status-error focus:ring-status-error focus:border-status-error',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-caption text-status-error">{error}</p>
      )}
    </div>
  );
};