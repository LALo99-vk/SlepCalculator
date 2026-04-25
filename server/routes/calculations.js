import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../lib/supabase.js';
import { mapId } from '../lib/transformers.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const serializeCalculation = (row, user) => {
  const mapped = mapId(row);
  return {
    ...mapped,
    jobName: mapped.job_name,
    createdBy: { _id: mapped.created_by, name: user.name },
  };
};

// Get all calculations for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, mode, material, startDate, endDate } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from('calculations')
      .select('*', { count: 'exact' })
      .eq('created_by', req.user._id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (mode && ['A', 'B'].includes(mode)) query = query.eq('mode', mode);
    if (startDate && endDate) query = query.gte('created_at', startDate).lte('created_at', endDate);

    const { data, error, count } = await query;
    if (error) throw error;

    const calculations = (data || [])
      .filter((calc) => {
        if (!material) return true;
        return String(calc.inputs?.material || '').toLowerCase().includes(String(material).toLowerCase());
      })
      .map((calc) => serializeCalculation(calc, req.user));

    const total = count || calculations.length;

    res.json({
      calculations,
      totalPages: Math.ceil(total / limit),
      currentPage: pageNumber,
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
    const { data: calculation, error } = await supabaseAdmin
      .from('calculations')
      .select('*')
      .eq('id', req.params.id)
      .eq('created_by', req.user._id)
      .maybeSingle();

    if (error) throw error;

    if (!calculation) {
      return res.status(404).json({ message: 'Calculation not found' });
    }

    res.json({ calculation: serializeCalculation(calculation, req.user) });
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

    const calculationData = {
      job_name: jobName,
      notes,
      mode,
      inputs,
      outputs,
      created_by: req.user._id
    };

    const { data: calculation, error } = await supabaseAdmin
      .from('calculations')
      .insert(calculationData)
      .select('*')
      .single();
    if (error) throw error;

    res.status(201).json({ calculation: serializeCalculation(calculation, req.user) });
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

    const { data: calculation, error } = await supabaseAdmin
      .from('calculations')
      .update({ job_name: jobName, notes })
      .eq('id', req.params.id)
      .eq('created_by', req.user._id)
      .select('*')
      .maybeSingle();
    if (error) throw error;

    if (!calculation) {
      return res.status(404).json({ message: 'Calculation not found' });
    }

    res.json({ calculation: serializeCalculation(calculation, req.user) });
  } catch (error) {
    console.error('Update calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete calculation
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: calculation, error } = await supabaseAdmin
      .from('calculations')
      .delete()
      .eq('id', req.params.id)
      .eq('created_by', req.user._id)
      .select('id')
      .maybeSingle();
    if (error) throw error;

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
    const { data: calculation, error } = await supabaseAdmin
      .from('calculations')
      .select('id')
      .eq('id', req.params.id)
      .eq('created_by', req.user._id)
      .maybeSingle();
    if (error) throw error;

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