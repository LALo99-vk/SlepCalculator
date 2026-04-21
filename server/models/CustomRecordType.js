import mongoose from 'mongoose';

const allowedFieldTypes = ['text', 'number', 'date', 'select', 'checkbox'];

const customFieldSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: allowedFieldTypes,
    },
    required: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
    options: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const customRecordTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fields: {
      type: [customFieldSchema],
      default: [],
      validate: {
        validator(fields) {
          const keys = fields.map((field) => field.key);
          return new Set(keys).size === keys.length;
        },
        message: 'Field keys must be unique within a record type',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

customRecordTypeSchema.index({ name: 1 });
customRecordTypeSchema.index({ createdBy: 1, createdAt: -1 });

export { allowedFieldTypes };
export default mongoose.model('CustomRecordType', customRecordTypeSchema);
