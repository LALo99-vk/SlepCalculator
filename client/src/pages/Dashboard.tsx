import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calculator, FileText, TrendingUp, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, chartsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/summary`),
        axios.get(`${API_URL}/dashboard/charts`)
      ]);
      
      setDashboardData({
        summary: summaryRes.data,
        charts: chartsRes.data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Mock data for demo
      setDashboardData({
        summary: {
          totalJobs: 45,
          quotationsThisMonth: 12,
          avgCostPerPiece: 2.45,
          avgMaterialEfficiency: 87.5
        },
        charts: {
          costTrend: [
            { date: '2024-01-01', cost: 2.10 },
            { date: '2024-01-08', cost: 2.25 },
            { date: '2024-01-15', cost: 2.40 },
            { date: '2024-01-22', cost: 2.35 },
            { date: '2024-01-29', cost: 2.45 }
          ],
          volumeData: [
            { week: 'Week 1', pieces: 15000 },
            { week: 'Week 2', pieces: 18000 },
            { week: 'Week 3', pieces: 22000 },
            { week: 'Week 4', pieces: 20000 }
          ],
          quotationStatus: [
            { name: 'Draft', value: 5, color: '#64748b' },
            { name: 'Sent', value: 8, color: '#3b82f6' },
            { name: 'Approved', value: 12, color: '#10b981' },
            { name: 'Rejected', value: 3, color: '#ef4444' }
          ],
          materialUsage: [
            { material: 'PP', usage: 150 },
            { material: 'HDPE', usage: 120 },
            { material: 'ABS', usage: 80 },
            { material: 'LDPE', usage: 60 }
          ]
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-slate-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, charts } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Calculator className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.totalJobs}</p>
              <p className="text-sm text-gray-500">this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-lg">
              <FileText className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quotations</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.quotationsThisMonth}</p>
              <p className="text-sm text-gray-500">this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-accent-100 dark:bg-accent-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Cost/Piece</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{summary.avgCostPerPiece}</p>
              <p className="text-sm text-gray-500">this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 dark:bg-success-900 rounded-lg">
              <Package className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Material Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.avgMaterialEfficiency}%</p>
              <p className="text-sm text-gray-500">average</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Cost per Piece Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Production Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="pieces" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quotation Status */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quotation Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts.quotationStatus}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {charts.quotationStatus.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Material Usage */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Material Usage (kg)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.materialUsage} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="material" type="category" stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="usage" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/calculator"
            className="flex items-center justify-center p-4 bg-primary-100 dark:bg-primary-900 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
          >
            <Calculator className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
            <span className="font-medium text-primary-900 dark:text-primary-100">New Calculation</span>
          </Link>
          <Link
            to="/quotations/new"
            className="flex items-center justify-center p-4 bg-secondary-100 dark:bg-secondary-900 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-800 transition-colors"
          >
            <FileText className="h-6 w-6 text-secondary-600 dark:text-secondary-400 mr-2" />
            <span className="font-medium text-secondary-900 dark:text-secondary-100">New Quotation</span>
          </Link>
          <Link
            to="/history"
            className="flex items-center justify-center p-4 bg-accent-100 dark:bg-accent-900 rounded-lg hover:bg-accent-200 dark:hover:bg-accent-800 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-accent-600 dark:text-accent-400 mr-2" />
            <span className="font-medium text-accent-900 dark:text-accent-100">View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;