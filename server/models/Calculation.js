import mongoose from 'mongoose';

const calculationSchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  mode: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  inputs: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  outputs: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
calculationSchema.index({ createdBy: 1, createdAt: -1 });
calculationSchema.index({ 'inputs.material': 1 });

export default mongoose.model('Calculation', calculationSchema);