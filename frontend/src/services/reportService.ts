import { apiClient } from './api';

export interface ReportDateRange {
  preset: string;
  startDate: string;
  endDate: string;
  displayLabel: string;
}

export interface ReportData {
  matchRunsIncluded: number;
  totalPerfectMatches: number;
  totalMismatches: number;
  totalUnmatchedCompany1: number;
  totalUnmatchedCompany2: number;
  averageMatchRate: number;
  totals: {
    company1Total: number;
    company2Total: number;
    variance: number;
  };
  matchRunDetails: Array<{
    matchRunId: string;
    matchRunDate: string;
    perfectMatchCount: number;
    mismatchCount: number;
    unmatchedCompany1Count: number;
    unmatchedCompany2Count: number;
    matchRate: number;
    company1Total: number;
    company2Total: number;
    variance: number;
  }>;
}

export interface BackendReport {
  _id: string;
  name: string;
  type: 'reconciliation' | 'matching' | 'discrepancy' | 'audit';
  description: string;
  format: string;
  status: 'generating' | 'ready' | 'failed';
  dateRange: ReportDateRange;
  parameters?: { counterpartyId?: string };
  fileSize: number;
  generatedAt?: string;
  error?: string;
  data?: ReportData;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateReportRequest {
  name: string;
  type: 'reconciliation' | 'matching' | 'discrepancy' | 'audit';
  description?: string;
  dateRange: string;
  format?: 'csv' | 'pdf';
  customDateFrom?: string;
  customDateTo?: string;
  counterpartyId?: string;
}

class ReportService {
  async getReports(params?: { type?: string; status?: string; page?: number; limit?: number }) {
    const response = await apiClient.get('/reports', { params });
    return response.data;
  }

  async generateReport(request: GenerateReportRequest) {
    const response = await apiClient.post('/reports/generate', request);
    return response.data;
  }

  async getReport(id: string) {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  }

  async downloadReport(id: string, fileName: string) {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob'
    });

    // Trigger browser download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async deleteReport(id: string) {
    const response = await apiClient.delete(`/reports/${id}`);
    return response.data;
  }
}

export const reportService = new ReportService();
