import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Users, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  notes: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

interface Client {
  _id: string;
  name: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  notes?: string;
  createdAt: string;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      company: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      gstin: '',
      pan: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Mock data for demo
      setClients([
        {
          _id: '1',
          name: 'John Doe',
          company: 'Ace Multi Axes Systems Private Limited',
          address: 'Sy.No.53/10, Minnappira,Thumagondala Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '562123',
          phone: '+91-9876543210',
          email: 'john@acemulti.com',
          gstin: '29AACCA3964A1ZX',
          pan: 'ABCDE1234F',
          notes: 'Regular customer',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: '2',
          name: 'Jane Smith',
          company: 'Tech Corp Solutions',
          address: '123 Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: '+91-9876543211',
          email: 'jane@techcorp.com',
          gstin: '27ABCDE1234A1Z5',
          pan: 'FGHIJ5678K',
          notes: 'New client',
          createdAt: '2024-01-16T15:20:00Z'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.gstin && client.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (data: ClientForm) => {
    try {
      if (editingClient) {
        await axios.put(`${API_URL}/clients/${editingClient._id}`, data);
        toast.success('Client updated successfully');
      } else {
        await axios.post(`${API_URL}/clients`, data);
        toast.success('Client added successfully');
      }
      fetchClients();
      setShowForm(false);
      setEditingClient(null);
      form.reset();
    } catch (error) {
      toast.error('Failed to save client');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset(client);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      await axios.delete(`${API_URL}/clients/${id}`);
      setClients(prev => prev.filter(client => client._id !== id));
      toast.success('Client deleted successfully');
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClient(null);
    form.reset();
  };

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, company, or GSTIN..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name *
                </label>
                <input
                  {...form.register('name')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  {...form.register('company')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  {...form.register('phone')}
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  {...form.register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GSTIN
                </label>
                <input
                  {...form.register('gstin')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PAN
                </label>
                <input
                  {...form.register('pan')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  {...form.register('address')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  {...form.register('city')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  {...form.register('state')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pincode
                </label>
                <input
                  {...form.register('pincode')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  {...form.register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Additional notes about this client"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {editingClient ? 'Update Client' : 'Add Client'}
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

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No clients found</p>
            {clients.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your first client
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    GSTIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.name}
                        </div>
                        {client.company && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.company}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {client.phone && (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {client.city && client.state 
                          ? `${client.city}, ${client.state}`
                          : client.city || client.state || '-'
                        }
                      </div>
                      {client.pincode && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {client.pincode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {client.gstin || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/quotations?client=${client._id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="View Quotations"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
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

export default Clients;