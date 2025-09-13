import React from 'react';
import { cn } from '../../utils/cn';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="overflow-hidden rounded-md border border-neutral-200">
        <div className="overflow-x-auto">
          <table
            ref={ref}
            className={cn('w-full text-sm', className)}
            {...props}
          >
            {children}
          </table>
        </div>
      </div>
    );
  }
);

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('bg-neutral-50 sticky top-0 z-10', className)}
        {...props}
      >
        {children}
      </thead>
    );
  }
);

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn('bg-white divide-y divide-neutral-200', className)}
        {...props}
      >
        {children}
      </tbody>
    );
  }
);

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, expandable, expanded, onToggleExpand, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'hover:bg-neutral-50 transition-colors duration-120',
          expandable && 'cursor-pointer',
          expanded && 'bg-neutral-50',
          className
        )}
        onClick={expandable ? onToggleExpand : undefined}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortable, sortDirection, onSort, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider',
          sortable && 'cursor-pointer hover:bg-neutral-100 select-none',
          className
        )}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          {sortable && (
            <span className="ml-1">
              {sortDirection === 'asc' ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              ) : sortDirection === 'desc' ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                </svg>
              )}
            </span>
          )}
        </div>
      </th>
    );
  }
);

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn('px-4 py-4 whitespace-nowrap text-neutral-900', className)}
        {...props}
      >
        {children}
      </td>
    );
  }
);

Table.displayName = 'Table';
TableHeader.displayName = 'TableHeader';
TableBody.displayName = 'TableBody';
TableRow.displayName = 'TableRow';
TableHead.displayName = 'TableHead';
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };