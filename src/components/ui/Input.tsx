import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-white text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-indigo-900 disabled:bg-slate-50 disabled:text-slate-500
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'}
            ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
