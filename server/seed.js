import 'dotenv/config';
import { supabaseAdmin } from './lib/supabase.js';

const seedData = async () => {
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@company.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

    const { data: authUserResp, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError && !String(authError.message || '').toLowerCase().includes('already')) {
      throw authError;
    }

    let authUserId = authUserResp?.user?.id;
    if (!authUserId) {
      const existing = await supabaseAdmin.auth.admin.listUsers();
      authUserId = existing.data?.users?.find((u) => u.email === adminEmail)?.id;
    }
    if (!authUserId) throw new Error('Unable to locate admin auth user');

    const { data: adminRows } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', adminEmail)
      .limit(1);

    if (!adminRows?.length) {
      const { error: adminInsertError } = await supabaseAdmin.from('admin_users').insert({
        auth_user_id: authUserId,
        name: 'Admin User',
        email: adminEmail,
        company: 'Sri Lakshmi Engineering Plastics',
        is_active: true,
      });
      if (adminInsertError) throw adminInsertError;
    }

    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    const { error: settingsError } = await supabaseAdmin.from('settings').upsert({
      company_name: 'Sri Lakshmi Engineering Plastics',
      address: 'S-13,3rd Cross, New Kalappa Block, Ramachandrapuram, Bengaluru-560021',
      phone: '+998055511',
      email: 'sleplastics@gmail.com',
      gstin: '29GBPGUD39642PZT2H',
      default_gst_percent: 18,
      default_profit_margin: 15,
      currency_symbol: 'INR',
      decimal_precision: 2,
      updated_by: adminUser.id,
    });
    if (settingsError) throw settingsError;

    console.log('\n=== SUPABASE SEED COMPLETED ===');
    console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
    console.log('Note: run server/supabase/schema.sql before seeding.');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();