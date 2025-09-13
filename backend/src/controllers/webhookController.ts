import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';
import { config } from '../config/config';

class WebhookController {
  // ERP System Webhooks
  
  public handleXeroWebhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['x-xero-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature (in production)
    if (!this.verifyWebhookSignature(payload, signature, 'xero')) {
      throw new AppError('Invalid webhook signature', 401, true, 'INVALID_SIGNATURE');
    }
    
    const { events } = req.body;
    
    for (const event of events) {
      await this.processXeroEvent(event);
    }
    
    logger.info('Xero webhook processed', {
      eventCount: events.length,
      events: events.map((e: any) => e.eventType),
    });
    
    res.status(200).json({ success: true });
  };
  
  public handleQuickBooksWebhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['intuit-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!this.verifyWebhookSignature(payload, signature, 'quickbooks')) {
      throw new AppError('Invalid webhook signature', 401, true, 'INVALID_SIGNATURE');
    }
    
    const { eventNotifications } = req.body;
    
    for (const notification of eventNotifications) {
      await this.processQuickBooksEvent(notification);
    }
    
    logger.info('QuickBooks webhook processed', {
      eventCount: eventNotifications.length,
    });
    
    res.status(200).json({ success: true });
  };
  
  public handleSageWebhook = async (req: Request, res: Response): Promise<void> => {
    // Sage webhook implementation
    logger.info('Sage webhook received', { body: req.body });
    res.status(200).json({ success: true });
  };
  
  public handleNetSuiteWebhook = async (req: Request, res: Response): Promise<void> => {
    // NetSuite webhook implementation
    logger.info('NetSuite webhook received', { body: req.body });
    res.status(200).json({ success: true });
  };
  
  // Stripe Webhooks
  
  public handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;
    
    if (!config.stripe.webhookSecret) {
      throw new AppError('Stripe webhook secret not configured', 500, true, 'WEBHOOK_NOT_CONFIGURED');
    }
    
    // Verify Stripe signature
    try {
      const elements = signature.split(',');
      const signatureElements: Record<string, string> = {};
      
      for (const element of elements) {
        const [key, value] = element.split('=');
        signatureElements[key] = value;
      }
      
      const timestamp = signatureElements.t;
      const signatures = signatureElements.v1;
      
      const expectedSignature = crypto
        .createHmac('sha256', config.stripe.webhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');
      
      if (signatures !== expectedSignature) {
        throw new AppError('Invalid Stripe signature', 401, true, 'INVALID_STRIPE_SIGNATURE');
      }
      
    } catch (error) {
      throw new AppError('Stripe webhook verification failed', 401, true, 'STRIPE_VERIFICATION_FAILED');
    }
    
    const event = JSON.parse(payload);
    
    await this.processStripeEvent(event);
    
    logger.info('Stripe webhook processed', {
      eventType: event.type,
      eventId: event.id,
    });
    
    res.status(200).json({ received: true });
  };
  
  // Internal Webhooks
  
  public handleMatchingCompleted = async (req: Request, res: Response): Promise<void> => {
    const { sessionId, results } = req.body;
    
    logger.info('Matching completed webhook', {
      sessionId,
      resultsCount: results?.length || 0,
    });
    
    // Update session status, send notifications, etc.
    await this.processMatchingCompletion(sessionId, results);
    
    res.status(200).json({ success: true });
  };
  
  public handleSyncCompleted = async (req: Request, res: Response): Promise<void> => {
    const { connectionId, recordsProcessed, status } = req.body;
    
    logger.info('Sync completed webhook', {
      connectionId,
      recordsProcessed,
      status,
    });
    
    // Update connection status, send notifications, etc.
    await this.processSyncCompletion(connectionId, recordsProcessed, status);
    
    res.status(200).json({ success: true });
  };
  
  public handleReportGenerated = async (req: Request, res: Response): Promise<void> => {
    const { reportId, status, filePath } = req.body;
    
    logger.info('Report generated webhook', {
      reportId,
      status,
    });
    
    // Send notification to user about report completion
    await this.processReportGeneration(reportId, status, filePath);
    
    res.status(200).json({ success: true });
  };
  
  // Webhook Management
  
  public getWebhookSubscriptions = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    // In a real implementation, you would fetch webhook subscriptions from database
    const subscriptions = [
      {
        id: 'sub-1',
        url: 'https://example.com/webhooks/matching',
        events: ['matching.completed', 'matching.failed'],
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    
    res.json({
      success: true,
      data: { subscriptions },
    });
  };
  
  public createWebhookSubscription = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { url, events, secret } = req.body;
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new AppError('Invalid webhook URL', 400, true, 'INVALID_URL');
    }
    
    // Create webhook subscription record
    const subscription = {
      id: crypto.randomUUID(),
      userId,
      url,
      events,
      secret,
      isActive: true,
      createdAt: new Date(),
    };
    
    logger.info('Webhook subscription created', {
      userId,
      url,
      events,
    });
    
    res.status(201).json({
      success: true,
      message: 'Webhook subscription created successfully',
      data: { subscription },
    });
  };
  
  public updateWebhookSubscription = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;
    
    logger.info('Webhook subscription updated', {
      subscriptionId: id,
      updates: Object.keys(updates),
    });
    
    res.json({
      success: true,
      message: 'Webhook subscription updated successfully',
    });
  };
  
  public deleteWebhookSubscription = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    logger.info('Webhook subscription deleted', {
      subscriptionId: id,
    });
    
    res.json({
      success: true,
      message: 'Webhook subscription deleted successfully',
    });
  };
  
  public testWebhook = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    // Send test webhook
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from LedgerLink',
      },
    };
    
    // In a real implementation, send HTTP request to webhook URL
    logger.info('Test webhook sent', {
      subscriptionId: id,
      payload: testPayload,
    });
    
    res.json({
      success: true,
      message: 'Test webhook sent successfully',
      data: { testPayload },
    });
  };
  
  // Helper Methods
  
  private verifyWebhookSignature(payload: string, signature: string, provider: string): boolean {
    // Implementation would vary by provider
    // For demo purposes, return true
    return true;
  }
  
  private async processXeroEvent(event: any): Promise<void> {
    const { eventType, tenantId, resourceId } = event;
    
    switch (eventType) {
      case 'CREATE':
      case 'UPDATE':
        // Handle invoice creation/update
        await this.syncInvoiceFromXero(tenantId, resourceId);
        break;
      case 'DELETE':
        // Handle invoice deletion
        await this.handleInvoiceDeletion(resourceId);
        break;
      default:
        logger.info('Unhandled Xero event type', { eventType });
    }
  }
  
  private async processQuickBooksEvent(notification: any): Promise<void> => {
    const { eventType, realmId, dataChangeEvent } = notification;
    
    for (const entity of dataChangeEvent.entities) {
      switch (entity.name) {
        case 'Invoice':
          await this.syncInvoiceFromQuickBooks(realmId, entity.id);
          break;
        case 'Customer':
          await this.syncCustomerFromQuickBooks(realmId, entity.id);
          break;
        default:
          logger.info('Unhandled QuickBooks entity', { entityName: entity.name });
      }
    }
  }
  
  private async processStripeEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handleSuccessfulPayment(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleFailedPayment(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;
      default:
        logger.info('Unhandled Stripe event', { eventType: event.type });
    }
  }
  
  private async processMatchingCompletion(sessionId: string, results: any[]): Promise<void> {
    try {
      const session = await prisma.matchingSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });
      
      if (session) {
        // Send notification to user
        await prisma.notification.create({
          data: {
            userId: session.userId,
            type: 'MATCH_COMPLETED',
            title: 'Matching Completed',
            message: `Your matching session "${session.name}" has completed with ${results.length} results.`,
            data: {
              sessionId,
              resultCount: results.length,
            },
          },
        });
      }
    } catch (error) {
      logger.error('Error processing matching completion:', error);
    }
  }
  
  private async processSyncCompletion(connectionId: string, recordsProcessed: number, status: string): Promise<void> {
    try {
      const connection = await prisma.eRPConnection.findUnique({
        where: { id: connectionId },
        include: { user: true },
      });
      
      if (connection) {
        // Send notification to user
        await prisma.notification.create({
          data: {
            userId: connection.userId,
            type: status === 'success' ? 'MATCH_COMPLETED' : 'SYNC_FAILED',
            title: status === 'success' ? 'Sync Completed' : 'Sync Failed',
            message: status === 'success'
              ? `Successfully synced ${recordsProcessed} records from ${connection.name}.`
              : `Sync failed for ${connection.name}. Please check your connection.`,
            data: {
              connectionId,
              recordsProcessed,
              status,
            },
          },
        });
      }
    } catch (error) {
      logger.error('Error processing sync completion:', error);
    }
  }
  
  private async processReportGeneration(reportId: string, status: string, filePath?: string): Promise<void> {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { user: true },
      });
      
      if (report) {
        // Send notification to user
        await prisma.notification.create({
          data: {
            userId: report.userId,
            type: 'REPORT_READY',
            title: status === 'completed' ? 'Report Ready' : 'Report Generation Failed',
            message: status === 'completed'
              ? `Your report "${report.name}" is ready for download.`
              : `Report generation failed for "${report.name}".`,
            data: {
              reportId,
              status,
              filePath,
            },
          },
        });
      }
    } catch (error) {
      logger.error('Error processing report generation:', error);
    }
  }
  
  // Placeholder methods for ERP-specific operations
  
  private async syncInvoiceFromXero(tenantId: string, invoiceId: string): Promise<void> {
    logger.info('Syncing invoice from Xero', { tenantId, invoiceId });
    // Implementation would fetch invoice data from Xero API and update local database
  }
  
  private async syncInvoiceFromQuickBooks(realmId: string, invoiceId: string): Promise<void> {
    logger.info('Syncing invoice from QuickBooks', { realmId, invoiceId });
    // Implementation would fetch invoice data from QuickBooks API and update local database
  }
  
  private async syncCustomerFromQuickBooks(realmId: string, customerId: string): Promise<void> {
    logger.info('Syncing customer from QuickBooks', { realmId, customerId });
    // Implementation would fetch customer data from QuickBooks API and update local database
  }
  
  private async handleInvoiceDeletion(resourceId: string): Promise<void> {
    logger.info('Handling invoice deletion', { resourceId });
    // Implementation would mark invoice as deleted or remove from local database
  }
  
  private async handleSuccessfulPayment(invoice: any): Promise<void> {
    logger.info('Handling successful payment', { invoiceId: invoice.id });
    // Implementation would update subscription status, send confirmation, etc.
  }
  
  private async handleFailedPayment(invoice: any): Promise<void> {
    logger.info('Handling failed payment', { invoiceId: invoice.id });
    // Implementation would notify user, retry payment, etc.
  }
  
  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    logger.info('Handling subscription update', { subscriptionId: subscription.id });
    // Implementation would update user's subscription in database
  }
}

export const webhookController = new WebhookController();