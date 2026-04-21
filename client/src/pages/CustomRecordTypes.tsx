import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FieldBuilder, { type CustomField } from '../components/custom-records/FieldBuilder';

const API_URL = import.meta.env.VITE_API_URL;

interface CustomRecordType {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  fields: CustomField[];
  createdAt: string;
}

const emptyField = (): CustomField => ({
  key: 'title',
  label: 'Title',
  type: 'text',
  required: true,
  description: '',
  options: [],
  order: 0,
});

const CustomRecordTypes: React.FC = () => {
  const [types, setTypes] = useState<CustomRecordType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<CustomRecordType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<CustomField[]>([emptyField()]);

  const sortedTypes = useMemo(
    () =>
      [...types].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [types]
  );

  const fetchTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/custom-record-types`);
      setTypes(response.data.types || []);
    } catch (error) {
      toast.error('Failed to load custom record types');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFields([emptyField()]);
    setEditingType(null);
    setShowForm(false);
  };

  const handleEdit = (item: CustomRecordType) => {
    setEditingType(item);
    setName(item.name);
    setDescription(item.description || '');
    setFields((item.fields || []).sort((a, b) => a.order - b.order));
    setShowForm(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Record heading is required');
      return;
    }

    if (fields.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { name, description, fields };
      if (editingType) {
        await axios.put(`${API_URL}/custom-record-types/${editingType._id}`, payload);
        toast.success('Record type updated');
      } else {
        await axios.post(`${API_URL}/custom-record-types`, payload);
        toast.success('Record type created');
      }
      resetForm();
      fetchTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save record type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record type and all entries?')) return;
    try {
      await axios.delete(`${API_URL}/custom-record-types/${id}`);
      setTypes((prev) => prev.filter((type) => type._id !== id));
      toast.success('Record type deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete record type');
    }
  };

  if (isLoading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading custom record types...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Records</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Record Type
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingType ? 'Edit Record Type' : 'Create Record Type'}
          </h2>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heading *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., Vendor Master"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Optional description"
                />
              </div>
            </div>

            <FieldBuilder fields={fields} onChange={setFields} />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60 transition-colors"
              >
                {isSaving ? 'Saving...' : editingType ? 'Update Type' : 'Create Type'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {sortedTypes.length === 0 ? (
          <div className="py-14 text-center">
            <Layers className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-300">No custom record types yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create one to start capturing custom data.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {sortedTypes.map((type) => (
              <div key={type._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{type.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(type.fields || []).length} fields {type.description ? `• ${type.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/custom-records/${type._id}`}
                    className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Manage Entries
                  </Link>
                  <button
                    onClick={() => handleEdit(type)}
                    className="p-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    title="Edit type"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(type._id)}
                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete type"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomRecordTypes;
