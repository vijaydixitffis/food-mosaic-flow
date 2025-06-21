// Order status constants
export const ORDER_STATUSES = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN PROGRESS',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  BILLED: 'BILLED',
  COMPLETE: 'COMPLETE',
  CANCELED: 'CANCELED',
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

// Order status display names
export const ORDER_STATUS_DISPLAY_NAMES: Record<OrderStatus, string> = {
  [ORDER_STATUSES.NEW]: 'New',
  [ORDER_STATUSES.IN_PROGRESS]: 'In Progress',
  [ORDER_STATUSES.SHIPPED]: 'Shipped',
  [ORDER_STATUSES.DELIVERED]: 'Delivered',
  [ORDER_STATUSES.BILLED]: 'Billed',
  [ORDER_STATUSES.COMPLETE]: 'Complete',
  [ORDER_STATUSES.CANCELED]: 'Canceled',
};

// Order status colors for badges
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUSES.NEW]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUSES.IN_PROGRESS]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUSES.SHIPPED]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUSES.DELIVERED]: 'bg-green-100 text-green-800',
  [ORDER_STATUSES.BILLED]: 'bg-amber-100 text-amber-800',
  [ORDER_STATUSES.COMPLETE]: 'bg-emerald-100 text-emerald-800',
  [ORDER_STATUSES.CANCELED]: 'bg-red-100 text-red-800',
}; 