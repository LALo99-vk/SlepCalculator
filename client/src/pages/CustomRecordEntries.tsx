import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DynamicEntryForm from '../components/custom-records/DynamicEntryForm';
import type { CustomField } from '../components/custom-records/FieldBuilder';

const API_URL = import.meta.env.VITE_API_URL;

interface CustomRecordType {
  _id: string;
  name: string;
  description?: string;
  fields: CustomField[];
}

interface CustomRecordEntry {
  _id: string;
  values: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const formatEntryValue = (field: CustomField, value: unknown) => {
  if (value === undefined || value === null || value === '') return '-';
  if (field.type === 'checkbox') return value ? 'Yes' : 'No';
  if (field.type === 'date') return new Date(String(value)).toLocaleDateString();
  return String(value);
};

const CustomRecordEntries: React.FC = () => {
  const { typeId } = useParams();
  const [recordType, setRecordType] = useState<CustomRecordType | null>(null);
  const [entries, setEntries] = useState<CustomRecordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CustomRecordEntry | null>(null);

  const sortedFields = useMemo(
    () => (recordType?.fields || []).slice().sort((a, b) => a.order - b.order),
    [recordType]
  );

  const fetchEntries = async () => {
    if (!typeId) return;
    try {
      const response = await axios.get(`${API_URL}/custom-record-types/${typeId}/entries`);
      setRecordType(response.data.type);
      setEntries(response.data.entries || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [typeId]);

  const handleCreateOrUpdate = async (values: Record<string, unknown>) => {
    if (!typeId) return;
    setIsSaving(true);
    try {
      if (editingEntry) {
        await axios.put(`${API_URL}/custom-record-types/${typeId}/entries/${editingEntry._id}`, { values });
        toast.success('Entry updated');
      } else {
        await axios.post(`${API_URL}/custom-record-types/${typeId}/entries`, { values });
        toast.success('Entry saved');
      }
      setShowForm(false);
      setEditingEntry(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!typeId || !confirm('Delete this entry?')) return;
    try {
      await axios.delete(`${API_URL}/custom-record-types/${typeId}/entries/${entryId}`);
      setEntries((prev) => prev.filter((entry) => entry._id !== entryId));
      toast.success('Entry deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete entry');
    }
  };

  if (isLoading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading entries...</div>;
  }

  if (!recordType) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Record type not found.</p>
        <Link to="/custom-records" className="text-primary-600 hover:underline">
          Back to Custom Records
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/custom-records" className="inline-flex items-center text-sm text-primary-600 hover:underline mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Record Types
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{recordType.name} Entries</h1>
          {recordType.description && <p className="text-sm text-gray-500 dark:text-gray-400">{recordType.description}</p>}
        </div>
        <button
          onClick={() => {
            setEditingEntry(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingEntry ? 'Edit Entry' : 'Create Entry'}
          </h2>
          <DynamicEntryForm
            fields={sortedFields}
            initialValues={editingEntry?.values}
            isSubmitting={isSaving}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => {
              setShowForm(false);
              setEditingEntry(null);
            }}
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  {sortedFields.map((field) => (
                    <th
                      key={field.key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    {sortedFields.map((field) => (
                      <td key={field.key} className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {formatEntryValue(field, entry.values?.[field.key])}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setShowForm(true);
                          }}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Edit entry"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomRecordEntries;
