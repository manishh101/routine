/**
 * Custom Hook for Excel Operations
 * Clean interface for import/export functionality
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ExcelService from '../services/excelService';
import { routinesAPI } from '../services/api';

const useExcelOperations = (programCode, semester, section) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  // Initialize Excel service
  const excelService = new ExcelService(routinesAPI);

  // Export Handler
  const exportToExcel = useCallback(async (options = {}) => {
    if (!programCode || !semester || !section) {
      throw new Error('Program code, semester, and section are required');
    }

    setIsExporting(true);
    
    try {
      await excelService.export(programCode, semester, section, {
        onStart: () => options.onStart?.(),
        onSuccess: (filename) => options.onSuccess?.(filename),
        onError: (error) => options.onError?.(error)
      });
    } finally {
      setIsExporting(false);
    }
  }, [programCode, semester, section, excelService]);

  // Import Handler
  const importFromExcel = useCallback(async (file, options = {}) => {
    if (!programCode || !semester || !section) {
      throw new Error('Program code, semester, and section are required');
    }

    setIsImporting(true);

    try {
      const result = await excelService.import(programCode, semester, section, file, {
        onStart: () => options.onStart?.(),
        onSuccess: (response) => {
          // Invalidate relevant queries to refresh data
          queryClient.invalidateQueries(['routine', programCode, semester, section]);
          queryClient.invalidateQueries(['teacherSchedules']);
          queryClient.invalidateQueries({ queryKey: ['teacherSchedule'] });
          
          options.onSuccess?.(response);
        },
        onError: (error) => options.onError?.(error),
        onProgress: (progress) => options.onProgress?.(progress)
      });

      return result;
    } finally {
      setIsImporting(false);
    }
  }, [programCode, semester, section, excelService, queryClient]);

  // File Validation
  const validateFile = useCallback((file) => {
    return excelService.validateFile(file);
  }, [excelService]);

  // Check if file is valid Excel
  const isValidExcelFile = useCallback((file) => {
    return excelService.isValidExcelFile(file);
  }, [excelService]);

  return {
    // State
    isExporting,
    isImporting,
    isLoading: isExporting || isImporting,
    
    // Operations
    exportToExcel,
    importFromExcel,
    
    // Validation
    validateFile,
    isValidExcelFile,
    
    // Service instance (for advanced usage)
    excelService
  };
};

export default useExcelOperations;
