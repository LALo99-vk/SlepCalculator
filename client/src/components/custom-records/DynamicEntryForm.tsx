import { useEffect, useState } from 'react';
import type { CustomField } from './FieldBuilder';

interface DynamicEntryFormProps {
  fields: CustomField[];
  initialValues?: Record<string, unknown>;
  isSubmitting?: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
}

const DynamicEntryForm: React.FC<DynamicEntryFormProps> = ({
  fields,
  initialValues,
  isSubmitting = false,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextValues: Record<string, unknown> = {};
    for (const field of fields) {
      const incoming = initialValues?.[field.key];
      if (incoming !== undefined && incoming !== null) {
        nextValues[field.key] = incoming;
      } else if (field.type === 'checkbox') {
        nextValues[field.key] = false;
      } else {
        nextValues[field.key] = '';
      }
    }
    setValues(nextValues);
  }, [fields, initialValues]);

  const updateValue = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    for (const field of fields) {
      const value = values[field.key];
      const isEmpty = value === '' || value === null || value === undefined;
      if (field.required && isEmpty) {
        setError(`${field.label} is required`);
        return;
      }
    }

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {field.label} {field.required ? '*' : ''}
          </label>

          {field.type === 'text' && (
            <input
              value={String(values[field.key] ?? '')}
              onChange={(e) => updateValue(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              value={String(values[field.key] ?? '')}
              onChange={(e) => updateValue(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            />
          )}

          {field.type === 'date' && (
            <input
              type="date"
              value={String(values[field.key] ?? '')}
              onChange={(e) => updateValue(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            />
          )}

          {field.type === 'select' && (
            <select
              value={String(values[field.key] ?? '')}
              onChange={(e) => updateValue(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select</option>
              {(field.options || []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {field.type === 'checkbox' && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={Boolean(values[field.key])}
                onChange={(e) => updateValue(field.key, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Yes
            </label>
          )}

          {!!field.description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.description}</p>}
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default DynamicEntryForm;
