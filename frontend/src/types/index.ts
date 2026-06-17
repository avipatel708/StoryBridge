export interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  interests: string[];
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  mood?: MoodType;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // author profile
  likes?: { user_id: string }[];
  comments?: { id: string }[];
  saved_posts?: { user_id: string }[];
  
  // Custom frontend fields added in hook queries
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile; // author profile
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
  post_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: Profile; // profile of person who triggered it
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type?: 'text' | 'image' | 'video' | 'voice' | 'story_share' | 'reel_share' | 'post_share';
  media_url?: string;
  shared_item_id?: string;
  reactions?: { user_id: string; emoji: string }[];
}

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  other_participant?: Profile; // the other person in chat
}

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  profiles?: Profile; // author profile
  media_type?: 'image' | 'video';
  video_url?: string;
  stickers?: any[];
  audio_track_id?: string | null;
  audio_start_time?: number;
  scheduled_at?: string | null;
}

export interface StoryCapsule {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_url: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  items_count?: number;
}

export interface StoryCapsuleItem {
  id: string;
  capsule_id: string;
  post_id: string;
  sort_order: number;
  created_at: string;
  posts?: Post;
}

export interface MemoryTimelineEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string;
  icon_type: 'star' | 'pen' | 'heart' | 'users' | 'trophy' | 'camera' | 'milestone' | 'custom';
  is_auto: boolean;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover_url: string;
  icon_url: string;
  category: string;
  creator_id: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  is_member?: boolean;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles?: Profile;
}

export interface CommunityPost {
  id: string;
  community_id: string;
  post_id: string;
  created_at: string;
  posts?: Post;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: 'top_creator' | 'story_writer' | 'community_builder' | 'photographer' | 'explorer' | 'early_adopter' | 'social_butterfly' | 'milestone_100' | 'milestone_1000';
  earned_at: string;
}

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  cover_url: string;
  sort_order: number;
  created_at: string;
  items?: StoryHighlightItem[];
  profiles?: Profile;
}

export interface StoryHighlightItem {
  id: string;
  highlight_id: string;
  story_id: string;
  sort_order: number;
  created_at: string;
  stories?: Story;
}

export type MoodType = 'happy' | 'inspired' | 'excited' | 'motivated' | 'sad';

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: 'Happy', color: '#FBBF24' },
  inspired: { emoji: '✨', label: 'Inspired', color: '#8B5CF6' },
  excited: { emoji: '🎉', label: 'Excited', color: '#EC4899' },
  motivated: { emoji: '🔥', label: 'Motivated', color: '#F97316' },
  sad: { emoji: '😢', label: 'Sad', color: '#6366F1' },
};

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  profiles?: Profile;
}

export interface StoryLike {
  id: string;
  story_id: string;
  user_id: string;
  created_at: string;
}

export interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles?: Profile;
}

export interface StoryMention {
  id: string;
  story_id: string;
  user_id: string;
  created_at: string;
  profiles?: Profile;
}

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  cover_url: string;
  caption: string;
  hashtags: string[];
  location: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  audio_track_id?: string | null;
  audio_start_time?: number;
  scheduled_at?: string | null;
}

export interface ReelLike {
  id: string;
  reel_id: string;
  user_id: string;
  created_at: string;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles?: Profile;
}

export interface ReelSave {
  id: string;
  reel_id: string;
  user_id: string;
  created_at: string;
}
