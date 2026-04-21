export interface CalculationInputsA {
  material: string;
  materialPrice: number;
  componentWeight: number;
  cavities: number;
  shortWeight: number;
  scrapRunnerWeight: number;
  jobWorkCost: number;
  overheadCost: number;
  packingCost: number;
  inputMode: 'material' | 'pieces';
  totalMaterial?: number;
  requiredPieces?: number;
  sellingPrice?: number;
}

export interface CalculationInputsB {
  material: string;
  materialPrice: number;
  totalShotWeight: number;
  cavities: number;
  jobWorkCost: number;
  overheadCost: number;
  packingCost: number;
  inputMode: 'material' | 'pieces';
  totalMaterial?: number;
  requiredPieces?: number;
  sellingPrice?: number;
}

export interface CalculationResults {
  // Basic metrics
  costPerGram: number;
  cycleWeight: number;
  componentWeight: number;
  
  // Forward calculation (material → pieces)
  totalMaterialGrams: number;
  totalCycles: number;
  totalPieces: number;
  leftoverGrams: number;
  
  // Material utilization
  netPartMaterial: number;
  totalShortLoss: number;
  totalScrapLoss: number;
  totalWaste: number;
  materialEfficiency: number;
  
  // Cost per piece
  materialCostPerPiece: number;
  totalCostPerPiece: number;
  
  // Production metrics
  totalProductionCost: number;
  piecesPerKg: number;
  costPer1000Pieces: number;
  
  // Reverse calculation (pieces → material)
  requiredCycles?: number;
  requiredMaterialGrams?: number;
  requiredMaterialKg?: number;
  estimatedTotalCost?: number;
  actualPiecesFromReq?: number;
  
  // Profitability (if selling price provided)
  profitPerPiece?: number;
  profitMargin?: number;
  totalRevenue?: number;
  totalProfit?: number;
  roi?: number;
  breakEvenQty?: number;
}

export function validateInputs(inputs: CalculationInputsA | CalculationInputsB, mode: 'A' | 'B'): string[] {
  const errors: string[] = [];
  
  if (inputs.cavities < 1) errors.push('Cavities must be at least 1');
  if (inputs.materialPrice <= 0) errors.push('Material price must be greater than 0');
  
  if (mode === 'A') {
    const inputsA = inputs as CalculationInputsA;
    if (inputsA.componentWeight <= 0) errors.push('Component weight must be greater than 0');
    if (inputsA.shortWeight < 0) errors.push('Short weight cannot be negative');
    if (inputsA.scrapRunnerWeight < 0) errors.push('Scrap/Runner weight cannot be negative');
  } else {
    const inputsB = inputs as CalculationInputsB;
    if (inputsB.totalShotWeight <= 0) errors.push('Total shot weight must be greater than 0');
  }
  
  if (inputs.jobWorkCost < 0) errors.push('Job work cost cannot be negative');
  if (inputs.overheadCost < 0) errors.push('Overhead cost cannot be negative');
  if (inputs.packingCost < 0) errors.push('Packing cost cannot be negative');
  
  if (inputs.inputMode === 'material' && (!inputs.totalMaterial || inputs.totalMaterial <= 0)) {
    errors.push('Total material must be greater than 0');
  }
  
  if (inputs.inputMode === 'pieces' && (!inputs.requiredPieces || inputs.requiredPieces <= 0)) {
    errors.push('Required pieces must be greater than 0');
  }
  
  return errors;
}

