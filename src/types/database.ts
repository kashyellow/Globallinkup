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
          badge: string | null;
          contact_information: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          description: string | null;
          id: string;
          is_published: boolean;
          name: string;
          origin_label: string | null;
          price_cents: number;
          sku: string | null;
          specs: NonNullable<Json>;
          summary: string | null;
          updated_at: string;
        };
        Insert: {
          badge?: string | null;
          contact_information?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          name: string;
          origin_label?: string | null;
          price_cents?: number;
          sku?: string | null;
          specs?: NonNullable<Json>;
          summary?: string | null;
          updated_at?: string;
        };
        Update: {
          badge?: string | null;
          contact_information?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          name?: string;
          origin_label?: string | null;
          price_cents?: number;
          sku?: string | null;
          specs?: NonNullable<Json>;
          summary?: string | null;
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
          image_path: string | null;
          moderation_status: Database["public"]["Enums"]["moderation_status"];
          removed_at: string | null;
          removed_by: string | null;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          moderation_status?: Database["public"]["Enums"]["moderation_status"];
          removed_at?: string | null;
          removed_by?: string | null;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          moderation_status?: Database["public"]["Enums"]["moderation_status"];
          removed_at?: string | null;
          removed_by?: string | null;
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
          submitted_at: string | null;
          updated_at: string;
        };
        Insert: {
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
          submitted_at?: string | null;
          updated_at?: string;
        };
        Update: {
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
    };
    Views: {
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
        };
        Relationships: [];
      };
    };
    Functions: {
      are_connected: { Args: { a: string; b: string }; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_approved: { Args: Record<PropertyKey, never>; Returns: boolean };
      normalize_interest_label: { Args: { value: string }; Returns: string };
      profile_age: { Args: { p_profile_id: string }; Returns: number };
      register_custom_interests: { Args: { p_labels: string[] }; Returns: Json };
      review_interest: {
        Args: { p_decision: Database["public"]["Enums"]["interest_status"]; p_interest_id: string };
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
      moderation_status: "visible" | "removed";
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
      moderation_status: ["visible", "removed"],
      report_status: ["open", "resolved", "dismissed"],
      report_target_type: ["user", "post"],
    },
  },
} as const;
