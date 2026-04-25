import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthCalculations, error: calcError } = await supabaseAdmin
      .from('calculations')
      .select('outputs')
      .gte('created_at', startOfMonth.toISOString());
    if (calcError) throw calcError;

    const { data: monthQuotations, error: quoteError } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .gte('created_at', startOfMonth.toISOString());
    if (quoteError) throw quoteError;

    const calculations = monthCalculations || [];
    const totalJobs = calculations.length;
    const quotationsThisMonth = (monthQuotations || []).length;

    let avgCostPerPiece = 0;
    let avgMaterialEfficiency = 0;

    if (calculations.length > 0) {
      const totalCost = calculations.reduce((sum, calc) => 
        sum + (calc.outputs.totalCostPerPiece || 0), 0);
      avgCostPerPiece = totalCost / calculations.length;

      const totalEfficiency = calculations.reduce((sum, calc) => 
        sum + (calc.outputs.materialEfficiency || 0), 0);
      avgMaterialEfficiency = totalEfficiency / calculations.length;
    }

    res.json({
      totalJobs,
      quotationsThisMonth,
      avgCostPerPiece: Math.round(avgCostPerPiece * 100) / 100,
      avgMaterialEfficiency: Math.round(avgMaterialEfficiency * 100) / 100
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard charts data
router.get('/charts', authenticate, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Cost trend over last 30 calculations
    const { data: recentCalculations, error: calcError } = await supabaseAdmin
      .from('calculations')
      .select('outputs, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(30);
    if (calcError) throw calcError;

    const costTrend = (recentCalculations || []).map(calc => ({
      date: new Date(calc.created_at).toISOString().split('T')[0],
      cost: calc.outputs?.totalCostPerPiece || 0
    }));

    // Volume data by week (last 4 weeks)
    const volumeData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      weekEnd.setHours(23, 59, 59, 999);

      const { data: weekCalculations, error: weekError } = await supabaseAdmin
        .from('calculations')
        .select('outputs')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());
      if (weekError) throw weekError;

      const totalPieces = (weekCalculations || []).reduce((sum, calc) =>
        sum + (calc.outputs?.totalPieces || 0), 0);

      volumeData.push({
        week: `Week ${4 - i}`,
        pieces: Math.round(totalPieces)
      });
    }

    // Quotation status distribution
    const { data: quotationRows, error: statusError } = await supabaseAdmin
      .from('quotations')
      .select('status');
    if (statusError) throw statusError;

    const statusCounts = {};
    for (const row of quotationRows || []) {
      statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
    }

    const statusColors = {
      draft: '#64748b',
      sent: '#3b82f6',
      approved: '#10b981',
      rejected: '#ef4444',
      revised: '#f59e0b'
    };

    const quotationStatusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusColors[status] || '#64748b'
    }));

    // Material usage (mock data for now)
    const materialUsage = [
      { material: 'PP', usage: 150 },
      { material: 'HDPE', usage: 120 },
      { material: 'ABS', usage: 80 },
      { material: 'LDPE', usage: 60 }
    ];

    res.json({
      costTrend,
      volumeData,
      quotationStatus: quotationStatusData,
      materialUsage
    });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;