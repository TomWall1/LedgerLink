import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  try {
    // Create default permissions
    const permissions = [
      { name: 'MANAGE_USERS', description: 'Create, read, update, and delete users', category: 'USER_MANAGEMENT' },
      { name: 'MANAGE_COMPANIES', description: 'Manage company settings and data', category: 'COMPANY_MANAGEMENT' },
      { name: 'MANAGE_INTEGRATIONS', description: 'Connect and manage ERP integrations', category: 'INTEGRATIONS' },
      { name: 'MANAGE_COUNTERPARTIES', description: 'Create and manage counterparty links', category: 'COUNTERPARTIES' },
      { name: 'MANAGE_MATCHING', description: 'Create and manage matching sessions', category: 'MATCHING' },
      { name: 'REVIEW_MATCHES', description: 'Review and approve match results', category: 'MATCHING' },
      { name: 'APPROVE_MATCHES', description: 'Final approval of match results', category: 'MATCHING' },
      { name: 'USE_AI_MATCHING', description: 'Use AI-powered matching features', category: 'MATCHING' },
      { name: 'UPLOAD_FILES', description: 'Upload CSV and other files', category: 'FILES' },
      { name: 'GENERATE_REPORTS', description: 'Generate reports', category: 'REPORTING' },
      { name: 'MANAGE_REPORTS', description: 'Manage and schedule reports', category: 'REPORTING' },
      { name: 'SHARE_REPORTS', description: 'Share reports with others', category: 'REPORTING' },
      { name: 'VIEW_ANALYTICS', description: 'View analytics and metrics', category: 'ANALYTICS' },
    ];
    
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }
    
    console.log(`✅ Created ${permissions.length} permissions`);
    
    // Create demo company
    const demoCompany = await prisma.company.upsert({
      where: { slug: 'demo-company' },
      update: {},
      create: {
        name: 'Demo Company',
        slug: 'demo-company',
        industry: 'Technology',
        size: 'SMALL',
        country: 'US',
        timezone: 'America/New_York',
        settings: {
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          theme: 'light',
        },
      },
    });
    
    console.log('✅ Created demo company');
    
    // Create demo admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ledgerlink.com' },
      update: {},
      create: {
        email: 'admin@ledgerlink.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isEmailVerified: true,
        companyId: demoCompany.id,
      },
    });
    
    console.log('✅ Created admin user (admin@ledgerlink.com / admin123)');
    
    // Assign all permissions to admin user
    const allPermissions = await prisma.permission.findMany();
    
    for (const permission of allPermissions) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: adminUser.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          permissionId: permission.id,
          grantedBy: adminUser.id,
        },
      });
    }
    
    console.log('✅ Assigned all permissions to admin user');
    
    // Create demo regular user
    const regularPassword = await bcrypt.hash('user123', 12);
    
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@ledgerlink.com' },
      update: {},
      create: {
        email: 'user@ledgerlink.com',
        passwordHash: regularPassword,
        firstName: 'Demo',
        lastName: 'User',
        role: UserRole.USER,
        isEmailVerified: true,
        companyId: demoCompany.id,
      },
    });
    
    console.log('✅ Created regular user (user@ledgerlink.com / user123)');
    
    // Assign basic permissions to regular user
    const basicPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: [
            'MANAGE_MATCHING',
            'REVIEW_MATCHES',
            'USE_AI_MATCHING',
            'UPLOAD_FILES',
            'GENERATE_REPORTS',
            'VIEW_ANALYTICS',
          ],
        },
      },
    });
    
    for (const permission of basicPermissions) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: regularUser.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: regularUser.id,
          permissionId: permission.id,
          grantedBy: adminUser.id,
        },
      });
    }
    
    console.log('✅ Assigned basic permissions to regular user');
    
    // Create sample invoice data
    const sampleInvoices = [
      {
        invoiceNumber: 'INV-2024-001',
        amount: 1500.00,
        currency: 'USD',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        counterpartyName: 'Acme Corporation',
        counterpartyEmail: 'billing@acmecorp.com',
        description: 'Software licensing fee',
        reference: 'LICENSE-Q1-2024',
        status: 'SENT',
      },
      {
        invoiceNumber: 'INV-2024-002',
        amount: 2750.50,
        currency: 'USD',
        issueDate: new Date('2024-01-16'),
        dueDate: new Date('2024-02-16'),
        counterpartyName: 'Global Suppliers Inc',
        counterpartyEmail: 'accounts@globalsuppliers.com',
        description: 'Monthly service fee',
        reference: 'MSF-JAN-2024',
        status: 'PAID',
      },
      {
        invoiceNumber: 'INV-2024-003',
        amount: 899.99,
        currency: 'USD',
        issueDate: new Date('2024-01-17'),
        dueDate: new Date('2024-02-17'),
        counterpartyName: 'TechFlow Solutions',
        counterpartyEmail: 'billing@techflow.com',
        description: 'Consulting services',
        reference: 'CONSULT-2024-001',
        status: 'SENT',
      },
    ];
    
    for (const invoice of sampleInvoices) {
      await prisma.invoice.upsert({
        where: { 
          invoiceNumber_erpConnectionId: {
            invoiceNumber: invoice.invoiceNumber,
            erpConnectionId: null,
          },
        },
        update: {},
        create: invoice,
      });
    }
    
    console.log('✅ Created sample invoices');
    
    console.log('');
    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('Demo accounts created:');
    console.log('  Admin: admin@ledgerlink.com / admin123');
    console.log('  User:  user@ledgerlink.com / user123');
    console.log('');
    console.log('You can now start the server and log in with these accounts.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });