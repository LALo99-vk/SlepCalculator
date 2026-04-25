import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../lib/supabase.js';
import { mapId, mapIds } from '../lib/transformers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const allowedFieldTypes = ['text', 'number', 'date', 'select', 'checkbox'];

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
    const { data: types, error } = await supabaseAdmin
      .from('custom_record_types')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.json({
      types: mapIds(types || []).map((type) => ({
        ...type,
        createdBy: { _id: type.created_by, name: req.user.name, email: req.user.email },
      })),
    });
  } catch (error) {
    console.error('Get custom record types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: type, error } = await supabaseAdmin
      .from('custom_record_types')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!type) return res.status(404).json({ message: 'Record type not found' });
    const mapped = mapId(type);
    res.json({ type: { ...mapped, createdBy: { _id: mapped.created_by, name: req.user.name, email: req.user.email } } });
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

      const { data: existing, error: existingError } = await supabaseAdmin
        .from('custom_record_types')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return res.status(400).json({ message: 'A record type with this name already exists' });

      const fields = parseFields(req.body.fields);
      const fieldError = validateFieldDefinitions(fields);
      if (fieldError) return res.status(400).json({ message: fieldError });

      const { data: type, error } = await supabaseAdmin
        .from('custom_record_types')
        .insert({
        name: req.body.name.trim(),
        slug,
        description: req.body.description || '',
        fields,
        created_by: req.user._id,
      })
        .select('*')
        .single();
      if (error) throw error;

      res.status(201).json({ type: mapId(type) });
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

      const slug = slugify(req.body.name);
      const { data: duplicateRows, error: duplicateError } = await supabaseAdmin
        .from('custom_record_types')
        .select('id')
        .eq('slug', slug)
        .neq('id', req.params.id);
      if (duplicateError) throw duplicateError;
      const duplicate = (duplicateRows || [])[0];
      if (duplicate) return res.status(400).json({ message: 'A record type with this name already exists' });

      const fields = parseFields(req.body.fields);
      const fieldError = validateFieldDefinitions(fields);
      if (fieldError) return res.status(400).json({ message: fieldError });

      const { data: type, error } = await supabaseAdmin
        .from('custom_record_types')
        .update({
          name: req.body.name.trim(),
          slug,
          description: req.body.description || '',
          fields,
        })
        .eq('id', req.params.id)
        .select('*')
        .maybeSingle();
      if (error) throw error;

      if (!type) return res.status(404).json({ message: 'Record type not found' });

      res.json({ type: mapId(type) });
    } catch (error) {
      console.error('Update custom record type error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const { data: deleted, error } = await supabaseAdmin
      .from('custom_record_types')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!deleted) return res.status(404).json({ message: 'Record type not found' });

    await supabaseAdmin.from('custom_record_entries').delete().eq('record_type_id', req.params.id);

    res.json({ message: 'Record type deleted successfully' });
  } catch (error) {
    console.error('Delete custom record type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Entries
router.get('/:typeId/entries', async (req, res) => {
  try {
    const { data: type, error: typeError } = await supabaseAdmin
      .from('custom_record_types')
      .select('*')
      .eq('id', req.params.typeId)
      .maybeSingle();
    if (typeError) throw typeError;
    if (!type) return res.status(404).json({ message: 'Record type not found' });

    const { data: entries, error: entryError } = await supabaseAdmin
      .from('custom_record_entries')
      .select('*')
      .eq('record_type_id', req.params.typeId)
      .order('created_at', { ascending: false });
    if (entryError) throw entryError;

    res.json({
      type: mapId(type),
      entries: mapIds(entries || []).map((entry) => ({
        ...entry,
        values: entry.values || {},
        createdBy: { _id: entry.created_by, name: req.user.name, email: req.user.email },
        updatedBy: { _id: entry.updated_by, name: req.user.name, email: req.user.email },
      })),
    });
  } catch (error) {
    console.error('Get custom record entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:typeId/entries', async (req, res) => {
  try {
    const { data: type, error: typeError } = await supabaseAdmin
      .from('custom_record_types')
      .select('*')
      .eq('id', req.params.typeId)
      .maybeSingle();
    if (typeError) throw typeError;
    if (!type) return res.status(404).json({ message: 'Record type not found' });

    const { normalizedValues, error } = validateEntryValues(type.fields, req.body.values || {});
    if (error) return res.status(400).json({ message: error });

    const { data: entry, error: entryError } = await supabaseAdmin
      .from('custom_record_entries')
      .insert({
      record_type_id: type.id,
      values: normalizedValues,
      created_by: req.user._id,
      updated_by: req.user._id,
    })
      .select('*')
      .single();
    if (entryError) throw entryError;

    res.status(201).json({ entry: mapId(entry) });
  } catch (error) {
    console.error('Create custom record entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:typeId/entries/:entryId', async (req, res) => {
  try {
    const { data: type, error: typeError } = await supabaseAdmin
      .from('custom_record_types')
      .select('*')
      .eq('id', req.params.typeId)
      .maybeSingle();
    if (typeError) throw typeError;
    if (!type) return res.status(404).json({ message: 'Record type not found' });

    const { normalizedValues, error } = validateEntryValues(type.fields, req.body.values || {});
    if (error) return res.status(400).json({ message: error });

    const { data: entry, error: entryError } = await supabaseAdmin
      .from('custom_record_entries')
      .update({ values: normalizedValues, updated_by: req.user._id })
      .eq('id', req.params.entryId)
      .eq('record_type_id', req.params.typeId)
      .select('*')
      .maybeSingle();
    if (entryError) throw entryError;

    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    res.json({ entry: mapId(entry) });
  } catch (error) {
    console.error('Update custom record entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:typeId/entries/:entryId', async (req, res) => {
  try {
    const { data: deleted, error } = await supabaseAdmin
      .from('custom_record_entries')
      .delete()
      .eq('id', req.params.entryId)
      .eq('record_type_id', req.params.typeId)
      .select('id')
      .maybeSingle();
    if (error) throw error;

    if (!deleted) return res.status(404).json({ message: 'Entry not found' });

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete custom record entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
