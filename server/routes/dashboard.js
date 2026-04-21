import express from 'express';
import Calculation from '../models/Calculation.js';
import Quotation from '../models/Quotation.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get calculations this month
    const totalJobs = await Calculation.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Get quotations this month
    const quotationsThisMonth = await Quotation.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Calculate average cost per piece this month
    const calculations = await Calculation.find({
      createdAt: { $gte: startOfMonth }
    });

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
    const recentCalculations = await Calculation.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 }).limit(30);

    const costTrend = recentCalculations.map(calc => ({
      date: calc.createdAt.toISOString().split('T')[0],
      cost: calc.outputs.totalCostPerPiece || 0
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

      const weekCalculations = await Calculation.find({
        createdAt: { $gte: weekStart, $lte: weekEnd }
      });

      const totalPieces = weekCalculations.reduce((sum, calc) => 
        sum + (calc.outputs.totalPieces || 0), 0);

      volumeData.push({
        week: `Week ${4 - i}`,
        pieces: Math.round(totalPieces)
      });
    }

    // Quotation status distribution
    const quotationStatus = await Quotation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusColors = {
      draft: '#64748b',
      sent: '#3b82f6',
      approved: '#10b981',
      rejected: '#ef4444',
      revised: '#f59e0b'
    };

    const quotationStatusData = quotationStatus.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      color: statusColors[item._id] || '#64748b'
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