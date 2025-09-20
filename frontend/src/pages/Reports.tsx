import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

interface Report {
  id: string;
  name: string;
  type: 'reconciliation' | 'matching' | 'discrepancy' | 'audit';
  description: string;
  dateRange: string;
  status: 'ready' | 'generating' | 'failed';
  generatedAt?: string;
  fileSize?: string;
  downloadUrl?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  type: 'reconciliation' | 'matching' | 'discrepancy' | 'audit';
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
}

export const Reports: React.FC = () => {
  const [generateModal, setGenerateModal] = useState<{ open: boolean; template?: ReportTemplate }>({ open: false });
  const [selectedDateRange, setSelectedDateRange] = useState('last_30_days');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  const [selectedCounterparty, setSelectedCounterparty] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Real reports will be fetched from backend
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // TODO: Fetch real reports from backend
    // const fetchReports = async () => {
    //   setLoading(true);
    //   try {
    //     const response = await fetch('/api/reports');
    //     const data = await response.json();
    //     setReports(data);
    //   } catch (error) {
    //     console.error('Failed to fetch reports:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchReports();
  }, []);
  
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'reconciliation',
      name: 'Reconciliation Summary',
      type: 'reconciliation',
      description: 'Comprehensive overview of matched and unmatched transactions with financial summaries',
      popular: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'matching',
      name: 'Matching Results',
      type: 'matching',
      description: 'Detailed breakdown of invoice matching with confidence scores and match criteria',
      popular: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'discrepancy',
      name: 'Discrepancy Analysis',
      type: 'discrepancy',
      description: 'Focus on unmatched transactions, variances, and potential issues requiring attention',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      type: 'audit',
      description: 'Complete audit trail of all reconciliation activities and system changes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];
  
  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'ready':
        return <Badge variant="success">Ready</Badge>;
      case 'generating':
        return <Badge variant="warning">Generating</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  
  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'reconciliation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'matching':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'discrepancy':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };
  
  const handleGenerateReport = () => {
    if (!generateModal.template) return;
    
    // TODO: Generate report via backend API
    const newReport: Report = {
      id: Date.now().toString(),
      name: `${generateModal.template.name} - ${new Date().toLocaleDateString()}`,
      type: generateModal.template.type,
      description: generateModal.template.description,
      dateRange: selectedDateRange === 'custom' 
        ? `${customDateFrom} - ${customDateTo}`
        : selectedDateRange.replace('_', ' '),
      status: 'generating'
    };
    
    setReports(prev => [newReport, ...prev]);
    setGenerateModal({ open: false });
    
    // Simulate report generation for now
    setTimeout(() => {
      setReports(prev => 
        prev.map(r => 
          r.id === newReport.id
            ? {
                ...r,
                status: 'ready' as const,
                generatedAt: 'Just now',
                fileSize: '1.8 MB',
                downloadUrl: '#'
              }
            : r
        )
      );
    }, 3000);
  };
  
  const handleDownload = (report: Report) => {
    // TODO: Implement actual file download
    console.log('Downloading report:', report.name);
  };
  
  const handleDelete = (reportId: string) => {
    // TODO: Delete via backend API
    setReports(prev => prev.filter(r => r.id !== reportId));
  };
  
  const readyReports = reports.filter(r => r.status === 'ready').length;
  const generatingReports = reports.filter(r => r.status === 'generating').length;
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-neutral-900 mb-2">Reports</h1>
        <p className="text-body-lg text-neutral-600">
          Generate and download comprehensive reports for reconciliation results, matching analysis, and audit trails.
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">
                  Total Reports
                </p>
                <p className="text-h1 font-bold text-neutral-900 mt-1">
                  {reports.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">
                  Ready to Download
                </p>
                <p className="text-h1 font-bold text-success mt-1">
                  {readyReports}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">
                  Generating
                </p>
                <p className="text-h1 font-bold text-warning mt-1">
                  {generatingReports}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Templates */}
      <div className="mb-12">
        <h2 className="text-h2 text-neutral-900 mb-6">Generate New Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow duration-240 cursor-pointer" 
                  onClick={() => setGenerateModal({ open: true, template })}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <div className="text-primary-600">{template.icon}</div>
                  </div>
                  {template.popular && <Badge variant="default">Popular</Badge>}
                </div>
                <h3 className="text-h3 text-neutral-900 mt-4">{template.name}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-body text-neutral-600">{template.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">
                  Generate Report
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Existing Reports */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-h2 text-neutral-900">Recent Reports</h2>
          {reports.length > 0 && (
            <div className="flex space-x-2">
              <Input 
                placeholder="Search reports..."
                className="w-64"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-h3 text-neutral-900 mb-2">No reports yet</h3>
              <p className="text-body text-neutral-600 max-w-md mx-auto mb-6">
                Start by uploading invoice data or connecting your accounting system, then generate reports to get insights into your reconciliation data.
              </p>
              <Button 
                variant="primary"
                onClick={() => reportTemplates[0] && setGenerateModal({ open: true, template: reportTemplates[0] })}
              >
                Generate Your First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <div className="text-neutral-600">{getTypeIcon(report.type)}</div>
                      </div>
                      <div>
                        <h3 className="text-body font-medium text-neutral-900">{report.name}</h3>
                        <p className="text-small text-neutral-600">{report.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-small text-neutral-500">
                          <span>{report.dateRange}</span>
                          {report.fileSize && <span>• {report.fileSize}</span>}
                          {report.generatedAt && <span>• Generated {report.generatedAt}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(report.status)}
                      
                      {report.status === 'ready' && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleDownload(report)}
                          leftIcon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          }
                        >
                          Download
                        </Button>
                      )}
                      
                      {report.status === 'generating' && (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-small text-warning">Generating...</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-2 hover:bg-error-100 rounded transition-colors duration-120"
                        title="Delete report"
                      >
                        <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Generate Report Modal */}
      <Modal
        isOpen={generateModal.open}
        onClose={() => setGenerateModal({ open: false })}
        title={`Generate ${generateModal.template?.name || ''}`}
        description="Configure report parameters and generate your custom report"
        size="md"
      >
        {generateModal.template && (
          <div className="space-y-6">
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <div className="text-primary-600">{generateModal.template.icon}</div>
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900">{generateModal.template.name}</h4>
                  <p className="text-small text-neutral-600">{generateModal.template.description}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Date Range
                </label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="input w-full"
                >
                  <option value="last_7_days">Last 7 days</option>
                  <option value="last_30_days">Last 30 days</option>
                  <option value="last_90_days">Last 90 days</option>
                  <option value="current_month">Current month</option>
                  <option value="previous_month">Previous month</option>
                  <option value="current_quarter">Current quarter</option>
                  <option value="current_year">Current year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'csv')}
                  className="input w-full"
                >
                  <option value="pdf">PDF Report</option>
                  <option value="csv">CSV Data Export</option>
                </select>
              </div>
            </div>
            
            {selectedDateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="From Date"
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                />
                <Input
                  label="To Date"
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                />
              </div>
            )}
            
            {generateModal.template.type === 'matching' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Counterparty Filter (Optional)
                </label>
                <select
                  value={selectedCounterparty}
                  onChange={(e) => setSelectedCounterparty(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All counterparties</option>
                  {/* Real counterparties will be loaded from backend */}
                </select>
              </div>
            )}
            
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-medium text-primary-900 mb-2">Report Will Include:</h4>
              <ul className="text-small text-primary-700 space-y-1">
                <li>• Executive summary with key metrics</li>
                <li>• Detailed transaction analysis</li>
                <li>• Match confidence breakdowns</li>
                <li>• Exception handling recommendations</li>
                {selectedFormat === 'pdf' && <li>• Visual charts and graphs</li>}
                {selectedFormat === 'csv' && <li>• Raw data for further analysis</li>}
              </ul>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                variant="primary"
                onClick={handleGenerateReport}
                className="flex-1"
              >
                Generate Report
              </Button>
              <Button
                variant="ghost"
                onClick={() => setGenerateModal({ open: false })}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
