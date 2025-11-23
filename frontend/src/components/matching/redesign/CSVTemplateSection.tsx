/**
 * CSVTemplateSection Component
 * 
 * Always-visible section showing CSV templates and requirements.
 * Provides clear download buttons and lists required/optional columns.
 * 
 * Design inspired by Ledger-Match for simplicity and clarity.
 */

import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { downloadCSVTemplate, getTemplateInfo } from '../../../utils/csvTemplate';

interface CSVTemplateSectionProps {
  onDownload?: () => void; // Optional callback after successful download
}

export const CSVTemplateSection: React.FC<CSVTemplateSectionProps> = ({ onDownload }) => {
  const templateInfo = getTemplateInfo();

  const handleDownload = (type: 'AR' | 'AP') => {
    try {
      downloadCSVTemplate();
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error(`Failed to download ${type} template:`, error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-h3 text-neutral-900">Sample CSV Templates</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="secondary"
            onClick={() => handleDownload('AR')}
            className="w-full"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
            Download AR Template
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleDownload('AP')}
            className="w-full"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
            Download AP Template
          </Button>
        </div>

        {/* CSV Requirements */}
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-h4 text-neutral-900 mb-4">CSV Data Format Requirements</h3>
          
          {/* Required Columns */}
          <div className="mb-6">
            <h4 className="text-body font-semibold text-neutral-900 mb-3">
              Required Columns:
            </h4>
            <ul className="space-y-2">
              {templateInfo.columns.filter(col => col.required).map((col) => (
                <li key={col.name} className="flex items-start space-x-3">
                  <svg 
                    className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <div className="flex-1">
                    <span className="font-mono text-sm text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                      {col.name}
                    </span>
                    <span className="text-small text-neutral-600 ml-2">
                      - {col.description}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional Columns */}
          <div>
            <h4 className="text-body font-semibold text-neutral-900 mb-3">
              Optional Columns:
            </h4>
            <ul className="space-y-2">
              {templateInfo.columns.filter(col => !col.required).map((col) => (
                <li key={col.name} className="flex items-start space-x-3">
                  <svg 
                    className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <div className="flex-1">
                    <span className="font-mono text-sm text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                      {col.name}
                    </span>
                    <span className="text-small text-neutral-600 ml-2">
                      - {col.description}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg 
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div className="text-small text-blue-900">
                <p className="font-medium mb-1">Formatting Tips:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Dates should be in YYYY-MM-DD format (e.g., 2024-01-31)</li>
                  <li>Amounts should be numeric without currency symbols</li>
                  <li>Transaction numbers must be unique within your file</li>
                  <li>Column headers should match exactly (case-sensitive)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVTemplateSection;
