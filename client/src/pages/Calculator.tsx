import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, FileText, RotateCcw } from 'lucide-react';
import { 
  CalculationInputsA, 
  CalculationInputsB, 
  CalculationResults,
  calculateModeA,
  calculateModeB,
  formatCurrency,
  formatNumber,
  getEfficiencyClass
} from '../utils/calculations';
import CalculatorReport from '../components/CalculatorReport';
import { debounce } from 'lodash';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

const modeASchema = z.object({
  material: z.string().min(1, 'Material is required'),
  materialPrice: z.number().min(0.01, 'Material price must be greater than 0'),
  componentWeight: z.number().min(0.01, 'Component weight must be greater than 0'),
  cavities: z.number().int().min(1, 'Cavities must be at least 1'),
  shortWeight: z.number().min(0, 'Short weight cannot be negative'),
  scrapRunnerWeight: z.number().min(0, 'Scrap/Runner weight cannot be negative'),
  jobWorkCost: z.number().min(0, 'Job work cost cannot be negative'),
  overheadCost: z.number().min(0, 'Overhead cost cannot be negative'),
  packingCost: z.number().min(0, 'Packing cost cannot be negative'),
  inputMode: z.enum(['material', 'pieces']),
  totalMaterial: z.number().optional(),
  requiredPieces: z.number().optional(),
  sellingPrice: z.number().optional(),
});

const modeBSchema = z.object({
  material: z.string().min(1, 'Material is required'),
  materialPrice: z.number().min(0.01, 'Material price must be greater than 0'),
  totalShotWeight: z.number().min(0.01, 'Total shot weight must be greater than 0'),
  cavities: z.number().int().min(1, 'Cavities must be at least 1'),
  jobWorkCost: z.number().min(0, 'Job work cost cannot be negative'),
  overheadCost: z.number().min(0, 'Overhead cost cannot be negative'),
  packingCost: z.number().min(0, 'Packing cost cannot be negative'),
  inputMode: z.enum(['material', 'pieces']),
  totalMaterial: z.number().optional(),
  requiredPieces: z.number().optional(),
  sellingPrice: z.number().optional(),
});

const Calculator: React.FC = () => {
  const [mode, setMode] = useState<'A' | 'B'>('A');
  const [materials, setMaterials] = useState<any[]>([]);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(mode === 'A' ? modeASchema : modeBSchema),
    defaultValues: {
      material: '',
      materialPrice: 95,
      componentWeight: mode === 'A' ? 10 : undefined,
      totalShotWeight: mode === 'B' ? 50 : undefined,
      cavities: 4,
      shortWeight: mode === 'A' ? 0 : undefined,
      scrapRunnerWeight: mode === 'A' ? 0 : undefined,
      jobWorkCost: 0.50,
      overheadCost: 0,
      packingCost: 0,
      inputMode: 'material',
      totalMaterial: 10,
      requiredPieces: undefined,
      sellingPrice: undefined,
    }
  });

  const watchedValues = form.watch();

  // Debounced calculation
  const debouncedCalculate = useMemo(
    () => debounce((values: any) => {
      try {
        setError(null);
        if (mode === 'A') {
          const result = calculateModeA(values as CalculationInputsA);
          setResults(result);
        } else {
          const result = calculateModeB(values as CalculationInputsB);
          setResults(result);
        }
      } catch (err: any) {
        setError(err.message);
        setResults(null);
      }
    }, 300),
    [mode]
  );

  // Calculate when inputs change
  useMemo(() => {
    debouncedCalculate(watchedValues);
  }, [watchedValues, debouncedCalculate]);

  const handleModeChange = (newMode: 'A' | 'B') => {
    setMode(newMode);
    form.reset();
    setResults(null);
    setError(null);
  };

  const handleReset = () => {
    form.reset();
    setResults(null);
    setError(null);
  };

  const handleSave = async () => {
    const jobName = prompt('Enter a name for this calculation:');
    if (!jobName) return;

    try {
      await axios.post(`${API_URL}/calculations`, {
        jobName,
        mode,
        inputs: watchedValues,
        outputs: results,
      });
      toast.success('Calculation saved successfully!');
    } catch (error) {
      toast.error('Failed to save calculation');
    }
  };

  const handleGenerateQuotation = () => {
    // Navigate to quotation form with pre-filled data
    window.location.href = '/quotations/new?from=calculator';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Calculator</h1>
        
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('A')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'A' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            MODE A: Component-Based
          </button>
          <button
            onClick={() => handleModeChange('B')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'B' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            MODE B: Shot-Based
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        {/* Input Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Input Parameters</h2>
            <button
              onClick={handleReset}
              className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </button>
          </div>

          <form className="space-y-6">
            {/* Material Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Material</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Material Name
                  </label>
                  <input
                    {...form.register('material')}
                    type="text"
                    placeholder="e.g., PP, HDPE, ABS"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (₹/kg)
                  </label>
                  <input
                    {...form.register('materialPrice', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Component/Shot Weight Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                {mode === 'A' ? 'Component Details' : 'Shot Details'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mode === 'A' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Component Weight (g/piece)
                    </label>
                    <input
                      {...form.register('componentWeight', { valueAsNumber: true })}
                      type="number"
                      step="0.0001"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Shot Weight (g/cycle)
                    </label>
                    <input
                      {...form.register('totalShotWeight', { valueAsNumber: true })}
                      type="number"
                      step="0.0001"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Cavities
                  </label>
                  <input
                    {...form.register('cavities', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              {mode === 'A' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Short Weight (g/cycle)
                    </label>
                    <input
                      {...form.register('shortWeight', { valueAsNumber: true })}
                      type="number"
                      step="0.0001"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Scrap/Runner Weight (g/cycle)
                    </label>
                    <input
                      {...form.register('scrapRunnerWeight', { valueAsNumber: true })}
                      type="number"
                      step="0.0001"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cost Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Costs</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Work (₹/piece)
                  </label>
                  <input
                    {...form.register('jobWorkCost', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Input Mode Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Calculation Mode</h3>
              
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    {...form.register('inputMode')}
                    type="radio"
                    value="material"
                    className="mr-2"
                  />
                  I have material
                </label>
                <label className="flex items-center">
                  <input
                    {...form.register('inputMode')}
                    type="radio"
                    value="pieces"
                    className="mr-2"
                  />
                  I need pieces
                </label>
              </div>

              {watchedValues.inputMode === 'material' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Material Available (kg)
                  </label>
                  <input
                    {...form.register('totalMaterial', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Required Quantity (pieces)
                  </label>
                  <input
                    {...form.register('requiredPieces', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Optional Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selling Price (₹/piece) - Optional
              </label>
              <input
                {...form.register('sellingPrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter for profit analysis"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Live Results</h2>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {results && !error && (
            <CalculatorReport results={results} />
          )}

          {!results && !error && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Fill in the form to see live calculations</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {results && !error && (
        <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Calculation
          </button>
          <button
            onClick={handleGenerateQuotation}
            className="flex items-center px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Quotation
          </button>
        </div>
      )}
    </div>
  );
};

export default Calculator;