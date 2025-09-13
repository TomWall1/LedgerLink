import React from 'react';
import { cn } from '../../utils/cn';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: () => void;
}

export interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-neutral-200', className)}>
        {children}
      </table>
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn('bg-neutral-50', className)}>
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn('bg-white divide-y divide-neutral-200', className)}>
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className, 
  expandable, 
  expanded, 
  onToggleExpand,
  onClick 
}) => {
  const handleClick = () => {
    if (expandable && onToggleExpand) {
      onToggleExpand();
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <tr 
      className={cn(
        'hover:bg-neutral-50 transition-colors duration-120',
        expandable && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      {expandable && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-neutral-500 w-8">
          <svg 
            className={cn(
              'w-4 h-4 transition-transform duration-120',
              expanded && 'rotate-90'
            )} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </td>
      )}
      {children}
    </tr>
  );
};

const TableHead: React.FC<TableHeadProps> = ({ 
  children, 
  className, 
  sortable,
  sortDirection,
  onSort 
}) => {
  return (
    <th 
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider',
        sortable && 'cursor-pointer hover:text-neutral-700 select-none',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <svg 
              className={cn(
                'w-3 h-3',
                sortDirection === 'asc' ? 'text-primary-600' : 'text-neutral-300'
              )} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <svg 
              className={cn(
                'w-3 h-3 -mt-1',
                sortDirection === 'desc' ? 'text-primary-600' : 'text-neutral-300'
              )} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
};

const TableCell: React.FC<TableCellProps> = ({ children, className, colSpan }) => {
  return (
    <td 
      className={cn('px-6 py-4 whitespace-nowrap text-sm text-neutral-900', className)}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };