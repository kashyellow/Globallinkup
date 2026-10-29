export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      connections: {
        Row: {
          created_at: string;
          id: string;
          intro: string | null;
          recipient_id: string;
          requester_id: string;
          status: Database["public"]["Enums"]["connection_status"];
          topic: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          intro?: string | null;
          recipient_id: string;
          requester_id: string;
          status?: Database["public"]["Enums"]["connection_status"];
          topic?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          intro?: string | null;
          recipient_id?: string;
          requester_id?: string;
          status?: Database["public"]["Enums"]["connection_status"];
          topic?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connections_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "connections_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "connections_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "connections_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_details: {
        Row: {
          email: string | null;
          instagram: string | null;
          other: NonNullable<Json>;
          profile_id: string;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          email?: string | null;
          instagram?: string | null;
          other?: NonNullable<Json>;
          profile_id: string;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          email?: string | null;
          instagram?: string | null;
          other?: NonNullable<Json>;
          profile_id?: string;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_details_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_details_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      interest_catalog: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          label: string;
          normalized: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["interest_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label: string;
          normalized: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["interest_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string;
          normalized?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["interest_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      marketplace_product_images: {
        Row: {
          id: string;
          product_id: string;
          sort: number;
          storage_path: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sort?: number;
          storage_path: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sort?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_products";
            referencedColumns: ["id"];
          },
        ];
      };
      marketplace_products: {
        Row: {
          catalog_status: Database["public"]["Enums"]["marketplace_status"] | null;
          contact_information: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          is_published: boolean;
          name: string;
          origin_label: string | null;
          price_cents: number;
          published_at: string | null;
          updated_at: string;
        };
        Insert: {
          catalog_status?: never;
          contact_information?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          name: string;
          origin_label?: string | null;
          price_cents?: number;
          published_at?: string | null;
          updated_at?: string;
        };
        Update: {
          catalog_status?: never;
          contact_information?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          name?: string;
          origin_label?: string | null;
          price_cents?: number;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_products_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketplace_products_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          parent_id: string | null;
          post_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          parent_id?: string | null;
          post_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          parent_id?: string | null;
          post_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "post_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts_feed";
            referencedColumns: ["id"];
          },
        ];
      };
      post_images: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          sort: number;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          sort?: number;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          sort?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_images_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts_feed";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts_feed";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string;
          caption: string | null;
          created_at: string;
          id: string;
          archived_at: string | null;
          image_path: string | null;
          moderation_status: Database["public"]["Enums"]["moderation_status"];
          previous_state: Database["public"]["Enums"]["post_state"] | null;
          purge_after: string | null;
          removed_at: string | null;
          removed_by: string | null;
          removed_reason: string | null;
          state: Database["public"]["Enums"]["post_state"];
          updated_at: string;
        };
        Insert: {
          author_id: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          archived_at?: string | null;
          image_path?: string | null;
          moderation_status?: Database["public"]["Enums"]["moderation_status"];
          previous_state?: Database["public"]["Enums"]["post_state"] | null;
          purge_after?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
          removed_reason?: string | null;
          state?: Database["public"]["Enums"]["post_state"];
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          archived_at?: string | null;
          image_path?: string | null;
          moderation_status?: Database["public"]["Enums"]["moderation_status"];
          previous_state?: Database["public"]["Enums"]["post_state"] | null;
          purge_after?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
          removed_reason?: string | null;
          state?: Database["public"]["Enums"]["post_state"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_removed_by_fkey";
            columns: ["removed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_removed_by_fkey";
            columns: ["removed_by"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_moderation_events: {
        Row: {
          admin_id: string | null;
          created_at: string;
          decision: Database["public"]["Enums"]["approval_status"];
          id: string;
          profile_id: string;
          reason: string | null;
        };
        Insert: {
          admin_id?: string | null;
          created_at?: string;
          decision: Database["public"]["Enums"]["approval_status"];
          id?: string;
          profile_id: string;
          reason?: string | null;
        };
        Update: {
          admin_id?: string | null;
          created_at?: string;
          decision?: Database["public"]["Enums"]["approval_status"];
          id?: string;
          profile_id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_moderation_events_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_moderation_events_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_moderation_events_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_moderation_events_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_private: {
        Row: {
          date_of_birth: string | null;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          date_of_birth?: string | null;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          date_of_birth?: string | null;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_private_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_private_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          admin_role_id: string | null;
          approval_status: Database["public"]["Enums"]["approval_status"];
          avatar_url: string | null;
          badge: string | null;
          bio_en: string | null;
          bio_es: string | null;
          city: string | null;
          country_code: string | null;
          created_at: string;
          display_name: string;
          headline: string | null;
          id: string;
          interests: string[];
          languages: NonNullable<Json>;
          neighborhood: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          search_text: string;
          submitted_at: string | null;
          updated_at: string;
        };
        Insert: {
          admin_role_id?: string | null;
          approval_status?: Database["public"]["Enums"]["approval_status"];
          avatar_url?: string | null;
          badge?: string | null;
          bio_en?: string | null;
          bio_es?: string | null;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          display_name: string;
          headline?: string | null;
          id: string;
          interests?: string[];
          languages?: NonNullable<Json>;
          neighborhood?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          search_text?: string;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          admin_role_id?: string | null;
          approval_status?: Database["public"]["Enums"]["approval_status"];
          avatar_url?: string | null;
          badge?: string | null;
          bio_en?: string | null;
          bio_es?: string | null;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          display_name?: string;
          headline?: string | null;
          id?: string;
          interests?: string[];
          languages?: NonNullable<Json>;
          neighborhood?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          search_text?: string;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["report_status"];
          target_post_id: string | null;
          target_type: Database["public"]["Enums"]["report_target_type"];
          target_user_id: string | null;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: string;
          reporter_id: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          target_post_id?: string | null;
          target_type: Database["public"]["Enums"]["report_target_type"];
          target_user_id?: string | null;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          target_post_id?: string | null;
          target_type?: Database["public"]["Enums"]["report_target_type"];
          target_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_post_id_fkey";
            columns: ["target_post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_post_id_fkey";
            columns: ["target_post_id"];
            isOneToOne: false;
            referencedRelation: "posts_feed";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_events: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: string | null;
          id: string;
          metadata: Json;
          occurred_at: string;
          reason: string | null;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: string | null;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          reason?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          reason?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [];
      };
      admin_invites: {
        Row: {
          accepted_at: string | null;
          admin_role_id: string | null;
          created_at: string;
          email: string;
          id: string;
          invited_by: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          admin_role_id?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          invited_by?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          admin_role_id?: string;
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string | null;
        };
        Relationships: [];
      };
      admin_roles: {
        Row: {
          capabilities: string[];
          created_at: string;
          description: string | null;
          id: string;
          is_system: boolean;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          capabilities?: string[];
          created_at?: string;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          capabilities?: string[];
          created_at?: string;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          read_at: string | null;
          reason: string | null;
          recipient_id: string;
          target_id: string | null;
          target_type: string | null;
          type: Database["public"]["Enums"]["notification_type"];
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          read_at?: string | null;
          reason?: string | null;
          recipient_id: string;
          target_id?: string | null;
          target_type?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          read_at?: string | null;
          reason?: string | null;
          recipient_id?: string;
          target_id?: string | null;
          target_type?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
        };
        Relationships: [];
      };
      post_appeals: {
        Row: {
          admin_id: string | null;
          admin_note: string | null;
          author_id: string;
          created_at: string;
          id: string;
          message: string;
          post_id: string;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["appeal_status"];
        };
        Insert: {
          admin_id?: string | null;
          admin_note?: string | null;
          author_id: string;
          created_at?: string;
          id?: string;
          message: string;
          post_id: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["appeal_status"];
        };
        Update: {
          admin_id?: string | null;
          admin_note?: string | null;
          author_id?: string;
          created_at?: string;
          id?: string;
          message?: string;
          post_id?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["appeal_status"];
        };
        Relationships: [];
      };
    };
    Views: {
      posts_feed: {
        Row: {
          author_avatar_url: string | null;
          author_city: string | null;
          author_country_code: string | null;
          author_id: string | null;
          author_name: string | null;
          caption: string | null;
          comment_count: number | null;
          created_at: string | null;
          id: string | null;
          image_path: string | null;
          like_count: number | null;
          moderation_status: Database["public"]["Enums"]["moderation_status"] | null;
          archived_at: string | null;
          previous_state: Database["public"]["Enums"]["post_state"] | null;
          purge_after: string | null;
          removed_reason: string | null;
          state: Database["public"]["Enums"]["post_state"] | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles_public: {
        Row: {
          age: number | null;
          approval_status: Database["public"]["Enums"]["approval_status"] | null;
          avatar_url: string | null;
          badge: string | null;
          bio_en: string | null;
          bio_es: string | null;
          city: string | null;
          country_code: string | null;
          created_at: string | null;
          display_name: string | null;
          headline: string | null;
          id: string | null;
          interests: string[] | null;
          languages: Json | null;
          neighborhood: string | null;
          role: Database["public"]["Enums"]["app_role"] | null;
          search_text: string | null;
          submitted_at: string | null;
        };
        Insert: {
          age?: never;
          approval_status?: Database["public"]["Enums"]["approval_status"] | null;
          avatar_url?: string | null;
          badge?: string | null;
          bio_en?: string | null;
          bio_es?: string | null;
          city?: string | null;
          country_code?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          headline?: string | null;
          id?: string | null;
          interests?: string[] | null;
          languages?: Json | null;
          neighborhood?: string | null;
          role?: Database["public"]["Enums"]["app_role"] | null;
          search_text?: string | null;
          submitted_at?: string | null;
        };
        Update: {
          age?: never;
          approval_status?: Database["public"]["Enums"]["approval_status"] | null;
          avatar_url?: string | null;
          badge?: string | null;
          bio_en?: string | null;
          bio_es?: string | null;
          city?: string | null;
          country_code?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          headline?: string | null;
          id?: string | null;
          interests?: string[] | null;
          languages?: Json | null;
          neighborhood?: string | null;
          role?: Database["public"]["Enums"]["app_role"] | null;
          search_text?: string | null;
          submitted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      are_connected: { Args: { a: string; b: string }; Returns: boolean };
      create_post: { Args: { p_caption: string; p_image_paths: string[] }; Returns: string };
      discover_countries: {
        Args: Record<PropertyKey, never>;
        Returns: { country_code: string; member_count: number }[];
      };
      purge_audit_events: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      record_audit: {
        Args: {
          p_action: string;
          p_metadata?: Json;
          p_reason?: string;
          p_target_id?: string;
          p_target_type?: string;
        };
        Returns: string;
      };
      my_capabilities: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      purge_expired_content: {
        Args: { p_dry_run?: boolean };
        Returns: Json;
      };
      discover_personas: {
        Args: {
          p_countries?: string[];
          p_limit?: number;
          p_offset?: number;
          p_query?: string;
          p_seed?: string;
        };
        Returns: {
          age: number;
          approval_status: Database["public"]["Enums"]["approval_status"];
          avatar_url: string;
          badge: string;
          city: string;
          country_code: string;
          display_name: string;
          id: string;
          interests: string[];
          languages: Json;
          total_count: number;
        }[];
      };
      interest_search_text: { Args: { p_interests: string[] }; Returns: string };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_approved: { Args: Record<PropertyKey, never>; Returns: boolean };
      language_search_text: { Args: { p_languages: Json }; Returns: string };
      normalize_interest_label: { Args: { value: string }; Returns: string };
      profile_age: { Args: { p_profile_id: string }; Returns: number };
      profile_search_text: {
        Args: {
          p_city: string;
          p_country_code: string;
          p_display_name: string;
          p_headline: string;
          p_interests: string[];
          p_languages: Json;
        };
        Returns: string;
      };
      register_custom_interests: { Args: { p_labels: string[] }; Returns: Json };
      review_interest: {
        Args: { p_decision: Database["public"]["Enums"]["interest_status"]; p_interest_id: string };
        Returns: boolean;
      };
      review_persona: {
        Args: {
          p_decision: Database["public"]["Enums"]["approval_status"];
          p_profile_id: string;
          p_reason?: string;
        };
        Returns: boolean;
      };
      save_persona: {
        Args: {
          p_avatar_url?: string;
          p_bio?: string;
          p_bio_locale?: string;
          p_city: string;
          p_country_code: string;
          p_date_of_birth?: string;
          p_display_name: string;
          p_facebook?: string;
          p_headline?: string;
          p_instagram?: string;
          p_interests?: string[];
          p_languages?: Json;
          p_telegram?: string;
          p_tiktok?: string;
          p_whatsapp?: string;
          p_x?: string;
        };
        Returns: Database["public"]["Enums"]["approval_status"];
      };
    };
    Enums: {
      app_role: "user" | "admin";
      approval_status: "pending" | "approved" | "rejected" | "suspended";
      connection_status: "requested" | "accepted" | "declined";
      interest_status: "pending" | "approved" | "rejected";
      marketplace_status: "draft" | "live" | "unpublished" | "trashed";
      appeal_status: "open" | "accepted" | "declined";
      moderation_status: "visible" | "removed";
      notification_type:
        | "post.removed"
        | "post.restored"
        | "appeal.declined"
        | "persona.approved"
        | "persona.rejected"
        | "persona.suspended"
        | "interest.approved"
        | "interest.rejected";
      post_state: "visible" | "archived" | "removed";
      report_status: "open" | "resolved" | "dismissed";
      report_target_type: "user" | "post";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["user", "admin"],
      approval_status: ["pending", "approved", "rejected", "suspended"],
      connection_status: ["requested", "accepted", "declined"],
      interest_status: ["pending", "approved", "rejected"],
      marketplace_status: ["draft", "live", "unpublished", "trashed"],
      moderation_status: ["visible", "removed"],
      report_status: ["open", "resolved", "dismissed"],
      report_target_type: ["user", "post"],
    },
  },
} as const;
