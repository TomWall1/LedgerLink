/**
 * TypeScript type definitions for Xero integration
 */

export interface XeroTokens {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface XeroTenant {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantType: 'ORGANISATION' | 'PRACTICE';
  createdDateUtc: string;
  updatedDateUtc: string;
}

export interface XeroOrganisation {
  APIKey?: string;
  Name: string;
  LegalName?: string;
  PaysTax: boolean;
  Version: string;
  OrganisationType?: string;
  BaseCurrency: string;
  CountryCode: string;
  IsDemoCompany: boolean;
  OrganisationStatus: string;
  RegistrationNumber?: string;
  TaxNumber?: string;
  FinancialYearEndDay?: number;
  FinancialYearEndMonth?: number;
  SalesTaxBasis?: string;
  SalesTaxPeriod?: string;
  DefaultSalesTax?: string;
  DefaultPurchasesTax?: string;
  PeriodLockDate?: string;
  EndOfYearLockDate?: string;
  CreatedDateUTC: string;
  Timezone: string;
  OrganisationEntityType?: string;
  ShortCode?: string;
  LineOfBusiness?: string;
  Addresses?: XeroAddress[];
  Phones?: XeroPhone[];
  ExternalLinks?: XeroExternalLink[];
  PaymentTerms?: XeroPaymentTerms;
}

export interface XeroAddress {
  AddressType: string;
  AddressLine1?: string;
  AddressLine2?: string;
  AddressLine3?: string;
  AddressLine4?: string;
  City?: string;
  Region?: string;
  PostalCode?: string;
  Country?: string;
  AttentionTo?: string;
}

export interface XeroPhone {
  PhoneType: string;
  PhoneNumber: string;
  PhoneAreaCode?: string;
  PhoneCountryCode?: string;
}

export interface XeroExternalLink {
  LinkType: string;
  Url: string;
  Description?: string;
}

export interface XeroPaymentTerms {
  Bills?: XeroPaymentTerm;
  Sales?: XeroPaymentTerm;
}

export interface XeroPaymentTerm {
  Day: number;
  Type: string;
}

export interface XeroInvoiceRaw {
  Type: 'ACCPAY' | 'ACCREC';
  InvoiceID: string;
  InvoiceNumber: string;
  Reference?: string;
  BrandingThemeID?: string;
  Url?: string;
  CurrencyCode: string;
  CurrencyRate?: number;
  Status: 'DRAFT' | 'SUBMITTED' | 'DELETED' | 'AUTHORISED' | 'PAID' | 'VOIDED';
  LineAmountTypes: 'Exclusive' | 'Inclusive' | 'NoTax';
  SubTotal: number;
  TotalTax: number;
  Total: number;
  TotalDiscount?: number;
  HasAttachments: boolean;
  IsDiscounted?: boolean;
  Contact: XeroContact;
  Date: string;
  DueDate?: string;
  BrandingThemeID?: string;
  Status: string;
  LineItems: XeroLineItem[];
  Payments?: XeroPayment[];
  CreditNotes?: XeroCreditNote[];
  Prepayments?: XeroPrepayment[];
  Overpayments?: XeroOverpayment[];
  AmountDue: number;
  AmountPaid: number;
  AmountCredited?: number;
  UpdatedDateUTC: string;
  HasErrors?: boolean;
  ValidationErrors?: XeroValidationError[];
}

export interface XeroContact {
  ContactID: string;
  ContactNumber?: string;
  AccountNumber?: string;
  ContactStatus: 'ACTIVE' | 'ARCHIVED';
  Name: string;
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
  SkypeUserName?: string;
  ContactPersons?: XeroContactPerson[];
  BankAccountDetails?: string;
  TaxNumber?: string;
  AccountsReceivableTaxType?: string;
  AccountsPayableTaxType?: string;
  Addresses?: XeroAddress[];
  Phones?: XeroPhone[];
  IsSupplier?: boolean;
  IsCustomer?: boolean;
  DefaultCurrency?: string;
  UpdatedDateUTC: string;
  ContactGroups?: XeroContactGroup[];
  Website?: string;
  BrandingTheme?: XeroBrandingTheme;
  BatchPayments?: XeroBatchPayment;
  Discount?: number;
  Balances?: XeroContactBalance;
  HasAttachments?: boolean;
}

export interface XeroContactPerson {
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
  IncludeInEmails?: boolean;
}

export interface XeroContactGroup {
  Name: string;
  Status?: string;
  ContactGroupID?: string;
  Contacts?: XeroContact[];
}

export interface XeroBrandingTheme {
  BrandingThemeID: string;
  Name?: string;
  LogoUrl?: string;
}

export interface XeroBatchPayment {
  Account?: XeroAccount;
  Reference?: string;
  Particulars?: string;
}

export interface XeroContactBalance {
  AccountsReceivable?: XeroBalanceDetail;
  AccountsPayable?: XeroBalanceDetail;
}

export interface XeroBalanceDetail {
  Outstanding?: number;
  Overdue?: number;
}

export interface XeroLineItem {
  Description?: string;
  UnitAmount?: number;
  TaxType?: string;
  TaxAmount?: number;
  LineAmount: number;
  AccountCode?: string;
  Quantity?: number;
  LineItemID?: string;
  AccountID?: string;
  ItemCode?: string;
  DiscountRate?: number;
  DiscountAmount?: number;
  RepeatingInvoiceID?: string;
}

export interface XeroAccount {
  Code: string;
  Name: string;
  Type: string;
  BankAccountNumber?: string;
  Status?: string;
  Description?: string;
  BankAccountType?: string;
  CurrencyCode?: string;
  TaxType?: string;
  EnablePaymentsToAccount?: boolean;
  ShowInExpenseClaims?: boolean;
  AccountID: string;
  Class?: string;
  SystemAccount?: string;
  ReportingCode?: string;
  ReportingCodeName?: string;
  HasAttachments?: boolean;
  UpdatedDateUTC: string;
}

export interface XeroPayment {
  PaymentID: string;
  Date: string;
  Amount: number;
  Reference?: string;
  CurrencyRate?: number;
  PaymentType?: string;
  Status?: string;
  UpdatedDateUTC: string;
  HasAccount?: boolean;
  HasValidationErrors?: boolean;
  StatusAttributeString?: string;
  Account?: XeroAccount;
}

export interface XeroCreditNote {
  CreditNoteID: string;
  CreditNoteNumber: string;
  Type: 'ACCPAYCREDIT' | 'ACCRECCREDIT';
  Contact: XeroContact;
  Date: string;
  Status: string;
  LineAmountTypes: string;
  LineItems: XeroLineItem[];
  SubTotal: number;
  TotalTax: number;
  Total: number;
  UpdatedDateUTC: string;
  CurrencyCode: string;
  FullyPaidOnDate?: string;
  RemainingCredit?: number;
  Allocations?: XeroAllocation[];
  HasAttachments?: boolean;
}

export interface XeroPrepayment {
  PrepaymentID: string;
  Contact: XeroContact;
  Date: string;
  Status: string;
  LineAmountTypes: string;
  LineItems: XeroLineItem[];
  SubTotal: number;
  TotalTax: number;
  Total: number;
  UpdatedDateUTC: string;
  CurrencyCode: string;
  RemainingCredit?: number;
  Allocations?: XeroAllocation[];
  HasAttachments?: boolean;
}

export interface XeroOverpayment {
  OverpaymentID: string;
  Contact: XeroContact;
  Date: string;
  Status: string;
  LineAmountTypes: string;
  LineItems: XeroLineItem[];
  SubTotal: number;
  TotalTax: number;
  Total: number;
  UpdatedDateUTC: string;
  CurrencyCode: string;
  RemainingCredit?: number;
  Allocations?: XeroAllocation[];
  HasAttachments?: boolean;
}

export interface XeroAllocation {
  AllocationID: string;
  Invoice: XeroInvoiceRaw;
  Amount: number;
  Date: string;
}

export interface XeroValidationError {
  Message: string;
}

export interface XeroApiResponse<T> {
  Id?: string;
  Status?: string;
  ProviderName?: string;
  DateTimeUTC?: string;
  [key: string]: T | any;
}

export interface XeroErrorResponse {
  ErrorNumber: number;
  Type: string;
  Message: string;
  Elements?: XeroValidationError[];
}

// Webhook related types
export interface XeroWebhookEvent {
  resourceUrl: string;
  resourceId: string;
  eventDateUtc: string;
  eventType: string;
  eventCategory: string;
  tenantId: string;
  tenantType: string;
}

export interface XeroWebhookPayload {
  events: XeroWebhookEvent[];
  firstEventSequence: number;
  lastEventSequence: number;
  entropy: string;
}

// Configuration types
export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  state?: boolean;
}

export interface XeroConnectionConfig {
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Rate limiting types
export interface XeroRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Sync status types
export type XeroSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface XeroSyncResult {
  status: XeroSyncStatus;
  recordsProcessed: number;
  errors: string[];
  lastSyncAt: Date;
  duration: number;
}

export default {
  // Export all types as a namespace
};