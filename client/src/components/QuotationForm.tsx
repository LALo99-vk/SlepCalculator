import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Save, Download, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { downloadQuotationPdf } from '../utils/quotationPdf';

const API_URL = import.meta.env.VITE_API_URL;

const quotationSchema = z.object({
  quoteNumber: z.string().min(1, 'Quote number is required'),
  quoteDate: z.string().min(1, 'Quote date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  referenceNumber: z.string().optional(),
  
  client: z.object({
    name: z.string().min(1, 'Client name is required'),
    company: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    gstin: z.string().optional(),
  }),
  
  lineItems: z.array(z.object({
    productName: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unit: z.string().min(1, 'Unit is required'),
    unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  })).min(1, 'At least one line item is required'),
  
  profitMargin: z.number().min(0).max(100, 'Profit margin must be between 0 and 100'),
  additionalCharges: z.array(z.object({
    label: z.string().min(1, 'Label is required'),
    amount: z.number().min(0, 'Amount cannot be negative'),
  })).optional(),
  discountPercent: z.number().min(0).max(100, 'Discount must be between 0 and 100').optional(),
  
  gstPercent: z.number().min(0).max(28, 'GST must be between 0 and 28'),
  gstType: z.enum(['same_state', 'inter_state']),
  
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
});

type QuotationForm = z.infer<typeof quotationSchema>;

const QuotationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const form = useForm<QuotationForm>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quoteNumber: `QT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      client: {
        name: '',
        company: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
      },
      lineItems: [
        {
          productName: '',
          description: '',
          quantity: 1,
          unit: 'pcs',
          unitPrice: 0,
        }
      ],
      profitMargin: 15,
      additionalCharges: [],
      discountPercent: 0,
      gstPercent: 18,
      gstType: 'same_state',
      paymentTerms: '30 days',
      deliveryTerms: '10-25 days from PO confirmation',
      notes: '',
    },
  });

  const { fields: lineItems, append: addLineItem, remove: removeLineItem } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const { fields: additionalCharges, append: addAdditionalCharge, remove: removeAdditionalCharge } = useFieldArray({
    control: form.control,
    name: 'additionalCharges',
  });

  const watchedValues = form.watch();

  useEffect(() => {
    fetchClients();
    if (isEditing && id) {
      fetchQuotation(id);
    }
  }, [id, isEditing]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchQuotation = async (quotationId: string) => {
    try {
      const response = await axios.get(`${API_URL}/quotations/${quotationId}`);
      const quotation = response.data.quotation;
      form.reset(quotation);
    } catch (error) {
      toast.error('Failed to fetch quotation');
      navigate('/quotations');
    }
  };

  // Calculate totals
  const calculations = useMemo(() => {
    const lineSubtotal = watchedValues.lineItems.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0);
    
    const profitAmount = lineSubtotal * (watchedValues.profitMargin / 100);
    const afterProfit = lineSubtotal + profitAmount;
    
    const additionalTotal = (watchedValues.additionalCharges || []).reduce((sum, charge) => 
      sum + charge.amount, 0);
    const afterAdditional = afterProfit + additionalTotal;
    
    const discountAmount = afterAdditional * ((watchedValues.discountPercent || 0) / 100);
    const taxableAmount = afterAdditional - discountAmount;
    
    const gstAmount = taxableAmount * (watchedValues.gstPercent / 100);
    const cgst = watchedValues.gstType === 'same_state' ? gstAmount / 2 : 0;
    const sgst = watchedValues.gstType === 'same_state' ? gstAmount / 2 : 0;
    const igst = watchedValues.gstType === 'inter_state' ? gstAmount : 0;
    
    const grandTotal = taxableAmount + gstAmount;

    return {
      lineSubtotal,
      profitAmount,
      afterProfit,
      additionalTotal,
      afterAdditional,
      discountAmount,
      taxableAmount,
      gstAmount,
      cgst,
      sgst,
      igst,
      grandTotal,
    };
  }, [watchedValues]);

  const convertToWords = (amount: number): string => {
    // Simplified number to words conversion for Indian currency
    // This would need a proper implementation for production
    return `Rupees ${Math.floor(amount).toLocaleString('en-IN')} Only`;
  };

  const onSubmit = async (data: QuotationForm) => {
    setIsLoading(true);
    try {
      const quotationData = {
        ...data,
        lineItems: data.lineItems.map((item) => ({
          ...item,
          lineTotal: item.quantity * item.unitPrice,
        })),
        ...calculations,
        amountInWords: convertToWords(calculations.grandTotal),
        status: isEditing ? undefined : 'draft',
      };

      if (isEditing) {
        await axios.put(`${API_URL}/quotations/${id}`, quotationData);
        toast.success('Quotation updated successfully');
      } else {
        const response = await axios.post(`${API_URL}/quotations`, quotationData);
        await downloadQuotationPdf(
          response.data.quotation || quotationData,
          `${(response.data.quotation?.quoteNumber || quotationData.quoteNumber)}.pdf`
        );
        toast.success('Quotation created successfully');
      }
      navigate('/quotations');
    } catch (error) {
      toast.error('Failed to save quotation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    const data = form.getValues();
    const quotationData = {
      ...data,
      lineItems: data.lineItems.map((item) => ({
        ...item,
        lineTotal: item.quantity * item.unitPrice,
      })),
      ...calculations,
      amountInWords: convertToWords(calculations.grandTotal),
    };

    try {
      await downloadQuotationPdf(quotationData, `${data.quoteNumber}-preview.pdf`);
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/quotations')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Quotation' : 'New Quotation'}
          </h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleGeneratePDF}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Preview PDF
          </button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quotation Info */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quotation Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quote Number *
                  </label>
                  <input
                    {...form.register('quoteNumber')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                  {form.formState.errors.quoteNumber && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.quoteNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference Number
                  </label>
                  <input
                    {...form.register('referenceNumber')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quote Date *
                  </label>
                  <input
                    {...form.register('quoteDate')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valid Until *
                  </label>
                  <input
                    {...form.register('validUntil')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Client Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Name *
                  </label>
                  <input
                    {...form.register('client.name')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company
                  </label>
                  <input
                    {...form.register('client.company')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <textarea
                    {...form.register('client.address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    {...form.register('client.phone')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    {...form.register('client.email')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GSTIN
                  </label>
                  <input
                    {...form.register('client.gstin')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Line Items</h3>
                <button
                  type="button"
                  onClick={() => addLineItem({ productName: '', description: '', quantity: 1, unit: 'pcs', unitPrice: 0 })}
                  className="flex items-center px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product Name *
                      </label>
                      <input
                        {...form.register(`lineItems.${index}.productName`)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        {...form.register(`lineItems.${index}.description`)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Qty *
                      </label>
                      <input
                        {...form.register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit *
                      </label>
                      <select
                        {...form.register(`lineItems.${index}.unit`)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white text-sm"
                      >
                        <option value="pcs">Pieces</option>
                        <option value="kg">Kg</option>
                        <option value="set">Set</option>
                        <option value="meter">Meter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rate (₹) *
                      </label>
                      <input
                        {...form.register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Total: </span>
                        <span className="font-medium">
                          ₹{(watchedValues.lineItems[index]?.quantity * watchedValues.lineItems[index]?.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {lineItems.length > 1 && (
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Profit Margin (%)
                    </label>
                    <input
                      {...form.register('profitMargin', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount (%)
                    </label>
                    <input
                      {...form.register('discountPercent', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      GST (%)
                    </label>
                    <input
                      {...form.register('gstPercent', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      max="28"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      GST Type
                    </label>
                    <select
                      {...form.register('gstType')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="same_state">Same State (CGST + SGST)</option>
                      <option value="inter_state">Inter State (IGST)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Charges */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Additional Charges</h4>
                  <button
                    type="button"
                    onClick={() => addAdditionalCharge({ label: '', amount: 0 })}
                    className="flex items-center px-3 py-2 text-sm bg-secondary-600 text-white rounded-md hover:bg-secondary-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Charge
                  </button>
                </div>

                {additionalCharges.map((charge, index) => (
                  <div key={charge.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <input
                        {...form.register(`additionalCharges.${index}.label`)}
                        placeholder="Charge description (e.g., Tooling, Delivery)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <input
                        {...form.register(`additionalCharges.${index}.amount`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalCharge(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms & Notes */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Terms & Notes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    {...form.register('paymentTerms')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="30 days">30 days</option>
                    <option value="45 days">45 days</option>
                    <option value="Advance">Advance</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Terms
                  </label>
                  <input
                    {...form.register('deliveryTerms')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Terms & Conditions / Notes
                </label>
                <textarea
                  {...form.register('notes')}
                  rows={4}
                  placeholder="Enter terms and conditions or additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium">₹{calculations.lineSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Profit ({watchedValues.profitMargin}%):</span>
                  <span className="font-medium">₹{calculations.profitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {calculations.additionalTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Additional Charges:</span>
                    <span className="font-medium">₹{calculations.additionalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {calculations.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Discount ({watchedValues.discountPercent}%):</span>
                    <span className="font-medium text-red-600">-₹{calculations.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taxable Amount:</span>
                  <span className="font-medium">₹{calculations.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {watchedValues.gstType === 'same_state' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">CGST ({watchedValues.gstPercent/2}%):</span>
                      <span className="font-medium">₹{calculations.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SGST ({watchedValues.gstPercent/2}%):</span>
                      <span className="font-medium">₹{calculations.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">IGST ({watchedValues.gstPercent}%):</span>
                    <span className="font-medium">₹{calculations.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">Grand Total:</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      ₹{calculations.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Amount in words: {convertToWords(calculations.grandTotal)}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : isEditing ? 'Update Quotation' : 'Save Quotation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;