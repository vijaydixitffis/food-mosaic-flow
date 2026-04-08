import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from '@/integrations/supabase/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates the next invoice number by appending sequence to prefix
 * Format: {prefix}{sequence} (e.g., MF/26-27/0101)
 * Prefix should already contain FY from company_params (e.g., "MF/26-27/")
 * Sequence starts at 100 and resets when FY prefix changes
 * 
 * @param prefix - The invoice prefix from company params (e.g., "MF/26-27/")
 * @returns Promise<string> - The generated invoice number
 */
export async function generateInvoiceNumber(prefix: string = 'INV-'): Promise<string> {
  // Get the highest existing invoice number for this prefix
  const { data: existingOrders, error } = await supabase
    .from('orders')
    .select('invoice_number')
    .not('invoice_number', 'is', null)
    .ilike('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching existing invoice numbers:', error);
    throw new Error('Failed to generate invoice number');
  }

  let nextSequence = 100; // Start at 100 for new financial year

  if (existingOrders && existingOrders.length > 0 && existingOrders[0].invoice_number) {
    // Extract the numeric part after the prefix
    const lastInvoiceNumber = existingOrders[0].invoice_number;
    const numericPart = lastInvoiceNumber.replace(prefix, '');
    const lastSequence = parseInt(numericPart, 10);

    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  // Format with 4-digit padding (e.g., 0100, 0101, 0200, etc.)
  const sequenceString = String(nextSequence).padStart(4, '0');
  return `${prefix}${sequenceString}`;
}
