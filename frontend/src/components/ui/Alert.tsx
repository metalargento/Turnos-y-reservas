import React, { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'info';
  className?: string;
}

export function Alert({ children, variant = 'info', className = '' }: AlertProps) {
  const variantStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}
