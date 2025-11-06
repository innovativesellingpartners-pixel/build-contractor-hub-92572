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
          id: string
          name: string
          notes: string | null
          phone: string | null
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
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
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
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
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
      estimates: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string | null
          estimate_number: string | null
          id: string
          line_items: Json | null
          opportunity_id: string | null
          status: string
          title: string
          total_amount: number
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          estimate_number?: string | null
          id?: string
          line_items?: Json | null
          opportunity_id?: string | null
          status?: string
          title: string
          total_amount?: number
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          estimate_number?: string | null
          id?: string
          line_items?: Json | null
          opportunity_id?: string | null
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
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
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
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
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
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
          city: string | null
          created_at: string
          custom_fields: Json | null
          customer_id: string | null
          description: string | null
          end_date: string | null
          id: string
          job_number: string | null
          job_status: Database["public"]["Enums"]["job_status"] | null
          name: string
          notes: string | null
          opportunity_id: string | null
          scheduled_end_date: string | null
          scheduled_start_date: string | null
          start_date: string | null
          state: string | null
          status: string
          sub_trade: string | null
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
          city?: string | null
          created_at?: string
          custom_fields?: Json | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          job_number?: string | null
          job_status?: Database["public"]["Enums"]["job_status"] | null
          name: string
          notes?: string | null
          opportunity_id?: string | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          sub_trade?: string | null
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
          city?: string | null
          created_at?: string
          custom_fields?: Json | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          job_number?: string | null
          job_status?: Database["public"]["Enums"]["job_status"] | null
          name?: string
          notes?: string | null
          opportunity_id?: string | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          sub_trade?: string | null
          total_cost?: number | null
          trade_type?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
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
      opportunities: {
        Row: {
          assigned_user_id: string | null
          budget_confirmed: boolean | null
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
        }
        Insert: {
          assigned_user_id?: string | null
          budget_confirmed?: boolean | null
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
        }
        Update: {
          assigned_user_id?: string | null
          budget_confirmed?: boolean | null
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
      profiles: {
        Row: {
          business_address: string | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          ct1_contractor_number: string | null
          id: string
          logo_url: string | null
          phone: string | null
          state: string | null
          subscription_tier: string | null
          tax_id: string | null
          trade: string | null
          updated_at: string
          user_id: string
          username: string | null
          zip_code: string | null
        }
        Insert: {
          business_address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          ct1_contractor_number?: string | null
          id: string
          logo_url?: string | null
          phone?: string | null
          state?: string | null
          subscription_tier?: string | null
          tax_id?: string | null
          trade?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          zip_code?: string | null
        }
        Update: {
          business_address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          ct1_contractor_number?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          state?: string | null
          subscription_tier?: string | null
          tax_id?: string | null
          trade?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      quickbooks_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          realm_id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          realm_id: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          realm_id?: string
          refresh_token?: string
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
      generate_estimate_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_job_number: { Args: never; Returns: string }
      get_user_tier: { Args: { user_id: string }; Returns: string }
      has_full_access: { Args: { user_id: string }; Returns: boolean }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
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
      task_status: ["not_started", "in_progress", "completed", "blocked"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
