import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-display font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`input ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-error font-display font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
