import mongoose from 'mongoose';

const customRecordEntrySchema = new mongoose.Schema(
  {
    recordTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomRecordType',
      required: true,
      index: true,
    },
    values: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

customRecordEntrySchema.index({ recordTypeId: 1, createdAt: -1 });
customRecordEntrySchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('CustomRecordEntry', customRecordEntrySchema);
