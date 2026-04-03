import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from '@/integrations/supabase/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates the next invoice number with financial year based sequence
 * Format: {prefix}{FY-START-FY-END}-{sequence} (e.g., INV-2026-2027-0100)
 * Sequence starts at 100 and resets at the beginning of each financial year (April 1)
 * 
 * @param prefix - The invoice prefix from company params (e.g., "INV-")
 * @returns Promise<string> - The generated invoice number
 */
export async function generateInvoiceNumber(prefix: string = 'INV-'): Promise<string> {
  // Determine current financial year
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // Financial year: April 1 to March 31
  // If current month is Jan-Mar, FY is (previousYear)-(currentYear)
  // If current month is Apr-Dec, FY is (currentYear)-(nextYear)
  let fyStart: number;
  let fyEnd: number;
  
  if (currentMonth >= 4) {
    // April to December: FY is currentYear-nextYear
    fyStart = currentYear;
    fyEnd = currentYear + 1;
  } else {
    // January to March: FY is (currentYear-1)-currentYear
    fyStart = currentYear - 1;
    fyEnd = currentYear;
  }
  
  const financialYearSuffix = `${fyStart}-${fyEnd}`;
  const fullPrefix = `${prefix}${financialYearSuffix}-`;
  
  // Get the highest existing invoice number for this financial year
  const { data: existingOrders, error } = await supabase
    .from('orders')
    .select('invoice_number')
    .not('invoice_number', 'is', null)
    .ilike('invoice_number', `${fullPrefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching existing invoice numbers:', error);
    throw new Error('Failed to generate invoice number');
  }

  let nextSequence = 100; // Start at 100 for new financial year

  if (existingOrders && existingOrders.length > 0 && existingOrders[0].invoice_number) {
    // Extract the numeric part after the full prefix
    const lastInvoiceNumber = existingOrders[0].invoice_number;
    const numericPart = lastInvoiceNumber.replace(fullPrefix, '');
    const lastSequence = parseInt(numericPart, 10);
    
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  // Format with 4-digit padding (e.g., 0100, 0101, 0200, etc.)
  const sequenceString = String(nextSequence).padStart(4, '0');
  return `${fullPrefix}${sequenceString}`;
}
