'use client';

/**
 * RequestStatusBadge Component
 * Visual indicator for request current status
 */

import Badge from '@/components/ui/Badge';

export default function RequestStatusBadge({ status }) {
  const statusConfig = {
    PENDING: { variant: 'warning', label: '⏳ Pending' },
    ASSIGNED: { variant: 'info', label: '🔍 Assigned' },
    IN_PROGRESS: { variant: 'info', label: '🚗 In Progress' },
    COMPLETED: { variant: 'success', label: '✓ Completed' },
    CANCELLED: { variant: 'danger', label: '✕ Cancelled' },
  };

  const config = statusConfig[status] || { variant: 'primary', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
