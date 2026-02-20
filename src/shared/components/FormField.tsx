import React from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}

export function FormField({ label, children, error, required }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#303d25] mb-3">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}