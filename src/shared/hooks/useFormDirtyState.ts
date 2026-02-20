import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to track if a form has been modified (is "dirty")
 * Compares current form data with initial values to detect changes
 * 
 * @param initialValues - The initial form values to compare against
 * @param currentValues - The current form values
 * @returns Object with isDirty flag and reset function
 * 
 * @example
 * const { isDirty, resetDirtyState } = useFormDirtyState(
 *   { name: '', email: '' },
 *   formData
 * );
 */
export function useFormDirtyState<T extends Record<string, any>>(
  initialValues: T,
  currentValues: T
) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Compare current values with initial values
    const hasChanges = Object.keys(currentValues).some(key => {
      const initial = initialValues[key];
      const current = currentValues[key];
      
      // Handle null/undefined equality
      if (initial === current) return false;
      if (!initial && !current) return false;
      
      // Deep comparison for objects/arrays (simplified)
      if (typeof initial === 'object' && typeof current === 'object') {
        return JSON.stringify(initial) !== JSON.stringify(current);
      }
      
      return initial !== current;
    });
    
    setIsDirty(hasChanges);
  }, [initialValues, currentValues]);

  const resetDirtyState = useCallback(() => {
    setIsDirty(false);
  }, []);

  return { isDirty, resetDirtyState };
}

