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

// Gender enum matching backend
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
  PREFER_NOT_TO_SAY = "prefer_not_to_say"
}

// Aircraft types enum matching backend
export enum AircraftType {
  PLANE = "plane",
  HELI = "heli"
}

// Load Status enum matching backend
export enum LoadStatus {
  FORMING = "forming",
  ON_CALL = "on_call", 
  DEPARTED = "departed"
}

export interface UserRoleAssignment {
  role: UserRole;
  created_at: string;
}

// User and authentication types
export interface User {
  id: number;
  telegram_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  display_name?: string;
  date_of_birth?: string; // ISO date string
  username?: string;
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  gender?: Gender;
  photo_url?: string;
  medical_clearance_date?: string; // ISO date string
  medical_clearance_is_confirmed?: boolean;
  is_active?: boolean;
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

// Jump Types
export interface JumpTypeAllowedRole {
  id: number;
  role: UserRole;
  created_at: string;
}

export interface JumpTypeMinimal {
  id: number;
  name: string;
  short_name: string;
}

export interface AdditionalStaff {
  id: number;
  staff_required_role: UserRole;
  staff_default_jump_type_id?: number;
  staff_default_jump_type?: JumpTypeMinimal;
  created_at: string;
}

export interface JumpType {
  id: number;
  name: string;
  short_name: string;
  description?: string;
  exit_altitude?: number;
  price?: number;
  is_available: boolean;
  allowed_roles: JumpTypeAllowedRole[];
  additional_staff: AdditionalStaff[];
  created_at: string;
  updated_at?: string;
}

// Aircraft interface
export interface Aircraft {
  id: number;
  name: string;
  type: AircraftType;
  max_load: number;
  created_at: string;
  updated_at?: string;
}

// Load types
export interface Load {
  id: number;
  departure: string; // ISO datetime string
  aircraft_id: number;
  aircraft?: Aircraft;
  status: LoadStatus;
  reserved_spaces: number;
  created_at: string;
  updated_at?: string;
  // Space information (calculated by backend)
  total_spaces?: number;
  occupied_public_spaces?: number;
  occupied_reserved_spaces?: number;
  remaining_public_spaces?: number;
  remaining_reserved_spaces?: number;
}

// Load creation and update types
export interface CreateLoadData {
  departure: string; // ISO datetime string
  aircraft_id: number;
}

export interface UpdateLoadData {
  departure?: string;
  aircraft_id?: number;
}

// Jump types
export interface Jump {
  id: number;
  user_id: number;
  jump_type_id: number;
  is_manifested: boolean;
  load_id?: number;
  reserved?: boolean;
  comment?: string;
  parent_jump_id?: number;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    display_name?: string;
  };
  jump_type?: {
    id: number;
    name: string;
    short_name: string;
    additional_staff: Array<{
      staff_required_role: string;
      staff_default_jump_type_id?: number;
    }>;
  };
  load?: {
    id: number;
    departure: string;
  };
  parent_jump?: Jump;
  child_jumps: Jump[];
  created_at: string;
  updated_at?: string;
}

export interface CreateJumpData {
  user_id: number;
  jump_type_id: number;
  comment?: string;
  parent_jump_id?: number;
}

export interface UpdateJumpData {
  user_id?: number;
  jump_type_id?: number;
  is_manifested?: boolean;
  reserved?: boolean;
  comment?: string;
  parent_jump_id?: number;
}
