import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import Report from '../models/Report.js';
import MatchingResult from '../models/MatchingResult.js';

const router = express.Router();

// All routes require auth
router.use(requireAuth);

// Helper: resolve date range preset to start/end dates
function resolveDateRange(preset, customFrom, customTo) {
  const now = new Date();
  let startDate, endDate, displayLabel;

  switch (preset) {
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = now;
      displayLabel = 'Last 7 days';
      break;
    case 'last_30_days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      endDate = now;
      displayLabel = 'Last 30 days';
      break;
    case 'last_90_days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      endDate = now;
      displayLabel = 'Last 90 days';
      break;
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
      displayLabel = 'Current month';
      break;
    case 'previous_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      displayLabel = 'Previous month';
      break;
    case 'current_quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = now;
      displayLabel = 'Current quarter';
      break;
    }
    case 'current_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
      displayLabel = 'Current year';
      break;
    case 'custom':
      if (!customFrom || !customTo) {
        throw new Error('Custom date range requires both from and to dates');
      }
      startDate = new Date(customFrom);
      endDate = new Date(customTo);
      endDate.setHours(23, 59, 59, 999);
      displayLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      break;
    default:
      // Default to last 30 days
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      endDate = now;
      displayLabel = 'Last 30 days';
  }

  return { startDate, endDate, displayLabel };
}

