import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../lib/supabase.js';
import { mapId, mapIds } from '../lib/transformers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.json({
      users: mapIds(users || []).map((user) => ({
        ...user,
        role: 'admin',
        isActive: user.is_active,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user (admin only)
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: { ...mapId(user), role: 'admin', isActive: user.is_active } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('company').optional().trim(),
  body('isActive').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const existingUsers = await supabaseAdmin.from('admin_users').select('id');
    if ((existingUsers.data || []).length > 0) {
      return res.status(400).json({ message: 'Only one admin authentication is allowed in this setup' });
    }

    const { name, email, password, company, isActive } = req.body;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError || !authUser?.user) throw authError || new Error('Unable to create auth user');

    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        auth_user_id: authUser.user.id,
        name,
        email,
        company,
        is_active: isActive,
      })
      .select('*')
      .single();
    if (error) throw error;

    res.status(201).json({ user: { ...mapId(user), role: 'admin', isActive: user.is_active } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', authenticate, authorize('admin'), [
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('company').optional().trim(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (currentUserError) throw currentUserError;
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const updateData = {
      name: req.body.name ?? currentUser.name,
      email: req.body.email ?? currentUser.email,
      company: req.body.company ?? currentUser.company,
      is_active: req.body.isActive ?? currentUser.is_active,
    };

    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.email || req.body.password) {
      const authPayload = {};
      if (req.body.email) authPayload.email = req.body.email;
      if (req.body.password) authPayload.password = req.body.password;
      await supabaseAdmin.auth.admin.updateUserById(currentUser.auth_user_id, authPayload);
    }

    res.json({ user: { ...mapId(user), role: 'admin', isActive: user.is_active } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    return res.status(400).json({ message: 'Deleting the only admin account is disabled for security' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;