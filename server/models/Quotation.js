import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  lineTotal: {
    type: Number,
    required: true
  }
});

const additionalChargeSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  gstin: {
    type: String,
    trim: true
  }
});

const quotationSchema = new mongoose.Schema({
  quoteNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  quoteDate: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  
  client: {
    type: clientSchema,
    required: true
  },
  
  lineItems: [lineItemSchema],
  
  // Calculations
  lineSubtotal: {
    type: Number,
    required: true
  },
  profitMargin: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  profitAmount: {
    type: Number,
    required: true
  },
  afterProfit: {
    type: Number,
    required: true
  },
  
  additionalCharges: [additionalChargeSchema],
  additionalTotal: {
    type: Number,
    default: 0
  },
  afterAdditional: {
    type: Number,
    required: true
  },
  
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  
  taxableAmount: {
    type: Number,
    required: true
  },
  
  gstPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 28
  },
  gstType: {
    type: String,
    enum: ['same_state', 'inter_state'],
    required: true
  },
  cgst: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  },
  igst: {
    type: Number,
    default: 0
  },
  gstAmount: {
    type: Number,
    required: true
  },
  
  grandTotal: {
    type: Number,
    required: true
  },
  amountInWords: {
    type: String,
    required: true
  },
  
  paymentTerms: {
    type: String,
    trim: true
  },
  deliveryTerms: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'sent', 'approved', 'rejected', 'revised'],
    default: 'draft'
  },
  
  linkedCalculationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calculation'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
quotationSchema.index({ 'client.name': 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('Quotation', quotationSchema);