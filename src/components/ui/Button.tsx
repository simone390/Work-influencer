'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variantClasses = {
    primary:
      'bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-[980px] hover:-translate-y-px focus:shadow-[0_0_0_3px_rgba(0,113,227,0.25)]',
    secondary:
      'bg-white hover:bg-[#e8f0fd] text-[#0071e3] border border-[#d2d2d7] hover:border-[#0071e3] rounded-[980px] focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]',
    danger: 'bg-[#ff3b30] hover:bg-[#e0352a] text-white rounded-[980px] hover:-translate-y-px focus:shadow-[0_0_0_3px_rgba(255,59,48,0.25)]',
    ghost:
      'bg-transparent hover:bg-[#f5f5f7] text-[#1d1d1f] rounded-[8px] focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]',
  }

  const sizeClasses = {
    sm: 'py-1.5 px-3.5 text-xs',
    md: 'py-2 px-[18px] text-sm',
    lg: 'py-2.5 px-6 text-sm',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
