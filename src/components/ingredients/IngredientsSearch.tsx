
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface IngredientsSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function IngredientsSearch({ searchTerm, onSearchChange }: IngredientsSearchProps) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        type="text"
        placeholder="Search ingredients..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
