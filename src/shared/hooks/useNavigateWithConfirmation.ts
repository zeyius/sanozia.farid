import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to handle navigation with confirmation when form has unsaved changes
 * 
 * @param isDirty - Whether the form has unsaved changes
 * @returns Object with navigation handler and confirmation modal state
 * 
 * @example
 * const { handleNavigate, showConfirm, confirmNavigation, cancelNavigation } = 
 *   useNavigateWithConfirmation(isDirty);
 * 
 * // Use in back button
 * <button onClick={() => handleNavigate('/dashboard')}>Back</button>
 * 
 * // Render modal
 * <ConfirmNavigationModal
 *   isOpen={showConfirm}
 *   onConfirm={confirmNavigation}
 *   onCancel={cancelNavigation}
 * />
 */
export function useNavigateWithConfirmation(isDirty: boolean) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleNavigate = useCallback((path: string) => {
    if (isDirty) {
      // Show confirmation modal if form is dirty
      setPendingPath(path);
      setShowConfirm(true);
    } else {
      // Navigate directly if form is clean
      navigate(path);
    }
  }, [isDirty, navigate]);

  const confirmNavigation = useCallback(() => {
    if (pendingPath) {
      navigate(pendingPath);
      setShowConfirm(false);
      setPendingPath(null);
    }
  }, [pendingPath, navigate]);

  const cancelNavigation = useCallback(() => {
    setShowConfirm(false);
    setPendingPath(null);
  }, []);

  return {
    handleNavigate,
    showConfirm,
    confirmNavigation,
    cancelNavigation
  };
}

