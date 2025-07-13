import React from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableTableHeaderProps {
  children: React.ReactNode;
  sortKey?: string;
  currentSort?: {
    key: string;
    direction: SortDirection;
  };
  onSort?: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  children,
  sortKey,
  currentSort,
  onSort,
  align = 'left',
  className = ''
}) => {
  const isSortable = sortKey && onSort;
  const isCurrentSort = currentSort?.key === sortKey;
  const sortDirection = isCurrentSort ? currentSort?.direction : null;

  const handleSort = () => {
    if (isSortable) {
      onSort(sortKey);
    }
  };

  const alignClass = {
    left: 'text-left justify-start',
    center: 'text-center justify-center',
    right: 'text-right justify-end'
  };

  return (
    <th className={`px-4 py-3 bg-gray-50 ${className}`}>
      <div className={`flex items-center gap-2 ${alignClass[align]}`}>
        {isSortable ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSort}
            className="h-auto p-1 font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            {children}
            <div className="flex flex-col">
              {sortDirection === null && <Filter size={12} className="text-gray-400" />}
              {sortDirection === 'asc' && <ChevronUp size={12} className="text-blue-600" />}
              {sortDirection === 'desc' && <ChevronDown size={12} className="text-blue-600" />}
            </div>
          </Button>
        ) : (
          <span className="font-medium text-gray-700">{children}</span>
        )}
      </div>
    </th>
  );
};
