import { User, UserRole } from '@/types';
import { UserFormData } from '../components/admin/user/UserForm';

// Mapping of role enum values to user-friendly display names
const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.TANDEM_JUMPER]: 'Tandem Jumper',
  [UserRole.AFF_STUDENT]: 'AFF Student',
  [UserRole.SPORT_PAID]: 'Sport Jumper (Paid)',
  [UserRole.SPORT_FREE]: 'Sport Jumper (Free)',
  [UserRole.TANDEM_INSTRUCTOR]: 'Tandem Instructor',
  [UserRole.AFF_INSTRUCTOR]: 'AFF Instructor',
  [UserRole.ADMINISTRATOR]: 'Administrator',
};

// Get user-friendly display name for a role
export const getRoleDisplayName = (role: UserRole): string => {
  return ROLE_DISPLAY_NAMES[role] || role;
};

// Extract user roles from user object
export const getUserRoles = (user: User): UserRole[] => {
  return user.roles?.map(r => r.role) || [];
};

// Process input field value based on field type
export const processFieldValue = (name: string, value: string): string => {
  let processedValue = value;
  
  // Apply masks based on field type
  if (name === 'username') {
    // Username mask: @xxx (display with @, store without)
    if (value.startsWith('@')) {
      processedValue = value.slice(1); // Remove @ for storage
    }
  } else if (name === 'phone') {
    // Phone mask: +0000000 (store with mask)
    if (!value.startsWith('+') && value.length > 0) {
      processedValue = '+' + value.replace(/\D/g, ''); // Add + and keep only digits
    } else {
      processedValue = value.replace(/[^\d+]/g, ''); // Keep only digits and +
    }
  }
  
  return processedValue;
};

// Convert user data to form data
export const userToFormData = (user: User): UserFormData => {
  return {
    first_name: user.first_name || '',
    middle_name: user.middle_name || '',
    last_name: user.last_name || '',
    display_name: user.display_name || '',
    date_of_birth: user.date_of_birth || '',
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    emergency_contact_name: user.emergency_contact_name || '',
    emergency_contact_phone: user.emergency_contact_phone || '',
    gender: user.gender,
    photo_url: user.photo_url || '',
    medical_clearance_date: user.medical_clearance_date || '',
    medical_clearance_is_confirmed: user.medical_clearance_is_confirmed || false,
    starting_number_of_jumps: user.starting_number_of_jumps || 0,
    is_active: user.is_active !== false,
  };
};

// Validate user form data
export const validateUserForm = (formData: UserFormData, selectedRoles?: UserRole[]): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.first_name.trim()) {
    errors.first_name = 'First name is required';
  }

  if (!formData.last_name.trim()) {
    errors.last_name = 'Last name is required';
  }

  if (formData.telegram_id !== undefined && formData.telegram_id.trim() && !/^\d+$/.test(formData.telegram_id)) {
    errors.telegram_id = 'Telegram ID must be numeric';
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (formData.emergency_contact_phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.emergency_contact_phone)) {
    errors.emergency_contact_phone = 'Please enter a valid emergency contact phone number';
  }

  if (formData.date_of_birth) {
    const birthDate = new Date(formData.date_of_birth);
    const today = new Date();
    if (birthDate >= today) {
      errors.date_of_birth = 'Date of birth must be in the past';
    }
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 16) {
      errors.date_of_birth = 'User must be at least 16 years old';
    }
  }

  if (formData.starting_number_of_jumps !== undefined) {
    const jumps = Number(formData.starting_number_of_jumps);
    if (isNaN(jumps) || jumps < 0 || !Number.isInteger(jumps)) {
      errors.starting_number_of_jumps = 'Starting number of jumps must be a non-negative integer';
    }
  }

  if (selectedRoles && selectedRoles.length === 0) {
    errors.roles = 'At least one role must be selected';
  }

  return errors;
};
