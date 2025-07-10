// User roles enum matching backend
export enum UserRole {
  TANDEM_JUMPER = "tandem_jumper",
  AFF_STUDENT = "aff_student", 
  SPORT_PAID = "sport_paid",
  SPORT_FREE = "sport_free",
  TANDEM_INSTRUCTOR = "tandem_instructor",
  AFF_INSTRUCTOR = "aff_instructor",
  ADMINISTRATOR = "administrator"
}

export interface UserRoleAssignment {
  role: UserRole;
  created_at: string;
}

// User and authentication types
export interface User {
  id: number;
  telegram_id: string;
  first_name: string;
  last_name: string;
  username?: string;
  email?: string;
  phone?: string;
  license_document_url?: string;
  avatar_url?: string;
  roles: UserRoleAssignment[];
  created_at: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

// Dictionary types
export interface Dictionary {
  id: number;
  name: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  values?: DictionaryValue[];
}

export interface DictionaryValue {
  id: number;
  dictionary_id: number;
  value: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// Error types
export interface ApiError {
  detail: string;
  status_code: number;
}
