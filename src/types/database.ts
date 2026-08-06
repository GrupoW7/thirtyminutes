/**
 * Hand-written types mirroring the Supabase schema in
 * `supabase/migrations`. Regenerate with the Supabase CLI once the project
 * is live: `supabase gen types typescript --linked > src/types/database.ts`.
 */

export type MediaType = 'image' | 'video';

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export type ActivityProfile = {
  user_id: string;
  interests: string[];
  goals: string[];
  available_minutes: number;
  energy_level: 'low' | 'medium' | 'high';
  has_kids: boolean;
  updated_at: string;
}

export type Post = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: MediaType;
  caption: string | null;
  created_at: string;
}

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export type Like = {
  post_id: string;
  user_id: string;
  created_at: string;
}

export type ActivityCatalogItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  tags: string[];
  base_points: number;
}

export type UserActivity = {
  id: string;
  user_id: string;
  catalog_id: string | null;
  custom_title: string | null;
  activity_date: string; // YYYY-MM-DD
  completed: boolean;
  points: number;
  created_at: string;
}

export type DailyUsage = {
  user_id: string;
  usage_date: string; // YYYY-MM-DD
  seconds_used: number;
  updated_at: string;
}

/** A table entry shaped the way supabase-js's generic typing expects. */
type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

/** Minimal schema the supabase-js client needs for generic typing. */
export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile, Partial<Profile> & { id: string; username: string }, Partial<Profile>>;
      activity_profiles: TableDef<
        ActivityProfile,
        Partial<ActivityProfile> & { user_id: string },
        Partial<ActivityProfile>
      >;
      posts: TableDef<
        Post,
        Partial<Post> & { user_id: string; media_url: string; media_type: MediaType },
        Partial<Post>
      >;
      comments: TableDef<
        Comment,
        Partial<Comment> & { post_id: string; user_id: string; body: string },
        Partial<Comment>
      >;
      likes: TableDef<Like, { post_id: string; user_id: string }, Partial<Like>>;
      activity_catalog: TableDef<
        ActivityCatalogItem,
        Partial<ActivityCatalogItem>,
        Partial<ActivityCatalogItem>
      >;
      user_activities: TableDef<
        UserActivity,
        Partial<UserActivity> & { user_id: string },
        Partial<UserActivity>
      >;
      daily_usage: TableDef<
        DailyUsage,
        Partial<DailyUsage> & { user_id: string; usage_date: string },
        Partial<DailyUsage>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
