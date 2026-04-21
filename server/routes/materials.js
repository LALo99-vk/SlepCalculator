import express from 'express';
import { body, validationResult } from 'express-validator';
import Material from '../models/Material.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all materials
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, search } = req.query;
    
    const query = {};
    
    if (type && ['PP', 'HDPE', 'LDPE', 'ABS', 'Nylon', 'PVC', 'PET', 'Custom'].includes(type)) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { supplierName: new RegExp(search, 'i') }
      ];
    }

    const materials = await Material.find(query)
      .populate('updatedBy', 'name')
      .sort({ name: 1 });

    res.json({ materials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single material
router.get('/:id', authenticate, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('updatedBy', 'name')
      .populate('priceHistory.updatedBy', 'name');

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.json({ material });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create material
router.post('/', authenticate, authorize('admin'), [
  body('name').notEmpty().trim(),
  body('type').isIn(['PP', 'HDPE', 'LDPE', 'ABS', 'Nylon', 'PVC', 'PET', 'Custom']),
  body('pricePerKg').isFloat({ min: 0.01 }),
  body('density').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('supplierName').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const materialData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const material = new Material(materialData);
    await material.save();
    await material.populate('updatedBy', 'name');

    res.status(201).json({ material });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update material
router.put('/:id', authenticate, authorize('admin'), [
  body('name').optional().notEmpty().trim(),
  body('type').optional().isIn(['PP', 'HDPE', 'LDPE', 'ABS', 'Nylon', 'PVC', 'PET', 'Custom']),
  body('pricePerKg').optional().isFloat({ min: 0.01 }),
  body('density').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('supplierName').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('updatedBy', 'name');

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.json({ material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete material
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get material price history
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('priceHistory.updatedBy', 'name')
      .select('name priceHistory');

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.json({ 
      materialName: material.name,
      priceHistory: material.priceHistory.sort((a, b) => b.date - a.date)
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;