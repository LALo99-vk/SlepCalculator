import express from 'express';
import { body, validationResult } from 'express-validator';
import Client from '../models/Client.js';
import Quotation from '../models/Quotation.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all clients
router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') },
        { gstin: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const clients = await Client.find(query).sort({ name: 1 });

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single client
router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ client });
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

    const client = new Client(req.body);
    await client.save();

    res.status(201).json({ client });
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

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete client
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Check if client has any quotations
    const quotationCount = await Quotation.countDocuments({ 'client._id': req.params.id });
    
    if (quotationCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete client. ${quotationCount} quotation(s) are associated with this client.` 
      });
    }

    const client = await Client.findByIdAndDelete(req.params.id);

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
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const quotations = await Quotation.find({ 'client.name': client.name })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ quotations, clientName: client.name });
  } catch (error) {
    console.error('Get client quotations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;