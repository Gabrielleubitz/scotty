import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className, ...props }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  return (
    <>
      <button
        type="button"
        onClick={() => context.setOpen(!context.open)}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2.5 bg-bg-card border border-border rounded-input text-text-primary text-body',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'hover:border-accent/50 transition-colors',
          className
        )}
        {...props}
      >
        {children || <SelectValue />}
        <ChevronDown size={16} className="text-text-muted" />
      </button>
      {context.open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => context.setOpen(false)}
          />
          <SelectContent>
            {React.Children.map(
              (React.Children.toArray(children).find((child: any) => child?.type === SelectContent) as any)?.props?.children || [],
              (child: any) => child
            )}
          </SelectContent>
        </>
      )}
    </>
  );
};

interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  return <span className="text-text-primary">{context.value || placeholder || 'Select...'}</span>;
};

interface SelectContentProps {
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  if (!context.open) return null;

  return (
    <div className="absolute z-20 w-full mt-1 bg-bg-card border border-border rounded-card shadow-lg max-h-60 overflow-auto">
      {children}
    </div>
  );
};

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className, ...props }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  return (
    <div
      onClick={() => {
        context.onValueChange(value);
        context.setOpen(false);
      }}
      className={cn(
        'px-3 py-2 text-body text-text-primary cursor-pointer hover:bg-[#111827] transition-colors',
        context.value === value && 'bg-accent/10 text-accent',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

