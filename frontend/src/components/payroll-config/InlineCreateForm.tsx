'use client';

import React from 'react';
import { Button } from '@/components/ui/shadcn';

interface InlineCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
}

export const InlineCreateForm: React.FC<InlineCreateFormProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Create',
}) => {
  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={onSubmit}>
        {children}
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};

