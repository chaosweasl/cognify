import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    ghost: 'btn-ghost',
    outline: 'btn-outline'
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loading && 'loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}