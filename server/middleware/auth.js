import { supabaseAdmin } from '../lib/supabase.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (userError || !adminUser || !adminUser.is_active) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    req.user = {
      _id: adminUser.id,
      id: adminUser.id,
      authUserId: authData.user.id,
      name: adminUser.name,
      email: adminUser.email,
      role: 'admin',
      company: adminUser.company,
      isActive: adminUser.is_active,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};