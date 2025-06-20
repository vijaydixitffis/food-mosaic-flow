
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
import { Edit, Trash2, MoreHorizontal, Truck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
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
  onUpdateStatus: (workOrderId: string, status: string) => void;
  onViewDelivery: (workOrder: WorkOrderWithProducts) => void;
  isReadOnly: boolean;
}

const statusColors = {
  CREATED: 'bg-gray-100 text-gray-800',
  PROCURED: 'bg-blue-100 text-blue-800',
  'IN-STOCK': 'bg-green-100 text-green-800',
  PROCESSED: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  EXECUTED: 'bg-orange-100 text-orange-800',
  COMPLETE: 'bg-emerald-100 text-emerald-800',
};

const statusOptions = [
  'CREATED',
  'PROCURED',
  'IN-STOCK',
  'PROCESSED',
  'SHIPPED',
  'EXECUTED',
  'COMPLETE',
];

export function WorkOrdersTable({
  workOrders,
  isLoading,
  onEdit,
  onDelete,
  onUpdateStatus,
  onViewDelivery,
  isReadOnly,
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
          {workOrders.map((workOrder) => (
            <TableRow key={workOrder.id}>
              <TableCell className="font-medium">{workOrder.name}</TableCell>
              <TableCell className="max-w-xs truncate">
                {workOrder.description || '-'}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={statusColors[workOrder.status as keyof typeof statusColors]}
                >
                  {workOrder.status}
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
                  year: '2-digit'
                })}
              </TableCell>
              <TableCell>
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
                      {isReadOnly ? 'View' : 'Edit'}
                    </DropdownMenuItem>
                    {!isReadOnly && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onDelete(workOrder.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        {statusOptions
                          .filter((status) => status !== workOrder.status)
                          .map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => onUpdateStatus(workOrder.id, status)}
                            >
                              Update to {status}
                            </DropdownMenuItem>
                          ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
