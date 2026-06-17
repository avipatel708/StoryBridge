import { formatDistanceToNowStrict } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { EMAIL_REGEX, USERNAME_REGEX } from '@/lib/constants';

export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input.trim());
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key.trim());
      }
    }
  }

  return classes.join(' ');
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 60_000) return 'just now';

  const formatted = formatDistanceToNowStrict(d, { addSuffix: false });

  return formatted
    .replace(' seconds', 's')
    .replace(' second', 's')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' weeks', 'w')
    .replace(' week', 'w')
    .replace(' months', 'mo')
    .replace(' month', 'mo')
    .replace(' years', 'y')
    .replace(' year', 'y')
    + ' ago';
}

export function formatNumber(num: number): string {
  if (num < 0) return `-${formatNumber(Math.abs(num))}`;
  if (num < 1_000) return num.toString();
  if (num < 1_000_000) {
    const value = num / 1_000;
    return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
  }
  if (num < 1_000_000_000) {
    const value = num / 1_000_000;
    return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
  }
  const value = num / 1_000_000_000;
  return value % 1 === 0 ? `${value}B` : `${value.toFixed(1)}B`;
}

export function getInitials(name: string): string {
  if (!name.trim()) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email.trim()) return { valid: false, message: 'Email is required' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, message: 'Invalid email format' };
  return { valid: true };
}

export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username.trim()) return { valid: false, message: 'Username is required' };
  if (username.length < 3) return { valid: false, message: 'Username must be at least 3 characters' };
  if (username.length > 20) return { valid: false, message: 'Username must be at most 20 characters' };
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export function getCoverUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const { data } = supabase.storage.from('covers').getPublicUrl(path);
  return data.publicUrl;
}

export function getPostImageUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const { data } = supabase.storage.from('posts').getPublicUrl(path);
  return data.publicUrl;
}

export function generateUniqueFileName(file: File): string {
  const extension = file.name.split('.').pop() ?? 'bin';
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}.${extension}`;
}

export function isVideoFile(file: File | Blob): boolean {
  if (file.type?.startsWith('video/')) return true;
  
  if (file instanceof File) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'quicktime'];
    return videoExtensions.includes(ext);
  }
  
  return false;
}

export function getFileMimeType(file: File | Blob): string {
  if (file.type) return file.type;
  
  if (file instanceof File) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'mp4': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'ogg': return 'video/ogg';
      case 'mov': return 'video/quicktime';
      case 'avi': return 'video/x-msvideo';
      case 'mkv': return 'video/x-matroska';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
    }
  }
  
  return 'application/octet-stream';
}

export function validatePassword(password: string): { valid: boolean; message?: string; strength: number } {
  if (!password) return { valid: false, message: 'Password is required', strength: 0 };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters', strength: 1 };

  let strength = 1;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength < 3) return { valid: true, message: 'Weak password', strength };
  if (strength < 4) return { valid: true, message: 'Good password', strength };
  return { valid: true, message: 'Strong password', strength };
}

export function getCapsuleCoverUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const { data } = supabase.storage.from('capsules').getPublicUrl(path);
  return data.publicUrl;
}

export function getCommunityCoverUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const { data } = supabase.storage.from('communities').getPublicUrl(path);
  return data.publicUrl;
}
