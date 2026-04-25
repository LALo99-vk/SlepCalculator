import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin, supabaseAuth } from '../lib/supabase.js';
import { userPublicFields } from '../lib/transformers.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, password } = req.body;

    const { data: authLogin, error: loginError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !authLogin?.user || !authLogin?.session?.access_token) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('auth_user_id', authLogin.user.id)
      .single();

    if (userError || !adminUser || !adminUser.is_active) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await supabaseAdmin
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id);

    res.json({
      token: authLogin.session.access_token,
      user: userPublicFields({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: 'admin',
        company: adminUser.company,
      }),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: userPublicFields(req.user),
  });
});

// Update profile
router.put('/profile', authenticate, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { name, email } = req.body;

    const { data: existingUsers, error: existingError } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .neq('id', req.user._id);

    if (existingError) {
      throw existingError;
    }

    if (existingUsers?.length) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const { data: user, error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update({ name, email })
      .eq('id', req.user._id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    await supabaseAdmin.auth.admin.updateUserById(req.user.authUserId, { email });

    res.json({
      message: 'Profile updated successfully',
      user: userPublicFields({
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
        company: user.company,
      }),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const { error: verifyError } = await supabaseAuth.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(req.user.authUserId, {
      password: newPassword,
    });

    if (updatePasswordError) {
      throw updatePasswordError;
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;