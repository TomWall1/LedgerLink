import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { config } from '../config/config';

class ReportController {
  // Report Management
  
  public getReports = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId!;
    const { page = 1, limit = 20, type, status } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const whereClause: any = {
      userId,
      companyId,
    };
    
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.report.count({ where: whereClause }),
    ]);
    
    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  };
  
  public generateReport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId!;
    const {
      name,
      type,
      format = 'PDF',
      parameters,
      isScheduled = false,
      schedule,
    } = req.body;
    
    // Create report record
    const report = await prisma.report.create({
      data: {
        name,
        type,
        format,
        parameters,
        isScheduled,
        schedule,
        userId,
        companyId,
        status: 'PENDING',
      },
    });
    
    // Start report generation (in background)
    this.processReportGeneration(report.id, type, format, parameters, userId, companyId)
      .catch(error => {
        logger.error('Report generation failed:', {
          reportId: report.id,
          error,
        });
      });
    
    logger.info('Report generation started', {
      userId,
      reportId: report.id,
      type,
    });
    
    res.status(201).json({
      success: true,
      message: 'Report generation started',
      data: { report },
    });
  };
  
  public getReport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: reportId } = req.params;
    
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    });
    
    if (!report) {
      throw new AppError('Report not found', 404, true, 'REPORT_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: { report },
    });
  };
  
  public deleteReport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: reportId } = req.params;
    
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    });
    
    if (!report) {
      throw new AppError('Report not found', 404, true, 'REPORT_NOT_FOUND');
    }
    
    // Delete file if exists
    if (report.filePath && fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }
    
    await prisma.report.delete({
      where: { id: reportId },
    });
    
    logger.info('Report deleted', {
      userId,
      reportId,
    });
    
    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  };
  
  // Report Downloads
  
  public downloadReport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: reportId } = req.params;
    
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    });
    
    if (!report) {
      throw new AppError('Report not found', 404, true, 'REPORT_NOT_FOUND');
    }
    
    if (report.status !== 'COMPLETED' || !report.filePath) {
      throw new AppError('Report not ready for download', 400, true, 'REPORT_NOT_READY');
    }
    
    if (!fs.existsSync(report.filePath)) {
      throw new AppError('Report file not found', 404, true, 'FILE_NOT_FOUND');
    }
    
    const filename = `${report.name}.${report.format.toLowerCase()}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', this.getContentType(report.format));
    
    const fileStream = fs.createReadStream(report.filePath);
    fileStream.pipe(res);
    
    logger.info('Report downloaded', {
      userId,
      reportId,
      filename,
    });
  };
  
  public previewReport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: reportId } = req.params;
    
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    });
    
    if (!report) {
      throw new AppError('Report not found', 404, true, 'REPORT_NOT_FOUND');
    }
    
    // Generate preview data (simplified version)
    const previewData = await this.generateReportPreview(report.type, report.parameters, userId);
    
    res.json({
      success: true,
      data: {
        preview: previewData,
        type: report.type,
        parameters: report.parameters,
      },
    });
  };
  
  // Report Sharing
  
  public shareReport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: reportId } = req.params;
    const { emails, message } = req.body;
    
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    });
    
    if (!report) {
      throw new AppError('Report not found', 404, true, 'REPORT_NOT_FOUND');
    }
    
    if (report.status !== 'COMPLETED') {
      throw new AppError('Report not ready for sharing', 400, true, 'REPORT_NOT_READY');
    }
    
    // In a real implementation, send emails with report links
    logger.info('Report shared', {
      userId,
      reportId,
      recipients: emails,
    });
    
    res.json({
      success: true,
      message: 'Report shared successfully',
    });
  };
  
  public getSharedReport = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    
    // In a real implementation, validate token and return report
    res.json({
      success: true,
      message: 'Shared report access not implemented in demo',
    });
  };
  
  // Scheduled Reports
  
  public getScheduledReports = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId!;
    
    const scheduledReports = await prisma.report.findMany({
      where: {
        userId,
        companyId,
        isScheduled: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({
      success: true,
      data: { scheduledReports },
    });
  };
  
  public scheduleReport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: reportId } = req.params;
    const { schedule, nextRun } = req.body;
    
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    });
    
    if (!report) {
      throw new AppError('Report not found', 404, true, 'REPORT_NOT_FOUND');
    }
    
    await prisma.report.update({
      where: { id: reportId },
      data: {
        isScheduled: true,
        schedule,
        nextRun: nextRun ? new Date(nextRun) : null,
      },
    });
    
    logger.info('Report scheduled', {
      userId,
      reportId,
      schedule,
    });
    
    res.json({
      success: true,
      message: 'Report scheduled successfully',
    });
  };
  
  public unscheduleReport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: reportId } = req.params;
    
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    });
    
    if (!report) {
      throw new AppError('Report not found', 404, true, 'REPORT_NOT_FOUND');
    }
    
    await prisma.report.update({
      where: { id: reportId },
      data: {
        isScheduled: false,
        schedule: null,
        nextRun: null,
      },
    });
    
    res.json({
      success: true,
      message: 'Report unscheduled successfully',
    });
  };
  
  // Report Templates
  
  public getReportTemplates = async (req: Request, res: Response): Promise<void> => {
    const templates = [
      {
        id: 'reconciliation-summary',
        name: 'Reconciliation Summary',
        description: 'High-level overview of matching results',
        parameters: [
          { name: 'dateFrom', type: 'date', required: true },
          { name: 'dateTo', type: 'date', required: true },
          { name: 'includeMatched', type: 'boolean', default: true },
        ],
        formats: ['PDF', 'CSV'],
      },
      {
        id: 'detailed-matches',
        name: 'Detailed Match Report',
        description: 'Complete breakdown of all matches',
        parameters: [
          { name: 'dateFrom', type: 'date', required: true },
          { name: 'dateTo', type: 'date', required: true },
          { name: 'confidenceThreshold', type: 'number', default: 80 },
        ],
        formats: ['PDF', 'CSV', 'XLSX'],
      },
      {
        id: 'audit-trail',
        name: 'Audit Trail Report',
        description: 'Comprehensive audit trail',
        parameters: [
          { name: 'dateFrom', type: 'date', required: true },
          { name: 'dateTo', type: 'date', required: true },
          { name: 'includeSystemChanges', type: 'boolean', default: true },
        ],
        formats: ['PDF', 'XLSX'],
      },
    ];
    
    res.json({
      success: true,
      data: { templates },
    });
  };
  
  public createReportTemplate = async (req: Request, res: Response): Promise<void> => {
    // Custom template creation would be implemented here
    res.json({
      success: true,
      message: 'Custom templates coming soon',
    });
  };
  
  public updateReportTemplate = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: 'Template updated',
    });
  };
  
  public deleteReportTemplate = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: 'Template deleted',
    });
  };
  
  // Report Analytics
  
  public getReportUsageAnalytics = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId!;
    const { dateFrom, dateTo } = req.query;
    
    const whereClause: any = {
      userId,
      companyId,
    };
    
    if (dateFrom && dateTo) {
      whereClause.createdAt = {
        gte: new Date(dateFrom as string),
        lte: new Date(dateTo as string),
      };
    }
    
    const [totalReports, reportsByType, reportsByStatus] = await Promise.all([
      prisma.report.count({ where: whereClause }),
      prisma.report.groupBy({
        by: ['type'],
        where: whereClause,
        _count: { type: true },
      }),
      prisma.report.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true },
      }),
    ]);
    
    const analytics = {
      totalReports,
      reportsByType: reportsByType.map(item => ({
        type: item.type,
        count: item._count.type,
      })),
      reportsByStatus: reportsByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
    };
    
    res.json({
      success: true,
      data: { analytics },
    });
  };
  
  public getReportPerformanceAnalytics = async (req: Request, res: Response): Promise<void> => {
    // Mock performance data
    const performance = {
      averageGenerationTime: '2.5 minutes',
      successRate: 98.5,
      mostPopularFormats: [
        { format: 'PDF', percentage: 65 },
        { format: 'CSV', percentage: 25 },
        { format: 'XLSX', percentage: 10 },
      ],
      peakUsageHours: [9, 10, 14, 15],
    };
    
    res.json({
      success: true,
      data: { performance },
    });
  };
  
  // Quick Reports
  
  public getQuickReconciliationSummary = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId!;
    
    // Mock summary data
    const summary = {
      totalInvoices: 1247,
      matchedInvoices: 1156,
      unmatchedInvoices: 91,
      averageConfidence: 94.2,
      lastUpdate: new Date().toISOString(),
      topCounterparties: [
        { name: 'Acme Corp', matchRate: 98.5, totalInvoices: 245 },
        { name: 'Global Suppliers', matchRate: 96.2, totalInvoices: 189 },
        { name: 'TechFlow Solutions', matchRate: 92.1, totalInvoices: 156 },
      ],
    };
    
    res.json({
      success: true,
      data: { summary },
    });
  };
  
  public getQuickRecentMatches = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    const recentMatches = await prisma.matchResult.findMany({
      where: {
        matchingSession: {
          userId,
        },
      },
      include: {
        sourceInvoice: {
          select: {
            invoiceNumber: true,
            amount: true,
            counterpartyName: true,
          },
        },
        matchingSession: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    res.json({
      success: true,
      data: { recentMatches },
    });
  };
  
  public getQuickCounterpartyBreakdown = async (req: Request, res: Response): Promise<void> => {
    // Mock counterparty breakdown
    const breakdown = [
      { name: 'Acme Corp', matched: 245, unmatched: 5, confidence: 98.5 },
      { name: 'Global Suppliers', matched: 189, unmatched: 8, confidence: 96.2 },
      { name: 'TechFlow Solutions', matched: 144, unmatched: 12, confidence: 92.1 },
      { name: 'Metro Logistics', matched: 89, unmatched: 15, confidence: 85.6 },
    ];
    
    res.json({
      success: true,
      data: { breakdown },
    });
  };
  
  public getQuickDiscrepancySummary = async (req: Request, res: Response): Promise<void> => {
    // Mock discrepancy data
    const discrepancies = {
      totalDiscrepancies: 47,
      byType: [
        { type: 'Amount Difference', count: 23, percentage: 48.9 },
        { type: 'Date Mismatch', count: 15, percentage: 31.9 },
        { type: 'Reference Error', count: 9, percentage: 19.1 },
      ],
      averageAmountDifference: 125.67,
      averageDateDifference: 3.2,
    };
    
    res.json({
      success: true,
      data: { discrepancies },
    });
  };
  
  // Helper Methods
  
  private async processReportGeneration(
    reportId: string,
    type: string,
    format: string,
    parameters: any,
    userId: string,
    companyId: string
  ): Promise<void> {
    try {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'GENERATING' },
      });
      
      // Simulate report generation time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate report file
      const filename = `report_${reportId}.${format.toLowerCase()}`;
      const filePath = path.join(config.upload.path, 'reports', filename);
      
      // Ensure reports directory exists
      const reportsDir = path.dirname(filePath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      if (format === 'PDF') {
        await this.generatePDFReport(filePath, type, parameters);
      } else if (format === 'CSV') {
        await this.generateCSVReport(filePath, type, parameters);
      }
      
      const stats = fs.statSync(filePath);
      
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          filePath,
          fileSize: stats.size,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      
      logger.info('Report generated successfully', {
        reportId,
        type,
        format,
        fileSize: stats.size,
      });
      
    } catch (error) {
      logger.error('Report generation failed:', {
        reportId,
        error,
      });
      
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'FAILED' },
      });
    }
  }
  
  private async generatePDFReport(filePath: string, type: string, parameters: any): Promise<void> {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Header
    doc.fontSize(20).text('LedgerLink Report', 50, 50);
    doc.fontSize(14).text(`Report Type: ${type}`, 50, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 100);
    
    // Content based on report type
    doc.moveDown();
    doc.fontSize(16).text('Summary', 50, 140);
    doc.fontSize(12).text('This is a sample report generated by LedgerLink.', 50, 160);
    doc.text('In a production environment, this would contain actual data.', 50, 180);
    
    // Add some mock data
    doc.moveDown();
    doc.text('Key Metrics:', 50, 220);
    doc.text('• Total Invoices: 1,247', 70, 240);
    doc.text('• Matched Invoices: 1,156', 70, 260);
    doc.text('• Average Confidence: 94.2%', 70, 280);
    
    doc.end();
    
    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }
  
  private async generateCSVReport(filePath: string, type: string, parameters: any): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'invoiceNumber', title: 'Invoice Number' },
        { id: 'amount', title: 'Amount' },
        { id: 'date', title: 'Date' },
        { id: 'counterparty', title: 'Counterparty' },
        { id: 'status', title: 'Status' },
        { id: 'confidence', title: 'Confidence' },
      ],
    });
    
    // Mock data
    const data = [
      {
        invoiceNumber: 'INV-2024-001',
        amount: 1500.00,
        date: '2024-01-15',
        counterparty: 'Acme Corp',
        status: 'Matched',
        confidence: 98.5,
      },
      {
        invoiceNumber: 'INV-2024-002',
        amount: 2750.50,
        date: '2024-01-16',
        counterparty: 'Global Suppliers',
        status: 'Matched',
        confidence: 96.2,
      },
    ];
    
    await csvWriter.writeRecords(data);
  }
  
  private getContentType(format: string): string {
    switch (format.toUpperCase()) {
      case 'PDF': return 'application/pdf';
      case 'CSV': return 'text/csv';
      case 'XLSX': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'application/octet-stream';
    }
  }
  
  private async generateReportPreview(type: string, parameters: any, userId: string): Promise<any> {
    // Generate preview data based on report type
    const preview = {
      title: `${type} Preview`,
      summary: {
        totalRecords: 156,
        dateRange: `${parameters.dateFrom} to ${parameters.dateTo}`,
        generatedAt: new Date().toISOString(),
      },
      sampleData: [
        { field1: 'Sample Value 1', field2: 'Sample Value 2' },
        { field1: 'Sample Value 3', field2: 'Sample Value 4' },
      ],
    };
    
    return preview;
  }
}

export const reportController = new ReportController();