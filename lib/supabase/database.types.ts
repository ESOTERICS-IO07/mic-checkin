export type UserRole = "ATTENDEE" | "ORGANIZER";
export type RegistrationStatus = "registered" | "checked_in";
export type CheckInSource = "online" | "offline_sync";
export type SyncConflictReason =
  | "already_checked_in"
  | "unknown_token"
  | "event_mismatch";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          organizer_id: string;
          name: string;
          starts_at: string;
          capacity: number;
          registration_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id?: string;
          name: string;
          starts_at: string;
          capacity: number;
          registration_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          name?: string;
          starts_at?: string;
          capacity?: number;
          registration_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          attendee_id: string;
          token_hash: string;
          token_lookup_prefix: string | null;
          status: RegistrationStatus;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          attendee_id: string;
          token_hash: string;
          token_lookup_prefix?: string | null;
          status?: RegistrationStatus;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          attendee_id?: string;
          token_hash?: string;
          token_lookup_prefix?: string | null;
          status?: RegistrationStatus;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      check_in_events: {
        Row: {
          id: string;
          registration_id: string;
          event_id: string;
          organizer_id: string;
          source: CheckInSource;
          client_scan_id: string | null;
          scanned_at_client: string | null;
          confirmed_at_server: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          event_id: string;
          organizer_id: string;
          source: CheckInSource;
          client_scan_id?: string | null;
          scanned_at_client?: string | null;
          confirmed_at_server?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          event_id?: string;
          organizer_id?: string;
          source?: CheckInSource;
          client_scan_id?: string | null;
          scanned_at_client?: string | null;
          confirmed_at_server?: string;
        };
        Relationships: [];
      };
      sync_conflicts: {
        Row: {
          id: string;
          event_id: string | null;
          registration_id: string | null;
          token_hash: string | null;
          client_scan_id: string | null;
          scanned_at_client: string | null;
          device_id: string | null;
          winning_check_in_id: string | null;
          reason: SyncConflictReason;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          registration_id?: string | null;
          token_hash?: string | null;
          client_scan_id?: string | null;
          scanned_at_client?: string | null;
          device_id?: string | null;
          winning_check_in_id?: string | null;
          reason: SyncConflictReason;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          registration_id?: string | null;
          token_hash?: string | null;
          client_scan_id?: string | null;
          scanned_at_client?: string | null;
          device_id?: string | null;
          winning_check_in_id?: string | null;
          reason?: SyncConflictReason;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      register_for_event: {
        Args: {
          p_event_id: string;
          p_token_hash: string;
          p_token_lookup_prefix: string;
        };
        Returns: string;
      };

      check_in_ticket: {
        Args: {
          p_event_id: string;
          p_token_hash: string;
        };
        Returns: string;
      };

      create_event: {
        Args: {
          p_name: string;
          p_starts_at: string;
          p_capacity: number;
        };
        Returns: Database["public"]["Tables"]["events"]["Row"];
      };
    },
    Enums: {
      user_role: UserRole;
      registration_status: RegistrationStatus;
      check_in_source: CheckInSource;
      sync_conflict_reason: SyncConflictReason;
    };
    CompositeTypes: Record<string, never>;
  };
};
