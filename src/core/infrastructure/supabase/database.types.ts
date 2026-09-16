/**
 * Tipos del esquema de Dádiva.
 *
 * Escrito a mano imitando la salida de `supabase gen types typescript`.
 * Cuando el esquema cambie, regenerar con:
 *
 *   supabase gen types typescript --local > src/core/infrastructure/supabase/database.types.ts
 *   # o contra el proyecto remoto:
 *   supabase gen types typescript --project-id <project-ref> > src/core/infrastructure/supabase/database.types.ts
 *
 * Notas de dominio:
 * - `assignments` solo devuelve la fila propia: RLS filtra el resto. El tipo no
 *   puede expresar eso, así que una consulta a `assignments` retorna 0 o 1 fila.
 * - `anonymous_messages` NO debe consultarse como receptor: usar la función
 *   `get_my_anonymous_messages`, que nunca proyecta `from_member_id`.
 * - `assignments`, `promise_cards` y `member_promises` son de solo lectura para
 *   el cliente; sus tipos `Insert`/`Update` existen por fidelidad al generador,
 *   pero los GRANT y las políticas rechazan la escritura.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      anonymous_messages: {
        Row: {
          body: string
          created_at: string
          from_member_id: string
          group_id: string
          id: string
          to_member_id: string
        }
        Insert: {
          body: string
          created_at?: string
          from_member_id: string
          group_id: string
          id?: string
          to_member_id: string
        }
        Update: {
          body?: string
          created_at?: string
          from_member_id?: string
          group_id?: string
          id?: string
          to_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_messages_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_messages_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string
          giver_member_id: string
          group_id: string
          id: string
          receiver_member_id: string
          revealed_at: string | null
        }
        Insert: {
          created_at?: string
          giver_member_id: string
          group_id: string
          id?: string
          receiver_member_id: string
          revealed_at?: string | null
        }
        Update: {
          created_at?: string
          giver_member_id?: string
          group_id?: string
          id?: string
          receiver_member_id?: string
          revealed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_giver_member_id_fkey"
            columns: ["giver_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_receiver_member_id_fkey"
            columns: ["receiver_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      exclusions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          member_a_id: string
          member_b_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          member_a_id: string
          member_b_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          member_a_id?: string
          member_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exclusions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusions_member_a_id_fkey"
            columns: ["member_a_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusions_member_b_id_fkey"
            columns: ["member_b_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          avatar_emoji: string
          display_name: string
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          avatar_emoji?: string
          display_name: string
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          avatar_emoji?: string
          display_name?: string
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          budget_amount: number | null
          budget_currency: string
          created_at: string
          description: string | null
          exchange_date: string | null
          id: string
          invite_code: string
          name: string
          owner_id: string
          status: Database["public"]["Enums"]["group_status"]
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          budget_currency?: string
          created_at?: string
          description?: string | null
          exchange_date?: string | null
          id?: string
          invite_code?: string
          name: string
          owner_id: string
          status?: Database["public"]["Enums"]["group_status"]
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          budget_currency?: string
          created_at?: string
          description?: string | null
          exchange_date?: string | null
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["group_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_promises: {
        Row: {
          drawn_at: string
          group_id: string
          id: string
          member_id: string
          promise_card_id: string
        }
        Insert: {
          drawn_at?: string
          group_id: string
          id?: string
          member_id: string
          promise_card_id: string
        }
        Update: {
          drawn_at?: string
          group_id?: string
          id?: string
          member_id?: string
          promise_card_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_promises_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_promises_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_promises_promise_card_id_fkey"
            columns: ["promise_card_id"]
            isOneToOne: false
            referencedRelation: "promise_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_emoji: string
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_emoji?: string
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_emoji?: string
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promise_cards: {
        Row: {
          created_at: string
          id: string
          reference: string
          text: string
          theme_key: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          reference: string
          text: string
          theme_key?: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          reference?: string
          text?: string
          theme_key?: string
          version?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          member_id: string
          notes: string | null
          position: number
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          position?: number
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          position?: number
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_member_id: {
        Args: { p_group_id: string }
        Returns: string
      }
      draw_group: {
        Args: { p_group_id: string }
        Returns: number
      }
      draw_promise: {
        Args: { p_group_id: string }
        Returns: {
          created_at: string
          id: string
          reference: string
          text: string
          theme_key: string
          version: string
        }
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_anonymous_messages: {
        Args: { p_group_id: string }
        Returns: {
          body: string
          created_at: string
          id: string
        }[]
      }
      group_is_draft: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      is_group_owner: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      is_my_member: {
        Args: { p_member_id: string }
        Returns: boolean
      }
      join_group_by_code: {
        Args: { p_display_name: string; p_invite_code: string }
        Returns: {
          avatar_emoji: string
          display_name: string
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
      }
      member_group_id: {
        Args: { p_member_id: string }
        Returns: string
      }
      my_receiver_member_id: {
        Args: { p_group_id: string }
        Returns: string
      }
      reveal_assignment: {
        Args: { p_group_id: string }
        Returns: string
      }
    }
    Enums: {
      group_status: "draft" | "drawn" | "closed"
      member_role: "owner" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      group_status: ["draft", "drawn", "closed"],
      member_role: ["owner", "member"],
    },
  },
} as const
