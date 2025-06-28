# Excel Import/Export Clean Architecture

## Overview

This document describes the clean architecture implementation for Excel import/export functionality in the routine management system. The solution follows SOLID principles and provides a modular, testable, and maintainable approach to handling Excel operations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  ExcelActions.jsx  │  RoutineGrid.jsx  │  ExcelDemo.jsx        │
│  (UI Component)    │  (Integrated UI)  │  (Demo Page)          │
└─────────────────────┴───────────────────┴───────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        Hook Layer                               │
├─────────────────────────────────────────────────────────────────┤
│                useExcelOperations.js                            │
│                (React Hook for State Management)                │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        Service Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                    excelService.js                              │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐ │
│  │  FileValidator  │ ExcelExportSvc  │   ExcelImportService    │ │
│  │   (Validation)  │   (Export)      │      (Import)           │ │
│  └─────────────────┴─────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                        api.js                                   │
│           (HTTP Client for Backend Communication)               │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. ExcelActions Component (`components/ExcelActions.jsx`)

**Purpose**: Reusable UI component for Excel operations

**Key Features**:
- Self-contained with all necessary UI logic
- Configurable permissions (import/export)
- Demo mode support
- Comprehensive error handling
- Accessibility compliance

**Props**:
```javascript
{
  programCode: string,      // Required: Program identifier
  semester: string,         // Required: Semester number
  section: string,          // Required: Section letter
  allowImport: boolean,     // Optional: Enable import functionality
  allowExport: boolean,     // Optional: Enable export functionality
  demoMode: boolean,        // Optional: Disable functionality for demo
  size: string,            // Optional: Button size ('small', 'default', 'large')
  onImportSuccess: func,    // Optional: Import success callback
  onImportError: func,      // Optional: Import error callback
  onExportSuccess: func,    // Optional: Export success callback
  onExportError: func,      // Optional: Export error callback
  style: object            // Optional: Custom styles
}
```

**Usage Examples**:
```jsx
// Admin view with full functionality
<ExcelActions
  programCode="BCT"
  semester="1"
  section="A"
  allowImport={true}
  allowExport={true}
/>

// Regular user view (export only)
<ExcelActions
  programCode="BCT"
  semester="1"
  section="A"
  allowImport={false}
  allowExport={true}
/>

// Demo mode (disabled)
<ExcelActions
  programCode="BCT"
  semester="1"
  section="A"
  demoMode={true}
/>
```

### 2. useExcelOperations Hook (`hooks/useExcelOperations.js`)

**Purpose**: Custom React hook that manages Excel operation state and logic

**Key Features**:
- Centralized state management for loading states
- File validation logic
- API call orchestration
- Error handling and recovery
- React Query integration

**API**:
```javascript
const {
  isExporting,           // boolean: Export operation in progress
  isImporting,           // boolean: Import operation in progress
  exportToExcel,         // function: Trigger export operation
  importFromExcel,       // function: Trigger import operation
  validateFile          // function: Validate uploaded file
} = useExcelOperations(programCode, semester, section);
```

**Implementation Pattern**:
```javascript
const useExcelOperations = (programCode, semester, section) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const exportToExcel = async (options = {}) => {
    try {
      setIsExporting(true);
      // Export logic with error handling
      const result = await excelService.export(programCode, semester, section);
      options.onSuccess?.(result);
    } catch (error) {
      options.onError?.(error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Similar pattern for import and validation
  
  return { isExporting, isImporting, exportToExcel, importFromExcel, validateFile };
};
```

### 3. Excel Service (`services/excelService.js`)

**Purpose**: Service layer implementing business logic for Excel operations

**Architecture Pattern**: Uses composition with specialized service classes

**Key Classes**:

#### FileValidator
```javascript
class FileValidator {
  static validate(file) {
    // Validate file type, size, and structure
    return { isValid: boolean, error?: string };
  }
}
```

#### ExcelExportService
```javascript
class ExcelExportService {
  static async export(programCode, semester, section, options = {}) {
    // Handle export logic with progress tracking
  }
}
```

#### ExcelImportService
```javascript
class ExcelImportService {
  static async import(programCode, semester, section, file, options = {}) {
    // Handle import logic with validation and progress tracking
  }
}
```

**Main Service Class**:
```javascript
class ExcelService {
  static async export(programCode, semester, section, options = {}) {
    return ExcelExportService.export(programCode, semester, section, options);
  }
  
  static async import(programCode, semester, section, file, options = {}) {
    return ExcelImportService.import(programCode, semester, section, file, options);
  }
  
  static validateFile(file) {
    return FileValidator.validate(file);
  }
}
```

## Design Principles Applied

### 1. Single Responsibility Principle (SRP)
- **ExcelActions**: Only handles UI presentation
- **useExcelOperations**: Only manages state and orchestration
- **ExcelService**: Only handles business logic
- **FileValidator**: Only validates files