// GET / — List user's reports
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { type, status, page = 1, limit = 20 } = req.query;

    // Demo/non-ObjectId users have no reports in DB
    if (!mongoose.isValidObjectId(userId)) {
      return res.json({ success: true, reports: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    }

    const filter = { userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select('-data')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Report.countDocuments(filter)
    ]);

    res.json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// POST /generate — Create and generate a report
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const companyId = req.user.companyId || req.user._id?.toString() || req.user.id;
    const { type, name, description, dateRange: dateRangePreset, format, customDateFrom, customDateTo, counterpartyId } = req.body;

    if (!type || !name) {
      return res.status(400).json({ success: false, message: 'Type and name are required' });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Report generation requires a real account. Please register or log in.' });
    }

    if (format === 'pdf') {
      return res.status(400).json({ success: false, message: 'PDF format is not yet supported. Please use CSV.' });
    }

    const { startDate, endDate, displayLabel } = resolveDateRange(dateRangePreset, customDateFrom, customDateTo);

    const report = new Report({
      userId,
      companyId,
      name,
      type,
      description: description || '',
      format: format || 'csv',
      status: 'generating',
      dateRange: {
        preset: dateRangePreset || 'last_30_days',
        startDate,
        endDate,
        displayLabel
      },
      parameters: {
        counterpartyId: counterpartyId || undefined
      }
    });

    await report.save();

    // Return immediately, then aggregate data in background
    res.status(201).json({
      success: true,
      report: {
        _id: report._id,
        id: report._id,
        name: report.name,
        type: report.type,
        description: report.description,
        status: report.status,
        dateRange: report.dateRange,
        createdAt: report.createdAt
      }
    });

    // Fire-and-forget aggregation
    aggregateReportData(report._id, companyId, startDate, endDate, counterpartyId).catch(err => {
      console.error('Report aggregation failed for report:', report._id, err);
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// Background aggregation function
async function aggregateReportData(reportId, companyId, startDate, endDate, counterpartyId) {
  try {
    const query = {
      companyId,
      matchRunDate: { $gte: startDate, $lte: endDate }
    };
    if (counterpartyId) {
      query.counterpartyId = counterpartyId;
    }

    const matchResults = await MatchingResult.find(query)
      .sort({ matchRunDate: -1 })
      .lean();

    let totalPerfectMatches = 0;
    let totalMismatches = 0;
    let totalUnmatchedCompany1 = 0;
    let totalUnmatchedCompany2 = 0;
    let totalCompany1 = 0;
    let totalCompany2 = 0;
    let totalMatchRate = 0;
    const matchRunDetails = [];

    for (const result of matchResults) {
      const stats = result.statistics || {};
      const perfectCount = stats.perfectMatchCount || (result.perfectMatches ? result.perfectMatches.length : 0);
      const mismatchCount = stats.mismatchCount || (result.mismatches ? result.mismatches.length : 0);
      const unmatched1 = stats.unmatchedCompany1Count || (result.unmatchedItems?.company1 ? result.unmatchedItems.company1.length : 0);
      const unmatched2 = stats.unmatchedCompany2Count || (result.unmatchedItems?.company2 ? result.unmatchedItems.company2.length : 0);
      const matchRate = stats.matchRate || 0;
      const c1Total = result.totals?.company1Total || 0;
      const c2Total = result.totals?.company2Total || 0;

      totalPerfectMatches += perfectCount;
      totalMismatches += mismatchCount;
      totalUnmatchedCompany1 += unmatched1;
      totalUnmatchedCompany2 += unmatched2;
      totalCompany1 += c1Total;
      totalCompany2 += c2Total;
      totalMatchRate += matchRate;

      matchRunDetails.push({
        matchRunId: result._id,
        matchRunDate: result.matchRunDate,
        perfectMatchCount: perfectCount,
        mismatchCount: mismatchCount,
        unmatchedCompany1Count: unmatched1,
        unmatchedCompany2Count: unmatched2,
        matchRate: matchRate,
        company1Total: c1Total,
        company2Total: c2Total,
        variance: c1Total - c2Total
      });
    }

    const averageMatchRate = matchResults.length > 0 ? totalMatchRate / matchResults.length : 0;

    const dataPayload = {
      matchRunsIncluded: matchResults.length,
      totalPerfectMatches,
      totalMismatches,
      totalUnmatchedCompany1,
      totalUnmatchedCompany2,
      averageMatchRate: Math.round(averageMatchRate * 100) / 100,
      totals: {
        company1Total: Math.round(totalCompany1 * 100) / 100,
        company2Total: Math.round(totalCompany2 * 100) / 100,
        variance: Math.round((totalCompany1 - totalCompany2) * 100) / 100
      },
      matchRunDetails
    };

    // Estimate file size from data
    const jsonSize = JSON.stringify(dataPayload).length;
    const estimatedCsvSize = jsonSize * 1.2; // rough estimate

    await Report.findByIdAndUpdate(reportId, {
      status: 'ready',
      data: dataPayload,
      fileSize: Math.round(estimatedCsvSize),
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    await Report.findByIdAndUpdate(reportId, {
      status: 'failed',
      error: error.message
    });
  }
}

// GET /:id — Get single report with full data
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const report = await Report.findOne({ _id: req.params.id, userId }).lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
});

// GET /:id/download — Download report as CSV
router.get('/:id/download', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const report = await Report.findOne({ _id: req.params.id, userId }).lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status !== 'ready') {
      return res.status(400).json({ success: false, message: 'Report is not ready for download' });
    }

    if (report.format === 'pdf') {
      return res.status(400).json({ success: false, message: 'PDF download is not yet supported' });
    }

    const companyId = report.companyId;
    const startDate = report.dateRange?.startDate;
    const endDate = report.dateRange?.endDate;

    // Build CSV based on report type
    let csvContent = '';

    const query = {
      companyId,
      matchRunDate: { $gte: startDate, $lte: endDate }
    };
    if (report.parameters?.counterpartyId) {
      query.counterpartyId = report.parameters.counterpartyId;
    }

    const matchResults = await MatchingResult.find(query)
      .sort({ matchRunDate: -1 })
      .lean();

    switch (report.type) {
      case 'reconciliation':
        csvContent = buildReconciliationCsv(report, matchResults);
        break;
      case 'matching':
        csvContent = buildMatchingCsv(report, matchResults);
        break;
      case 'discrepancy':
        csvContent = buildDiscrepancyCsv(report, matchResults);
        break;
      case 'audit':
        csvContent = buildAuditCsv(report, matchResults);
        break;
      default:
        csvContent = buildReconciliationCsv(report, matchResults);
    }

    const fileName = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ success: false, message: 'Failed to download report' });
  }
});

