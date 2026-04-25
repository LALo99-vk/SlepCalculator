import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../lib/supabase.js';
import { mapId, mapIds } from '../lib/transformers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all clients
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;

    const searchTerm = String(req.query.search || '').toLowerCase();
    const clients = mapIds((data || []).filter((client) => {
      if (!searchTerm) return true;
      return ['name', 'company', 'gstin', 'email'].some((field) =>
        String(client[field] || '').toLowerCase().includes(searchTerm)
      );
    }));

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single client
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ client: mapId(client) });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create client
router.post('/', authenticate, authorize('admin'), [
  body('name').notEmpty().trim(),
  body('company').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('gstin').optional().trim().toUpperCase(),
  body('pan').optional().trim().toUpperCase(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert(req.body)
      .select('*')
      .single();
    if (error) throw error;

    res.status(201).json({ client: mapId(client) });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update client
router.put('/:id', authenticate, authorize('admin'), [
  body('name').optional().notEmpty().trim(),
  body('company').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('gstin').optional().trim().toUpperCase(),
  body('pan').optional().trim().toUpperCase(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ client: mapId(client) });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete client
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data: quotations, error: countError } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .eq('client_id', req.params.id);
    if (countError) throw countError;
    const quotationCount = quotations?.length || 0;
    
    if (quotationCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete client. ${quotationCount} quotation(s) are associated with this client.` 
      });
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get client quotations
router.get('/:id/quotations', authenticate, async (req, res) => {
  try {
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (clientError) throw clientError;
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const { data: quotationsData, error: quoteError } = await supabaseAdmin
      .from('quotations')
      .select('*')
      .eq('client_id', req.params.id)
      .order('created_at', { ascending: false });
    if (quoteError) throw quoteError;

    const quotations = mapIds(quotationsData || []).map((quotation) => ({
      ...quotation,
      createdBy: { _id: req.user._id, name: req.user.name },
    }));

    res.json({ quotations, clientName: client.name });
  } catch (error) {
    console.error('Get client quotations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;