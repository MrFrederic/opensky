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
  roles: UserRoleAssignment[];
  created_at: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

// Equipment types
export interface Equipment {
  id: number;
  type_id: number;
  name_id: number;
  serial_number: string;
  status_id: number;
  created_at: string;
  updated_at: string;
}

// Load and Jump types
export interface Load {
  id: number;
  load_date: string;
  status_id: number;
  created_at: string;
  updated_at: string;
}

export interface Jump {
  id: number;
  user_id: number;
  passenger_id?: number;
  load_id: number;
  jump_type_id: number;
  payment_status_id: number;
  manifest_id?: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

// Manifest types
export interface Manifest {
  id: number;
  user_id: number;
  jump_type_id: number;
  status: ManifestStatus;
  decline_reason?: string;
  tandem_booking_id?: number;
  created_at: string;
  updated_at: string;
}

export type ManifestStatus = 'pending' | 'approved' | 'declined';

// Tandem types
export interface TandemSlot {
  slot_date: string;
  total_slots: number;
  created_at: string;
  updated_at: string;
}

export interface TandemBooking {
  id: number;
  user_id: number;
  booking_date: string;
  status: TandemBookingStatus;
  created_at: string;
  updated_at: string;
}

export type TandemBookingStatus = 'confirmed' | 'cancelled';

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

// Form types for requests
export interface CreateManifestRequest {
  jump_type_id: number;
  equipment_ids: number[];
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface CreateTandemBookingRequest {
  booking_date: string;
}

// Error types
export interface ApiError {
  detail: string;
  status_code: number;
}
