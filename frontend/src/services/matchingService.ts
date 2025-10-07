/**
 * Matching Service
 * 
 * This service handles all communication between the frontend and backend
 * for invoice matching operations. Think of it as a "messenger" that knows
 * how to talk to your backend API.
 */

import { apiClient, ApiResponse } from './api';
import {
  MatchingResults,
  MatchingHistoryResponse,
  UploadMatchingRequest,
  DateFormat,
  TransactionRecord
} from '../types/matching';

class MatchingService {
  /**
   * Upload CSV Files and Run Matching
   * 
   * Takes two CSV files and sends them to the backend for processing.
   * This is like sending documents to an accountant for reconciliation.
   * 
   * @param company1File - First company's CSV file (e.g., your invoices)
   * @param company2File - Second company's CSV file (e.g., customer's payments)
   * @param dateFormat1 - How dates are formatted in file 1
   * @param dateFormat2 - How dates are formatted in file 2
   * @param notes - Optional notes about this matching operation
   * @returns Promise with matching results
   */
  async uploadAndMatch(
    company1File: File,
    company2File: File,
    dateFormat1: DateFormat = 'DD/MM/YYYY',
    dateFormat2: DateFormat = 'DD/MM/YYYY',
    notes?: string
  ): Promise<MatchingResults> {
    try {
      // Create FormData - this is how we send files to the server
      const formData = new FormData();
      formData.append('company1File', company1File);
      formData.append('company2File', company2File);
      formData.append('dateFormat1', dateFormat1);
      formData.append('dateFormat2', dateFormat2);
      
      if (notes) {
        formData.append('notes', notes);
      }

      // Send request to backend
      const response = await apiClient.post<ApiResponse<{ results: MatchingResults }>>(
        '/matching/upload-and-match',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 seconds timeout for large files
        }
      );

      if (response.data.success) {
        return response.data.data.results;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      // Provide helpful error messages
      if (error.response?.status === 413) {
        throw new Error('Files are too large. Please use files smaller than 10MB.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid file format. Please upload CSV files.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. Please try with smaller files.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Upload failed');
      }
    }
  }

  /**
   * Match Data from ERP Systems
   * 
   * This is for when data comes from accounting systems like Xero
   * instead of CSV files.
   * 
   * @param company1Data - First company's transaction data
   * @param company2Data - Second company's transaction data  
   * @param options - Additional options for matching
   * @returns Promise with matching results
   */
  async matchFromERP(
    company1Data: TransactionRecord[],
    company2Data: TransactionRecord[],
    options: {
      dateFormat1?: DateFormat;
      dateFormat2?: DateFormat;
      sourceType1?: string;
      sourceType2?: string;
      counterpartyId?: string;
      notes?: string;
    } = {}
  ): Promise<MatchingResults> {
    try {
      const response = await apiClient.post<ApiResponse<{ results: MatchingResults }>>(
        '/matching/match-from-erp',
        {
          company1Data,
          company2Data,
          dateFormat1: options.dateFormat1 || 'DD/MM/YYYY',
          dateFormat2: options.dateFormat2 || 'DD/MM/YYYY',
          sourceType1: options.sourceType1 || 'erp',
          sourceType2: options.sourceType2 || 'erp',
          counterpartyId: options.counterpartyId,
          notes: options.notes,
        }
      );

      if (response.data.success) {
        return response.data.data.results;
      } else {
        throw new Error(response.data.message || 'ERP matching failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'ERP matching failed');
    }
  }

  /**
   * Get Specific Matching Results
   * 
   * Retrieves previously saved matching results by their ID.
   * Like looking up a file in your filing cabinet.
   * 
   * @param matchId - Unique identifier for the matching result
   * @returns Promise with matching results
   */
  async getMatchingResult(matchId: string): Promise<MatchingResults> {
    try {
      const response = await apiClient.get<MatchingResults>(`/matching/results/${matchId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Matching result not found');
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch result');
    }
  }

  /**
   * Get Matching History
   * 
   * Gets a list of all previous matching operations for your company.
   * Like viewing your reconciliation history.
   * 
   * @param limit - Maximum number of records to return
   * @returns Promise with history and statistics
   */
  async getMatchingHistory(limit: number = 10): Promise<MatchingHistoryResponse> {
    try {
      const response = await apiClient.get<MatchingHistoryResponse>('/matching/history', {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      // Check specifically for 404 or endpoint not found errors
      if (error.response?.status === 404 || 
          error.message?.includes('endpoint not found') || 
          error.message?.includes('backend implementation')) {
        throw new Error('API endpoint not found - history feature not yet implemented');
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch history');
    }
  }

  /**
   * Delete Matching Result
   * 
   * Permanently removes a matching result from the system.
   * Use with caution!
   * 
   * @param matchId - Unique identifier for the matching result
   * @returns Promise that resolves when deletion is complete
   */
  async deleteMatchingResult(matchId: string): Promise<void> {
    try {
      await apiClient.delete(`/matching/results/${matchId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Matching result not found');
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete result');
    }
  }

  /**
   * Export Matching Results to CSV
   * 
   * Downloads a CSV file containing all the matching results.
   * Perfect for sharing with your accountant or importing into Excel.
   * 
   * @param matchId - Unique identifier for the matching result
   * @returns Promise that triggers a file download
   */
  async exportToCSV(matchId: string): Promise<void> {
    try {
      const response = await apiClient.post(`/matching/export/${matchId}`, {}, {
        responseType: 'blob', // Important: tells axios this is a file download
      });

      // Create a download link and trigger it
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `matching_results_${matchId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Matching result not found');
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to export results');
    }
  }

  /**
   * Validate CSV File
   * 
   * Checks if a CSV file has the right format before uploading.
   * This helps catch problems early.
   * 
   * @param file - The CSV file to validate
   * @returns Promise with validation result and preview data
   */
  async validateCSVFile(file: File): Promise<{
    isValid: boolean;
    error?: string;
    previewData?: {
      headers: string[];
      rows: string[][];
      totalRows: number;
    };
  }> {
    return new Promise((resolve) => {
      // Check file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        resolve({
          isValid: false,
          error: 'Please select a CSV file (.csv extension required)'
        });
        return;
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        resolve({
          isValid: false,
          error: 'File too large. Maximum size is 10MB.'
        });
        return;
      }

      // Read and parse a sample of the file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            resolve({
              isValid: false,
              error: 'CSV must have at least a header row and one data row'
            });
            return;
          }

          // Parse headers and first few rows
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const rows = lines.slice(1, 6).map(line => 
            line.split(',').map(cell => cell.trim().replace(/"/g, ''))
          );

          resolve({
            isValid: true,
            previewData: {
              headers,
              rows,
              totalRows: lines.length - 1
            }
          });
        } catch (error) {
          resolve({
            isValid: false,
            error: 'Invalid CSV format'
          });
        }
      };

      reader.onerror = () => {
        resolve({
          isValid: false,
          error: 'Error reading file'
        });
      };

      // Read only first 50KB for validation
      const blob = file.slice(0, 50 * 1024);
      reader.readAsText(blob);
    });
  }
}

// Export a single instance that can be used throughout the app
export const matchingService = new MatchingService();
export default matchingService;
