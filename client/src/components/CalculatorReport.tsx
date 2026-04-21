import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Copy, TrendingUp, Package, DollarSign } from 'lucide-react';
import { CalculationResults, formatCurrency, formatNumber, getEfficiencyClass } from '../utils/calculations';
import toast from 'react-hot-toast';

interface CalculatorReportProps {
  results: CalculationResults;
}

const copyToClipboard = (text: string, description: string) => {
  navigator.clipboard.writeText(text.toString()).then(() => {
    toast.success(`${description} copied to clipboard`);
  });
};

const CalculatorReport: React.FC<CalculatorReportProps> = ({ results }) => {
  const efficiencyClass = getEfficiencyClass(results.materialEfficiency);

  const costBreakdownData = [
    { name: 'Material', value: results.materialCostPerPiece, color: '#3b82f6' },
    { name: 'Job Work', value: results.totalCostPerPiece - results.materialCostPerPiece, color: '#14b8a6' },
  ];

  const materialUtilizationData = [
    { name: 'Parts', value: results.netPartMaterial, color: '#10b981' },
    { name: 'Short Loss', value: results.totalShortLoss, color: '#f59e0b' },
    { name: 'Scrap Loss', value: results.totalScrapLoss, color: '#ef4444' },
    { name: 'Leftover', value: results.leftoverGrams, color: '#6b7280' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 dark:text-primary-400">Cost per Piece</p>
              <p 
                className="text-2xl font-bold text-primary-900 dark:text-primary-100 cursor-pointer copy-number"
                onClick={() => copyToClipboard(formatCurrency(results.totalCostPerPiece), 'Cost per piece')}
              >
                {formatCurrency(results.totalCostPerPiece)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Pieces</p>
              <p 
                className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 cursor-pointer copy-number"
                onClick={() => copyToClipboard(formatNumber(results.totalPieces, 0), 'Total pieces')}
              >
                {formatNumber(results.totalPieces, 0)}
              </p>
            </div>
            <Package className="h-8 w-8 text-secondary-600 dark:text-secondary-400" />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${efficiencyClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">Material Efficiency</p>
              <p 
                className="text-2xl font-bold cursor-pointer copy-number"
                onClick={() => copyToClipboard(formatNumber(results.materialEfficiency), 'Material efficiency')}
              >
                {formatNumber(results.materialEfficiency)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 opacity-75" />
          </div>
        </div>

        <div className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-600 dark:text-accent-400">Production Cost</p>
              <p 
                className="text-2xl font-bold text-accent-900 dark:text-accent-100 cursor-pointer copy-number"
                onClick={() => copyToClipboard(formatCurrency(results.totalProductionCost), 'Total production cost')}
              >
                {formatCurrency(results.totalProductionCost)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-accent-600 dark:text-accent-400" />
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-4">
        {/* Production Summary */}
        <details className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4" open>
          <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
            Production Summary
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Material Input:</span>
              <span className="float-right font-medium copy-number" 
                    onClick={() => copyToClipboard(formatNumber(results.totalMaterialGrams / 1000, 3), 'Material input')}>
                {formatNumber(results.totalMaterialGrams / 1000, 3)} kg
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Complete Cycles:</span>
              <span className="float-right font-medium copy-number"
                    onClick={() => copyToClipboard(formatNumber(results.totalCycles, 0), 'Total cycles')}>
                {formatNumber(results.totalCycles, 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Pieces per Cycle:</span>
              <span className="float-right font-medium">
                {results.totalCycles > 0 ? formatNumber(results.totalPieces / results.totalCycles, 2) : '0.00'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Leftover Material:</span>
              <span className="float-right font-medium copy-number"
                    onClick={() => copyToClipboard(formatNumber(results.leftoverGrams, 4), 'Leftover material')}>
                {formatNumber(results.leftoverGrams, 4)} g
              </span>
            </div>
          </div>
        </details>

        {/* Material Utilization */}
        <details className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
            Material Utilization
          </summary>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={materialUtilizationData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" width={60} />
                <Tooltip 
                  formatter={(value: any) => [`${formatNumber(value, 4)} g`, '']}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="value" fill="#3b82f6">
                  {materialUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </details>

        {/* Cost Breakdown */}
        <details className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
            Cost Breakdown (per piece)
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Material Cost:</span>
                <span className="font-medium copy-number"
                      onClick={() => copyToClipboard(formatCurrency(results.materialCostPerPiece), 'Material cost per piece')}>
                  {formatCurrency(results.materialCostPerPiece)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Other Costs:</span>
                <span className="font-medium">
                  {formatCurrency(results.totalCostPerPiece - results.materialCostPerPiece)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-300 dark:border-slate-600 pt-2">
                <span className="font-medium">Total Cost:</span>
                <span className="font-bold copy-number"
                      onClick={() => copyToClipboard(formatCurrency(results.totalCostPerPiece), 'Total cost per piece')}>
                  {formatCurrency(results.totalCostPerPiece)}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </details>

        {/* Efficiency Metrics */}
        <details className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
            Efficiency Metrics
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Pieces per kg:</span>
              <span className="float-right font-medium copy-number"
                    onClick={() => copyToClipboard(formatNumber(results.piecesPerKg), 'Pieces per kg')}>
                {formatNumber(results.piecesPerKg)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Cost per 1,000 pieces:</span>
              <span className="float-right font-medium copy-number"
                    onClick={() => copyToClipboard(formatCurrency(results.costPer1000Pieces), 'Cost per 1000 pieces')}>
                {formatCurrency(results.costPer1000Pieces)}
              </span>
            </div>
          </div>
        </details>

        {/* Profitability Analysis (if selling price provided) */}
        {results.profitPerPiece !== undefined && (
          <details className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
              Profitability Analysis
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Profit per piece:</span>
                <span className={`float-right font-medium ${results.profitPerPiece! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(results.profitPerPiece!)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Profit margin:</span>
                <span className={`float-right font-medium ${results.profitMargin! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatNumber(results.profitMargin!)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total revenue:</span>
                <span className="float-right font-medium copy-number"
                      onClick={() => copyToClipboard(formatCurrency(results.totalRevenue!), 'Total revenue')}>
                  {formatCurrency(results.totalRevenue!)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total profit:</span>
                <span className={`float-right font-medium ${results.totalProfit! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(results.totalProfit!)}
                </span>
              </div>
            </div>
          </details>
        )}

        {/* Reverse Planning (if applicable) */}
        {results.requiredMaterialKg && (
          <details className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
              Material Requirements
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Required material:</span>
                <span className="float-right font-medium copy-number"
                      onClick={() => copyToClipboard(formatNumber(results.requiredMaterialKg, 3), 'Required material')}>
                  {formatNumber(results.requiredMaterialKg, 3)} kg
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">With 5% buffer:</span>
                <span className="float-right font-medium copy-number"
                      onClick={() => copyToClipboard(formatNumber(results.requiredMaterialKg * 1.05, 3), 'Material with buffer')}>
                  {formatNumber(results.requiredMaterialKg * 1.05, 3)} kg
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Required cycles:</span>
                <span className="float-right font-medium">{results.requiredCycles}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Actual pieces (full cycles):</span>
                <span className="float-right font-medium">{results.actualPiecesFromReq}</span>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default CalculatorReport;