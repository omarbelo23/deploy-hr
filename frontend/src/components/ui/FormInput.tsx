import React from 'react'
import { Label } from '@/components/ui/shadcn'
import { Input } from '@/components/ui/shadcn'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && <Label className="mb-1">{label}</Label>}
      <Input {...(props as any)} />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const FormTextarea: React.FC<FormTextareaProps> = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && <Label className="mb-1">{label}</Label>}
      <textarea
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        {...props}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options?: SelectOption[]
  error?: string
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, options = [], error, children, ...props }) => {
  return (
    <div className="mb-4">
      {label && <Label className="mb-1">{label}</Label>}
      <select
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export default FormInput
