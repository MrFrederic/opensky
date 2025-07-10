import { useState, useEffect, useCallback } from 'react';

interface UseUnsavedChangesOptions<T> {
  /** The original data to compare against */
  originalData: T | null;
  /** The current form data */
  currentData: T;
  /** Additional data that indicates changes (like staged files) */
  additionalChanges?: any[];
  /** Custom comparison function. If not provided, uses JSON.stringify */
  compareFunction?: (original: T, current: T) => boolean;
  /** Dependencies that should trigger a recheck */
  dependencies?: any[];
}

interface UseUnsavedChangesReturn {
  hasUnsavedChanges: boolean;
  resetUnsavedChanges: () => void;
  setHasUnsavedChanges: (value: boolean) => void;
}

/**
 * Custom hook to track unsaved changes in forms
 * @param options Configuration options
 * @returns Object with unsaved changes state and control functions
 */
export function useUnsavedChanges<T>({
  originalData,
  currentData,
  additionalChanges = [],
  compareFunction,
  dependencies = [],
}: UseUnsavedChangesOptions<T>): UseUnsavedChangesReturn {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const checkForChanges = useCallback(() => {
    if (!originalData) {
      setHasUnsavedChanges(false);
      return;
    }

    let isChanged = false;

    // Use custom comparison function if provided
    if (compareFunction) {
      isChanged = !compareFunction(originalData, currentData);
    } else {
      // Default: JSON comparison
      isChanged = JSON.stringify(originalData) !== JSON.stringify(currentData);
    }

    // Check additional changes (like staged files)
    if (!isChanged && additionalChanges.length > 0) {
      isChanged = additionalChanges.some(change => change !== null && change !== undefined);
    }

    setHasUnsavedChanges(isChanged);
  }, [originalData, currentData, additionalChanges, compareFunction]);

  // Check for changes whenever dependencies change
  useEffect(() => {
    checkForChanges();
  }, [checkForChanges, ...dependencies]);

  const resetUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  return {
    hasUnsavedChanges,
    resetUnsavedChanges,
    setHasUnsavedChanges,
  };
}

export default useUnsavedChanges;
