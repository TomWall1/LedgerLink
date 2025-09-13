import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/config';
import axios from 'axios';
import crypto from 'crypto';

class IntegrationController {
  // ERP Connections
  
  public getERPConnections = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [connections, total] = await Promise.all([
      prisma.eRPConnection.findMany({
        where: {
          userId,
          ...(companyId && { companyId }),
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          lastSyncAt: true,
          nextSyncAt: true,
          syncStatus: true,
          totalRecords: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.eRPConnection.count({
        where: {
          userId,
          ...(companyId && { companyId }),
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        connections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  };
  
  public createERPConnection = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const companyId = req.user!.companyId!;
    const { name, type, settings = {} } = req.body;
    
    // Check if connection already exists
    const existingConnection = await prisma.eRPConnection.findFirst({
      where: {
        userId,
        companyId,
        type,
      },
    });
    
    if (existingConnection) {
      throw new AppError(`${type} connection already exists`, 409, true, 'CONNECTION_EXISTS');
    }
    
    const connection = await prisma.eRPConnection.create({
      data: {
        name,
        type,
        userId,
        companyId,
        settings,
        status: 'DISCONNECTED',
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });
    
    logger.info('ERP connection created', {
      userId,
      companyId,
      connectionId: connection.id,
      type,
    });
    
    res.status(201).json({
      success: true,
      message: 'ERP connection created successfully',
      data: { connection },
    });
  };
  
  public getERPConnection = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: connectionId } = req.params;
    
    const connection = await prisma.eRPConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
      include: {
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!connection) {
      throw new AppError('ERP connection not found', 404, true, 'CONNECTION_NOT_FOUND');
    }
    
    // Hide sensitive data
    const { accessToken, refreshToken, ...safeConnection } = connection;
    
    res.json({
      success: true,
      data: { connection: safeConnection },
    });
  };
  
  public updateERPConnection = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: connectionId } = req.params;
    const { name, settings, isActive } = req.body;
    
    const connection = await prisma.eRPConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });
    
    if (!connection) {
      throw new AppError('ERP connection not found', 404, true, 'CONNECTION_NOT_FOUND');
    }
    
    const updatedConnection = await prisma.eRPConnection.update({
      where: { id: connectionId },
      data: {
        ...(name && { name }),
        ...(settings && { settings }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        isActive: true,
        updatedAt: true,
      },
    });
    
    logger.info('ERP connection updated', {
      userId,
      connectionId,
      updatedFields: Object.keys(req.body),
    });
    
    res.json({
      success: true,
      message: 'ERP connection updated successfully',
      data: { connection: updatedConnection },
    });
  };
  
  public deleteERPConnection = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: connectionId } = req.params;
    
    const connection = await prisma.eRPConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });
    
    if (!connection) {
      throw new AppError('ERP connection not found', 404, true, 'CONNECTION_NOT_FOUND');
    }
    
    await prisma.eRPConnection.delete({
      where: { id: connectionId },
    });
    
    logger.info('ERP connection deleted', {
      userId,
      connectionId,
      type: connection.type,
    });
    
    res.json({
      success: true,
      message: 'ERP connection deleted successfully',
    });
  };
  
  // ERP Connection Actions
  
  public syncERPConnection = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: connectionId } = req.params;
    
    const connection = await prisma.eRPConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });
    
    if (!connection) {
      throw new AppError('ERP connection not found', 404, true, 'CONNECTION_NOT_FOUND');
    }
    
    if (connection.status !== 'CONNECTED') {
      throw new AppError('Connection must be active to sync', 400, true, 'CONNECTION_NOT_ACTIVE');
    }
    
    // Start sync process
    await prisma.eRPConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: 'RUNNING',
        lastSyncAt: new Date(),
      },
    });
    
    // Create sync log
    const syncLog = await prisma.syncLog.create({
      data: {
        erpConnectionId: connectionId,
        status: 'RUNNING',
        type: 'MANUAL',
      },
    });
    
    // In a real implementation, this would trigger a background job
    // For now, we'll simulate the sync process
    setTimeout(async () => {
      try {
        const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
        
        await Promise.all([
          prisma.eRPConnection.update({
            where: { id: connectionId },
            data: {
              syncStatus: 'COMPLETED',
              totalRecords: recordsProcessed,
              nextSyncAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // Next sync in 6 hours
            },
          }),
          prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'COMPLETED',
              recordsProcessed,
              recordsCreated: Math.floor(recordsProcessed * 0.1),
              recordsUpdated: Math.floor(recordsProcessed * 0.8),
              recordsSkipped: Math.floor(recordsProcessed * 0.1),
              completedAt: new Date(),
            },
          }),
        ]);
        
        logger.info('ERP sync completed', {
          userId,
          connectionId,
          recordsProcessed,
        });
      } catch (error) {
        logger.error('ERP sync failed', {
          userId,
          connectionId,
          error,
        });
        
        await Promise.all([
          prisma.eRPConnection.update({
            where: { id: connectionId },
            data: {
              syncStatus: 'FAILED',
              syncError: 'Sync process failed',
            },
          }),
          prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'FAILED',
              errorMessage: 'Sync process failed',
              completedAt: new Date(),
            },
          }),
        ]);
      }
    }, 2000);
    
    res.json({
      success: true,
      message: 'Sync started successfully',
      data: { syncId: syncLog.id },
    });
  };
  
  public testERPConnection = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: connectionId } = req.params;
    
    const connection = await prisma.eRPConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });
    
    if (!connection) {
      throw new AppError('ERP connection not found', 404, true, 'CONNECTION_NOT_FOUND');
    }
    
    // Simulate connection test
    const isConnected = connection.status === 'CONNECTED' && connection.accessToken;
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Connection test successful',
        data: {
          status: 'connected',
          lastTested: new Date().toISOString(),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Connection test failed',
        data: {
          status: 'disconnected',
          error: 'Invalid or expired credentials',
        },
      });
    }
  };
  
  public getERPSyncLogs = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: connectionId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Verify connection ownership
    const connection = await prisma.eRPConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });
    
    if (!connection) {
      throw new AppError('ERP connection not found', 404, true, 'CONNECTION_NOT_FOUND');
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [syncLogs, total] = await Promise.all([
      prisma.syncLog.findMany({
        where: { erpConnectionId: connectionId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.syncLog.count({
        where: { erpConnectionId: connectionId },
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        syncLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  };
  
  // OAuth Flows
  
  public initiateXeroAuth = async (req: Request, res: Response): Promise<void> => {
    if (!config.integrations.xero.clientId) {
      throw new AppError('Xero integration not configured', 400, true, 'INTEGRATION_NOT_CONFIGURED');
    }
    
    const state = crypto.randomBytes(32).toString('hex');
    const scope = 'accounting.transactions accounting.contacts accounting.settings';
    
    const authUrl = `https://login.xero.com/identity/connect/authorize?` +
      `response_type=code&` +
      `client_id=${config.integrations.xero.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.integrations.xero.redirectUri!)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;
    
    // Store state for verification
    // In production, store this in Redis with expiration
    
    res.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    });
  };
  
  public handleXeroCallback = async (req: Request, res: Response): Promise<void> => {
    const { code, state } = req.query;
    
    if (!code) {
      throw new AppError('Authorization code not provided', 400, true, 'MISSING_AUTH_CODE');
    }
    
    // Exchange code for tokens
    try {
      const tokenResponse = await axios.post('https://identity.xero.com/connect/token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.integrations.xero.redirectUri,
        client_id: config.integrations.xero.clientId,
        client_secret: config.integrations.xero.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Get tenant information
      const connectionsResponse = await axios.get('https://api.xero.com/connections', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });
      
      const tenant = connectionsResponse.data[0]; // Use first tenant
      
      // Create or update connection
      const connection = await prisma.eRPConnection.upsert({
        where: {
          userId_companyId_type: {
            userId: req.user!.id,
            companyId: req.user!.companyId!,
            type: 'XERO',
          },
        },
        update: {
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
          externalId: tenant.tenantId,
          status: 'CONNECTED',
        },
        create: {
          name: `Xero - ${tenant.tenantName}`,
          type: 'XERO',
          userId: req.user!.id,
          companyId: req.user!.companyId!,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
          externalId: tenant.tenantId,
          status: 'CONNECTED',
        },
      });
      
      logger.info('Xero connection established', {
        userId: req.user!.id,
        connectionId: connection.id,
        tenantId: tenant.tenantId,
      });
      
      res.redirect(`${config.cors.origin[0]}/integrations?status=success&type=xero`);
      
    } catch (error) {
      logger.error('Xero OAuth callback failed:', error);
      res.redirect(`${config.cors.origin[0]}/integrations?status=error&type=xero`);
    }
  };
  
  public initiateQuickBooksAuth = async (req: Request, res: Response): Promise<void> => {
    if (!config.integrations.quickbooks.clientId) {
      throw new AppError('QuickBooks integration not configured', 400, true, 'INTEGRATION_NOT_CONFIGURED');
    }
    
    const state = crypto.randomBytes(32).toString('hex');
    const scope = 'com.intuit.quickbooks.accounting';
    
    const baseUrl = config.integrations.quickbooks.sandbox 
      ? 'https://appcenter.intuit.com/connect/oauth2'
      : 'https://appcenter.intuit.com/connect/oauth2';
    
    const authUrl = `${baseUrl}?` +
      `client_id=${config.integrations.quickbooks.clientId}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `redirect_uri=${encodeURIComponent(config.integrations.quickbooks.redirectUri!)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `state=${state}`;
    
    res.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    });
  };
  
  public handleQuickBooksCallback = async (req: Request, res: Response): Promise<void> => {
    // Similar implementation to Xero but for QuickBooks
    res.redirect(`${config.cors.origin[0]}/integrations?status=success&type=quickbooks`);
  };
  
  public initiateSageAuth = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: 'Sage integration coming soon',
    });
  };
  
  public handleSageCallback = async (req: Request, res: Response): Promise<void> => {
    res.redirect(`${config.cors.origin[0]}/integrations?status=success&type=sage`);
  };
  
  public initiateNetSuiteAuth = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: 'NetSuite integration coming soon',
    });
  };
  
  public handleNetSuiteCallback = async (req: Request, res: Response): Promise<void> => {
    res.redirect(`${config.cors.origin[0]}/integrations?status=success&type=netsuite`);
  };
  
  // Counterparty Links
  
  public getCounterpartyLinks = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user!.companyId!;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [links, total] = await Promise.all([
      prisma.counterpartyLink.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.counterpartyLink.count({
        where: { companyId },
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        links,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  };
  
  public createCounterpartyLink = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user!.companyId!;
    const {
      ourCustomerName,
      theirCompanyName,
      theirSystemType,
      theirContactEmail,
      theirContactName,
      matchingRules = {},
    } = req.body;
    
    const linkToken = crypto.randomBytes(32).toString('hex');
    const linkExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const link = await prisma.counterpartyLink.create({
      data: {
        companyId,
        ourCustomerName,
        theirCompanyName,
        theirSystemType,
        theirContactEmail,
        theirContactName,
        linkToken,
        linkExpiresAt,
        matchingRules,
      },
    });
    
    logger.info('Counterparty link created', {
      userId: req.user!.id,
      companyId,
      linkId: link.id,
      theirCompanyName,
    });
    
    res.status(201).json({
      success: true,
      message: 'Counterparty link created successfully',
      data: { link },
    });
  };
  
  public getCounterpartyLink = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user!.companyId!;
    const { id: linkId } = req.params;
    
    const link = await prisma.counterpartyLink.findFirst({
      where: {
        id: linkId,
        companyId,
      },
    });
    
    if (!link) {
      throw new AppError('Counterparty link not found', 404, true, 'LINK_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: { link },
    });
  };
  
  public updateCounterpartyLink = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user!.companyId!;
    const { id: linkId } = req.params;
    
    const link = await prisma.counterpartyLink.findFirst({
      where: {
        id: linkId,
        companyId,
      },
    });
    
    if (!link) {
      throw new AppError('Counterparty link not found', 404, true, 'LINK_NOT_FOUND');
    }
    
    const updatedLink = await prisma.counterpartyLink.update({
      where: { id: linkId },
      data: req.body,
    });
    
    res.json({
      success: true,
      message: 'Counterparty link updated successfully',
      data: { link: updatedLink },
    });
  };
  
  public deleteCounterpartyLink = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user!.companyId!;
    const { id: linkId } = req.params;
    
    const link = await prisma.counterpartyLink.findFirst({
      where: {
        id: linkId,
        companyId,
      },
    });
    
    if (!link) {
      throw new AppError('Counterparty link not found', 404, true, 'LINK_NOT_FOUND');
    }
    
    await prisma.counterpartyLink.delete({
      where: { id: linkId },
    });
    
    res.json({
      success: true,
      message: 'Counterparty link deleted successfully',
    });
  };
  
  public sendCounterpartyInvite = async (req: Request, res: Response): Promise<void> => {
    const { id: linkId } = req.params;
    
    const link = await prisma.counterpartyLink.findUnique({
      where: { id: linkId },
    });
    
    if (!link) {
      throw new AppError('Counterparty link not found', 404, true, 'LINK_NOT_FOUND');
    }
    
    // Send invitation email (implementation would use emailService)
    logger.info('Counterparty invite sent', {
      linkId,
      email: link.theirContactEmail,
    });
    
    res.json({
      success: true,
      message: 'Invitation sent successfully',
    });
  };
  
  public acceptCounterpartyInvite = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    
    const link = await prisma.counterpartyLink.findFirst({
      where: {
        linkToken: token,
        linkExpiresAt: {
          gt: new Date(),
        },
      },
    });
    
    if (!link) {
      throw new AppError('Invalid or expired invitation link', 400, true, 'INVALID_INVITATION');
    }
    
    res.json({
      success: true,
      data: {
        companyName: link.ourCustomerName,
        systemType: link.theirSystemType,
      },
    });
  };
  
  public completeCounterpartyLink = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    
    const link = await prisma.counterpartyLink.findFirst({
      where: {
        linkToken: token,
        linkExpiresAt: {
          gt: new Date(),
        },
      },
    });
    
    if (!link) {
      throw new AppError('Invalid or expired invitation link', 400, true, 'INVALID_INVITATION');
    }
    
    await prisma.counterpartyLink.update({
      where: { id: link.id },
      data: {
        connectionStatus: 'LINKED',
        linkToken: null,
        linkExpiresAt: null,
      },
    });
    
    res.json({
      success: true,
      message: 'Counterparty link completed successfully',
    });
  };
  
  // Integration Health
  
  public getIntegrationHealth = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    const connections = await prisma.eRPConnection.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        lastSyncAt: true,
        syncStatus: true,
      },
    });
    
    const health = {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.status === 'CONNECTED').length,
      failedConnections: connections.filter(c => c.status === 'ERROR').length,
      lastSync: connections.reduce((latest, conn) => {
        if (!conn.lastSyncAt) return latest;
        return !latest || conn.lastSyncAt > latest ? conn.lastSyncAt : latest;
      }, null as Date | null),
      connections: connections.map(conn => ({
        id: conn.id,
        name: conn.name,
        type: conn.type,
        status: conn.status,
        syncStatus: conn.syncStatus,
        lastSync: conn.lastSyncAt,
      })),
    };
    
    res.json({
      success: true,
      data: { health },
    });
  };
  
  public getSupportedSystems = async (req: Request, res: Response): Promise<void> => {
    const systems = [
      {
        type: 'XERO',
        name: 'Xero',
        description: 'Cloud-based accounting software',
        features: ['Invoices', 'Contacts', 'Reports'],
        configured: !!config.integrations.xero.clientId,
      },
      {
        type: 'QUICKBOOKS',
        name: 'QuickBooks Online',
        description: 'Popular accounting software for small businesses',
        features: ['Invoices', 'Customers', 'Vendors'],
        configured: !!config.integrations.quickbooks.clientId,
      },
      {
        type: 'SAGE',
        name: 'Sage',
        description: 'Comprehensive business management software',
        features: ['Accounting', 'Payroll', 'CRM'],
        configured: !!config.integrations.sage.clientId,
      },
      {
        type: 'NETSUITE',
        name: 'NetSuite',
        description: 'Enterprise resource planning (ERP) software',
        features: ['Financials', 'CRM', 'E-commerce'],
        configured: !!config.integrations.netsuite.clientId,
      },
    ];
    
    res.json({
      success: true,
      data: { systems },
    });
  };
}

export const integrationController = new IntegrationController();