import { useState, useEffect } from 'react';
import { Eye, Download, Trash2, Calculator, ListFilter as Filter, Search } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/calculations';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

interface Calculation {
  _id: string;
  jobName: string;
  mode: 'A' | 'B';
  inputs: any;
  outputs: any;
  createdAt: string;
  createdBy: {
    name: string;
  };
}

const History: React.FC = () => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [filteredCalculations, setFilteredCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'A' | 'B'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchCalculations();
  }, []);

  useEffect(() => {
    filterCalculations();
  }, [calculations, searchTerm, modeFilter, dateRange]);

  const fetchCalculations = async () => {
    try {
      const response = await axios.get(`${API_URL}/calculations`);
      setCalculations(response.data.calculations);
    } catch (error) {
      console.error('Error fetching calculations:', error);
      toast.error('Failed to fetch calculations');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCalculations = () => {
    let filtered = calculations.filter(calc => {
      const matchesSearch = calc.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          calc.inputs.material.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMode = modeFilter === 'all' || calc.mode === modeFilter;
      
      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const calcDate = new Date(calc.createdAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDate = calcDate >= startDate && calcDate <= endDate;
      }

      return matchesSearch && matchesMode && matchesDate;
    });

    setFilteredCalculations(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calculation?')) return;

    try {
      await axios.delete(`${API_URL}/calculations/${id}`);
      setCalculations(prev => prev.filter(calc => calc._id !== id));
      toast.success('Calculation deleted successfully');
    } catch (error) {
      toast.error('Failed to delete calculation');
    }
  };

  const handleExportPDF = async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/calculations/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calculation-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleReopenInCalculator = (calc: Calculation) => {
    // Navigate to calculator with pre-filled data
    const queryParams = new URLSearchParams({
      mode: calc.mode,
      data: JSON.stringify(calc.inputs)
    });
    window.location.href = `/calculator?${queryParams}`;
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculation History</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredCalculations.length} of {calculations.length} calculations
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                placeholder="Job name or material..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mode
            </label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as 'all' | 'A' | 'B')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Modes</option>
              <option value="A">Mode A (Component-Based)</option>
              <option value="B">Mode B (Shot-Based)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Calculations Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {filteredCalculations.length === 0 ? (
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No calculations found</p>
            {calculations.length === 0 && (
              <p className="text-sm text-gray-400 mt-2">Create your first calculation to see it here</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Job Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pieces
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cost/Piece
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredCalculations.map((calc) => (
                  <tr key={calc._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {calc.jobName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          by {calc.createdBy.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        calc.mode === 'A' 
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                          : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200'
                      }`}>
                        Mode {calc.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {calc.inputs.material}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatNumber(calc.outputs.totalPieces, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(calc.outputs.totalCostPerPiece)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(calc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReopenInCalculator(calc)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Re-open in Calculator"
                        >
                          <Calculator className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(calc._id)}
                          className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                          title="Export PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(calc._id)}
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

export default History;