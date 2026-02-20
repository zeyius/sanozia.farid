import { useState } from 'react';
import { errorService, ErrorType } from '../services/errorService';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      errorService.handleError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { key, operation: 'read' }
      );
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      errorService.handleError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { key, operation: 'write', value }
      );
    }
  };

  return [storedValue, setValue] as const;
}