  /**
   * Handle Xero customer selection and data loading
   * CustomerSelectorDropdown now handles fetching invoices and returns complete data
   */
  const handleXeroDataLoad = (data: { invoices: any[]; customerName: string; invoiceCount: number }) => {
    try {
      console.log('📊 Received Xero data:', data.customerName, data.invoiceCount, 'invoices');
      
      const loadedData: LoadedDataSource = {
        type: 'xero',
        invoices: data.invoices,
        customerName: data.customerName,
        invoiceCount: data.invoiceCount
      };

      if (!dataSource1) {
        setDataSource1(loadedData);
        showToast(
          `Loaded ${data.invoiceCount} invoice${data.invoiceCount !== 1 ? 's' : ''} from Xero for ${data.customerName}`,
          'success'
        );
      } else {
        setDataSource2(loadedData);
        showToast(
          `Loaded ${data.invoiceCount} invoice${data.invoiceCount !== 1 ? 's' : ''} from Xero for ${data.customerName}`,
          'success'
        );
      }
    } catch (error: any) {
      console.error('❌ Error processing Xero data:', error);
      showToast('Failed to process invoice data', 'error');
    }
  };
