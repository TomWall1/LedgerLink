import React from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-hidden">
      <table className={clsx('min-w-full divide-y divide-neutral-200', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={clsx('bg-neutral-50', className)}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={clsx('bg-white divide-y divide-neutral-200', className)}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className, 
  expandable, 
  expanded, 
  onToggleExpand 
}) => {
  return (
    <tr 
      className={clsx(
        expandable && 'cursor-pointer hover:bg-neutral-50 transition-colors duration-120',
        className
      )}
      onClick={expandable ? onToggleExpand : undefined}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<TableHeadProps> = ({ 
  children, 
  className, 
  sortable, 
  sortDirection, 
  onSort 
}) => {
  return (
    <th 
      className={clsx(
        'px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider',
        sortable && 'cursor-pointer hover:bg-neutral-100 select-none',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <svg 
              className={clsx(
                'w-3 h-3 -mb-1 transition-colors duration-120',
                sortDirection === 'asc' ? 'text-primary-600' : 'text-neutral-400'
              )} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
            </svg>
            <svg 
              className={clsx(
                'w-3 h-3 transition-colors duration-120',
                sortDirection === 'desc' ? 'text-primary-600' : 'text-neutral-400'
              )} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
};

export const TableCell: React.FC<TableCellProps> = ({ children, className, colSpan }) => {
  return (
    <td 
      className={clsx(
        'px-6 py-4 whitespace-nowrap text-sm text-neutral-900',
        className
      )}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};