'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/shadcn';
import { Modal } from '@/components/ui/Modal';
import { FormSelect, FormTextarea } from '@/components/ui/FormInput';
import { ConfigStatus } from '@/types/payroll-config';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: ConfigStatus;
  onConfirm: (status: ConfigStatus, rejectionReason?: string) => void;
  title: string;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onConfirm,
  title,
}) => {
  const [status, setStatus] = useState<ConfigStatus>(ConfigStatus.APPROVED);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(status, status === ConfigStatus.REJECTED ? rejectionReason : undefined);
    setRejectionReason('');
  };

  const statusOptions = [
    { value: ConfigStatus.APPROVED, label: 'Approve' },
    { value: ConfigStatus.REJECTED, label: 'Reject' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit}>
        <FormSelect
          label="New Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ConfigStatus)}
          options={statusOptions}
          required
        />
        {status === ConfigStatus.REJECTED && (
          <FormTextarea
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            required
          />
        )}
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Confirm
          </Button>
        </div>
      </form>
    </Modal>
  );
};

