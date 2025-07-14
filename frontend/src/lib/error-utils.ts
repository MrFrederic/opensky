import { AxiosError } from 'axios';

/**
 * Utility function to extract meaningful error messages from API responses
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // If it's an Axios error with response data
    if ('response' in error && error.response) {
      const axiosError = error as AxiosError<any>;
      
      // Try to extract error from response data
      if (axiosError.response?.data) {
        const data = axiosError.response.data;
        
        // FastAPI validation errors
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Multiple validation errors
            return data.detail.map((err: any) => 
              `${err.loc?.join('.') || 'Field'}: ${err.msg}`
            ).join(', ');
          } else if (typeof data.detail === 'string') {
            return data.detail;
          }
        }
        
        // Other error formats
        if (data.message) return data.message;
        if (data.error) return data.error;
        
        // If we have a status code, provide context
        if (axiosError.response.status) {
          switch (axiosError.response.status) {
            case 400:
              return 'Bad request - please check your input';
            case 401:
              return 'Unauthorized - please login again';
            case 403:
              return 'Forbidden - you do not have permission';
            case 404:
              return 'Resource not found';
            case 409:
              return 'Conflict - resource already exists';
            case 422:
              return 'Validation error - please check your input';
            case 500:
              return 'Server error - please try again later';
            default:
              return `Request failed with status ${axiosError.response.status}`;
          }
        }
      }
    }
    
    // Return the error message if it's a regular Error
    return error.message;
  }
  
  // Fallback for non-Error objects
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
};

/**
 * Utility function for consistent toast error handling in mutations
 */
export const createErrorHandler = (baseMessage: string) => {
  return (error: unknown) => {
    const errorMessage = getErrorMessage(error);
    return `${baseMessage}: ${errorMessage}`;
  };
};
