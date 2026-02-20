// Public API for Consumption feature
export { ConsumptionPage } from './pages/ConsumptionPage';
export { consumptionService, mealService } from './services/consumptionService';
export type { 
  ConsumptionFormData, 
  ConsumptionData, 
  ConsumptionType, 
  PrepMode,
  // Legacy compatibility
  MealFormData,
  MealData
} from './types';

// Legacy export for compatibility
export { ConsumptionPage as MealPage } from './pages/ConsumptionPage';
