import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Truck,
  PackageCheck,
  Wrench,
  BadgeCheck,
  CheckCheck,
  ClipboardCheck,
  CheckSquare,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
type WorkOrderStatus = Database['public']['Enums']['work_order_status'];
type WorkOrderWithProducts = WorkOrder & {
  work_order_products: Array<{
    id: string;
    product_id: string;
    total_weight: number;
    number_of_pouches: number;
    pouch_size: number;
    products: {
      id: string;
      name: string;
    };
  }>;
};

interface WorkOrdersTableProps {
  workOrders: WorkOrderWithProducts[];
  isLoading: boolean;
  onEdit: (workOrder: WorkOrderWithProducts) => void;
  onDelete: (workOrderId: string) => void;
  onAdvanceStatus: (workOrder: WorkOrderWithProducts) => void;
  onViewDelivery: (workOrder: WorkOrderWithProducts) => void;
  isReadOnly: boolean;
  canMarkComplete: boolean;
}

const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  CREATED:   'bg-blue-100 text-blue-800',
  PROCURE:   'bg-red-100 text-red-800',
  'IN-STOCK':'bg-yellow-100 text-yellow-800',
  READY:     'bg-lime-100 text-lime-800',
  PROCESSED: 'bg-purple-100 text-purple-800',
  EXECUTED:  'bg-teal-100 text-teal-800',
  COMPLETE:  'bg-green-100 text-green-800',
};

const NEXT_STEP_CONFIG: Record<
  WorkOrderStatus,
  { label: string; Icon: React.ElementType } | null
> = {
  CREATED:   { label: 'Check Ingredients',  Icon: ClipboardCheck },
  PROCURE:   { label: 'Mark In-Stock',       Icon: PackageCheck },
  'IN-STOCK':{ label: 'Mark Ready',          Icon: CheckSquare },
  READY:     { label: 'Mark Processed',      Icon: Wrench },
  PROCESSED: { label: 'Execute & Add Stock', Icon: BadgeCheck },
  EXECUTED:  { label: 'Mark Complete',       Icon: CheckCheck },
  COMPLETE:  null,
};

const canEdit = (status: WorkOrderStatus) => status === 'CREATED' || status === 'PROCURE';
const canDelete = (status: WorkOrderStatus) => status === 'CREATED';

export function WorkOrdersTable({
  workOrders,
  isLoading,
  onEdit,
  onDelete,
  onAdvanceStatus,
  onViewDelivery,
  isReadOnly,
  canMarkComplete,
}: WorkOrdersTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading work orders...</div>
      </div>
    );
  }

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No work orders found.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>WO Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workOrders.map((workOrder) => {
            const status = workOrder.status as WorkOrderStatus;
            const nextStep = NEXT_STEP_CONFIG[status];

            return (
              <TableRow key={workOrder.id}>
                <TableCell className="font-medium">{workOrder.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {workOrder.description || '-'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-800'}
                  >
                    {status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {workOrder.work_order_products.length > 0 ? (
                    <div className="space-y-1">
                      {workOrder.work_order_products.slice(0, 2).map((wop) => (
                        <div key={wop.id} className="text-sm">
                          {wop.products.name} ({wop.total_weight}kg)
                        </div>
                      ))}
                      {workOrder.work_order_products.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{workOrder.work_order_products.length - 2} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">No products</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(workOrder.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* Next Step primary action button */}
                    {!isReadOnly && nextStep && !(status === 'EXECUTED' && !canMarkComplete) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1.5 text-xs"
                        onClick={() => onAdvanceStatus(workOrder)}
                      >
                        <nextStep.Icon className="h-3.5 w-3.5" />
                        {nextStep.label}
                      </Button>
                    )}
                    {status === 'COMPLETE' && (
                      <CheckCheck className="h-5 w-5 text-green-600" />
                    )}

                    {/* Overflow menu — secondary actions only */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem onClick={() => onViewDelivery(workOrder)}>
                          <Truck className="mr-2 h-4 w-4" />
                          View Delivery
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(workOrder)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {isReadOnly || !canEdit(status) ? 'View' : 'Edit'}
                        </DropdownMenuItem>
                        {!isReadOnly && canDelete(status) && (
                          <DropdownMenuItem
                            onClick={() => onDelete(workOrder.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
