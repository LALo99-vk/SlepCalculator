import { Plus, Trash2 } from 'lucide-react';

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox';

export interface CustomField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  description?: string;
  options?: string[];
  order: number;
}

interface FieldBuilderProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

const FIELD_TYPES: FieldType[] = ['text', 'number', 'date', 'select', 'checkbox'];

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onChange }) => {
  const addField = () => {
    onChange([
      ...fields,
      {
        key: `field_${fields.length + 1}`,
        label: '',
        type: 'text',
        required: false,
        description: '',
        options: [],
        order: fields.length,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<CustomField>) => {
    const next = fields.map((field, idx) => (idx === index ? { ...field, ...updates } : field));
    onChange(next.map((field, idx) => ({ ...field, order: idx })));
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, idx) => idx !== index).map((field, idx) => ({ ...field, order: idx })));
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={`${field.key}-${index}`} className="rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label *</label>
              <input
                value={field.label}
                onChange={(e) => {
                  const label = e.target.value;
                  updateField(index, {
                    label,
                    key: field.key.startsWith('field_') || !field.key ? normalizeKey(label) : field.key,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                placeholder="Field label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key *</label>
              <input
                value={field.key}
                onChange={(e) => updateField(index, { key: normalizeKey(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                placeholder="field_key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select
                value={field.type}
                onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                title="Remove field"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input
                value={field.description || ''}
                onChange={(e) => updateField(index, { description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                placeholder="Optional helper text"
              />
            </div>
            {field.type === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Options (comma separated)
                </label>
                <input
                  value={(field.options || []).join(', ')}
                  onChange={(e) =>
                    updateField(index, {
                      options: e.target.value
                        .split(',')
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Option A, Option B"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Field
      </button>
    </div>
  );
};

export default FieldBuilder;
