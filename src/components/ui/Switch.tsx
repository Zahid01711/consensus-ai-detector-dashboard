import React from 'react';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onChange, label, className = '', disabled, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center space-x-3 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
            disabled={disabled}
            {...props}
          />
          <div
            className={`w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
              checked ? 'bg-indigo-900' : 'bg-slate-200'
            }`}
          />
          <div
            className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
export default Switch;
