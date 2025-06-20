import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, XCircle } from 'lucide-react';

export function OrdersTable({ orders = [], isLoading = false, onEdit, onDeactivate, isReadOnly }) {
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
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_code}</TableCell>
              <TableCell>{order.client_name}</TableCell>
              <TableCell>{order.order_date}</TableCell>
              <TableCell>{order.target_delivery_date}</TableCell>
              <TableCell>
                <Badge variant="default">{order.status}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={() => onEdit(order)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {isReadOnly ? 'View' : 'Edit'}
                    </DropdownMenuItem>
                    {!isReadOnly && order.status !== 'COMPLETE' && (
                      <DropdownMenuItem
                        onClick={() => onDeactivate(order.id)}
                        className="text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
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