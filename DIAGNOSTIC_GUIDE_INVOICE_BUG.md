# Diagnostic Guide: Finding the Invoice Data Rendering Bug

## Problem Summary
- **Error**: `TypeError: Cannot read properties of undefined (reading 'id')`
- **When**: After clicking "Load Data" in the Xero customer selector  
- **Where**: Frontend crashes AFTER data successfully loads - crash happens during React rendering
- **Line**: Minified function `ga` at line 236131

## What We Know
1. Data validation passes ✅ (all null checks work)
2. Data loads successfully ✅ (dataSource1 state is set)
3. Crash happens during RENDERING ❌ (not during data loading)
4. The error is at the SAME line number despite fixes (means we're not fixing the right component)

## Diagnostic Steps

### Step 1: Open Browser DevTools
1. Open Chrome/Edge DevTools (F12)
2. Go to **Console** tab
3. Clear all logs
4. Click "Load Data" for a Xero customer
5. **Screenshot the FULL error stack trace** (not just the first line)

### Step 2: Enable React DevTools Component Highlighting
1. Install React DevTools browser extension if not already installed
2. Open React DevTools (Components tab)
3. Enable "Highlight updates when components render"
4. Click "Load Data"
5. **Watch which components flash** when they re-render
6. **Which component crashes?** (it will stop rendering)

### Step 3: Add Console Logs to Find the Culprit

Add this to **frontend/src/components/matching/workflow/DataSourceSummary.tsx** at the very top of the component:

```typescript
export const DataSourceSummary: React.FC<DataSourceSummaryProps> = ({
  source,
  customerName,
  fileName,
  invoiceCount,
  onClear,
  label,
}) => {
  console.log('🎨 [DataSourceSummary] Rendering with props:', {
    source,
    customerName,
    fileName,
    invoiceCount,
    label
  });

  // Rest of component...
```

Add this to **frontend/src/components/matching/workflow/MatchReadyCard.tsx** at the very top:

```typescript
export const MatchReadyCard: React.FC<MatchReadyCardProps> = ({
  source1,
  source2,
  onStartMatching,
  isMatching = false,
}) => {
  console.log('🎨 [MatchReadyCard] Rendering with props:', {
    source1,
    source2,
    isMatching
  });

  // Rest of component...
```

### Step 4: Check for Hidden Components

Search your ENTIRE codebase for components that might iterate over invoices:

```bash
# In your terminal, from the frontend directory:
cd frontend/src
grep -r "\.map((invoice" .
grep -r "invoices\[" .
grep -r "invoice\.id" .
```

**Send me the results** - this will show ALL places where invoices are accessed.

### Step 5: Check the Exact Error Location

In the browser console, when the error appears:
1. Click on the **error line number** (the `ga@236131` link)
2. This will show you the **actual code** that crashed (even if minified)
3. **Screenshot this code** or copy it
4. Look for ANY `.id` property access in that code

### Step 6: Use Error Boundary (Already Created)

Import and wrap sections in your Matches.tsx:

```typescript
import ErrorBoundary from '../components/ErrorBoundary';

// Then wrap the workflow card:
<ErrorBoundary componentName="Workflow Card">
  <Card>
    {/* ... your workflow content ... */}
  </Card>
</ErrorBoundary>
```

The ErrorBoundary will tell you EXACTLY which component crashed and show the component stack.

## What to Send Me

Please provide:
1. **Full error stack trace** from browser console (screenshot)
2. **React DevTools component tree** screenshot (show which component is selected)
3. **Results of grep commands** from Step 4
4. **What the ErrorBoundary displays** if you add it
5. **All console logs** with the `[DIAGNOSTIC]` prefix

## Most Likely Culprits

Based on the symptoms, the crash is probably in ONE of these components:
1. `DataSourceSummary.tsx` - displays loaded data summary
2. `MatchReadyCard.tsx` - shows when both sources are loaded
3. A component we haven't looked at yet that receives invoice data
4. A utility function that processes invoices

## Why Previous Fixes Didn't Work

The validation code in `CustomerSelectorDropdown.tsx` and `Matches.tsx` successfully filters out bad invoices. The problem is:

**The crash happens AFTER validation, in a rendering component that expects the data in a specific format or is trying to access a property that doesn't exist.**

The data passes validation but then a component tries to access `.id` on `undefined` - which means either:
- The component is accessing the wrong property name
- The component is trying to iterate an array that's undefined
- The component expects a different data structure

## Next Steps

Once you provide the diagnostic information above, I can:
1. Identify the exact component causing the crash
2. Fix the specific property access issue
3. Add proper null checks in the right place
4. Test the fix

The ErrorBoundary and console logs will make it immediately obvious where the problem is!
