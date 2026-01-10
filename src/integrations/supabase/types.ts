export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_call_actions: {
        Row: {
          action_data: Json
          action_type: string
          call_id: string
          completed: boolean | null
          completed_at: string | null
          contractor_id: string
          created_at: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
        }
        Insert: {
          action_data: Json
          action_type: string
          call_id: string
          completed?: boolean | null
          completed_at?: string | null
          contractor_id: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
        }
        Update: {
          action_data?: Json
          action_type?: string
          call_id?: string
          completed?: boolean | null
          completed_at?: string | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_call_actions_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_call_actions_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_call_actions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_call_actions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      assumption_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          default_selected: boolean
          id: string
          is_active: boolean
          priority: number
          title: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          default_selected?: boolean
          id?: string
          is_active?: boolean
          priority?: number
          title: string
          trade_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          default_selected?: boolean
          id?: string
          is_active?: boolean
          priority?: number
          title?: string
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assumption_templates_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_account_links: {
        Row: {
          created_at: string | null
          id: string
          plaid_access_token_encrypted: string
          plaid_institution_name: string | null
          plaid_item_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plaid_access_token_encrypted: string
          plaid_institution_name?: string | null
          plaid_item_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plaid_access_token_encrypted?: string
          plaid_institution_name?: string | null
          plaid_item_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_connections: {
        Row: {
          access_token_encrypted: string
          calendar_email: string
          created_at: string | null
          expires_at: string
          id: string
          provider: string
          refresh_token_encrypted: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          calendar_email: string
          created_at?: string | null
          expires_at: string
          id?: string
          provider: string
          refresh_token_encrypted: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          calendar_email?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          provider?: string
          refresh_token_encrypted?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          contractor_id: string
          created_at: string | null
          end_time: string
          event_id: string
          event_type: string | null
          id: string
          is_busy: boolean | null
          start_time: string
          synced_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          end_time: string
          event_id: string
          event_type?: string | null
          id?: string
          is_busy?: boolean | null
          start_time: string
          synced_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          end_time?: string
          event_id?: string
          event_type?: string | null
          id?: string
          is_busy?: boolean | null
          start_time?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          action_taken: string | null
          ai_summary: string | null
          call_sid: string
          caller_name: string | null
          contractor_id: string | null
          conversation_history: Json | null
          created_at: string
          from_number: string
          id: string
          job_id: string | null
          outcome: string | null
          recording_duration: number | null
          recording_sid: string | null
          recording_status: string | null
          recording_url: string | null
          status: string
          tenant_id: string | null
          to_number: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          ai_summary?: string | null
          call_sid: string
          caller_name?: string | null
          contractor_id?: string | null
          conversation_history?: Json | null
          created_at?: string
          from_number: string
          id?: string
          job_id?: string | null
          outcome?: string | null
          recording_duration?: number | null
          recording_sid?: string | null
          recording_status?: string | null
          recording_url?: string | null
          status?: string
          tenant_id?: string | null
          to_number: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          ai_summary?: string | null
          call_sid?: string
          caller_name?: string | null
          contractor_id?: string | null
          conversation_history?: Json | null
          created_at?: string
          from_number?: string
          id?: string
          job_id?: string | null
          outcome?: string | null
          recording_duration?: number | null
          recording_sid?: string | null
          recording_status?: string | null
          recording_url?: string | null
          status?: string
          tenant_id?: string | null
          to_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          ai_backup_triggered: boolean | null
          ai_handled: boolean | null
          ai_summary: string | null
          call_sid: string
          call_status: string
          contractor_answered: boolean | null
          contractor_id: string | null
          created_at: string
          customer_info: Json | null
          duration: number | null
          follow_up_action: string | null
          forwarded_to_contractor: boolean | null
          from_number: string
          id: string
          message_type: string | null
          outcome: string | null
          recording_sid: string | null
          recording_url: string | null
          routing_status: string
          tenant_id: string | null
          to_number: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          ai_backup_triggered?: boolean | null
          ai_handled?: boolean | null
          ai_summary?: string | null
          call_sid: string
          call_status: string
          contractor_answered?: boolean | null
          contractor_id?: string | null
          created_at?: string
          customer_info?: Json | null
          duration?: number | null
          follow_up_action?: string | null
          forwarded_to_contractor?: boolean | null
          from_number: string
          id?: string
          message_type?: string | null
          outcome?: string | null
          recording_sid?: string | null
          recording_url?: string | null
          routing_status?: string
          tenant_id?: string | null
          to_number: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          ai_backup_triggered?: boolean | null
          ai_handled?: boolean | null
          ai_summary?: string | null
          call_sid?: string
          call_status?: string
          contractor_answered?: boolean | null
          contractor_id?: string | null
          created_at?: string
          customer_info?: Json | null
          duration?: number | null
          follow_up_action?: string | null
          forwarded_to_contractor?: boolean | null
          from_number?: string
          id?: string
          message_type?: string | null
          outcome?: string | null
          recording_sid?: string | null
          recording_url?: string | null
          routing_status?: string
          tenant_id?: string | null
          to_number?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      change_orders: {
        Row: {
          additional_cost: number
          approved_by: string | null
          created_at: string
          date_approved: string | null
          date_requested: string
          description: string
          id: string
          job_id: string
          notes: string | null
          reason: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["change_order_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_cost?: number
          approved_by?: string | null
          created_at?: string
          date_approved?: string | null
          date_requested?: string
          description: string
          id?: string
          job_id: string
          notes?: string | null
          reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["change_order_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_cost?: number
          approved_by?: string | null
          created_at?: string
          date_approved?: string | null
          date_requested?: string
          description?: string
          id?: string
          job_id?: string
          notes?: string | null
          reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["change_order_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_usage: {
        Row: {
          created_at: string
          id: string
          last_reset_date: string
          prompt_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset_date?: string
          prompt_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset_date?: string
          prompt_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contractor_ai_profiles: {
        Row: {
          ai_enabled: boolean | null
          allow_pricing: boolean | null
          booking_buffer_minutes: number | null
          business_hours: Json | null
          business_name: string
          calendar_email: string | null
          calendar_type: string | null
          confirmation_message_template: string | null
          contractor_id: string
          contractor_name: string
          contractor_phone: string | null
          created_at: string | null
          custom_greeting: string | null
          custom_instructions: string | null
          default_meeting_length: number | null
          emergency_availability: boolean | null
          emergency_hours: Json | null
          forward_attempts: number | null
          forward_timeout_seconds: number | null
          google_access_token: string | null
          google_calendar_enabled: boolean | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          id: string
          inbound_call_mode: string | null
          internal_notes: string | null
          license_number: string | null
          preferred_meeting_types: string[] | null
          pricing_rules: string | null
          service_area: string[] | null
          service_description: string | null
          services_not_offered: string[] | null
          services_offered: string[] | null
          trade: string
          updated_at: string | null
          voice_id: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          allow_pricing?: boolean | null
          booking_buffer_minutes?: number | null
          business_hours?: Json | null
          business_name: string
          calendar_email?: string | null
          calendar_type?: string | null
          confirmation_message_template?: string | null
          contractor_id: string
          contractor_name: string
          contractor_phone?: string | null
          created_at?: string | null
          custom_greeting?: string | null
          custom_instructions?: string | null
          default_meeting_length?: number | null
          emergency_availability?: boolean | null
          emergency_hours?: Json | null
          forward_attempts?: number | null
          forward_timeout_seconds?: number | null
          google_access_token?: string | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          inbound_call_mode?: string | null
          internal_notes?: string | null
          license_number?: string | null
          preferred_meeting_types?: string[] | null
          pricing_rules?: string | null
          service_area?: string[] | null
          service_description?: string | null
          services_not_offered?: string[] | null
          services_offered?: string[] | null
          trade: string
          updated_at?: string | null
          voice_id?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          allow_pricing?: boolean | null
          booking_buffer_minutes?: number | null
          business_hours?: Json | null
          business_name?: string
          calendar_email?: string | null
          calendar_type?: string | null
          confirmation_message_template?: string | null
          contractor_id?: string
          contractor_name?: string
          contractor_phone?: string | null
          created_at?: string | null
          custom_greeting?: string | null
          custom_instructions?: string | null
          default_meeting_length?: number | null
          emergency_availability?: boolean | null
          emergency_hours?: Json | null
          forward_attempts?: number | null
          forward_timeout_seconds?: number | null
          google_access_token?: string | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          inbound_call_mode?: string | null
          internal_notes?: string | null
          license_number?: string | null
          preferred_meeting_types?: string[] | null
          pricing_rules?: string | null
          service_area?: string[] | null
          service_description?: string | null
          services_not_offered?: string[] | null
          services_offered?: string[] | null
          trade?: string
          updated_at?: string | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_ai_profiles_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_required: boolean
          lesson_type: string
          module_id: string
          order_index: number
          pdf_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          lesson_type?: string
          module_id: string
          order_index: number
          pdf_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          lesson_type?: string
          module_id?: string
          order_index?: number
          pdf_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_assignments: {
        Row: {
          assigned_by: string | null
          assigned_date: string
          crew_member_id: string
          id: string
          job_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_date?: string
          crew_member_id: string
          id?: string
          job_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_date?: string
          crew_member_id?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_assignments_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          contact_info: Json | null
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["crew_role"]
          skills_trades: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["crew_role"]
          skills_trades?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["crew_role"]
          skills_trades?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          created_at: string
          customer_type: string | null
          email: string | null
          estimate_id: string | null
          id: string
          job_id: string | null
          lifetime_value: number | null
          name: string
          notes: string | null
          phone: string | null
          referral_source: string | null
          referral_source_other: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          estimate_id?: string | null
          id?: string
          job_id?: string | null
          lifetime_value?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          referral_source?: string | null
          referral_source_other?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          estimate_id?: string | null
          id?: string
          job_id?: string | null
          lifetime_value?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          referral_source?: string | null
          referral_source_other?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_job_id_jobs_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          created_at: string
          crew_count: number | null
          equipment_used: string | null
          hours_worked: number | null
          id: string
          job_id: string
          log_date: string
          materials_used: string | null
          notes: string | null
          user_id: string
          weather: string | null
          work_completed: string | null
        }
        Insert: {
          created_at?: string
          crew_count?: number | null
          equipment_used?: string | null
          hours_worked?: number | null
          id?: string
          job_id: string
          log_date?: string
          materials_used?: string | null
          notes?: string | null
          user_id: string
          weather?: string | null
          work_completed?: string | null
        }
        Update: {
          created_at?: string
          crew_count?: number | null
          equipment_used?: string | null
          hours_worked?: number | null
          id?: string
          job_id?: string
          log_date?: string
          materials_used?: string | null
          notes?: string | null
          user_id?: string
          weather?: string | null
          work_completed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_connections: {
        Row: {
          access_token_encrypted: string
          created_at: string | null
          email_address: string
          expires_at: string
          id: string
          provider: string
          refresh_token_encrypted: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string | null
          email_address: string
          expires_at: string
          id?: string
          provider: string
          refresh_token_encrypted: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string | null
          email_address?: string
          expires_at?: string
          id?: string
          provider?: string
          refresh_token_encrypted?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          body: string
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string
          status: string
          subject: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string
          status?: string
          subject: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          entity_type: string
          id: string
          is_active: boolean
          name: string
          stage: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          entity_type: string
          id?: string
          is_active?: boolean
          name: string
          stage?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          name?: string
          stage?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      estimate_assumptions: {
        Row: {
          category: string | null
          created_at: string
          estimate_id: string
          id: string
          is_custom: boolean
          priority: number | null
          template_id: string | null
          text: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          estimate_id: string
          id?: string
          is_custom?: boolean
          priority?: number | null
          template_id?: string | null
          text: string
        }
        Update: {
          category?: string | null
          created_at?: string
          estimate_id?: string
          id?: string
          is_custom?: boolean
          priority?: number | null
          template_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_assumptions_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_assumptions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assumption_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_exclusions: {
        Row: {
          category: string | null
          created_at: string
          estimate_id: string
          id: string
          is_custom: boolean
          priority: number | null
          template_id: string | null
          text: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          estimate_id: string
          id?: string
          is_custom?: boolean
          priority?: number | null
          template_id?: string | null
          text: string
        }
        Update: {
          category?: string | null
          created_at?: string
          estimate_id?: string
          id?: string
          is_custom?: boolean
          priority?: number | null
          template_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_exclusions_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_exclusions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "exclusion_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_item_macro_groups: {
        Row: {
          contractor_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      estimate_line_item_macros: {
        Row: {
          created_at: string | null
          default_quantity: number
          default_unit: string
          default_unit_price: number
          description_template: string
          id: string
          item_code_template: string | null
          macro_group_id: string
          order_index: number
        }
        Insert: {
          created_at?: string | null
          default_quantity?: number
          default_unit?: string
          default_unit_price?: number
          description_template: string
          id?: string
          item_code_template?: string | null
          macro_group_id: string
          order_index?: number
        }
        Update: {
          created_at?: string | null
          default_quantity?: number
          default_unit?: string
          default_unit_price?: number
          description_template?: string
          id?: string
          item_code_template?: string | null
          macro_group_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_item_macros_macro_group_id_fkey"
            columns: ["macro_group_id"]
            isOneToOne: false
            referencedRelation: "estimate_line_item_macro_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_payment_sessions: {
        Row: {
          amount: number
          clover_session_id: string
          created_at: string
          customer_email: string
          estimate_id: string
          id: string
        }
        Insert: {
          amount: number
          clover_session_id: string
          created_at?: string
          customer_email: string
          estimate_id: string
          id?: string
        }
        Update: {
          amount?: number
          clover_session_id?: string
          created_at?: string
          customer_email?: string
          estimate_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_payment_sessions_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          line_items: Json | null
          name: string
          scope_summary: string | null
          tags: string[] | null
          trade: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          line_items?: Json | null
          name: string
          scope_summary?: string | null
          tags?: string[] | null
          trade: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          line_items?: Json | null
          name?: string
          scope_summary?: string | null
          tags?: string[] | null
          trade?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      estimate_text_macros: {
        Row: {
          body_text: string
          category: string
          contractor_id: string
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          body_text: string
          category: string
          contractor_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          body_text?: string
          category?: string
          contractor_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      estimate_trades: {
        Row: {
          created_at: string
          estimate_id: string
          id: string
          trade_id: string
        }
        Insert: {
          created_at?: string
          estimate_id: string
          id?: string
          trade_id: string
        }
        Update: {
          created_at?: string
          estimate_id?: string
          id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_trades_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_trades_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_views: {
        Row: {
          estimate_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          estimate_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          estimate_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_views_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          assumptions_and_exclusions: string | null
          balance_due: number | null
          client_acceptance_date: string | null
          client_address: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_printed_name: string | null
          client_signature: string | null
          contractor_acceptance_date: string | null
          contractor_printed_name: string | null
          contractor_signature: string | null
          cost_summary: Json | null
          created_at: string
          customer_id: string | null
          date_issued: string | null
          description: string | null
          email_provider_id: string | null
          email_send_error: string | null
          estimate_number: string | null
          grand_total: number | null
          id: string
          job_id: string | null
          last_send_attempt: string | null
          lead_id: string | null
          line_items: Json | null
          opportunity_id: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          permit_fee: number | null
          prepared_by: string | null
          project_address: string | null
          project_description: string | null
          project_name: string | null
          public_token: string | null
          referred_by: string | null
          required_deposit: number | null
          required_deposit_percent: number | null
          sales_tax_rate_percent: number | null
          scope_exclusions: Json | null
          scope_key_deliverables: Json | null
          scope_objective: string | null
          scope_timeline: string | null
          sent_at: string | null
          signed_at: string | null
          site_address: string | null
          status: string
          stripe_payment_link: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          terms_change_orders: string | null
          terms_insurance: string | null
          terms_payment_schedule: string | null
          terms_validity: string | null
          terms_warranty_years: number | null
          title: string
          total_amount: number
          trade_specific: Json | null
          trade_type: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          assumptions_and_exclusions?: string | null
          balance_due?: number | null
          client_acceptance_date?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_printed_name?: string | null
          client_signature?: string | null
          contractor_acceptance_date?: string | null
          contractor_printed_name?: string | null
          contractor_signature?: string | null
          cost_summary?: Json | null
          created_at?: string
          customer_id?: string | null
          date_issued?: string | null
          description?: string | null
          email_provider_id?: string | null
          email_send_error?: string | null
          estimate_number?: string | null
          grand_total?: number | null
          id?: string
          job_id?: string | null
          last_send_attempt?: string | null
          lead_id?: string | null
          line_items?: Json | null
          opportunity_id?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          permit_fee?: number | null
          prepared_by?: string | null
          project_address?: string | null
          project_description?: string | null
          project_name?: string | null
          public_token?: string | null
          referred_by?: string | null
          required_deposit?: number | null
          required_deposit_percent?: number | null
          sales_tax_rate_percent?: number | null
          scope_exclusions?: Json | null
          scope_key_deliverables?: Json | null
          scope_objective?: string | null
          scope_timeline?: string | null
          sent_at?: string | null
          signed_at?: string | null
          site_address?: string | null
          status?: string
          stripe_payment_link?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms_change_orders?: string | null
          terms_insurance?: string | null
          terms_payment_schedule?: string | null
          terms_validity?: string | null
          terms_warranty_years?: number | null
          title: string
          total_amount?: number
          trade_specific?: Json | null
          trade_type?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          assumptions_and_exclusions?: string | null
          balance_due?: number | null
          client_acceptance_date?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_printed_name?: string | null
          client_signature?: string | null
          contractor_acceptance_date?: string | null
          contractor_printed_name?: string | null
          contractor_signature?: string | null
          cost_summary?: Json | null
          created_at?: string
          customer_id?: string | null
          date_issued?: string | null
          description?: string | null
          email_provider_id?: string | null
          email_send_error?: string | null
          estimate_number?: string | null
          grand_total?: number | null
          id?: string
          job_id?: string | null
          last_send_attempt?: string | null
          lead_id?: string | null
          line_items?: Json | null
          opportunity_id?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          permit_fee?: number | null
          prepared_by?: string | null
          project_address?: string | null
          project_description?: string | null
          project_name?: string | null
          public_token?: string | null
          referred_by?: string | null
          required_deposit?: number | null
          required_deposit_percent?: number | null
          sales_tax_rate_percent?: number | null
          scope_exclusions?: Json | null
          scope_key_deliverables?: Json | null
          scope_objective?: string | null
          scope_timeline?: string | null
          sent_at?: string | null
          signed_at?: string | null
          site_address?: string | null
          status?: string
          stripe_payment_link?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms_change_orders?: string | null
          terms_insurance?: string | null
          terms_payment_schedule?: string | null
          terms_validity?: string | null
          terms_warranty_years?: number | null
          title?: string
          total_amount?: number
          trade_specific?: Json | null
          trade_type?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      exclusion_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          default_selected: boolean
          id: string
          is_active: boolean
          priority: number
          title: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          default_selected?: boolean
          id?: string
          is_active?: boolean
          priority?: number
          title: string
          trade_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          default_selected?: boolean
          id?: string
          is_active?: boolean
          priority?: number
          title?: string
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exclusion_templates_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          contractor_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          job_id: string | null
          notes: string | null
          plaid_transaction_id: string | null
          receipt_url: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          contractor_id: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          plaid_transaction_id?: string | null
          receipt_url?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          contractor_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          plaid_transaction_id?: string | null
          receipt_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      gc_contacts: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_documents: {
        Row: {
          document_type: string
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          notes: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          document_type: string
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          document_type?: string
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_waivers: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          created_by: string
          gc_id: string | null
          id: string
          invoice_id: string
          pdf_url: string | null
          retainage: number | null
          waiver_type: string
        }
        Insert: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          created_by: string
          gc_id?: string | null
          id?: string
          invoice_id: string
          pdf_url?: string | null
          retainage?: number | null
          waiver_type: string
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          created_by?: string
          gc_id?: string | null
          id?: string
          invoice_id?: string
          pdf_url?: string | null
          retainage?: number | null
          waiver_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_waivers_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "gc_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_waivers_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          balance_due: number | null
          created_at: string
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string
          job_id: string
          line_items: Json | null
          notes: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_id: string | null
          stripe_payment_link: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          balance_due?: number | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          job_id: string
          line_items?: Json | null
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_id?: string | null
          stripe_payment_link?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          balance_due?: number | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          job_id?: string
          line_items?: Json | null
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_id?: string | null
          stripe_payment_link?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_costs: {
        Row: {
          amount: number
          category: string
          cost_date: string
          created_at: string
          description: string | null
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          cost_date?: string
          created_at?: string
          description?: string | null
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          cost_date?: string
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_meetings: {
        Row: {
          calendar_event_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          job_id: string
          location: string | null
          meeting_type: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_event_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          job_id: string
          location?: string | null
          meeting_type?: string
          notes?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_event_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          job_id?: string
          location?: string | null
          meeting_type?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_meetings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          job_id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id: string
          photo_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          changed_at: string
          id: string
          job_id: string
          new_status: string
          old_status: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          job_id: string
          new_status: string
          old_status?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          job_id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_cost: number | null
          actual_end_date: string | null
          actual_start_date: string | null
          address: string | null
          adjusted_budget_amount: number | null
          budget_amount: number | null
          change_orders_total: number | null
          city: string | null
          contract_value: number | null
          converted_at: string | null
          converted_to_customer_id: string | null
          created_at: string
          custom_fields: Json | null
          customer_id: string | null
          description: string | null
          end_date: string | null
          expenses_total: number | null
          id: string
          job_number: string | null
          job_status: Database["public"]["Enums"]["job_status"] | null
          lead_id: string | null
          name: string
          notes: string | null
          opportunity_id: string | null
          original_estimate_id: string | null
          payments_collected: number | null
          profit: number | null
          scheduled_end_date: string | null
          scheduled_start_date: string | null
          start_date: string | null
          state: string | null
          status: string
          sub_trade: string | null
          total_contract_value: number | null
          total_cost: number | null
          trade_type: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          address?: string | null
          adjusted_budget_amount?: number | null
          budget_amount?: number | null
          change_orders_total?: number | null
          city?: string | null
          contract_value?: number | null
          converted_at?: string | null
          converted_to_customer_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          expenses_total?: number | null
          id?: string
          job_number?: string | null
          job_status?: Database["public"]["Enums"]["job_status"] | null
          lead_id?: string | null
          name: string
          notes?: string | null
          opportunity_id?: string | null
          original_estimate_id?: string | null
          payments_collected?: number | null
          profit?: number | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          sub_trade?: string | null
          total_contract_value?: number | null
          total_cost?: number | null
          trade_type?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          address?: string | null
          adjusted_budget_amount?: number | null
          budget_amount?: number | null
          change_orders_total?: number | null
          city?: string | null
          contract_value?: number | null
          converted_at?: string | null
          converted_to_customer_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          expenses_total?: number | null
          id?: string
          job_number?: string | null
          job_status?: Database["public"]["Enums"]["job_status"] | null
          lead_id?: string | null
          name?: string
          notes?: string | null
          opportunity_id?: string | null
          original_estimate_id?: string | null
          payments_collected?: number | null
          profit?: number | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          sub_trade?: string | null
          total_contract_value?: number | null
          total_cost?: number | null
          trade_type?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_converted_to_customer_id_fkey"
            columns: ["converted_to_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_lead_id_leads_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_original_estimate_id_fkey"
            columns: ["original_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          converted_at: string | null
          converted_to_customer: boolean | null
          converted_to_job_id: string | null
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          last_contact_date: string | null
          name: string
          notes: string | null
          phone: string | null
          project_type: string | null
          source_id: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
          value: number | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          converted_at?: string | null
          converted_to_customer?: boolean | null
          converted_to_job_id?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          source_id?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
          value?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          converted_at?: string | null
          converted_to_customer?: boolean | null
          converted_to_job_id?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          source_id?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          value?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_to_job_id_fkey"
            columns: ["converted_to_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          lesson_id: string
          options: Json | null
          order_index: number
          points: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          lesson_id: string
          options?: Json | null
          order_index: number
          points?: number
          question_text: string
          question_type?: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          lesson_id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      marketplace_services: {
        Row: {
          category: string | null
          category_id: string | null
          contact_info: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          logo_url: string | null
          name: string
          price_info: string | null
          price_range: string | null
          provider_email: string | null
          provider_name: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          logo_url?: string | null
          name: string
          price_info?: string | null
          price_range?: string | null
          provider_email?: string | null
          provider_name?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          category_id?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          logo_url?: string | null
          name?: string
          price_info?: string | null
          price_range?: string | null
          provider_email?: string | null
          provider_name?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          date_ordered: string | null
          date_used: string | null
          description: string
          id: string
          job_id: string
          notes: string | null
          quantity_ordered: number | null
          quantity_used: number | null
          supplier_name: string | null
          total_cost: number | null
          unit_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          date_ordered?: string | null
          date_used?: string | null
          description: string
          id?: string
          job_id: string
          notes?: string | null
          quantity_ordered?: number | null
          quantity_used?: number | null
          supplier_name?: string | null
          total_cost?: number | null
          unit_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          date_ordered?: string | null
          date_used?: string | null
          description?: string
          id?: string
          job_id?: string
          notes?: string | null
          quantity_ordered?: number | null
          quantity_used?: number | null
          supplier_name?: string | null
          total_cost?: number | null
          unit_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          contractor_id: string
          created_at: string
          expires_at: string
          id: string
          provider: string | null
          state: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string | null
          state: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string | null
          state?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          assigned_user_id: string | null
          budget_confirmed: boolean | null
          closed_at: string | null
          competing_options_description: string | null
          contract_document_url: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          decision_maker_name: string | null
          estimated_close_date: string | null
          estimated_value: number | null
          id: string
          job_address: string | null
          job_start_target_date: string | null
          last_activity_at: string | null
          lead_id: string | null
          lead_source: Database["public"]["Enums"]["lead_source"] | null
          need_description: string | null
          next_action_date: string | null
          next_action_description: string | null
          notes: string | null
          previous_stage:
            | Database["public"]["Enums"]["opportunity_stage"]
            | null
          probability_override: boolean | null
          probability_percent: number | null
          proposal_document_url: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"]
          stage_entered_at: string
          title: string
          trade_type: string
          updated_at: string
          user_id: string
          win_loss_details: string | null
          win_loss_reason: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          budget_confirmed?: boolean | null
          closed_at?: string | null
          competing_options_description?: string | null
          contract_document_url?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          decision_maker_name?: string | null
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          job_address?: string | null
          job_start_target_date?: string | null
          last_activity_at?: string | null
          lead_id?: string | null
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          need_description?: string | null
          next_action_date?: string | null
          next_action_description?: string | null
          notes?: string | null
          previous_stage?:
            | Database["public"]["Enums"]["opportunity_stage"]
            | null
          probability_override?: boolean | null
          probability_percent?: number | null
          proposal_document_url?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          stage_entered_at?: string
          title: string
          trade_type: string
          updated_at?: string
          user_id: string
          win_loss_details?: string | null
          win_loss_reason?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          budget_confirmed?: boolean | null
          closed_at?: string | null
          competing_options_description?: string | null
          contract_document_url?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          decision_maker_name?: string | null
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          job_address?: string | null
          job_start_target_date?: string | null
          last_activity_at?: string | null
          lead_id?: string | null
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          need_description?: string | null
          next_action_date?: string | null
          next_action_description?: string | null
          notes?: string | null
          previous_stage?:
            | Database["public"]["Enums"]["opportunity_stage"]
            | null
          probability_override?: boolean | null
          probability_percent?: number | null
          proposal_document_url?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          stage_entered_at?: string
          title?: string
          trade_type?: string
          updated_at?: string
          user_id?: string
          win_loss_details?: string | null
          win_loss_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          contractor_id: string
          created_at: string
          customer_id: string | null
          estimate_id: string | null
          fee_amount: number | null
          id: string
          invoice_id: string | null
          job_id: string | null
          notes: string | null
          paid_at: string | null
          payment_date: string
          payment_method: string | null
          status: string
          stripe_payment_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          contractor_id: string
          created_at?: string
          customer_id?: string | null
          estimate_id?: string | null
          fee_amount?: number | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_date?: string
          payment_method?: string | null
          status?: string
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contractor_id?: string
          created_at?: string
          customer_id?: string | null
          estimate_id?: string | null
          fee_amount?: number | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_date?: string
          payment_method?: string | null
          status?: string
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contractor_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_tasks: {
        Row: {
          category: string | null
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          source: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          active: boolean
          contractor_id: string
          created_at: string
          id: string
          tenant_id: string | null
          twilio_phone_number: string
          twilio_sid: string
        }
        Insert: {
          active?: boolean
          contractor_id: string
          created_at?: string
          id?: string
          tenant_id?: string | null
          twilio_phone_number: string
          twilio_sid: string
        }
        Update: {
          active?: boolean
          contractor_id?: string
          created_at?: string
          id?: string
          tenant_id?: string | null
          twilio_phone_number?: string
          twilio_sid?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plaid_transactions: {
        Row: {
          amount: number
          bank_account_link_id: string | null
          category: string | null
          contractor_id: string
          created_at: string
          description: string | null
          id: string
          is_expense: boolean | null
          is_reimbursable: boolean | null
          job_id: string | null
          notes: string | null
          plaid_transaction_id: string
          receipt_url: string | null
          transaction_date: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          bank_account_link_id?: string | null
          category?: string | null
          contractor_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_expense?: boolean | null
          is_reimbursable?: boolean | null
          job_id?: string | null
          notes?: string | null
          plaid_transaction_id: string
          receipt_url?: string | null
          transaction_date: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          bank_account_link_id?: string | null
          category?: string | null
          contractor_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_expense?: boolean | null
          is_reimbursable?: boolean | null
          job_id?: string | null
          notes?: string | null
          plaid_transaction_id?: string
          receipt_url?: string | null
          transaction_date?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plaid_transactions_bank_account_link_id_fkey"
            columns: ["bank_account_link_id"]
            isOneToOne: false
            referencedRelation: "bank_account_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plaid_transactions_contractor_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plaid_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      post_sale_follow_ups: {
        Row: {
          completed_at: string | null
          contact_method: string | null
          created_at: string
          customer_id: string | null
          id: string
          job_id: string
          next_contact_date: string | null
          notes: string | null
          outcome: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_method?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          job_id: string
          next_contact_date?: string | null
          notes?: string | null
          outcome?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_method?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          job_id?: string
          next_contact_date?: string | null
          notes?: string | null
          outcome?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_sale_follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_sale_follow_ups_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_address: string | null
          business_email: string | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          ct1_contractor_number: string | null
          default_currency: string | null
          default_deposit_percent: number | null
          default_sales_tax_rate: number | null
          default_warranty_years: number | null
          id: string
          license_number: string | null
          logo_url: string | null
          phone: string | null
          pocketbot_full_access: boolean
          qb_access_token: string | null
          qb_access_token_expires_at: string | null
          qb_last_sync_at: string | null
          qb_realm_id: string | null
          qb_refresh_token: string | null
          qb_refresh_token_expires_at: string | null
          state: string | null
          stripe_connect_account_id: string | null
          stripe_customer_id: string | null
          subscription_tier: string | null
          tax_id: string | null
          trade: string | null
          updated_at: string
          user_id: string
          username: string | null
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          business_address?: string | null
          business_email?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          ct1_contractor_number?: string | null
          default_currency?: string | null
          default_deposit_percent?: number | null
          default_sales_tax_rate?: number | null
          default_warranty_years?: number | null
          id: string
          license_number?: string | null
          logo_url?: string | null
          phone?: string | null
          pocketbot_full_access?: boolean
          qb_access_token?: string | null
          qb_access_token_expires_at?: string | null
          qb_last_sync_at?: string | null
          qb_realm_id?: string | null
          qb_refresh_token?: string | null
          qb_refresh_token_expires_at?: string | null
          state?: string | null
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          tax_id?: string | null
          trade?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          business_address?: string | null
          business_email?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          ct1_contractor_number?: string | null
          default_currency?: string | null
          default_deposit_percent?: number | null
          default_sales_tax_rate?: number | null
          default_warranty_years?: number | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          phone?: string | null
          pocketbot_full_access?: boolean
          qb_access_token?: string | null
          qb_access_token_expires_at?: string | null
          qb_last_sync_at?: string | null
          qb_realm_id?: string | null
          qb_refresh_token?: string | null
          qb_refresh_token_expires_at?: string | null
          state?: string | null
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          tax_id?: string | null
          trade?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      quickbooks_connections: {
        Row: {
          access_token: string
          access_token_encrypted: string | null
          created_at: string
          expires_at: string
          id: string
          realm_id: string
          refresh_token: string
          refresh_token_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          access_token_encrypted?: string | null
          created_at?: string
          expires_at: string
          id?: string
          realm_id: string
          refresh_token: string
          refresh_token_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          access_token_encrypted?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          realm_id?: string
          refresh_token?: string
          refresh_token_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          customer_name: string
          estimate_id: string
          id: string
          ip_address: string | null
          signature_data: string
          signed_at: string
        }
        Insert: {
          customer_name: string
          estimate_id: string
          id?: string
          ip_address?: string | null
          signature_data: string
          signed_at?: string
        }
        Update: {
          customer_name?: string
          estimate_id?: string
          id?: string
          ip_address?: string | null
          signature_data?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_history: {
        Row: {
          changed_at: string
          changed_by_user_id: string
          from_stage: Database["public"]["Enums"]["opportunity_stage"] | null
          id: string
          note: string | null
          opportunity_id: string
          reason: string | null
          to_stage: Database["public"]["Enums"]["opportunity_stage"]
        }
        Insert: {
          changed_at?: string
          changed_by_user_id: string
          from_stage?: Database["public"]["Enums"]["opportunity_stage"] | null
          id?: string
          note?: string | null
          opportunity_id: string
          reason?: string | null
          to_stage: Database["public"]["Enums"]["opportunity_stage"]
        }
        Update: {
          changed_at?: string
          changed_by_user_id?: string
          from_stage?: Database["public"]["Enums"]["opportunity_stage"] | null
          id?: string
          note?: string | null
          opportunity_id?: string
          reason?: string | null
          to_stage?: Database["public"]["Enums"]["opportunity_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_accounts: {
        Row: {
          charges_enabled: boolean | null
          contractor_id: string
          created_at: string
          id: string
          onboarding_complete: boolean | null
          payouts_enabled: boolean | null
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          charges_enabled?: boolean | null
          contractor_id: string
          created_at?: string
          id?: string
          onboarding_complete?: boolean | null
          payouts_enabled?: boolean | null
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          charges_enabled?: boolean | null
          contractor_id?: string
          created_at?: string
          id?: string
          onboarding_complete?: boolean | null
          payouts_enabled?: boolean | null
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_accounts_contractor_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_payment_sessions: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          status: string | null
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          status?: string | null
          stripe_session_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          clover_payment_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          started_at: string
          status: string
          tier_id: string
          trial_end_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle: string
          clover_payment_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          tier_id: string
          trial_end_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          clover_payment_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          tier_id?: string
          trial_end_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          business_name: string | null
          created_at: string
          description: string
          email: string
          full_name: string
          id: string
          phone_number: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          reason: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_category: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          business_name?: string | null
          created_at?: string
          description: string
          email: string
          full_name: string
          id?: string
          phone_number: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          reason: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_category?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          business_name?: string | null
          created_at?: string
          description?: string
          email?: string
          full_name?: string
          id?: string
          phone_number?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          reason?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_photos: {
        Row: {
          caption: string | null
          created_at: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          photo_url: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          photo_url: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          photo_url?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_crew_member_id: string | null
          created_at: string
          description: string
          id: string
          is_blocking: boolean | null
          job_id: string
          notes: string | null
          order_index: number | null
          parent_task_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_crew_member_id?: string | null
          created_at?: string
          description: string
          id?: string
          is_blocking?: boolean | null
          job_id: string
          notes?: string | null
          order_index?: number | null
          parent_task_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_crew_member_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_blocking?: boolean | null
          job_id?: string
          notes?: string | null
          order_index?: number | null
          parent_task_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_crew_member_id_fkey"
            columns: ["assigned_crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          crew_member_id: string
          hours_worked: number | null
          id: string
          job_id: string
          notes: string | null
          task_id: string | null
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string
          crew_member_id: string
          hours_worked?: number | null
          id?: string
          job_id: string
          notes?: string | null
          task_id?: string | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          crew_member_id?: string
          hours_worked?: number | null
          id?: string
          job_id?: string
          notes?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_category_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "training_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certificates: {
        Row: {
          certificate_url: string | null
          course_id: string
          id: string
          issued_at: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          id?: string
          issued_at?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          id?: string
          issued_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress_percentage: number
          started_at: string | null
          time_spent_minutes: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number
          started_at?: string | null
          time_spent_minutes?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number
          started_at?: string | null
          time_spent_minutes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_notes: {
        Row: {
          content: string
          created_at: string
          enrollment_id: string | null
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          is_completed: boolean
          lesson_id: string
          time_spent_minutes: number
          updated_at: string
          user_id: string
          video_progress_seconds: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          time_spent_minutes?: number
          updated_at?: string
          user_id: string
          video_progress_seconds?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          time_spent_minutes?: number
          updated_at?: string
          user_id?: string
          video_progress_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_answers: {
        Row: {
          answered_at: string
          enrollment_id: string
          id: string
          is_correct: boolean
          lesson_id: string
          question_id: string
          user_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          enrollment_id: string
          id?: string
          is_correct: boolean
          lesson_id: string
          question_id: string
          user_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string
          enrollment_id?: string
          id?: string
          is_correct?: boolean
          lesson_id?: string
          question_id?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_answers_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_answers_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_stats: {
        Args: never
        Returns: {
          total_courses: number
          total_customers: number
          total_jobs: number
          total_leads: number
          total_roles: number
          total_services: number
          total_users: number
        }[]
      }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      drop_quickbooks_plaintext_columns: { Args: never; Returns: undefined }
      generate_contractor_number: { Args: never; Returns: string }
      generate_estimate_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_job_number: { Args: never; Returns: string }
      get_quickbooks_tokens: {
        Args: { p_encryption_key: string; p_user_id: string }
        Returns: {
          access_token: string
          expires_at: string
          realm_id: string
          refresh_token: string
          user_id: string
        }[]
      }
      get_user_tier: { Args: { user_id: string }; Returns: string }
      has_full_access: { Args: { user_id: string }; Returns: boolean }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      store_calendar_tokens: {
        Args: {
          p_access_token: string
          p_email: string
          p_encryption_key: string
          p_expires_at: string
          p_provider: string
          p_refresh_token: string
          p_user_id: string
        }
        Returns: undefined
      }
      store_email_tokens: {
        Args: {
          p_access_token: string
          p_email: string
          p_encryption_key: string
          p_expires_at: string
          p_provider: string
          p_refresh_token: string
          p_user_id: string
        }
        Returns: undefined
      }
      store_quickbooks_tokens: {
        Args: {
          p_access_token: string
          p_encryption_key: string
          p_expires_at: string
          p_realm_id: string
          p_refresh_token: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      change_order_status: "requested" | "approved" | "rejected"
      crew_role: "office" | "dispatcher" | "field_crew_member" | "customer"
      invoice_status: "draft" | "sent" | "partial" | "paid" | "overdue"
      job_status:
        | "scheduled"
        | "in_progress"
        | "on_hold"
        | "inspection_pending"
        | "completed"
        | "closed"
      lead_source: "referral" | "website" | "ad" | "repeat_customer" | "other"
      opportunity_stage:
        | "qualification"
        | "lwe_discovery"
        | "demo"
        | "proposal"
        | "negotiation"
        | "close"
        | "psfu"
      task_priority: "low" | "medium" | "high"
      task_status: "not_started" | "in_progress" | "completed" | "blocked"
      ticket_priority: "low" | "medium" | "high"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      change_order_status: ["requested", "approved", "rejected"],
      crew_role: ["office", "dispatcher", "field_crew_member", "customer"],
      invoice_status: ["draft", "sent", "partial", "paid", "overdue"],
      job_status: [
        "scheduled",
        "in_progress",
        "on_hold",
        "inspection_pending",
        "completed",
        "closed",
      ],
      lead_source: ["referral", "website", "ad", "repeat_customer", "other"],
      opportunity_stage: [
        "qualification",
        "lwe_discovery",
        "demo",
        "proposal",
        "negotiation",
        "close",
        "psfu",
      ],
      task_priority: ["low", "medium", "high"],
      task_status: ["not_started", "in_progress", "completed", "blocked"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