// CSV builder helpers
function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildReconciliationCsv(report, matchResults) {
  const lines = [];
  // Summary header
  lines.push('Reconciliation Summary Report');
  lines.push(`Generated,${escapeCsv(report.generatedAt?.toISOString?.() || new Date().toISOString())}`);
  lines.push(`Date Range,${escapeCsv(report.dateRange?.displayLabel || '')}`);
  lines.push('');

  // Summary stats
  const data = report.data || {};
  lines.push('Summary');
  lines.push(`Match Runs Included,${data.matchRunsIncluded || 0}`);
  lines.push(`Total Perfect Matches,${data.totalPerfectMatches || 0}`);
  lines.push(`Total Mismatches,${data.totalMismatches || 0}`);
  lines.push(`Total Unmatched (Company 1),${data.totalUnmatchedCompany1 || 0}`);
  lines.push(`Total Unmatched (Company 2),${data.totalUnmatchedCompany2 || 0}`);
  lines.push(`Average Match Rate,${data.averageMatchRate || 0}%`);
  lines.push(`Company 1 Total,${data.totals?.company1Total || 0}`);
  lines.push(`Company 2 Total,${data.totals?.company2Total || 0}`);
  lines.push(`Variance,${data.totals?.variance || 0}`);
  lines.push('');

  // Match run details
  lines.push('Match Run Details');
  lines.push('Run Date,Perfect Matches,Mismatches,Unmatched (Co1),Unmatched (Co2),Match Rate,Company 1 Total,Company 2 Total,Variance');
  for (const run of (data.matchRunDetails || [])) {
    lines.push([
      escapeCsv(run.matchRunDate ? new Date(run.matchRunDate).toISOString() : ''),
      run.perfectMatchCount || 0,
      run.mismatchCount || 0,
      run.unmatchedCompany1Count || 0,
      run.unmatchedCompany2Count || 0,
      `${run.matchRate || 0}%`,
      run.company1Total || 0,
      run.company2Total || 0,
      run.variance || 0
    ].join(','));
  }

  // All match data
  lines.push('');
  lines.push('Perfect Matches');
  lines.push('Run Date,Invoice Number (Co1),Amount (Co1),Invoice Number (Co2),Amount (Co2)');
  for (const result of matchResults) {
    for (const match of (result.perfectMatches || [])) {
      lines.push([
        escapeCsv(result.matchRunDate ? new Date(result.matchRunDate).toISOString() : ''),
        escapeCsv(match.company1?.transactionNumber || ''),
        match.company1?.amount || 0,
        escapeCsv(match.company2?.transactionNumber || ''),
        match.company2?.amount || 0
      ].join(','));
    }
  }

  return lines.join('\n');
}

function buildMatchingCsv(report, matchResults) {
  const lines = [];
  lines.push('Matching Results Report');
  lines.push(`Generated,${escapeCsv(report.generatedAt?.toISOString?.() || new Date().toISOString())}`);
  lines.push(`Date Range,${escapeCsv(report.dateRange?.displayLabel || '')}`);
  lines.push('');

  lines.push('Perfect Matches');
  lines.push('Run Date,Invoice (Co1),Type (Co1),Amount (Co1),Date (Co1),Invoice (Co2),Type (Co2),Amount (Co2),Date (Co2)');
  for (const result of matchResults) {
    for (const match of (result.perfectMatches || [])) {
      lines.push([
        escapeCsv(result.matchRunDate ? new Date(result.matchRunDate).toISOString() : ''),
        escapeCsv(match.company1?.transactionNumber || ''),
        escapeCsv(match.company1?.type || ''),
        match.company1?.amount || 0,
        escapeCsv(match.company1?.date || ''),
        escapeCsv(match.company2?.transactionNumber || ''),
        escapeCsv(match.company2?.type || ''),
        match.company2?.amount || 0,
        escapeCsv(match.company2?.date || '')
      ].join(','));
    }
  }

  lines.push('');
  lines.push('Mismatches');
  lines.push('Run Date,Invoice (Co1),Amount (Co1),Invoice (Co2),Amount (Co2),Difference');
  for (const result of matchResults) {
    for (const mismatch of (result.mismatches || [])) {
      const diff = (mismatch.company1?.amount || 0) - (mismatch.company2?.amount || 0);
      lines.push([
        escapeCsv(result.matchRunDate ? new Date(result.matchRunDate).toISOString() : ''),
        escapeCsv(mismatch.company1?.transactionNumber || ''),
        mismatch.company1?.amount || 0,
        escapeCsv(mismatch.company2?.transactionNumber || ''),
        mismatch.company2?.amount || 0,
        Math.round(diff * 100) / 100
      ].join(','));
    }
  }

  return lines.join('\n');
}

