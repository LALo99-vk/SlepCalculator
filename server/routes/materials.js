import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../lib/supabase.js';
import { mapId, mapIds } from '../lib/transformers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all materials
router.get('/', authenticate, async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('materials')
      .select('*')
      .order('name', { ascending: true });

    if (req.query.type && ['PP', 'HDPE', 'LDPE', 'ABS', 'Nylon', 'PVC', 'PET', 'Custom'].includes(String(req.query.type))) {
      query = query.eq('type', req.query.type);
    }

    const { data, error } = await query;
    if (error) throw error;

    const searchTerm = String(req.query.search || '').toLowerCase();
    const materials = mapIds((data || []).filter((material) => {
      if (!searchTerm) return true;
      return ['name', 'description', 'supplier_name'].some((field) =>
        String(material[field] || '').toLowerCase().includes(searchTerm)
      );
    })).map((material) => ({
      ...material,
      supplierName: material.supplier_name,
      pricePerKg: material.price_per_kg,
      updatedBy: { _id: material.updated_by, name: req.user.name },
    }));

    res.json({ materials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single material
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: material, error } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const mapped = mapId(material);
    res.json({
      material: {
        ...mapped,
        supplierName: mapped.supplier_name,
        pricePerKg: mapped.price_per_kg,
        updatedBy: { _id: mapped.updated_by, name: req.user.name },
      },
    });
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
      name: req.body.name,
      type: req.body.type,
      price_per_kg: req.body.pricePerKg,
      density: req.body.density,
      description: req.body.description,
      supplier_name: req.body.supplierName,
      updated_by: req.user._id,
      price_history: [{ price: req.body.pricePerKg, date: new Date().toISOString(), updatedBy: req.user._id }],
    };

    const { data: material, error } = await supabaseAdmin
      .from('materials')
      .insert(materialData)
      .select('*')
      .single();
    if (error) throw error;

    const mapped = mapId(material);
    res.status(201).json({
      material: {
        ...mapped,
        supplierName: mapped.supplier_name,
        pricePerKg: mapped.price_per_kg,
        updatedBy: { _id: mapped.updated_by, name: req.user.name },
      },
    });
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

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return res.status(404).json({ message: 'Material not found' });

    const priceHistory = Array.isArray(existing.price_history) ? [...existing.price_history] : [];
    if (req.body.pricePerKg !== undefined && Number(req.body.pricePerKg) !== Number(existing.price_per_kg)) {
      priceHistory.push({ price: req.body.pricePerKg, date: new Date().toISOString(), updatedBy: req.user._id });
    }

    const updateData = {
      name: req.body.name ?? existing.name,
      type: req.body.type ?? existing.type,
      price_per_kg: req.body.pricePerKg ?? existing.price_per_kg,
      density: req.body.density ?? existing.density,
      description: req.body.description ?? existing.description,
      supplier_name: req.body.supplierName ?? existing.supplier_name,
      updated_by: req.user._id,
      price_history: priceHistory,
    };

    const { data: material, error } = await supabaseAdmin
      .from('materials')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const mapped = mapId(material);
    res.json({
      material: {
        ...mapped,
        supplierName: mapped.supplier_name,
        pricePerKg: mapped.price_per_kg,
        updatedBy: { _id: mapped.updated_by, name: req.user.name },
      },
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete material
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data: material, error } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;

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
    const { data: material, error } = await supabaseAdmin
      .from('materials')
      .select('id, name, price_history')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.json({ 
      materialName: material.name,
      priceHistory: (material.price_history || [])
        .map((entry) => ({
          ...entry,
          updatedBy: { _id: entry.updatedBy, name: req.user.name },
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;