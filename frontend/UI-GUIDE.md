# LedgerLink UI Style Guide

## Overview
This document provides implementation details for the LedgerLink design system, a production-ready UI framework focused on trustworthy, clear, and accessible design for financial applications.

## Design Principles

1. **Trustworthy & Clear** — Finance-grade seriousness with friendly touches
2. **Radical Simplicity** — Show only what's needed; progressive disclosure for detail
3. **Readable & Fast** — High information density without clutter
4. **Consistent** — Single typography, icon set, spacing scale
5. **Accessible** — AA+ contrast minimum; keyboard-first interactions

## Design Tokens

### Colors

```css
/* Primary Palette */
--color-primary-900: #0b3a66; /* deep blue */
--color-primary-700: #1464a6; /* primary */
--color-primary-500: #2a8fe6; /* bright primary - main brand color */
--color-primary-300: #7fc0ff; /* accent light */

/* Neutral Palette */
--color-neutral-900: #0f1724; /* text */
--color-neutral-700: #334155; /* subtext */
--color-neutral-400: #94a3b8; /* muted */
--color-neutral-200: #e6eef9; /* surface light */

/* Semantic Colors */
--color-success: #16a34a;
--color-warning: #f59e0b;
--color-error: #ef4444;

/* Utility Colors */
--color-white: #ffffff;
--color-border: #e6eef9;
--color-muted-bg: #f8fafc;
```

### Spacing Scale (Base 4px)

```
1  = 4px
2  = 8px
3  = 12px
4  = 16px
6  = 24px
8  = 32px
12 = 48px
16 = 64px
```

### Typography

**Font Family:**
- Primary: `Inter` (loaded from Google Fonts)
- Mono: `ui-monospace` for tables and code

**Type Scale:**
- H1: 28px / 36px line-height / 700 weight
- H2: 22px / 30px / 600
- H3: 18px / 26px / 600
- Body Large: 16px / 24px / 400
- Body: 14px / 20px / 400
- Small: 12px / 16px / 400
- Mono (tables): 13px / 18px / 400

### Border Radius

```
radius-sm = 6px
radius-md = 12px
radius-lg = 20px
```

### Shadows

```css
shadow-sm: 0 1px 2px rgba(14,25,40,0.06)
shadow-md: 0 6px 18px rgba(14,25,40,0.08)
shadow-lg: 0 20px 40px rgba(14,25,40,0.12)
```

### Motion

```
Duration:
  short:  120ms
  medium: 240ms
  long:   420ms

Easing: cubic-bezier(.2, .8, .2, 1)
```

## Component Usage

### Buttons

**Primary Button**
```tsx
<Button variant="primary">
  Create Invoice
</Button>
```

**Secondary Button (Outline)**
```tsx
<Button variant="secondary">
  Cancel
</Button>
```

**Ghost Button**
```tsx
<Button variant="ghost">
  Learn More
</Button>
```

**Destructive Button**
```tsx
<Button variant="destructive">
  Delete Account
</Button>
```

**Button Sizes**
```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
```

### Cards

```tsx
<Card>
  <CardHeader>
    <h3 className="text-h3">Card Title</h3>
    <p className="text-small text-neutral-400">Card subtitle</p>
  </CardHeader>
  <CardContent>
    {/* Card content here */}
  </CardContent>
  <CardFooter>
    {/* Optional footer actions */}
  </CardFooter>
</Card>
```

### Badges

**Match Confidence Badges:**

```tsx
// High confidence (>= 90%)
<span className="badge badge-success">95%</span>

// Medium confidence (70-89%)
<span className="badge badge-info">82%</span>

// Low confidence (< 70%)
<span className="badge badge-warning">65%</span>

// Failed match
<span className="badge badge-error">Unmatched</span>
```

### Tables

```tsx
<table className="table">
  <thead>
    <tr>
      <th>Invoice #</th>
      <th>Date</th>
      <th>Amount</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr className="table-row hover:bg-neutral-200">
      <td className="font-mono">INV-001</td>
      <td>2025-01-15</td>
      <td className="font-mono">$1,250.00</td>
      <td>
        <span className="badge badge-success">Matched</span>
      </td>
    </tr>
  </tbody>
</table>
```

### Input Fields

```tsx
<input 
  type="text"
  className="input"
  placeholder="Enter invoice number"
/>

{/* Error state */}
<input 
  type="text"
  className="input error"
  placeholder="Enter invoice number"
/>
<p className="text-small text-error mt-1">This field is required</p>
```

### Toasts

```tsx
<div className="toast toast-success">
  Successfully matched 150 invoices!
</div>

<div className="toast toast-error">
  Failed to upload CSV file
</div>

<div className="toast toast-warning">
  10 invoices require manual review
</div>
```

