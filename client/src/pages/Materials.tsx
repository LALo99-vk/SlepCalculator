import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Package, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

const materialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  type: z.string().min(1, 'Material type is required'),
  pricePerKg: z.number().min(0.01, 'Price must be greater than 0'),
  density: z.number().optional(),
  description: z.string().optional(),
  supplierName: z.string().optional(),
});

type MaterialForm = z.infer<typeof materialSchema>;

interface Material {
  _id: string;
  name: string;
  type: string;
  pricePerKg: number;
  density?: number;
  description?: string;
  supplierName?: string;
  updatedAt: string;
  updatedBy: {
    name: string;
  };
}

const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const form = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      type: '',
      pricePerKg: 0,
      density: undefined,
      description: '',
      supplierName: '',
    },
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API_URL}/materials`);
      setMaterials(response.data.materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      // Mock data for demo
      setMaterials([
        {
          _id: '1',
          name: 'Polypropylene',
          type: 'PP',
          pricePerKg: 95,
          density: 0.9,
          description: 'High quality PP grade',
          supplierName: 'Reliance Industries',
          updatedAt: '2024-01-15T10:30:00Z',
          updatedBy: { name: 'Admin' }
        },
        {
          _id: '2',
          name: 'High Density Polyethylene',
          type: 'HDPE',
          pricePerKg: 88,
          density: 0.95,
          description: 'Food grade HDPE',
          supplierName: 'IOCL',
          updatedAt: '2024-01-14T15:20:00Z',
          updatedBy: { name: 'Admin' }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: MaterialForm) => {
    try {
      if (editingMaterial) {
        await axios.put(`${API_URL}/materials/${editingMaterial._id}`, data);
        toast.success('Material updated successfully');
      } else {
        await axios.post(`${API_URL}/materials`, data);
        toast.success('Material added successfully');
      }
      fetchMaterials();
      setShowForm(false);
      setEditingMaterial(null);
      form.reset();
    } catch (error) {
      toast.error('Failed to save material');
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    form.reset({
      name: material.name,
      type: material.type,
      pricePerKg: material.pricePerKg,
      density: material.density,
      description: material.description,
      supplierName: material.supplierName,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await axios.delete(`${API_URL}/materials/${id}`);
      setMaterials(prev => prev.filter(material => material._id !== id));
      toast.success('Material deleted successfully');
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMaterial(null);
    form.reset();
  };

  const materialTypes = ['PP', 'HDPE', 'LDPE', 'ABS', 'Nylon', 'PVC', 'PET', 'Custom'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-slate-600 rounded w-1/4 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-300 dark:bg-slate-600 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Material Price Library</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </h2>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Material Name *
                </label>
                <input
                  {...form.register('name')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., Polypropylene"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  {...form.register('type')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select type</option>
                  {materialTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {form.formState.errors.type && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price per Kg (₹) *
                </label>
                <input
                  {...form.register('pricePerKg', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
                {form.formState.errors.pricePerKg && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.pricePerKg.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Density (g/cm³)
                </label>
                <input
                  {...form.register('density', { valueAsNumber: true })}
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Name
                </label>
                <input
                  {...form.register('supplierName')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Optional"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  {...form.register('description')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {editingMaterial ? 'Update Material' : 'Add Material'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Materials Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {materials.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No materials added yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add your first material
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price/kg
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Density
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {materials.map((material) => (
                  <tr key={material._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {material.name}
                        </div>
                        {material.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {material.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {material.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{material.pricePerKg.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {material.density ? `${material.density} g/cm³` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {material.supplierName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(material.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          by {material.updatedBy.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          title="Price History"
                          className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                        >
                          <TrendingUp className="h-4 w-4" />
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

export default Materials;