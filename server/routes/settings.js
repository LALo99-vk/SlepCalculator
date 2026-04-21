import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import Settings from '../models/Settings.js';
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
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = new Settings({
        updatedBy: req.user._id
      });
      await settings.save();
    }

    res.json({ settings });
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
      ...req.body,
      updatedBy: req.user._id
    };

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(updateData);
    } else {
      Object.assign(settings, updateData);
    }

    await settings.save();

    res.json({ settings });
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

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({
        logoUrl,
        updatedBy: req.user._id
      });
    } else {
      settings.logoUrl = logoUrl;
      settings.updatedBy = req.user._id;
    }

    await settings.save();

    res.json({ logoUrl });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;