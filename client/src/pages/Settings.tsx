import { useState, useEffect } from 'react';
import { Save, Upload, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  gstin: z.string().optional(),
  cin: z.string().optional(),
  defaultGstPercent: z.number().min(0).max(28, 'GST must be between 0 and 28'),
  defaultProfitMargin: z.number().min(0).max(100, 'Profit margin must be between 0 and 100'),
  currencySymbol: z.string().min(1, 'Currency symbol is required'),
  decimalPrecision: z.number().min(2).max(4, 'Decimal precision must be between 2 and 4'),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: 'Sri Lakshmi Engineering Plastics',
      address: 'S-13,3rd Cross, New Kalappa Block, Ramachandrapuram, Bengaluru-560021',
      phone: '+998055511',
      email: 'sleplastics@gmail.com',
      gstin: '29GBPGUD39642PZT2H',
      cin: '',
      defaultGstPercent: 18,
      defaultProfitMargin: 15,
      currencySymbol: '₹',
      decimalPrecision: 2,
    },
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      const settings = response.data.settings;
      form.reset(settings);
      if (settings.logoUrl) {
        setLogoUrl(settings.logoUrl);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async (data: SettingsForm) => {
    setIsLoading(true);
    try {
      await axios.put(`${API_URL}/settings`, data);
      
      // Upload logo if selected
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const logoResponse = await axios.post(`${API_URL}/settings/logo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setLogoUrl(logoResponse.data.logoUrl);
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Settings</h1>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Company Logo */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Company Logo</h3>
          
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                />
              ) : (
                <div className="h-20 w-20 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <div>
              <label className="block">
                <span className="sr-only">Choose logo file</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                />
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                JPG, PNG, or SVG. Max 2MB. Recommended: 200x200px
              </p>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Company Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name *
              </label>
              <input
                {...form.register('companyName')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
              {form.formState.errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.companyName.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                {...form.register('address')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                {...form.register('phone')}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                {...form.register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GSTIN
              </label>
              <input
                {...form.register('gstin')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CIN
              </label>
              <input
                {...form.register('cin')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Default Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default GST (%)
              </label>
              <input
                {...form.register('defaultGstPercent', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                max="28"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
              {form.formState.errors.defaultGstPercent && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.defaultGstPercent.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Profit Margin (%)
              </label>
              <input
                {...form.register('defaultProfitMargin', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
              {form.formState.errors.defaultProfitMargin && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.defaultProfitMargin.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency Symbol
              </label>
              <input
                {...form.register('currencySymbol')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
              {form.formState.errors.currencySymbol && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.currencySymbol.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Decimal Precision
              </label>
              <select
                {...form.register('decimalPrecision', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              >
                <option value={2}>2 decimal places</option>
                <option value={3}>3 decimal places</option>
                <option value={4}>4 decimal places</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;