export function calculateModeA(inputs: CalculationInputsA): CalculationResults {
  const errors = validateInputs(inputs, 'A');
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  // Preliminary calculations
  const costPerGram = inputs.materialPrice / 1000;
  const cycleWeight = (inputs.componentWeight * inputs.cavities) + inputs.shortWeight + inputs.scrapRunnerWeight;
  
  if (cycleWeight <= 0) {
    throw new Error('Cycle weight computed as 0 — check inputs');
  }
  
  let results: CalculationResults;
  
  const effectiveMaterialPerPieceGrams = cycleWeight / inputs.cavities;

  if (inputs.inputMode === 'material' && inputs.totalMaterial) {
    // Forward calculation (material → pieces)
    const totalMaterialGrams = inputs.totalMaterial * 1000;
    const totalCycles = Math.floor(totalMaterialGrams / cycleWeight);
    const totalPieces = totalCycles * inputs.cavities;
    const leftoverGrams = totalMaterialGrams - (totalCycles * cycleWeight);
    
    // Material utilization
    const netPartMaterial = inputs.componentWeight * totalPieces;
    const totalShortLoss = inputs.shortWeight * totalCycles;
    const totalScrapLoss = inputs.scrapRunnerWeight * totalCycles;
    const totalWaste = totalShortLoss + totalScrapLoss + leftoverGrams;
    const materialEfficiency = (netPartMaterial / totalMaterialGrams) * 100;
    
    results = {
      costPerGram,
      cycleWeight,
      componentWeight: inputs.componentWeight,
      totalMaterialGrams,
      totalCycles,
      totalPieces,
      leftoverGrams,
      netPartMaterial,
      totalShortLoss,
      totalScrapLoss,
      totalWaste,
      materialEfficiency,
      materialCostPerPiece: effectiveMaterialPerPieceGrams * costPerGram,
      totalCostPerPiece: (effectiveMaterialPerPieceGrams * costPerGram) + inputs.jobWorkCost + inputs.overheadCost + inputs.packingCost,
      totalProductionCost: 0, // Will be calculated below
      piecesPerKg: totalPieces / inputs.totalMaterial,
      costPer1000Pieces: 0, // Will be calculated below
    };
    
    results.totalProductionCost = results.totalCostPerPiece * totalPieces;
    results.costPer1000Pieces = results.totalCostPerPiece * 1000;
  } else {
    // Reverse calculation (pieces → material)
    const requiredPieces = inputs.requiredPieces!;
    const requiredCycles = Math.ceil(requiredPieces / inputs.cavities);
    const requiredMaterialGrams = requiredCycles * cycleWeight;
    const requiredMaterialKg = requiredMaterialGrams / 1000;
    const actualPiecesFromReq = requiredCycles * inputs.cavities;
    
    results = {
      costPerGram,
      cycleWeight,
      componentWeight: inputs.componentWeight,
      totalMaterialGrams: requiredMaterialGrams,
      totalCycles: requiredCycles,
      totalPieces: actualPiecesFromReq,
      leftoverGrams: 0,
      netPartMaterial: inputs.componentWeight * actualPiecesFromReq,
      totalShortLoss: inputs.shortWeight * requiredCycles,
      totalScrapLoss: inputs.scrapRunnerWeight * requiredCycles,
      totalWaste: (inputs.shortWeight + inputs.scrapRunnerWeight) * requiredCycles,
      materialEfficiency: (inputs.componentWeight * actualPiecesFromReq / requiredMaterialGrams) * 100,
      materialCostPerPiece: effectiveMaterialPerPieceGrams * costPerGram,
      totalCostPerPiece: (effectiveMaterialPerPieceGrams * costPerGram) + inputs.jobWorkCost + inputs.overheadCost + inputs.packingCost,
      totalProductionCost: 0, // Will be calculated below
      piecesPerKg: actualPiecesFromReq / requiredMaterialKg,
      costPer1000Pieces: 0, // Will be calculated below
      requiredCycles,
      requiredMaterialGrams,
      requiredMaterialKg,
      actualPiecesFromReq,
    };
    
    results.totalProductionCost = results.totalCostPerPiece * actualPiecesFromReq;
    results.costPer1000Pieces = results.totalCostPerPiece * 1000;
    results.estimatedTotalCost = results.totalCostPerPiece * requiredPieces;
  }
  
  // Profitability calculations
  if (inputs.sellingPrice && inputs.sellingPrice > 0) {
    results.profitPerPiece = inputs.sellingPrice - results.totalCostPerPiece;
    results.profitMargin = (results.profitPerPiece / inputs.sellingPrice) * 100;
    results.totalRevenue = inputs.sellingPrice * results.totalPieces;
    results.totalProfit = results.profitPerPiece * results.totalPieces;
    results.roi = (results.totalProfit / results.totalProductionCost) * 100;
    
    if (results.profitPerPiece > 0) {
      results.breakEvenQty = Math.ceil(results.totalProductionCost / results.profitPerPiece);
    }
  }
  
  return results;
}

export function calculateModeB(inputs: CalculationInputsB): CalculationResults {
  const errors = validateInputs(inputs, 'B');
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  // Convert Mode B inputs to Mode A equivalent
  const modeAInputs: CalculationInputsA = {
    material: inputs.material,
    materialPrice: inputs.materialPrice,
    componentWeight: inputs.totalShotWeight / inputs.cavities,
    cavities: inputs.cavities,
    shortWeight: 0,
    scrapRunnerWeight: 0,
    jobWorkCost: inputs.jobWorkCost,
    overheadCost: inputs.overheadCost,
    packingCost: inputs.packingCost,
    inputMode: inputs.inputMode,
    totalMaterial: inputs.totalMaterial,
    requiredPieces: inputs.requiredPieces,
    sellingPrice: inputs.sellingPrice,
  };
  
  return calculateModeA(modeAInputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function getEfficiencyClass(efficiency: number): string {
  if (efficiency >= 90) return 'efficiency-high';
  if (efficiency >= 70) return 'efficiency-medium';
  return 'efficiency-low';
}

export function copyToClipboard(text: string, description: string): void {
  navigator.clipboard.writeText(text.toString()).then(() => {
    toast.success(`${description} copied to clipboard`);
  });
}