import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import CustomRecordType, { allowedFieldTypes } from '../models/CustomRecordType.js';
import CustomRecordEntry from '../models/CustomRecordEntry.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const normalizeKey = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseFields = (fields = []) =>
  fields.map((field, index) => {
    const type = String(field.type || '').trim();
    const options = Array.isArray(field.options)
      ? field.options.map((option) => String(option).trim()).filter(Boolean)
      : [];

    return {
      key: normalizeKey(field.key || field.label || `field_${index + 1}`),
      label: String(field.label || '').trim(),
      type,
      required: Boolean(field.required),
      description: String(field.description || '').trim(),
      options,
      order: typeof field.order === 'number' ? field.order : index,
    };
  });

const validateFieldDefinitions = (fields = []) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    return 'At least one field is required';
  }

  const keys = new Set();
  for (const field of fields) {
    if (!field.label) return 'Each field must have a label';
    if (!field.key) return 'Each field must have a key';
    if (!allowedFieldTypes.includes(field.type)) {
      return `Unsupported field type "${field.type}"`;
    }
    if (keys.has(field.key)) return `Duplicate field key "${field.key}"`;
    keys.add(field.key);

    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      return `Field "${field.label}" must include options`;
    }
  }

  return null;
};

const validateEntryValues = (fields, values = {}) => {
  const normalizedValues = {};

  for (const field of fields) {
    const rawValue = values[field.key];
    const isEmptyString = typeof rawValue === 'string' && rawValue.trim() === '';
    const isMissing = rawValue === undefined || rawValue === null || isEmptyString;

    if (field.required && isMissing) {
      return { error: `Field "${field.label}" is required` };
    }

    if (isMissing) continue;

    if (field.type === 'text') {
      normalizedValues[field.key] = String(rawValue);
      continue;
    }

    if (field.type === 'number') {
      const num = Number(rawValue);
      if (Number.isNaN(num)) return { error: `Field "${field.label}" must be a number` };
      normalizedValues[field.key] = num;
      continue;
    }

    if (field.type === 'date') {
      const date = new Date(rawValue);
      if (Number.isNaN(date.getTime())) return { error: `Field "${field.label}" must be a valid date` };
      normalizedValues[field.key] = date.toISOString();
      continue;
    }

    if (field.type === 'select') {
      const selected = String(rawValue);
      if (!field.options.includes(selected)) {
        return { error: `Field "${field.label}" must be one of the configured options` };
      }
      normalizedValues[field.key] = selected;
      continue;
    }

    if (field.type === 'checkbox') {
      if (typeof rawValue === 'boolean') {
        normalizedValues[field.key] = rawValue;
        continue;
      }
      if (rawValue === 'true' || rawValue === 'false') {
        normalizedValues[field.key] = rawValue === 'true';
        continue;
      }
      return { error: `Field "${field.label}" must be true or false` };
    }
  }

  return { normalizedValues };
};

router.use(authenticate, authorize('admin'));

// Record types
router.get('/', async (req, res) => {
  try {
    const types = await CustomRecordType.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ types });
  } catch (error) {
    console.error('Get custom record types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const type = await CustomRecordType.findById(req.params.id).populate('createdBy', 'name email');
    if (!type) return res.status(404).json({ message: 'Record type not found' });
    res.json({ type });
  } catch (error) {
    console.error('Get custom record type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/',
  [body('name').notEmpty().trim(), body('description').optional().trim(), body('fields').isArray({ min: 1 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input', errors: errors.array() });

      const slug = slugify(req.body.name);
      if (!slug) return res.status(400).json({ message: 'Invalid record type name' });

      const existing = await CustomRecordType.findOne({ slug });
      if (existing) return res.status(400).json({ message: 'A record type with this name already exists' });

      const fields = parseFields(req.body.fields);
      const fieldError = validateFieldDefinitions(fields);
      if (fieldError) return res.status(400).json({ message: fieldError });

      const type = await CustomRecordType.create({
        name: req.body.name.trim(),
        slug,
        description: req.body.description || '',
        fields,
        createdBy: req.user._id,
      });

      res.status(201).json({ type });
    } catch (error) {
      console.error('Create custom record type error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/:id',
  [body('name').notEmpty().trim(), body('description').optional().trim(), body('fields').isArray({ min: 1 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input', errors: errors.array() });

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid type id' });
      }

      const slug = slugify(req.body.name);
      const duplicate = await CustomRecordType.findOne({ slug, _id: { $ne: req.params.id } });
      if (duplicate) return res.status(400).json({ message: 'A record type with this name already exists' });

      const fields = parseFields(req.body.fields);
      const fieldError = validateFieldDefinitions(fields);
      if (fieldError) return res.status(400).json({ message: fieldError });

      const type = await CustomRecordType.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name.trim(),
          slug,
          description: req.body.description || '',
          fields,
        },
        { new: true, runValidators: true }
      );

      if (!type) return res.status(404).json({ message: 'Record type not found' });

      res.json({ type });
    } catch (error) {
      console.error('Update custom record type error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid type id' });
    }

    const deleted = await CustomRecordType.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Record type not found' });

    await CustomRecordEntry.deleteMany({ recordTypeId: req.params.id });

    res.json({ message: 'Record type deleted successfully' });
  } catch (error) {
    console.error('Delete custom record type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Entries
router.get('/:typeId/entries', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.typeId)) {
      return res.status(400).json({ message: 'Invalid type id' });
    }

    const type = await CustomRecordType.findById(req.params.typeId);
    if (!type) return res.status(404).json({ message: 'Record type not found' });

    const entries = await CustomRecordEntry.find({ recordTypeId: req.params.typeId })
      .populate('createdBy updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ type, entries });
  } catch (error) {
    console.error('Get custom record entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:typeId/entries', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.typeId)) {
      return res.status(400).json({ message: 'Invalid type id' });
    }

    const type = await CustomRecordType.findById(req.params.typeId);
    if (!type) return res.status(404).json({ message: 'Record type not found' });

    const { normalizedValues, error } = validateEntryValues(type.fields, req.body.values || {});
    if (error) return res.status(400).json({ message: error });

    const entry = await CustomRecordEntry.create({
      recordTypeId: type._id,
      values: normalizedValues,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ entry });
  } catch (error) {
    console.error('Create custom record entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:typeId/entries/:entryId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.typeId) || !mongoose.Types.ObjectId.isValid(req.params.entryId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const type = await CustomRecordType.findById(req.params.typeId);
    if (!type) return res.status(404).json({ message: 'Record type not found' });

    const { normalizedValues, error } = validateEntryValues(type.fields, req.body.values || {});
    if (error) return res.status(400).json({ message: error });

    const entry = await CustomRecordEntry.findOneAndUpdate(
      { _id: req.params.entryId, recordTypeId: req.params.typeId },
      { values: normalizedValues, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    res.json({ entry });
  } catch (error) {
    console.error('Update custom record entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:typeId/entries/:entryId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.typeId) || !mongoose.Types.ObjectId.isValid(req.params.entryId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const deleted = await CustomRecordEntry.findOneAndDelete({
      _id: req.params.entryId,
      recordTypeId: req.params.typeId,
    });

    if (!deleted) return res.status(404).json({ message: 'Entry not found' });

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete custom record entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
