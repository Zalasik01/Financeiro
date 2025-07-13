import { useState, useMemo } from 'react';
import { SortDirection } from '@/components/ui/SortableTableHeader';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function useTableSort<T>(data: T[], defaultSortKey?: string) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: defaultSortKey || '',
    direction: null
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      
      if (prev.direction === 'desc') {
        return { key: '', direction: null };
      }
      
      return { key, direction: 'asc' };
    });
  };

  return {
    sortedData,
    sortConfig,
    handleSort
  };
}

// Função auxiliar para acessar propriedades aninhadas
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}
