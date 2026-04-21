import express from 'express';
import { body, validationResult } from 'express-validator';
import Calculation from '../models/Calculation.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all calculations for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, mode, material, startDate, endDate } = req.query;
    
    const query = { createdBy: req.user._id };
    
    // Add filters
    if (mode && ['A', 'B'].includes(mode)) {
      query.mode = mode;
    }
    
    if (material) {
      query['inputs.material'] = new RegExp(material, 'i');
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const calculations = await Calculation.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Calculation.countDocuments(query);

    res.json({
      calculations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get calculations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single calculation
router.get('/:id', authenticate, async (req, res) => {
  try {
    const calculation = await Calculation.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    }).populate('createdBy', 'name');

    if (!calculation) {
      return res.status(404).json({ message: 'Calculation not found' });
    }

    res.json({ calculation });
  } catch (error) {
    console.error('Get calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create calculation
router.post('/', authenticate, [
  body('jobName').notEmpty().trim(),
  body('mode').isIn(['A', 'B']),
  body('inputs').isObject(),
  body('outputs').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { jobName, notes, mode, inputs, outputs } = req.body;

    const calculation = new Calculation({
      jobName,
      notes,
      mode,
      inputs,
      outputs,
      createdBy: req.user._id
    });

    await calculation.save();
    await calculation.populate('createdBy', 'name');

    res.status(201).json({ calculation });
  } catch (error) {
    console.error('Create calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update calculation
router.put('/:id', authenticate, [
  body('jobName').optional().notEmpty().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { jobName, notes } = req.body;

    const calculation = await Calculation.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { jobName, notes },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!calculation) {
      return res.status(404).json({ message: 'Calculation not found' });
    }

    res.json({ calculation });
  } catch (error) {
    console.error('Update calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete calculation
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const calculation = await Calculation.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!calculation) {
      return res.status(404).json({ message: 'Calculation not found' });
    }

    res.json({ message: 'Calculation deleted successfully' });
  } catch (error) {
    console.error('Delete calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export calculation as PDF
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const calculation = await Calculation.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    }).populate('createdBy', 'name');

    if (!calculation) {
      return res.status(404).json({ message: 'Calculation not found' });
    }

    // For now, return a simple response
    // In production, you would generate a PDF using puppeteer
    res.json({ message: 'PDF generation not implemented yet' });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;