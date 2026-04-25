import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../lib/supabase.js';
import { mapId } from '../lib/transformers.js';
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

const serializeQuotation = (quotation) => {
  const mapped = mapId(quotation);
  return {
    ...mapped,
    quoteNumber: mapped.quote_number,
    quoteDate: mapped.quote_date,
    validUntil: mapped.valid_until,
    referenceNumber: mapped.reference_number,
    lineItems: mapped.line_items || [],
    lineSubtotal: mapped.line_subtotal,
    profitMargin: mapped.profit_margin,
    profitAmount: mapped.profit_amount,
    afterProfit: mapped.after_profit,
    additionalCharges: mapped.additional_charges || [],
    additionalTotal: mapped.additional_total,
    afterAdditional: mapped.after_additional,
    discountPercent: mapped.discount_percent,
    discountAmount: mapped.discount_amount,
    taxableAmount: mapped.taxable_amount,
    gstPercent: mapped.gst_percent,
    gstType: mapped.gst_type,
    gstAmount: mapped.gst_amount,
    grandTotal: mapped.grand_total,
    amountInWords: mapped.amount_in_words,
    paymentTerms: mapped.payment_terms,
    deliveryTerms: mapped.delivery_terms,
    linkedCalculationId: mapped.linked_calculation_id,
    createdBy: { _id: mapped.created_by, name: mapped.created_by_name || 'Admin' },
  };
};

// Get all quotations
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, client, startDate, endDate } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from('quotations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status && ['draft', 'sent', 'approved', 'rejected', 'revised'].includes(String(status))) {
      query = query.eq('status', status);
    }
    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const searchClient = String(client || '').toLowerCase();
    const filtered = (data || []).filter((quote) => {
      if (!searchClient) return true;
      return String(quote.client?.name || '').toLowerCase().includes(searchClient);
    });
    const quotations = filtered.map(serializeQuotation);
    const total = count || quotations.length;

    res.json({
      quotations,
      totalPages: Math.ceil(total / limit),
      currentPage: pageNumber,
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
    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ quotation: serializeQuotation(quotation) });
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public quotation (no auth required)
router.get('/public/:quoteNumber', async (req, res) => {
  try {
    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .select('*')
      .eq('quote_number', req.params.quoteNumber)
      .maybeSingle();
    if (error) throw error;

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ quotation: serializeQuotation(quotation) });
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
    const { data: existingQuote, error: existingError } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .eq('quote_number', req.body.quoteNumber)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingQuote) {
      return res.status(400).json({ message: 'Quote number already exists' });
    }

    const quotationData = {
      quote_number: req.body.quoteNumber,
      quote_date: req.body.quoteDate,
      valid_until: req.body.validUntil,
      reference_number: req.body.referenceNumber,
      client_id: req.body.client?._id || null,
      client: req.body.client,
      line_items: normalizeLineItems(req.body.lineItems),
      line_subtotal: req.body.lineSubtotal,
      profit_margin: req.body.profitMargin,
      profit_amount: req.body.profitAmount,
      after_profit: req.body.afterProfit,
      additional_charges: req.body.additionalCharges || [],
      additional_total: req.body.additionalTotal || 0,
      after_additional: req.body.afterAdditional,
      discount_percent: req.body.discountPercent || 0,
      discount_amount: req.body.discountAmount || 0,
      taxable_amount: req.body.taxableAmount,
      gst_percent: req.body.gstPercent,
      gst_type: req.body.gstType,
      cgst: req.body.cgst || 0,
      sgst: req.body.sgst || 0,
      igst: req.body.igst || 0,
      gst_amount: req.body.gstAmount,
      grand_total: req.body.grandTotal,
      amount_in_words: req.body.amountInWords,
      payment_terms: req.body.paymentTerms,
      delivery_terms: req.body.deliveryTerms,
      notes: req.body.notes,
      status: req.body.status || 'draft',
      linked_calculation_id: req.body.linkedCalculationId || null,
      created_by: req.user._id,
      created_by_name: req.user.name
    };

    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .insert(quotationData)
      .select('*')
      .single();
    if (error) throw error;

    res.status(201).json({ quotation: serializeQuotation(quotation) });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update quotation
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const updateData = {
      quote_number: req.body.quoteNumber,
      quote_date: req.body.quoteDate,
      valid_until: req.body.validUntil,
      reference_number: req.body.referenceNumber,
      client_id: req.body.client?._id || null,
      client: req.body.client,
      line_items: normalizeLineItems(req.body.lineItems || []),
      line_subtotal: req.body.lineSubtotal,
      profit_margin: req.body.profitMargin,
      profit_amount: req.body.profitAmount,
      after_profit: req.body.afterProfit,
      additional_charges: req.body.additionalCharges || [],
      additional_total: req.body.additionalTotal || 0,
      after_additional: req.body.afterAdditional,
      discount_percent: req.body.discountPercent || 0,
      discount_amount: req.body.discountAmount || 0,
      taxable_amount: req.body.taxableAmount,
      gst_percent: req.body.gstPercent,
      gst_type: req.body.gstType,
      cgst: req.body.cgst || 0,
      sgst: req.body.sgst || 0,
      igst: req.body.igst || 0,
      gst_amount: req.body.gstAmount,
      grand_total: req.body.grandTotal,
      amount_in_words: req.body.amountInWords,
      payment_terms: req.body.paymentTerms,
      delivery_terms: req.body.deliveryTerms,
      notes: req.body.notes,
      status: req.body.status || 'draft',
      linked_calculation_id: req.body.linkedCalculationId || null,
    };

    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ quotation: serializeQuotation(quotation) });
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

    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .update({ status })
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ quotation: serializeQuotation(quotation) });
  } catch (error) {
    console.error('Update quotation status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete quotation
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;

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
    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;

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
    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .eq('quote_number', req.params.quoteNumber)
      .maybeSingle();
    if (error) throw error;

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
    const { data: quotations, error } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // For now, return a simple response
    // In production, you would generate a CSV file
    res.json({ message: 'CSV export not implemented yet', count: quotations.length });
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;