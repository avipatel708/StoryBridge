export const APP_NAME = 'StoryBridge';

export const APP_DESCRIPTION =
  'A modern social platform where stories connect people. Share moments, discover perspectives, and build meaningful connections through the art of storytelling.';

export const TAGLINE = 'Connecting Lives Through Stories';

export const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  muted: '#94A3B8',
} as const;

export const INTEREST_CATEGORIES = [
  'Photography',
  'Travel',
  'Music',
  'Art',
  'Technology',
  'Sports',
  'Food',
  'Fashion',
  'Gaming',
  'Reading',
  'Writing',
  'Nature',
  'Fitness',
  'Movies',
  'Science',
  'Design',
  'Business',
  'Education',
  'Health',
  'Cooking',
  'Architecture',
  'History',
  'Psychology',
  'Astronomy',
  'Dance',
  'Pets',
  'DIY & Crafts',
  'Sustainability',
] as const;

export const MAX_FILE_SIZES = {
  avatar: 5 * 1024 * 1024,
  cover: 10 * 1024 * 1024,
  postImage: 10 * 1024 * 1024,
  storyMedia: 15 * 1024 * 1024,
} as const;

export const PAGINATION = {
  feedPageSize: 10,
  commentsPageSize: 20,
  messagesPageSize: 30,
  notificationsPageSize: 20,
  searchPageSize: 20,
  profilePostsPageSize: 12,
  explorePageSize: 24,
} as const;

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  covers: 'covers',
  posts: 'posts',
  stories: 'stories',
} as const;

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const BIO_MAX_LENGTH = 160;
export const POST_MAX_LENGTH = 2200;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_MAX_LENGTH = 50;

export const MIN_INTERESTS = 3;