function buildDiscrepancyCsv(report, matchResults) {
  const lines = [];
  lines.push('Discrepancy Analysis Report');
  lines.push(`Generated,${escapeCsv(report.generatedAt?.toISOString?.() || new Date().toISOString())}`);
  lines.push(`Date Range,${escapeCsv(report.dateRange?.displayLabel || '')}`);
  lines.push('');

  lines.push('Mismatches');
  lines.push('Run Date,Invoice (Co1),Amount (Co1),Invoice (Co2),Amount (Co2),Variance');
  for (const result of matchResults) {
    for (const mismatch of (result.mismatches || [])) {
      const variance = (mismatch.company1?.amount || 0) - (mismatch.company2?.amount || 0);
      lines.push([
        escapeCsv(result.matchRunDate ? new Date(result.matchRunDate).toISOString() : ''),
        escapeCsv(mismatch.company1?.transactionNumber || ''),
        mismatch.company1?.amount || 0,
        escapeCsv(mismatch.company2?.transactionNumber || ''),
        mismatch.company2?.amount || 0,
        Math.round(variance * 100) / 100
      ].join(','));
    }
  }

  lines.push('');
  lines.push('Unmatched - Company 1');
  lines.push('Run Date,Invoice Number,Type,Amount,Date,Status');
  for (const result of matchResults) {
    for (const item of (result.unmatchedItems?.company1 || [])) {
      lines.push([
        escapeCsv(result.matchRunDate ? new Date(result.matchRunDate).toISOString() : ''),
        escapeCsv(item.transactionNumber || ''),
        escapeCsv(item.type || ''),
        item.amount || 0,
        escapeCsv(item.date || ''),
        escapeCsv(item.status || '')
      ].join(','));
    }
  }

  lines.push('');
  lines.push('Unmatched - Company 2');
  lines.push('Run Date,Invoice Number,Type,Amount,Date,Status');
  for (const result of matchResults) {
    for (const item of (result.unmatchedItems?.company2 || [])) {
      lines.push([
        escapeCsv(result.matchRunDate ? new Date(result.matchRunDate).toISOString() : ''),
        escapeCsv(item.transactionNumber || ''),
        escapeCsv(item.type || ''),
        item.amount || 0,
        escapeCsv(item.date || ''),
        escapeCsv(item.status || '')
      ].join(','));
    }
  }

  return lines.join('\n');
}

function buildAuditCsv(report, matchResults) {
  const lines = [];
  lines.push('Audit Trail Report');
  lines.push(`Generated,${escapeCsv(report.generatedAt?.toISOString?.() || new Date().toISOString())}`);
  lines.push(`Date Range,${escapeCsv(report.dateRange?.displayLabel || '')}`);
  lines.push('');

  lines.push('Match Run History');
  lines.push('Run Date,Source Type 1,File Name 1,Source Type 2,File Name 2,Perfect Matches,Mismatches,Unmatched (Co1),Unmatched (Co2),Match Rate,Company 1 Total,Company 2 Total,Variance,Processing Time (ms)');
  for (const result of matchResults) {
    const stats = result.statistics || {};
    lines.push([
      escapeCsv(result.matchRunDate ? new Date(result.matchRunDate).toISOString() : ''),
      escapeCsv(result.sourceType1 || ''),
      escapeCsv(result.fileName1 || ''),
      escapeCsv(result.sourceType2 || ''),
      escapeCsv(result.fileName2 || ''),
      stats.perfectMatchCount || (result.perfectMatches?.length || 0),
      stats.mismatchCount || (result.mismatches?.length || 0),
      stats.unmatchedCompany1Count || (result.unmatchedItems?.company1?.length || 0),
      stats.unmatchedCompany2Count || (result.unmatchedItems?.company2?.length || 0),
      `${stats.matchRate || 0}%`,
      result.totals?.company1Total || 0,
      result.totals?.company2Total || 0,
      result.totals?.variance || 0,
      stats.processingTime || ''
    ].join(','));
  }

  return lines.join('\n');
}

// DELETE /:id — Delete a report
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const report = await Report.findOneAndDelete({ _id: req.params.id, userId });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
});

export default router;
