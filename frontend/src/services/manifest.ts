import { api } from '@/lib/api';
import { LoadStatus } from '@/types';

export interface LoadSummary {
  id: number;
  index_number: number;
  aircraft_name: string;
  aircraft_id: number;
  total_spaces: number;
  remaining_public_spaces: number;
  remaining_reserved_spaces: number;
  departure: string;
  status: LoadStatus;
  reserved_spaces: number;
}

export interface JumpSummary {
  id: number;
  user_id: number;
  user_name: string;
  jump_type_name: string;
  reserved: boolean;
  parent_jump_id?: number;
  load_id?: number;
  staff_assignments?: Record<string, number>;
  jump_type?: {
    id: number;
    name: string;
    short_name: string;
    additional_staff: Array<{
      id: number;
      staff_required_role: string;
      staff_default_jump_type_id?: number;
    }>;
  };
}

export interface ManifestResponse {
  loads: LoadSummary[];
  selected_load?: number;
  selected_load_jumps: JumpSummary[];
  unassigned_jumps: JumpSummary[];
}

export interface GetManifestParams {
  hide_old_loads?: boolean;
  aircraft_ids?: number[];
  load_statuses?: LoadStatus[];
  selected_load_id?: number;
  is_manifested?: boolean;
}

class ManifestService {
  async getManifestData(params: GetManifestParams = {}): Promise<ManifestResponse> {
    const searchParams = new URLSearchParams();
    
    // Add single value parameters
    if (params.hide_old_loads !== undefined) {
      searchParams.append('hide_old_loads', String(params.hide_old_loads));
    }
    if (params.selected_load_id !== undefined) {
      searchParams.append('selected_load_id', String(params.selected_load_id));
    }
    if (params.is_manifested !== undefined) {
      searchParams.append('is_manifested', String(params.is_manifested));
    }
    
    // Add array parameters
    if (params.aircraft_ids && params.aircraft_ids.length > 0) {
      params.aircraft_ids.forEach(id => searchParams.append('aircraft_ids', String(id)));
    }
    if (params.load_statuses && params.load_statuses.length > 0) {
      params.load_statuses.forEach(status => searchParams.append('load_statuses', status));
    }
    
    const response = await api.get(`/manifest/?${searchParams.toString()}`);
    return response.data;
  }
}

export const manifestService = new ManifestService();