## Responsive Breakpoints

```
sm:  640px  (mobile landscape)
md:  768px  (tablet)
lg:  1024px (desktop)
xl:  1280px (large desktop)
2xl: 1536px (extra large)
```

## Layout Guidelines

### Top Navigation
- Height: 64px (desktop), 56px (mobile)
- Fixed position
- Contains: Logo, search, user menu, invite button

### Sidebar Navigation
- Width: 280px (expanded), 72px (collapsed)
- Sticky position
- Active state: 4px left border in primary-500

### Content Area
- Padding: 32px (lg+), 16px (mobile)
- Max width: 1200px for reading content
- Full width for data tables

## Accessibility

### Focus Styles
All interactive elements have a 3px outline in `primary-500` with 2px offset:

```css
*:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Contrast Requirements
- Normal text: 4.5:1 minimum contrast
- Large text (18px+): 3:1 minimum contrast
- All colors tested for AA+ compliance

### Keyboard Navigation
- Tab order is logical and sequential
- All interactive elements are keyboard accessible
- Escape closes modals and drawers
- Enter/Space activates buttons

### Screen Reader Support
- All icons have aria-labels
- Dynamic content uses live regions
- Forms have associated labels
- Table headers properly marked with `<th>`

## Icon Usage

Using Lucide React icons:

```tsx
import { Upload, Download, Check } from 'lucide-react';

// Sizes
<Upload size={16} /> // Dense table rows
<Download size={20} /> // Inline with text
<Check size={24} /> // Controls (default)
```

## Best Practices

1. **Use semantic HTML** — Use proper heading hierarchy, lists, tables
2. **Mobile-first** — Design for mobile, enhance for desktop
3. **Progressive disclosure** — Show essential info first, details on demand
4. **Consistent spacing** — Use design tokens, not arbitrary values
5. **Test accessibility** — Run Lighthouse audits regularly
6. **Respect motion preferences** — Honor `prefers-reduced-motion`

## Implementation Files

- **Design Tokens:** `frontend/src/design-tokens.ts`
- **Tailwind Config:** `frontend/tailwind.config.js`
- **Global Styles:** `frontend/src/styles/global.css`
- **Components:** `frontend/src/components/ui/`

## Examples

### Dashboard Card
```tsx
<Card className="hover:shadow-lg transition-shadow duration-medium">
  <CardHeader>
    <h3 className="text-h3 text-neutral-900">Account Summary</h3>
    <p className="text-small text-neutral-400">Last updated: 2 hours ago</p>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <div className="text-h2 font-bold text-success">94%</div>
        <div className="text-small text-neutral-600">Matched</div>
      </div>
      <div>
        <div className="text-h2 font-bold text-warning">5%</div>
        <div className="text-small text-neutral-600">Partial</div>
      </div>
      <div>
        <div className="text-h2 font-bold text-error">1%</div>
        <div className="text-small text-neutral-600">Unmatched</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Matching Results Table
```tsx
<Card>
  <CardHeader>
    <div className="flex justify-between items-center">
      <h3 className="text-h3">Invoice Matches</h3>
      <Button variant="secondary" size="sm">
        <Download size={16} className="mr-2" />
        Export CSV
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    <table className="table">
      <thead className="table-header">
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Counterparty</th>
          <th>Confidence</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {matches.map(match => (
          <tr key={match.id} className="table-row">
            <td className="font-mono text-body">{match.invoiceNumber}</td>
            <td className="text-body">{match.date}</td>
            <td className="font-mono text-body text-right">{match.amount}</td>
            <td className="text-body">{match.counterparty}</td>
            <td>
              <span className={`badge ${getConfidenceBadgeClass(match.confidence)}`}>
                {match.confidence}%
              </span>
            </td>
            <td>
              <span className={`badge ${getStatusBadgeClass(match.status)}`}>
                {match.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </CardContent>
</Card>
```

## Color Usage for Match Confidence

| Confidence | Background | Text | Label |
|-----------|-----------|------|-------|
| >= 90% | `#dcfce7` | `#15803d` | High |
| 70-89% | `#dbeafe` | `#1464a6` | Medium |
| < 70% | `#fef3c7` | `#b45309` | Low |
| Failed | `#fee2e2` | `#b91c1c` | Unmatched |

## Support

For questions or issues with the design system:
- Review this guide
- Check `design-tokens.ts` for available tokens
- Refer to Tailwind documentation for utility classes
- Test accessibility with browser DevTools

---

**Version:** 1.0  
**Last Updated:** October 2025  
**Maintainer:** LedgerLink Team
