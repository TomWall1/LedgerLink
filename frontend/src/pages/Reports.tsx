import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { mockDashboardMetrics } from '../data/mockData';
import { useToast } from '../hooks/useToast';

export interface ReportsProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'detailed' | 'audit';
  formats: ('pdf' | 'csv' | 'xlsx')[];
  icon: React.ReactNode;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  status: 'generating' | 'ready' | 'error';
  downloadUrl?: string;
  size?: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'reconciliation-summary',
    name: 'Reconciliation Summary',
    description: 'High-level overview of matching results with key metrics and trends',
    type: 'summary',
    formats: ['pdf', 'csv'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'detailed-matches',
    name: 'Detailed Match Report',
    description: 'Complete breakdown of all matched, mismatched, and unmatched invoices',
    type: 'detailed',
    formats: ['pdf', 'csv', 'xlsx'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'audit-trail',
    name: 'Audit Trail Report',
    description: 'Comprehensive audit trail for compliance and review purposes',
    type: 'audit',
    formats: ['pdf', 'xlsx'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'counterparty-analysis',
    name: 'Counterparty Analysis',
    description: 'Performance analysis by customer/vendor with reconciliation patterns',
    type: 'summary',
    formats: ['pdf', 'csv'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'discrepancy-report',
    name: 'Discrepancy Analysis',
    description: 'Focus on mismatched items with root cause analysis and recommendations',
    type: 'detailed',
    formats: ['pdf', 'csv'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
  {
    id: 'monthly-trending',
    name: 'Monthly Trending',
    description: 'Month-over-month trends in reconciliation performance and accuracy',
    type: 'summary',
    formats: ['pdf', 'csv'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

const mockGeneratedReports: GeneratedReport[] = [
  {
    id: 'rep-001',
    name: 'January 2024 Reconciliation Summary',
    type: 'Reconciliation Summary',
    createdAt: '2024-01-30T10:30:00Z',
    status: 'ready',
    downloadUrl: '#',
    size: '2.4 MB',
  },
  {
    id: 'rep-002',
    name: 'Q4 2023 Audit Trail Report',
    type: 'Audit Trail Report',
    createdAt: '2024-01-28T14:15:00Z',
    status: 'ready',
    downloadUrl: '#',
    size: '15.7 MB',
  },
  {
    id: 'rep-003',
    name: 'Acme Corp Counterparty Analysis',
    type: 'Counterparty Analysis',
    createdAt: '2024-01-26T09:45:00Z',
    status: 'generating',
  },
];

const Reports: React.FC<ReportsProps> = ({ isLoggedIn, onLogin }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState(mockGeneratedReports);
  const { success, error, info } = useToast();
  
  if (!isLoggedIn) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-h2 font-bold text-neutral-900 mb-4">
            Account Required
          </h2>
          <p className="text-body-lg text-neutral-600 mb-8">
            Please create an account to generate and access detailed reconciliation reports. 
            Reports include audit trails, compliance documentation, and analytics.
          </p>
          <Button variant="primary" onClick={onLogin}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }
  
  const handleGenerateReport = async () => {
    if (!selectedTemplate || !selectedFormat) {
      error('Please select a report template and format');
      return;
    }
    
    if (!dateRange.start || !dateRange.end) {
      error('Please select a date range for the report');
      return;
    }
    
    setIsGenerating(true);
    
    const template = reportTemplates.find(t => t.id === selectedTemplate);
    
    // Simulate report generation
    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: `rep-${Date.now()}`,
        name: `${template?.name} - ${dateRange.start} to ${dateRange.end}`,
        type: template?.name || 'Unknown',
        createdAt: new Date().toISOString(),
        status: 'ready',
        downloadUrl: '#',
        size: `${(Math.random() * 10 + 1).toFixed(1)} MB`,
      };
      
      setGeneratedReports(prev => [newReport, ...prev]);
      setIsGenerating(false);
      
      success(`${template?.name} generated successfully!`);
      
      // Reset form
      setSelectedTemplate('');
      setSelectedFormat('');
      setDateRange({ start: '', end: '' });
    }, 3000);
  };
  
  const handleDownload = (reportId: string) => {
    const report = generatedReports.find(r => r.id === reportId);
    if (report?.status === 'ready') {
      success(`Downloading ${report.name}`);
      // In a real app, this would trigger the actual download
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="success">Ready</Badge>;
      case 'generating':
        return <Badge variant="warning">Generating</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const selectedTemplateData = reportTemplates.find(t => t.id === selectedTemplate);
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900">Reports</h1>
          <p className="mt-1 text-body text-neutral-600">
            Generate comprehensive reconciliation reports for analysis and compliance
          </p>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Total Invoices
                </p>
                <p className="mt-2 text-h3 font-bold text-neutral-900">
                  {mockDashboardMetrics.totalInvoices.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Match Rate
                </p>
                <p className="mt-2 text-h3 font-bold text-success-600">
                  {Math.round((mockDashboardMetrics.matchedInvoices / mockDashboardMetrics.totalInvoices) * 100)}%
                </p>
              </div>
              <div className="p-2 bg-success-100 rounded-lg">
                <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Avg Confidence
                </p>
                <p className="mt-2 text-h3 font-bold text-primary-600">
                  {mockDashboardMetrics.averageMatchConfidence}%
                </p>
              </div>
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Reports Generated
                </p>
                <p className="mt-2 text-h3 font-bold text-neutral-900">
                  {generatedReports.length}
                </p>
              </div>
              <div className="p-2 bg-neutral-100 rounded-lg">
                <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Generator */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-neutral-900">
            Generate New Report
          </h2>
          <p className="text-body text-neutral-600">
            Select a report template and customize your parameters
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Report Template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all duration-120 ${
                      selectedTemplate === template.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedTemplate === template.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-body font-medium text-neutral-900">
                          {template.name}
                        </h3>
                        <p className="text-small text-neutral-600 mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center space-x-1 mt-2">
                          {template.formats.map((format) => (
                            <Badge key={format} variant="default" className="text-xs">
                              {format.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Configuration */}
            {selectedTemplate && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Output Format
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  >
                    <option value="">Select format...</option>
                    {selectedTemplateData?.formats.map((format) => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            )}
            
            {/* Generate Button */}
            {selectedTemplate && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerateReport}
                  isLoading={isGenerating}
                  className="min-w-[200px]"
                >
                  {isGenerating ? 'Generating report...' : 'Generate report'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h3 font-semibold text-neutral-900">
                Generated Reports
              </h2>
              <p className="text-body text-neutral-600">
                Download and manage your reconciliation reports
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {generatedReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-h3 font-medium text-neutral-900 mb-2">
                No reports yet
              </h3>
              <p className="text-body text-neutral-600">
                Generate your first report using the template selector above.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="font-medium text-neutral-900">
                        {report.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-neutral-600">
                        {report.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-neutral-600">
                        {formatDate(report.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-neutral-600">
                        {report.size || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {report.status === 'ready' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleDownload(report.id)}
                            >
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              Share
                            </Button>
                          </>
                        )}
                        {report.status === 'generating' && (
                          <div className="flex items-center space-x-2 text-neutral-500">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm">Generating...</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { Reports };