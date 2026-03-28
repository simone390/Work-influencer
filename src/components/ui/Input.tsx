'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export function Input({
  label,
  error,
  helpText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#1d1d1f] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`block w-full rounded-[8px] border px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-[#b0b0b5] focus:outline-none focus:ring-[3px] transition-all duration-200 bg-white font-[inherit] ${
          error
            ? 'border-[#ff3b30] focus:border-[#ff3b30] focus:ring-[rgba(255,59,48,0.12)]'
            : 'border-[#d2d2d7] focus:border-[#0071e3] focus:ring-[rgba(0,113,227,0.12)]'
        } disabled:bg-[#f5f5f7] disabled:text-[#6e6e73] disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-[#ff3b30]">{error}</p>}
      {helpText && !error && (
        <p className="mt-1.5 text-xs text-[#6e6e73]">{helpText}</p>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helpText?: string
}

export function Textarea({
  label,
  error,
  helpText,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#1d1d1f] mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`block w-full rounded-[8px] border px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-[#b0b0b5] focus:outline-none focus:ring-[3px] transition-all duration-200 resize-none bg-white font-[inherit] ${
          error
            ? 'border-[#ff3b30] focus:border-[#ff3b30] focus:ring-[rgba(255,59,48,0.12)]'
            : 'border-[#d2d2d7] focus:border-[#0071e3] focus:ring-[rgba(0,113,227,0.12)]'
        } disabled:bg-[#f5f5f7] disabled:text-[#6e6e73] disabled:cursor-not-allowed ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-[#ff3b30]">{error}</p>}
      {helpText && !error && (
        <p className="mt-1.5 text-xs text-[#6e6e73]">{helpText}</p>
      )}
    </div>
  )
}
