import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../lib/supabase.js';
import { mapId } from '../lib/transformers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get settings
router.get('/', authenticate, async (req, res) => {
  try {
    let { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    
    if (!settings) {
      const { data: createdSettings, error: createError } = await supabaseAdmin
        .from('settings')
        .insert({
          updated_by: req.user._id,
        })
        .select('*')
        .single();
      if (createError) throw createError;
      settings = createdSettings;
    }

    const mapped = mapId(settings);
    res.json({
      settings: {
        ...mapped,
        companyName: mapped.company_name,
        defaultGstPercent: mapped.default_gst_percent,
        defaultProfitMargin: mapped.default_profit_margin,
        currencySymbol: mapped.currency_symbol,
        decimalPrecision: mapped.decimal_precision,
        logoUrl: mapped.logo_url,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update settings
router.put('/', authenticate, authorize('admin'), [
  body('companyName').notEmpty().trim(),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('gstin').optional().trim(),
  body('cin').optional().trim(),
  body('defaultGstPercent').isFloat({ min: 0, max: 28 }),
  body('defaultProfitMargin').isFloat({ min: 0, max: 100 }),
  body('currencySymbol').notEmpty().trim(),
  body('decimalPrecision').isInt({ min: 2, max: 4 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const updateData = {
      company_name: req.body.companyName,
      address: req.body.address,
      phone: req.body.phone,
      email: req.body.email,
      gstin: req.body.gstin,
      cin: req.body.cin,
      default_gst_percent: req.body.defaultGstPercent,
      default_profit_margin: req.body.defaultProfitMargin,
      currency_symbol: req.body.currencySymbol,
      decimal_precision: req.body.decimalPrecision,
      updated_by: req.user._id,
    };

    let { data: settings, error: findError } = await supabaseAdmin
      .from('settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (findError) throw findError;

    if (!settings) {
      const { data: created, error: createError } = await supabaseAdmin
        .from('settings')
        .insert(updateData)
        .select('*')
        .single();
      if (createError) throw createError;
      settings = created;
    } else {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('settings')
        .update(updateData)
        .eq('id', settings.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      settings = updated;
    }

    const mapped = mapId(settings);
    res.json({
      settings: {
        ...mapped,
        companyName: mapped.company_name,
        address: mapped.address,
        phone: mapped.phone,
        email: mapped.email,
        gstin: mapped.gstin,
        cin: mapped.cin,
        defaultGstPercent: mapped.default_gst_percent,
        defaultProfitMargin: mapped.default_profit_margin,
        currencySymbol: mapped.currency_symbol,
        decimalPrecision: mapped.decimal_precision,
        logoUrl: mapped.logo_url,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload logo
router.post('/logo', authenticate, authorize('admin'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    let { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    if (!settings) {
      const { error: createError } = await supabaseAdmin
        .from('settings')
        .insert({
          logo_url: logoUrl,
          updated_by: req.user._id
        });
      if (createError) throw createError;
    } else {
      const { error: updateError } = await supabaseAdmin
        .from('settings')
        .update({
          logo_url: logoUrl,
          updated_by: req.user._id
        })
        .eq('id', settings.id);
      if (updateError) throw updateError;
    }

    res.json({ logoUrl });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;