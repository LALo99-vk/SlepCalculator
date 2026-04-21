import express from 'express';
import { body, validationResult } from 'express-validator';
import Quotation from '../models/Quotation.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const normalizeLineItems = (lineItems = []) =>
  lineItems.map((item) => ({
    ...item,
    lineTotal:
      typeof item.lineTotal === 'number'
        ? item.lineTotal
        : (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
  }));

// Get all quotations
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, client, startDate, endDate } = req.query;
    
    const query = {};
    
    // Add filters
    if (status && ['draft', 'sent', 'approved', 'rejected', 'revised'].includes(status)) {
      query.status = status;
    }
    
    if (client) {
      query['client.name'] = new RegExp(client, 'i');
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const quotations = await Quotation.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quotation.countDocuments(query);

    res.json({
      quotations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single quotation
router.get('/:id', authenticate, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    const quotation = await Quotation.findOne(query).populate('createdBy', 'name');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ quotation });
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public quotation (no auth required)
router.get('/public/:quoteNumber', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ 
      quoteNumber: req.params.quoteNumber 
    });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ quotation });
  } catch (error) {
    console.error('Get public quotation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create quotation
router.post('/', authenticate, authorize('admin'), [
  body('quoteNumber').notEmpty().trim(),
  body('quoteDate').isISO8601(),
  body('validUntil').isISO8601(),
  body('client.name').notEmpty().trim(),
  body('lineItems').isArray({ min: 1 }),
  body('profitMargin').isFloat({ min: 0, max: 100 }),
  body('gstPercent').isFloat({ min: 0, max: 28 }),
  body('gstType').isIn(['same_state', 'inter_state'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    // Check if quote number already exists
    const existingQuote = await Quotation.findOne({ quoteNumber: req.body.quoteNumber });
    if (existingQuote) {
      return res.status(400).json({ message: 'Quote number already exists' });
    }

    const quotationData = {
      ...req.body,
      lineItems: normalizeLineItems(req.body.lineItems),
      createdBy: req.user._id
    };

    const quotation = new Quotation(quotationData);
    await quotation.save();
    await quotation.populate('createdBy', 'name');

    res.status(201).json({ quotation });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update quotation
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lineItems: normalizeLineItems(req.body.lineItems),
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ quotation });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update quotation status
router.put('/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['draft', 'sent', 'approved', 'rejected', 'revised'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { status } = req.body;

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ quotation });
  } catch (error) {
    console.error('Update quotation status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete quotation
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export quotation as PDF
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    const quotation = await Quotation.findOne(query);

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // For now, return a simple response
    // In production, you would generate a PDF using puppeteer
    res.json({ message: 'PDF generation not implemented yet' });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export public quotation as PDF (no auth required)
router.get('/public/:quoteNumber/pdf', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ 
      quoteNumber: req.params.quoteNumber 
    });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // For now, return a simple response
    // In production, you would generate a PDF using puppeteer
    res.json({ message: 'PDF generation not implemented yet' });
  } catch (error) {
    console.error('Export public PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Preview quotation PDF
router.post('/preview/pdf', authenticate, authorize('admin'), async (req, res) => {
  try {
    // For now, return a simple response
    // In production, you would generate a PDF using puppeteer
    res.json({ message: 'PDF preview not implemented yet' });
  } catch (error) {
    console.error('Preview PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export quotations list as CSV
router.get('/export/csv', authenticate, authorize('admin'), async (req, res) => {
  try {
    const quotations = await Quotation.find({})
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    // For now, return a simple response
    // In production, you would generate a CSV file
    res.json({ message: 'CSV export not implemented yet', count: quotations.length });
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;