/**
 * CSV Template Generator
 * 
 * Provides utilities for generating and downloading CSV templates
 * for invoice matching with example data and proper formatting.
 */

/**
 * Generate a CSV template with headers and example rows
 */
export function generateCSVTemplate(): string {
  // Define the headers
  const headers = [
    'transaction_number',
    'date',
    'amount',
    'customer_name',
    'reference',
    'due_date'
  ];

  // Add example rows to show proper format
  const exampleRows = [
    ['INV-001', '2024-01-15', '1500.00', 'Acme Corp', 'PO-12345', '2024-02-15'],
    ['INV-002', '2024-01-20', '2750.50', 'Tech Solutions Ltd', 'PO-12346', '2024-02-20'],
    ['INV-003', '2024-01-25', '890.25', 'Global Industries', '', '2024-02-25']
  ];

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Download the CSV template file
 */
export function downloadCSVTemplate(): void {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ledgerlink_invoice_template.csv';
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get template information for display
 */
export function getTemplateInfo() {
  return {
    filename: 'ledgerlink_invoice_template.csv',
    columns: [
      {
        name: 'transaction_number',
        description: 'Unique invoice or transaction number',
        required: true,
        example: 'INV-001'
      },
      {
        name: 'date',
        description: 'Invoice date in YYYY-MM-DD format',
        required: true,
        example: '2024-01-15'
      },
      {
        name: 'amount',
        description: 'Invoice amount (numeric, can include decimals)',
        required: true,
        example: '1500.00'
      },
      {
        name: 'customer_name',
        description: 'Customer or counterparty name',
        required: false,
        example: 'Acme Corp'
      },
      {
        name: 'reference',
        description: 'Reference number (PO number, contract ID, etc.)',
        required: false,
        example: 'PO-12345'
      },
      {
        name: 'due_date',
        description: 'Payment due date in YYYY-MM-DD format',
        required: false,
        example: '2024-02-15'
      }
    ]
  };
}
