import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { validateCSVFile } from '../middleware/upload';
import csvParser from 'csv-parser';
import fs from 'fs';

interface CSVRecord {
  invoiceNumber: string;
  amount: number;
  date: string;
  counterparty: string;
  reference?: string;
  [key: string]: any;
}

class MatchingController {
  // CSV Demo for non-authenticated users
  public csvDemo = async (req: Request, res: Response): Promise<void> => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.file1 || !files.file2) {
      throw new AppError('Both CSV files are required', 400, true, 'MISSING_FILES');
    }
    
    const file1 = files.file1[0];
    const file2 = files.file2[0];
    
    validateCSVFile(file1);
    validateCSVFile(file2);
    
    try {
      const [records1, records2] = await Promise.all([
        this.parseCSVFile(file1.path),
        this.parseCSVFile(file2.path),
      ]);
      
      // Simple demo matching logic
      const matches = this.performDemoMatching(records1, records2);
      
      res.json({
        success: true,
        message: 'CSV demo matching completed',
        data: {
          file1Records: records1.length,
          file2Records: records2.length,
          matches: matches.length,
          results: matches.slice(0, 10), // Return first 10 matches
          summary: {
            totalMatches: matches.filter(m => m.confidence > 80).length,
            possibleMatches: matches.filter(m => m.confidence > 50 && m.confidence <= 80).length,
            unmatched: Math.max(0, records1.length - matches.length),
          },
        },
      });
    } catch (error) {
      logger.error('CSV demo matching failed:', error);
      throw new AppError('Failed to process CSV files', 500, true, 'CSV_PROCESSING_FAILED');
    }
  };
  
  // Matching Sessions
  
  public getMatchingSessions = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId!;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [sessions, total] = await Promise.all([
      prisma.matchingSession.findMany({
        where: {
          userId,
          companyId,
        },
        include: {
          counterpartyLink: {
            select: {
              id: true,
              ourCustomerName: true,
              theirCompanyName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.matchingSession.count({
        where: {
          userId,
          companyId,
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  };
  
  public createMatchingSession = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId!;
    const {
      name,
      type,
      sourceType,
      sourceConfig,
      targetType,
      targetConfig,
      matchingRules = {},
      counterpartyLinkId,
    } = req.body;
    
    const session = await prisma.matchingSession.create({
      data: {
        name,
        type,
        userId,
        companyId,
        counterpartyLinkId,
        sourceType,
        sourceConfig,
        targetType,
        targetConfig,
        matchingRules,
        confidenceThreshold: matchingRules.autoMatchThreshold || 0.8,
        autoApprove: matchingRules.autoApprove || false,
      },
      include: {
        counterpartyLink: {
          select: {
            ourCustomerName: true,
            theirCompanyName: true,
          },
        },
      },
    });
    
    logger.info('Matching session created', {
      userId,
      companyId,
      sessionId: session.id,
      type,
    });
    
    res.status(201).json({
      success: true,
      message: 'Matching session created successfully',
      data: { session },
    });
  };
  
  public getMatchingSession = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    
    const session = await prisma.matchingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        counterpartyLink: true,
        matchResults: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!session) {
      throw new AppError('Matching session not found', 404, true, 'SESSION_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: { session },
    });
  };
  
  public updateMatchingSession = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    
    const session = await prisma.matchingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
    
    if (!session) {
      throw new AppError('Matching session not found', 404, true, 'SESSION_NOT_FOUND');
    }
    
    if (session.status === 'RUNNING') {
      throw new AppError('Cannot update running session', 400, true, 'SESSION_RUNNING');
    }
    
    const updatedSession = await prisma.matchingSession.update({
      where: { id: sessionId },
      data: req.body,
    });
    
    res.json({
      success: true,
      message: 'Matching session updated successfully',
      data: { session: updatedSession },
    });
  };
  
  public deleteMatchingSession = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    
    const session = await prisma.matchingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
    
    if (!session) {
      throw new AppError('Matching session not found', 404, true, 'SESSION_NOT_FOUND');
    }
    
    if (session.status === 'RUNNING') {
      throw new AppError('Cannot delete running session', 400, true, 'SESSION_RUNNING');
    }
    
    await prisma.matchingSession.delete({
      where: { id: sessionId },
    });
    
    res.json({
      success: true,
      message: 'Matching session deleted successfully',
    });
  };
  
  // Matching Actions
  
  public startMatching = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    
    const session = await prisma.matchingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
    
    if (!session) {
      throw new AppError('Matching session not found', 404, true, 'SESSION_NOT_FOUND');
    }
    
    if (session.status === 'RUNNING') {
      throw new AppError('Session is already running', 400, true, 'SESSION_ALREADY_RUNNING');
    }
    
    // Start matching process
    await prisma.matchingSession.update({
      where: { id: sessionId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
    
    // Simulate matching process (in production, this would be a background job)
    setTimeout(async () => {
      try {
        // Generate mock results
        const mockResults = this.generateMockMatchResults(sessionId);
        
        await Promise.all([
          prisma.matchingSession.update({
            where: { id: sessionId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              totalRecords: mockResults.length,
              processedRecords: mockResults.length,
              matchedRecords: mockResults.filter(r => r.confidence > 80).length,
              unmatchedRecords: mockResults.filter(r => r.confidence <= 50).length,
            },
          }),
          ...mockResults.map(result =>
            prisma.matchResult.create({
              data: {
                matchingSessionId: sessionId,
                sourceInvoiceId: result.sourceInvoiceId,
                targetInvoiceId: result.targetInvoiceId,
                confidence: result.confidence,
                status: result.confidence > 80 ? 'MATCHED' : result.confidence > 50 ? 'PENDING' : 'PENDING',
                matchType: 'AUTOMATIC',
                matchFactors: result.factors,
                discrepancies: result.discrepancies,
              },
            })
          ),
        ]);
        
        logger.info('Matching completed', {
          userId,
          sessionId,
          totalResults: mockResults.length,
        });
      } catch (error) {
        logger.error('Matching failed:', error);
        
        await prisma.matchingSession.update({
          where: { id: sessionId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
          },
        });
      }
    }, 3000);
    
    res.json({
      success: true,
      message: 'Matching started successfully',
    });
  };
  
  public stopMatching = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    
    const session = await prisma.matchingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
    
    if (!session) {
      throw new AppError('Matching session not found', 404, true, 'SESSION_NOT_FOUND');
    }
    
    if (session.status !== 'RUNNING') {
      throw new AppError('Session is not running', 400, true, 'SESSION_NOT_RUNNING');
    }
    
    await prisma.matchingSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
    
    res.json({
      success: true,
      message: 'Matching stopped successfully',
    });
  };
  
  public getMatchingStatus = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    
    const session = await prisma.matchingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        status: true,
        totalRecords: true,
        processedRecords: true,
        matchedRecords: true,
        unmatchedRecords: true,
        startedAt: true,
        completedAt: true,
      },
    });
    
    if (!session) {
      throw new AppError('Matching session not found', 404, true, 'SESSION_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: { status: session },
    });
  };
  
  public getMatchingProgress = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    
    const session = await prisma.matchingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
    
    if (!session) {
      throw new AppError('Matching session not found', 404, true, 'SESSION_NOT_FOUND');
    }
    
    const progress = {
      status: session.status,
      percentage: session.totalRecords > 0 
        ? Math.round((session.processedRecords / session.totalRecords) * 100)
        : 0,
      processed: session.processedRecords,
      total: session.totalRecords,
      matched: session.matchedRecords,
      unmatched: session.unmatchedRecords,
      startedAt: session.startedAt,
      estimatedCompletion: session.startedAt && session.status === 'RUNNING'
        ? new Date(session.startedAt.getTime() + 5 * 60 * 1000) // Estimate 5 minutes
        : null,
    };
    
    res.json({
      success: true,
      data: { progress },
    });
  };
  
  // Match Results
  
  public getMatchResults = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    // Verify session ownership
    const session = await prisma.matchingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
    
    if (!session) {
      throw new AppError('Matching session not found', 404, true, 'SESSION_NOT_FOUND');
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const whereClause: any = { matchingSessionId: sessionId };
    
    if (status) {
      whereClause.status = status;
    }
    
    const [results, total] = await Promise.all([
      prisma.matchResult.findMany({
        where: whereClause,
        include: {
          sourceInvoice: {
            select: {
              invoiceNumber: true,
              amount: true,
              issueDate: true,
              counterpartyName: true,
              reference: true,
            },
          },
        },
        orderBy: { confidence: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.matchResult.count({
        where: whereClause,
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  };
  
  public getMatchResult = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { sessionId, resultId } = req.params;
    
    const result = await prisma.matchResult.findFirst({
      where: {
        id: resultId,
        matchingSession: {
          id: sessionId,
          userId,
        },
      },
      include: {
        sourceInvoice: true,
        matchingSession: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });
    
    if (!result) {
      throw new AppError('Match result not found', 404, true, 'RESULT_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: { result },
    });
  };
  
  public reviewMatchResult = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { sessionId, resultId } = req.params;
    const { status, notes } = req.body;
    
    const result = await prisma.matchResult.findFirst({
      where: {
        id: resultId,
        matchingSession: {
          id: sessionId,
          userId,
        },
      },
    });
    
    if (!result) {
      throw new AppError('Match result not found', 404, true, 'RESULT_NOT_FOUND');
    }
    
    const updatedResult = await prisma.matchResult.update({
      where: { id: resultId },
      data: {
        status,
        notes,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });
    
    logger.info('Match result reviewed', {
      userId,
      sessionId,
      resultId,
      status,
    });
    
    res.json({
      success: true,
      message: 'Match result reviewed successfully',
      data: { result: updatedResult },
    });
  };
  
  // Additional methods for bulk operations, CSV upload, etc.
  
  public uploadCSV = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    
    if (!file) {
      throw new AppError('No file uploaded', 400, true, 'NO_FILE');
    }
    
    validateCSVFile(file);
    
    try {
      const records = await this.parseCSVFile(file.path);
      
      res.json({
        success: true,
        message: 'CSV uploaded and parsed successfully',
        data: {
          filename: file.originalname,
          recordCount: records.length,
          columns: records.length > 0 ? Object.keys(records[0]) : [],
          sample: records.slice(0, 5),
        },
      });
    } catch (error) {
      logger.error('CSV upload failed:', error);
      throw new AppError('Failed to parse CSV file', 400, true, 'CSV_PARSE_FAILED');
    }
  };
  
  // Helper methods
  
  private async parseCSVFile(filePath: string): Promise<CSVRecord[]> {
    return new Promise((resolve, reject) => {
      const records: CSVRecord[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          // Normalize field names and parse data
          const record: CSVRecord = {
            invoiceNumber: data['Invoice Number'] || data['invoice_number'] || data.invoiceNumber || '',
            amount: parseFloat(data['Amount'] || data.amount || '0'),
            date: data['Date'] || data.date || '',
            counterparty: data['Counterparty'] || data['Customer'] || data.counterparty || '',
            reference: data['Reference'] || data.reference || '',
          };
          
          if (record.invoiceNumber && record.amount && record.date) {
            records.push(record);
          }
        })
        .on('end', () => resolve(records))
        .on('error', reject);
    });
  }
  
  private performDemoMatching(records1: CSVRecord[], records2: CSVRecord[]): any[] {
    const matches = [];
    
    for (const record1 of records1) {
      let bestMatch = null;
      let bestConfidence = 0;
      
      for (const record2 of records2) {
        const confidence = this.calculateDemoConfidence(record1, record2);
        
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = record2;
        }
      }
      
      if (bestMatch && bestConfidence > 30) {
        matches.push({
          ourRecord: record1,
          theirRecord: bestMatch,
          confidence: bestConfidence,
          status: bestConfidence > 80 ? 'matched' : bestConfidence > 50 ? 'review' : 'mismatch',
        });
      }
    }
    
    return matches;
  }
  
  private calculateDemoConfidence(record1: CSVRecord, record2: CSVRecord): number {
    let confidence = 0;
    
    // Invoice number match (40% weight)
    if (record1.invoiceNumber === record2.invoiceNumber) {
      confidence += 40;
    } else if (record1.invoiceNumber.includes(record2.invoiceNumber) || 
               record2.invoiceNumber.includes(record1.invoiceNumber)) {
      confidence += 20;
    }
    
    // Amount match (30% weight)
    const amountDiff = Math.abs(record1.amount - record2.amount);
    const amountPercent = amountDiff / Math.max(record1.amount, record2.amount);
    
    if (amountPercent < 0.01) confidence += 30;
    else if (amountPercent < 0.05) confidence += 20;
    else if (amountPercent < 0.1) confidence += 10;
    
    // Date proximity (20% weight)
    const date1 = new Date(record1.date);
    const date2 = new Date(record2.date);
    const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) confidence += 20;
    else if (daysDiff <= 7) confidence += 15;
    else if (daysDiff <= 30) confidence += 5;
    
    // Counterparty match (10% weight)
    if (record1.counterparty.toLowerCase().includes(record2.counterparty.toLowerCase()) ||
        record2.counterparty.toLowerCase().includes(record1.counterparty.toLowerCase())) {
      confidence += 10;
    }
    
    return Math.min(100, confidence);
  }
  
  private generateMockMatchResults(sessionId: string): any[] {
    const results = [];
    const recordCount = Math.floor(Math.random() * 50) + 20;
    
    for (let i = 0; i < recordCount; i++) {
      const confidence = Math.floor(Math.random() * 100);
      
      results.push({
        sourceInvoiceId: `source-${i}`,
        targetInvoiceId: confidence > 30 ? `target-${i}` : null,
        confidence,
        factors: {
          invoiceNumberMatch: Math.floor(Math.random() * 100),
          amountMatch: Math.floor(Math.random() * 100),
          dateMatch: Math.floor(Math.random() * 100),
        },
        discrepancies: confidence < 80 ? ['Amount difference detected'] : [],
      });
    }
    
    return results;
  }
  
  // Placeholder methods for remaining endpoints
  public approveAllMatches = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'All matches approved' });
  };
  
  public rejectAllMatches = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'All matches rejected' });
  };
  
  public bulkReviewMatches = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'Bulk review completed' });
  };
  
  public bulkApproveMatches = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'Bulk approve completed' });
  };
  
  public bulkRejectMatches = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'Bulk reject completed' });
  };
  
  public exportMatchResults = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'Export initiated' });
  };
  
  public getMatchingRules = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, data: { rules: {} } });
  };
  
  public updateMatchingRules = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'Rules updated' });
  };
  
  public getAISuggestions = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, data: { suggestions: [] } });
  };
  
  public getMatchingStatistics = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, data: { statistics: {} } });
  };
  
  public getConfidenceDistribution = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, data: { distribution: {} } });
  };
}

export const matchingController = new MatchingController();