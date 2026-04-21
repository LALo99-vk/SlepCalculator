import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, CreditCard as Edit, Copy, Download, Trash2, Plus, Search, ListFilter as Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

interface Quotation {
  _id: string;
  quoteNumber: string;
  client: {
    name: string;
    company: string;
  };
  quoteDate: string;
  grandTotal: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'revised';
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  revised: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const QuotationsList: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm, statusFilter]);

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(`${API_URL}/quotations`);
      setQuotations(response.data.quotations);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to fetch quotations');
      // Mock data for demo
      setQuotations([
        {
          _id: '1',
          quoteNumber: 'QT-2024-01-00001',
          client: { name: 'John Doe', company: 'Ace Multi Axes Systems' },
          quoteDate: '2024-01-15',
          grandTotal: 10325.00,
          status: 'sent'
        },
        {
          _id: '2',
          quoteNumber: 'QT-2024-01-00002',
          client: { name: 'Jane Smith', company: 'Tech Corp' },
          quoteDate: '2024-01-16',
          grandTotal: 8750.50,
          status: 'approved'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuotations = () => {
    let filtered = quotations.filter(quot => {
      const matchesSearch = quot.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quot.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quot.client.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || quot.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    setFilteredQuotations(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      await axios.delete(`${API_URL}/quotations/${id}`);
      setQuotations(prev => prev.filter(quot => quot._id !== id));
      toast.success('Quotation deleted successfully');
    } catch (error) {
      toast.error('Failed to delete quotation');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/quotations/${id}`);
      const original = response.data.quotation;
      
      // Create duplicate with new quote number
      const duplicate = {
        ...original,
        quoteNumber: `${original.quoteNumber}-COPY`,
        status: 'draft',
        quoteDate: new Date().toISOString().split('T')[0]
      };
      
      await axios.post(`${API_URL}/quotations`, duplicate);
      fetchQuotations();
      toast.success('Quotation duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate quotation');
    }
  };

  const handleDownloadPDF = async (id: string, quoteNumber: string) => {
    try {
      const response = await axios.get(`${API_URL}/quotations/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quoteNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotations</h1>
        <Link
          to="/quotations/new"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Quotation
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Quote number, client name, or company..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="revised">Revised</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-gray-500 dark:text-gray-400">No quotations found</p>
            {quotations.length === 0 && (
              <Link
                to="/quotations/new"
                className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first quotation
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quote No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredQuotations.map((quotation) => (
                  <tr key={quotation._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {quotation.quoteNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {quotation.client.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {quotation.client.company}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(quotation.quoteDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[quotation.status]}`}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={`/quotations/view/${quotation.quoteNumber}`}
                          target="_blank"
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <Link
                          to={`/quotations/edit/${quotation._id}`}
                          className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(quotation._id)}
                          className="text-accent-600 hover:text-accent-900 dark:text-accent-400 dark:hover:text-accent-300"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(quotation._id, quotation.quoteNumber)}
                          className="text-success-600 hover:text-success-900 dark:text-success-400 dark:hover:text-success-300"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quotation._id)}
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

export default QuotationsList;