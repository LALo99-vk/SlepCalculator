import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['PP', 'HDPE', 'LDPE', 'ABS', 'Nylon', 'PVC', 'PET', 'Custom'],
    trim: true
  },
  pricePerKg: {
    type: Number,
    required: true,
    min: 0
  },
  density: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  supplierName: {
    type: String,
    trim: true
  },
  priceHistory: [priceHistorySchema],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient searching
materialSchema.index({ name: 1, type: 1 });
materialSchema.index({ type: 1 });

// Update price history when price changes
materialSchema.pre('save', function(next) {
  if (this.isModified('pricePerKg') && !this.isNew) {
    this.priceHistory.push({
      price: this.pricePerKg,
      updatedBy: this.updatedBy
    });
  }
  next();
});

export default mongoose.model('Material', materialSchema);