  /**
   * Handle Xero customer selection and data loading
   * CustomerSelectorDropdown now handles fetching invoices and returns complete data
   */
  const handleXeroDataLoad = (data: { invoices: any[]; customerName: string; invoiceCount: number }) => {
    try {
      console.log('📥 [Matches] handleXeroDataLoad called');
      console.log('📥 [Matches] Received data:', JSON.stringify(data, null, 2));
      console.log('📥 [Matches] Data structure check:');
      console.log('   - has invoices?', 'invoices' in data);
      console.log('   - invoices is array?', Array.isArray(data.invoices));
      console.log('   - invoices length:', data.invoices?.length);
      console.log('   - has customerName?', 'customerName' in data);
      console.log('   - has invoiceCount?', 'invoiceCount' in data);
      
      if (data.invoices && data.invoices.length > 0) {
        console.log('📥 [Matches] First invoice check:');
        console.log('   - First invoice:', JSON.stringify(data.invoices[0], null, 2));
        console.log('   - Has id?', 'id' in data.invoices[0]);
        console.log('   - id value:', data.invoices[0].id);
      }
      
      console.log('📥 [Matches] Creating LoadedDataSource object...');
      const loadedData: LoadedDataSource = {
        type: 'xero',
        invoices: data.invoices,
        customerName: data.customerName,
        invoiceCount: data.invoiceCount
      };
      
      console.log('📥 [Matches] LoadedDataSource created:', JSON.stringify(loadedData, null, 2));
      console.log('📥 [Matches] Current dataSource1:', dataSource1 ? 'exists' : 'null');
      console.log('📥 [Matches] Current dataSource2:', dataSource2 ? 'exists' : 'null');

      if (!dataSource1) {
        console.log('📥 [Matches] Setting as dataSource1...');
        setDataSource1(loadedData);
        console.log('✅ [Matches] dataSource1 set successfully');
        showToast(
          `Loaded ${data.invoiceCount} invoice${data.invoiceCount !== 1 ? 's' : ''} from Xero for ${data.customerName}`,
          'success'
        );
      } else {
        console.log('📥 [Matches] Setting as dataSource2...');
        setDataSource2(loadedData);
        console.log('✅ [Matches] dataSource2 set successfully');
        showToast(
          `Loaded ${data.invoiceCount} invoice${data.invoiceCount !== 1 ? 's' : ''} from Xero for ${data.customerName}`,
          'success'
        );
      }
      
      console.log('✅ [Matches] handleXeroDataLoad completed successfully');
    } catch (error: any) {
      console.error('❌ [Matches] Error in handleXeroDataLoad:', error);
      console.error('❌ [Matches] Error stack:', error.stack);
      showToast('Failed to process invoice data', 'error');
    }
  };
