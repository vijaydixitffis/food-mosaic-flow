import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  DatabaseBackup,
  Download,
  Loader2,
  Package,
  Layers,
  ShoppingCart,
  ChefHat,
  Users,
  Tag,
  Factory,
  IndianRupee,
  Settings,
  Database,
  ClipboardList,
  Link,
  BookOpen,
  ListOrdered,
  Boxes,
  UserCog,
  FileSpreadsheet,
} from 'lucide-react';

const ALL_TABLES = [
  { name: 'ingredients',         label: 'Ingredients',          icon: Package,        color: 'text-orange-500',  bg: 'bg-orange-50' },
  { name: 'compounds',           label: 'Compounds',            icon: Layers,         color: 'text-green-500',   bg: 'bg-green-50' },
  { name: 'compound_ingredients',label: 'Compound Ingredients', icon: Link,           color: 'text-green-400',   bg: 'bg-green-50' },
  { name: 'products',            label: 'Products',             icon: ShoppingCart,   color: 'text-amber-500',   bg: 'bg-amber-50' },
  { name: 'product_ingredients', label: 'Product Ingredients',  icon: Link,           color: 'text-amber-400',   bg: 'bg-amber-50' },
  { name: 'product_compounds',   label: 'Product Compounds',    icon: Boxes,          color: 'text-amber-600',   bg: 'bg-amber-50' },
  { name: 'product_prices',      label: 'Product Prices',       icon: IndianRupee,    color: 'text-purple-500',  bg: 'bg-purple-50' },
  { name: 'categories',          label: 'Categories',           icon: Tag,            color: 'text-purple-500',  bg: 'bg-purple-50' },
  { name: 'recipes',             label: 'Recipes',              icon: ChefHat,        color: 'text-orange-500',  bg: 'bg-orange-50' },
  { name: 'recipe_instructions', label: 'Recipe Instructions',  icon: ListOrdered,    color: 'text-orange-400',  bg: 'bg-orange-50' },
  { name: 'recipe_products',     label: 'Recipe Products',      icon: BookOpen,       color: 'text-orange-600',  bg: 'bg-orange-50' },
  { name: 'recipe_compounds',    label: 'Recipe Compounds',     icon: BookOpen,       color: 'text-red-500',     bg: 'bg-red-50' },
  { name: 'clients',             label: 'Clients',              icon: Users,          color: 'text-green-500',   bg: 'bg-green-50' },
  { name: 'orders',              label: 'Orders',               icon: ClipboardList,  color: 'text-amber-500',   bg: 'bg-amber-50' },
  { name: 'order_products',      label: 'Order Products',       icon: FileSpreadsheet,color: 'text-amber-400',   bg: 'bg-amber-50' },
  { name: 'work_orders',         label: 'Work Orders',          icon: Factory,        color: 'text-green-600',   bg: 'bg-green-50' },
  { name: 'work_order_products', label: 'Work Order Products',  icon: Database,       color: 'text-green-400',   bg: 'bg-green-50' },
  { name: 'stock_allocation',    label: 'Stock Allocations',    icon: Boxes,          color: 'text-blue-500',    bg: 'bg-blue-50' },
  { name: 'company_settings',    label: 'Company Settings',     icon: Settings,       color: 'text-slate-500',   bg: 'bg-slate-50' },
  { name: 'company_params',      label: 'Company Params',       icon: Settings,       color: 'text-slate-400',   bg: 'bg-slate-50' },
  { name: 'profiles',            label: 'User Profiles',        icon: UserCog,        color: 'text-blue-600',    bg: 'bg-blue-50' },
];

async function fetchAllRows(tableName: string): Promise<any[]> {
  const pageSize = 1000;
  let page = 0;
  const all: any[] = [];

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await (supabase as any)
      .from(tableName)
      .select('*')
      .range(from, to);

    if (error) throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  return all;
}

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any): string => {
    if (v === null || v === undefined) return '';
    const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))];
  return lines.join('\n');
}

export function BackupPage() {
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [progress, setProgress] = useState('');

  const { data: counts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ['backup-counts'],
    queryFn: async () => {
      const results = await Promise.all(
        ALL_TABLES.map(async table => {
          const { count, error } = await (supabase as any)
            .from(table.name)
            .select('*', { count: 'exact', head: true });
          return { name: table.name, count: error ? 0 : (count ?? 0) };
        })
      );
      return Object.fromEntries(results.map(r => [r.name, r.count])) as Record<string, number>;
    },
  });

  const totalRecords = counts ? Object.values(counts).reduce((s, c) => s + c, 0) : 0;

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('foodmosaic-backup');

      for (let i = 0; i < ALL_TABLES.length; i++) {
        const table = ALL_TABLES[i];
        setProgress(`Exporting ${table.label} (${i + 1}/${ALL_TABLES.length})…`);
        const rows = await fetchAllRows(table.name);
        const csv = toCSV(rows);
        folder!.file(`${table.name}.csv`, csv);
      }

      setProgress('Creating ZIP file…');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `foodmosaic-backup-${ts}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Backup complete', description: `${ALL_TABLES.length} tables exported successfully.` });
    } catch (err: any) {
      toast({ title: 'Backup failed', description: err.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setIsBackingUp(false);
      setProgress('');
    }
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
            <DatabaseBackup className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Data Backup</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isLoadingCounts
                ? 'Loading record counts…'
                : `${totalRecords.toLocaleString()} total records across ${ALL_TABLES.length} tables`}
            </p>
          </div>
        </div>

        <Button
          onClick={handleBackup}
          disabled={isBackingUp}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg gap-2 min-w-[180px]"
        >
          {isBackingUp ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Backing up…
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Perform Backup
            </>
          )}
        </Button>
      </div>

      {/* Progress */}
      {isBackingUp && progress && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-700 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          {progress}
        </div>
      )}

      {/* Table Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ALL_TABLES.map(table => {
          const count = counts?.[table.name] ?? 0;
          const Icon = table.icon;

          return (
            <Card key={table.name} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 ${table.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${table.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 truncate">{table.label}</p>
                  <p className={`text-2xl font-bold ${table.color}`}>
                    {isLoadingCounts ? '…' : count.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 font-mono truncate">{table.name}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-500">
        <strong className="text-slate-700">What's included:</strong> All {ALL_TABLES.length} database tables are exported as individual
        CSV files and packaged into a single ZIP archive. The backup file is saved directly to your
        browser's Downloads folder. No data is sent to any external server.
      </div>
    </div>
  );
}
