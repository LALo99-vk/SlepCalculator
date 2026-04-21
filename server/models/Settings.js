import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    default: 'Sri Lakshmi Engineering Plastics'
  },
  address: {
    type: String,
    default: 'S-13,3rd Cross, New Kalappa Block, Ramachandrapuram, Bengaluru-560021'
  },
  phone: {
    type: String,
    default: '+998055511'
  },
  email: {
    type: String,
    default: 'sleplastics@gmail.com'
  },
  gstin: {
    type: String,
    default: '29GBPGUD39642PZT2H'
  },
  cin: {
    type: String
  },
  logoUrl: {
    type: String
  },
  defaultGstPercent: {
    type: Number,
    default: 18,
    min: 0,
    max: 28
  },
  defaultProfitMargin: {
    type: Number,
    default: 15,
    min: 0,
    max: 100
  },
  currencySymbol: {
    type: String,
    default: '₹'
  },
  decimalPrecision: {
    type: Number,
    default: 2,
    min: 2,
    max: 4
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('Settings', settingsSchema);