### 2. Open/Closed Principle (OCP)
- Service classes can be extended without modifying existing code
- New export/import formats can be added by implementing new service classes
- UI components accept configuration through props

### 3. Liskov Substitution Principle (LSP)
- Service classes implement consistent interfaces
- Mock implementations can replace real services in tests

### 4. Interface Segregation Principle (ISP)
- Separate interfaces for export, import, and validation
- Components only depend on the functionality they need

### 5. Dependency Inversion Principle (DIP)
- High-level components depend on abstractions (hooks/services)
- Low-level details (API calls) are abstracted away

## Error Handling Strategy

### 1. Layered Error Handling
```javascript
// Service Layer
try {
  const result = await api.export();
  return result;
} catch (error) {
  throw new ExcelExportError('Export failed', error);
}

// Hook Layer
try {
  await excelService.export();
  options.onSuccess?.();
} catch (error) {
  options.onError?.(error);
}

// Component Layer
<ExcelActions
  onExportError={(error) => message.error(error.message)}
/>
```

### 2. User-Friendly Error Messages
- File validation errors: "Please select a valid Excel file (.xlsx or .xls)"
- Size limit errors: "File size must be less than 10MB"
- Network errors: "Failed to upload file. Please check your connection."
- Server errors: "Server error occurred. Please try again later."

### 3. Error Recovery
- Automatic retry for transient network errors
- Graceful degradation when services are unavailable
- Clear instructions for user action

## Testing Strategy

### 1. Unit Tests
- **Component Testing**: Test UI behavior, prop handling, and user interactions
- **Hook Testing**: Test state management and API orchestration
- **Service Testing**: Test business logic and error handling

### 2. Integration Tests
- **API Integration**: Test real API calls with mock backend
- **File Upload**: Test actual file upload and processing
- **Error Scenarios**: Test error handling across layers

### 3. End-to-End Tests
- **Complete Workflows**: Test full import/export scenarios
- **Permission Testing**: Test admin vs. regular user functionality
- **Browser Compatibility**: Test across different browsers

## Performance Optimizations

### 1. Component Level
```javascript
// Memoization for expensive operations
const ExcelActions = React.memo(({ programCode, semester, section, ...props }) => {
  // Component implementation
});

// Debounced file validation
const debouncedValidation = useMemo(
  () => debounce(validateFile, 300),
  [validateFile]
);
```

### 2. Hook Level
```javascript
// Prevent unnecessary re-renders
const exportToExcel = useCallback(async (options) => {
  // Implementation
}, [programCode, semester, section]);
```

### 3. Service Level
```javascript
// Chunked file processing for large files
class ExcelImportService {
  static async import(file, options) {
    const chunks = this.chunkFile(file);
    for (const chunk of chunks) {
      await this.processChunk(chunk);
      options.onProgress?.(chunk.progress);
    }
  }
}
```

## Security Considerations

### 1. File Validation
- MIME type checking
- File size limits
- Content validation
- Malicious file detection

### 2. Permission Control
```javascript
// Permission-based rendering
{isAdmin && (
  <ExcelActions allowImport={true} />
)}

// Server-side validation
if (!user.hasPermission('IMPORT_ROUTINE')) {
  throw new UnauthorizedError();
}
```

### 3. Data Sanitization
- Input validation before database operations
- SQL injection prevention
- XSS protection for file names

## Migration Guide

### From Old Implementation
1. **Replace existing Excel buttons** with `<ExcelActions />` component
2. **Remove inline Excel handlers** from components
3. **Update import statements** to use new service structure
4. **Test functionality** with existing data

### Backward Compatibility
- Old API endpoints remain functional
- Existing Excel export format unchanged
- Gradual migration strategy supported

## Future Enhancements

### 1. Advanced Features
- **Batch Operations**: Multiple file processing
- **Template Generation**: Custom Excel templates
- **Data Validation**: Pre-import conflict detection
- **Audit Trail**: Track import/export operations

### 2. Performance Improvements
- **Web Workers**: Background file processing
- **Streaming**: Large file handling
- **Caching**: Reduce redundant operations
- **Compression**: Optimize file transfers

### 3. User Experience
- **Progress Indicators**: Real-time progress tracking
- **Preview Mode**: Preview before import
- **Undo/Redo**: Revert import operations
- **Drag & Drop**: Enhanced file upload UI

## Conclusion

This clean architecture implementation provides:

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Comprehensive test coverage
3. **Reusability**: Components can be used anywhere
4. **Scalability**: Easy to add new features
5. **Performance**: Optimized for user experience
6. **Security**: Robust validation and permission control

The modular design ensures that Excel functionality can evolve independently while maintaining system stability and user experience.
