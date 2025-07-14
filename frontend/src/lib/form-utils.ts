/**
 * Universal utilities for cleaning form data before sending to API
 */

/**
 * Configuration for field cleaning
 */
interface CleanFieldsConfig {
  /** Fields that should have empty strings converted to null */
  optionalStringFields?: string[];
  /** Fields that should have empty strings converted to null and be trimmed */
  trimFields?: string[];
  /** Fields that should be excluded from cleaning */
  excludeFields?: string[];
}

/**
 * Universal function to clean form data by converting empty strings to null
 * for optional fields and trimming string fields.
 * 
 * @param data - The form data object to clean
 * @param config - Configuration for cleaning behavior
 * @returns Cleaned data object
 */
export function cleanFormData<T extends Record<string, any>>(
  data: T,
  config: CleanFieldsConfig = {}
): T {
  const {
    optionalStringFields = [],
    trimFields = [],
    excludeFields = []
  } = config;

  const cleanedData = { ...data } as any;

  Object.keys(cleanedData).forEach(key => {
    if (excludeFields.includes(key)) {
      return; // Skip excluded fields
    }

    const value = cleanedData[key];

    // Handle string values
    if (typeof value === 'string') {
      // Trim if it's in trimFields
      const trimmedValue = trimFields.includes(key) ? value.trim() : value;
      
      // Convert empty strings to null for optional fields
      if (optionalStringFields.includes(key) && trimmedValue === '') {
        cleanedData[key] = null;
      } else {
        cleanedData[key] = trimmedValue;
      }
    }
    // Handle other empty values
    else if (value === '' && optionalStringFields.includes(key)) {
      cleanedData[key] = null;
    }
  });

  return cleanedData;
}

/**
 * Predefined cleaning configurations for common use cases
 */
export const cleaningConfigs = {
  /**
   * Configuration for user data cleaning
   */
  userData: {
    optionalStringFields: [
      'middle_name',
      'display_name',
      'date_of_birth',
      'username',
      'email',
      'phone',
      'emergency_contact_name',
      'emergency_contact_phone',
      'gender',
      'telegram_id',
      'medical_clearance_date',
      'photo_url'
    ],
    trimFields: [
      'first_name',
      'middle_name',
      'last_name',
      'display_name',
      'emergency_contact_name',
      'telegram_id'
    ],
    excludeFields: [
      'medical_clearance_is_confirmed',
      'starting_number_of_jumps',
      'is_active'
    ]
  }
};

/**
 * Convenience function specifically for cleaning user form data
 */
export function cleanUserFormData<T extends Record<string, any>>(data: T): T {
  return cleanFormData(data, cleaningConfigs.userData);
}
