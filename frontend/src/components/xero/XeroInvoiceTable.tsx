import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { XeroInvoice, xeroService } from '../../services/xeroService';
import { cn } from '../../utils/cn';

export interface XeroInvoiceTableProps {
  connectionId: string;
  onError?: (error: string) => void;
  className?: string;
}

interface FilterState {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const XeroInvoiceTable: React.FC<XeroInvoiceTableProps> = ({
  connectionId,
  onError,
  className
}) => {
  const [invoices, setInvoices] = useState<XeroInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });
  
  const [sortField, setSortField] = useState<string>('issue_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    if (connectionId) {
      loadInvoices();
    }
  }, [connectionId, pagination.page, sortField, sortDirection]);
  
  const loadInvoices = async () => {
    if (!connectionId) return;
    
    setLoading(true);
    
    try {
      const result = await xeroService.getInvoices({
        connectionId,
        page: pagination.page,
        limit: pagination.limit,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        status: filters.status || undefined
      });
      
      let sortedInvoices = [...result.invoices];
      
      // Client-side sorting
      sortedInvoices.sort((a, b) => {
        const aVal = a[sortField as keyof XeroInvoice];
        const bVal = b[sortField as keyof XeroInvoice];
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      // Client-side search filtering
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        sortedInvoices = sortedInvoices.filter(invoice => 
          invoice.transaction_number.toLowerCase().includes(searchLower) ||
          invoice.contact_name.toLowerCase().includes(searchLower) ||
          (invoice.reference && invoice.reference.toLowerCase().includes(searchLower))
        );
      }
      
      setInvoices(sortedInvoices);
      setPagination(prev => ({ ...prev, total: result.pagination.total }));
      
    } catch (error: any) {
      console.error('Failed to load invoices:', error);
      onError?.(error.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadInvoices();
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(loadInvoices, 0);
  };
  
  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'open':
      case 'authorised': return 'warning';
      case 'void':
      case 'deleted': return 'error';
      default: return 'default';
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-h3 font-semibold text-neutral-900">Xero Invoices</h3>
            <p className="text-small text-neutral-600 mt-1">
              {pagination.total > 0 && `${pagination.total.toLocaleString()} invoices found`}
            </p>
          </div>
          <Button 
            variant="secondary"
            onClick={loadInvoices}
            disabled={loading}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Input
            placeholder="Search invoices..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          
          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="AUTHORISED">Open</option>
            <option value="PAID">Paid</option>
            <option value="VOIDED">Voided</option>
          </select>
          
          <Input
            type="date"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
          
          <Input
            type="date"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          <Button variant="secondary" size="sm" onClick={applyFilters}>
            Apply Filters
          </Button>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  sortable
                  sortDirection={sortField === 'transaction_number' ? sortDirection : null}
                  onSort={() => handleSort('transaction_number')}
                >
                  Invoice #
                </TableHead>
                <TableHead 
                  sortable
                  sortDirection={sortField === 'issue_date' ? sortDirection : null}
                  onSort={() => handleSort('issue_date')}
                >
                  Date
                </TableHead>
                <TableHead 
                  sortable
                  sortDirection={sortField === 'due_date' ? sortDirection : null}
                  onSort={() => handleSort('due_date')}
                >
                  Due Date
                </TableHead>
                <TableHead 
                  sortable
                  sortDirection={sortField === 'contact_name' ? sortDirection : null}
                  onSort={() => handleSort('contact_name')}
                >
                  Customer
                </TableHead>
                <TableHead 
                  sortable
                  sortDirection={sortField === 'amount' ? sortDirection : null}
                  onSort={() => handleSort('amount')}
                  className="text-right"
                >
                  Amount
                </TableHead>
                <TableHead 
                  sortable
                  sortDirection={sortField === 'status' ? sortDirection : null}
                  onSort={() => handleSort('status')}
                >
                  Status
                </TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading && invoices.length === 0 ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-24"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-32"></div>
                    </TableCell>
                    <TableCell className="animate-pulse text-right">
                      <div className="h-4 bg-neutral-200 rounded w-16 ml-auto"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-6 bg-neutral-200 rounded w-16"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-neutral-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-body">No invoices found</p>
                      <p className="text-small text-neutral-400 mt-1">Try adjusting your filters or refresh the data</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice, index) => (
                  <TableRow key={`${invoice.xero_id}-${index}`}>
                    <TableCell className="font-mono text-small">
                      {invoice.transaction_number}
                    </TableCell>
                    <TableCell>
                      {xeroService.formatDate(invoice.issue_date)}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date ? xeroService.formatDate(invoice.due_date) : '—'}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="truncate" title={invoice.contact_name}>
                        {invoice.contact_name || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {xeroService.formatAmount(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="truncate" title={invoice.reference}>
                        {invoice.reference || '—'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-small text-neutral-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1 || loading}
              >
                Previous
              </Button>
              <span className="text-small text-neutral-600">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit) || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XeroInvoiceTable;