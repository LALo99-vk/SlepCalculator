import mongoose from 'mongoose';

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
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true
  },
  pan: {
    type: String,
    trim: true,
    uppercase: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient searching
clientSchema.index({ name: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ gstin: 1 });
clientSchema.index({ email: 1 });

export default mongoose.model('Client', clientSchema);