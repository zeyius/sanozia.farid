import { User } from '@supabase/supabase-js';

export interface UserProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  diagnosis_date?: string;
  ibd_type?: string;
  current_medications?: string[];
  allergies?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser extends User {
  profile?: UserProfile;
}
