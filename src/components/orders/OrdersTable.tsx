import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye } from 'lucide-react';
import { ORDER_STATUSES } from '@/lib/constants';

interface StatusSliderProps {
  isActive: boolean;
  onToggle: () => void;
  orderCode: string;
  disabled?: boolean;
}

function StatusSlider({ isActive, onToggle, orderCode, disabled = false }: StatusSliderProps) {
  const handleToggle = () => {
    if (disabled) return;
    
    if (isActive) {
      // If currently active and trying to deactivate, show confirmation
      const confirmed = window.confirm(
        `Are you sure you want to cancel order "${orderCode}"? This action cannot be undone.`
      );
      if (confirmed) {
        onToggle();
      }
    } else {
      // If currently inactive and trying to activate, proceed directly
      onToggle();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          ${isActive 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-200 hover:bg-gray-300'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${isActive ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

export function OrdersTable({ orders = [], isLoading = false, onEdit, onToggleStatus, isReadOnly }) {
  if (isLoading) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-center text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Code</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Target Delivery</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isActive = order.status !== ORDER_STATUSES.CANCELED;
            
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.order_code}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{order.clients?.client_code || 'N/A'}</span>
                    <span className="text-xs text-gray-500">{order.clients?.name || 'Unknown Client'}</span>
                  </div>
                </TableCell>
                <TableCell>{order.order_date}</TableCell>
                <TableCell>{order.target_delivery_date}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-between">
                    <StatusSlider
                      isActive={isActive}
                      onToggle={() => onToggleStatus(order.id, order.status)}
                      orderCode={order.order_code}
                      disabled={isReadOnly || order.status === ORDER_STATUSES.COMPLETE}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(order)}
                      className="flex items-center gap-1"
                    >
                      {isReadOnly ? <Eye className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                      {isReadOnly ? 'View' : 'Edit'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 