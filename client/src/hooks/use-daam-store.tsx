import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { type LocalPost, type LocalReply, type PostType, type UserProfile, type Attachment, type UserAccount, type UserRole, type Region } from "@shared/schema";

// Types
export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark';
export type User = {
  email: string;
  isAdmin: boolean;
  isModerator: boolean;
  profile?: UserProfile;
  account?: UserAccount;
};

// ========== RBAC Types ==========
export type DaamRole = "admin" | "moderator" | "student";

export type DaamPermission =
  | "mod.posts.delete"
  | "mod.posts.hide"
  | "mod.comments.delete"
  | "mod.users.mute"
  | "mod.users.ban"
  | "admin.moderators.manage"
  | "admin.settings.manage"
  | "ai.view"
  | "ai.settings.edit"
  | "ai.sources.create"
  | "ai.sources.review"
  | "ai.train.run"
  | "ai.train.publish"
  | "ai.analytics.view"
  | "ai.audit.view";

export const ALL_PERMISSIONS: DaamPermission[] = [
  "mod.posts.delete",
  "mod.posts.hide",
  "mod.comments.delete",
  "mod.users.mute",
  "mod.users.ban",
  "admin.moderators.manage",
  "admin.settings.manage",
  "ai.view",
  "ai.settings.edit",
  "ai.sources.create",
  "ai.sources.review",
  "ai.train.run",
  "ai.train.publish",
  "ai.analytics.view",
  "ai.audit.view"
];

export type ModeratorAccount = {
  id: string;
  email: string;
  displayName: string;
  role: "moderator";
  permissions: DaamPermission[];
  isActive: boolean;
  createdAt: number;
  createdBy: string;
};

export type LocalAuthUser = {
  id: string;
  email: string;
  passwordHash: string; // TODO: Use proper hashing (Web Crypto SHA-256)
  role: DaamRole;
  linkedModeratorId?: string;
  createdAt: number;
};

// ========== RBAC Helpers ==========
function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function can(role: DaamRole, perms: DaamPermission[], permission: DaamPermission): boolean {
  if (role === "admin") return true;
  return perms.includes(permission);
}

export function getRolePermissions(role: DaamRole, moderatorPermissions: DaamPermission[] = []): DaamPermission[] {
  if (role === "admin") return ALL_PERMISSIONS;
  if (role === "moderator") return moderatorPermissions;
  return [];
}

// Moderator email - the only allowed moderator email
export const MODERATOR_EMAIL = 'w.qq89@hotmail.com';

// Admin Configuration - add admin emails here (moderators are admins)
export const ADMIN_EMAILS = [
  MODERATOR_EMAIL
];

// localStorage keys - only for UI preferences
const KEYS = {
  LANG: 'daam_lang',
  THEME: 'daam_theme',
};

// ========== DM Types ==========
export interface Conversation {
  id: string;
  participants: [string, string]; // emails
  lastMessageAt: string; // ISO
  lastMessagePreview: string;
  unreadCount: Record<string, number>; // per participant
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderEmail: string;
  content: string;
  sentAt: string; // ISO
  readBy: string[]; // emails who read
}

// Rate limit tracking
interface RateLimitEntry {
  senderEmail: string;
  timestamps: number[]; // unix timestamps of messages sent
}

// ========== Audit Log Types ==========
export type AuditAction =
  | "post.hide"
  | "post.show"
  | "post.delete"
  | "reply.delete"
  | "moderator.create"
  | "moderator.permissions.update"
  | "moderator.toggleActive"
  | "moderator.delete"
  | "report.create"
  | "report.status.update"
  | "user.mute"
  | "user.unmute"
  | "user.ban"
  | "user.unban";

export type AuditEvent = {
  id: string;
  action: AuditAction;
  targetType: "post" | "reply" | "moderator" | "report" | "user" | "comment" | "file";
  targetId: string;
  byEmail: string;
  at: number; // Date.now()
  meta?: Record<string, unknown>; // optional: post title, moderator email, etc.
};

const DEFAULT_ALLOWED_DOMAINS = ['utas.edu.om'];

export type ReportReason = 'spam' | 'harassment' | 'hate' | 'impersonation' | 'inappropriate' | 'other';
export type ReportTargetType = 'post' | 'comment' | 'user';
export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  reason: ReportReason;
  note?: string;
  reporter: string;
  reporterEmail: string;
  status: ReportStatus;
  createdAt: string;
}

// ========== Mute System Types ==========
export interface MuteRecord {
  userEmail: string;
  mutedBy: string;
  reason?: string;
  mutedAt: number;
  expiresAt?: number; // undefined = permanent mute
}

// ========== Ban System Types ==========
export interface BanRecord {
  userEmail: string;
  bannedBy: string;
  reason?: string;
  bannedAt: number;
  expiresAt?: number; // undefined = permanent ban
}

// Simple hash function for demo (in production, use bcrypt on server)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// Generate verification token
const generateVerificationToken = (): string => {
  return 'verify_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Simple translations dictionary
const DICTIONARY = {
  en: {
    welcome: "Welcome to DAAM",
    loginSubtitle: "Student Collaboration Platform",
    emailPlaceholder: "University Email (@utas.edu.om)",
    loginBtn: "Login",
    logoutBtn: "Logout",
    invalidEmail: "Please use a valid @utas.edu.om email",
    feedTitle: "Student Feed",
    createPost: "Share something with your peers...",
    postBtn: "Post",
    tutorBtn: "AI Tutor",
    backToFeed: "Back to Feed",
    tutorWelcome: "AI Tutor Assistant",
    tutorPlaceholder: "Ask me anything about your courses...",
    tutorSend: "Send",
    tutorResponse: "Your question is received. AI tutor will be enabled and connected to DAAM materials soon.",
    emptyFeed: "No posts yet. Be the first to share!",
    postedJustNow: "Just now",
    by: "by",
    recentPosts: "Recent Discussions",
    adminBadge: "Admin",
    deletePost: "Delete"
  },
  ar: {
    welcome: "مرحباً بكم في دام",
    loginSubtitle: "منصة التعاون الطلابي",
    emailPlaceholder: "البريد الجامعي (@utas.edu.om)",
    loginBtn: "دخول",
    logoutBtn: "تسجيل خروج",
    invalidEmail: "يرجى استخدام بريد جامعي صحيح @utas.edu.om",
    feedTitle: "ساحة النقاش",
    createPost: "شارك أفكارك مع زملائك...",
    postBtn: "نشر",
    tutorBtn: "المعلم الذكي",
    backToFeed: "العودة للرئيسية",
    tutorWelcome: "المساعد الذكي",
    tutorPlaceholder: "اسألني أي شيء عن موادك الدراسية...",
    tutorSend: "إرسال",
    tutorResponse: "تم استلام سؤالك. سيتم تفعيل الذكاء الاصطناعي وربطه بمواد DAAM قريبًا.",
    emptyFeed: "لا توجد منشورات بعد. كن أول من يشارك!",
    postedJustNow: "الآن",
    by: "بواسطة",
    recentPosts: "أحدث النقاشات",
    adminBadge: "مشرف",
    deletePost: "حذف"
  }
};

// Registration data type
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  phone: string;
  governorate: string;
  wilayat: string;
}

// Pending verification for simulated emails
export interface PendingVerification {
  email: string;
  token: string;
  expiry: string;
}

interface DaamStoreContextType {
  user: User | null;
  lang: Language;
  theme: Theme;
  posts: LocalPost[];
  profiles: Record<string, UserProfile>;
  accounts: Record<string, UserAccount>;
  pendingVerification: PendingVerification | null;
  isLoading: boolean;
  t: typeof DICTIONARY.en;
  login: (email: string, password: string, rememberMe?: boolean) => void;
  loginSimple: (email: string) => void;
  logout: () => void;
  register: (data: RegistrationData) => PendingVerification;
  resetPassword: (email: string, newPassword: string) => void;
  verifyEmail: (token: string) => boolean;
  createPost: (content: string, postType?: PostType, subject?: string, imageUrl?: string, attachments?: Attachment[]) => void;
  deletePost: (postId: string) => void;
  updatePost: (postId: string, content: string, postType?: PostType, subject?: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addReply: (postId: string, content: string, parentReplyId?: string) => void;
  toggleLang: () => void;
  toggleTheme: () => void;
  updateProfile: (email: string, profile: Partial<UserProfile>) => void;
  getProfile: (email: string) => UserProfile | undefined;
  getAccount: (email: string) => UserAccount | undefined;
  updateAccount: (email: string, data: { phone?: string; region?: { governorate: string; wilayat: string }; allowDM?: 'everyone' | 'none' }) => void;
  toggleFollow: (targetEmail: string) => void;
  isFollowing: (targetEmail: string) => boolean;
  banUser: (email: string, reason: string) => void;
  unbanUser: (email: string) => void;
  deleteReply: (postId: string, replyId: string) => void;
  editReply: (postId: string, replyId: string, content: string) => void;
  reports: Report[];
  hasUserReported: (targetType: ReportTargetType, targetId: string) => boolean;
  submitReport: (targetType: ReportTargetType, targetId: string, targetTitle: string, reason: ReportReason, note?: string) => void;
  updateReportStatus: (reportId: string, status: ReportStatus, resolutionReason?: string) => void;
  allowedDomains: string[];
  addAllowedDomain: (domain: string) => boolean;
  removeAllowedDomain: (domain: string) => boolean;
  isEmailDomainAllowed: (email: string) => boolean;
  // RBAC
  moderators: ModeratorAccount[];
  authUsers: LocalAuthUser[];
  currentUserPermissions: DaamPermission[];
  createModeratorAccount: (data: { email: string; displayName: string; tempPassword: string; permissions: DaamPermission[] }) => ModeratorAccount;
  updateModeratorPermissions: (moderatorId: string, permissions: DaamPermission[]) => void;
  toggleModeratorActive: (moderatorId: string) => void;
  deleteModerator: (moderatorId: string) => void;
  getModeratorByEmail: (email: string) => ModeratorAccount | undefined;
  canCurrentUser: (permission: DaamPermission) => boolean;
  // Audit Log
  auditLog: AuditEvent[];
  addAuditEvent: (event: Omit<AuditEvent, 'id' | 'at'>) => void;
  // Mute System
  mutes: MuteRecord[];
  muteUser: (userEmail: string, reason?: string, durationMinutes?: number) => void;
  unmuteUser: (userEmail: string) => void;
  isUserMuted: (userEmail: string) => boolean;
  getMuteRecord: (userEmail: string) => MuteRecord | undefined;
  // Ban System
  bans: BanRecord[];
  banUserWithDuration: (userEmail: string, reason?: string, durationDays?: number) => void;
  unbanUserRecord: (userEmail: string) => void;
  isUserBanned: (userEmail: string) => { banned: boolean; expiresAt?: number; reason?: string };
  getBanRecord: (userEmail: string) => BanRecord | undefined;
  // DM System
  conversations: Conversation[];
  directMessages: DirectMessage[];
  getOrCreateConversation: (otherEmail: string) => Conversation | null;
  getConversationsForUser: (userEmail: string) => Conversation[];
  getMessages: (conversationId: string) => DirectMessage[];
  sendDirectMessage: (conversationId: string, senderEmail: string, content: string) => { success: boolean; error?: string };
  markConversationRead: (conversationId: string, userEmail: string) => void;
  getUnreadConversationCount: (userEmail: string) => number;
  canSendDM: (targetEmail: string) => { allowed: boolean; reason?: string };
}

const DaamStoreContext = createContext<DaamStoreContextType | null>(null);

// Helper to get initial theme (system preference or stored)
const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(KEYS.THEME) as Theme | null;
  if (stored) return stored;
  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Default to dark
};

// API helper
const apiFetch = async (path: string, options?: RequestInit) => {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) errMsg = body.error;
      else if (body?.message) errMsg = body.message;
    } catch (_) {}
    throw new Error(errMsg);
  }
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
};

export function DaamStoreProvider({ children }: { children: ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>('dark');
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [accounts, setAccounts] = useState<Record<string, UserAccount>>({});
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<string[]>(DEFAULT_ALLOWED_DOMAINS);
  const [isLoading, setIsLoading] = useState(true);

  // RBAC State
  const [moderators, setModerators] = useState<ModeratorAccount[]>([]);
  const [authUsers, setAuthUsers] = useState<LocalAuthUser[]>([]);

  // Audit Log State
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);

  // Mute System State
  const [mutes, setMutes] = useState<MuteRecord[]>([]);

  // Ban System State
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [rateLimitEntries, setRateLimitEntries] = useState<RateLimitEntry[]>([]);

  // Initialize: restore session from API, then fetch all data
  useEffect(() => {
    const storedLang = localStorage.getItem(KEYS.LANG) as Language | null;
    if (storedLang) setLang(storedLang);

    // Apply document direction based on stored/default lang
    const effectiveLang = storedLang || 'ar';
    document.documentElement.dir = effectiveLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = effectiveLang;

    // Initialize theme
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);

    const init = async () => {
      try {
        // 1. Restore session
        let restoredUser: User | null = null;
        try {
          const meData = await apiFetch('/api/auth/me');
          if (meData && meData.email) {
            restoredUser = {
              email: meData.email,
              isAdmin: ADMIN_EMAILS.includes(meData.email.toLowerCase()),
              isModerator: meData.isModerator || meData.email.toLowerCase() === MODERATOR_EMAIL.toLowerCase(),
              profile: meData.profile,
              account: meData.account,
            };
            setUser(restoredUser);
          }
        } catch (_) {
          // Not authenticated - that's fine
        }

        // 2. Fetch posts
        try {
          const postsData = await apiFetch('/api/posts');
          if (Array.isArray(postsData)) {
            setPosts(postsData);
          } else if (postsData?.data && Array.isArray(postsData.data)) {
            setPosts(postsData.data);
          }
        } catch (err) {
          console.error('Failed to fetch posts:', err);
        }

        // 3. Fetch reports
        try {
          const reportsData = await apiFetch('/api/reports');
          const raw = Array.isArray(reportsData) ? reportsData : (reportsData?.data || []);
          const normalized = raw.map((r: any) => ({
            ...r,
            status: r.status === 'pending' ? 'open' : r.status
          }));
          setReports(normalized);
        } catch (err) {
          console.error('Failed to fetch reports:', err);
        }

        // 4. Fetch moderators
        try {
          const modsData = await apiFetch('/api/moderators');
          const raw = Array.isArray(modsData) ? modsData : (modsData?.data || []);
          setModerators(raw);
        } catch (err) {
          console.error('Failed to fetch moderators:', err);
        }

        // 5. Fetch mutes
        try {
          const mutesData = await apiFetch('/api/mutes');
          const raw = Array.isArray(mutesData) ? mutesData : (mutesData?.data || []);
          setMutes(raw);
        } catch (err) {
          console.error('Failed to fetch mutes:', err);
        }

        // 6. Fetch bans
        try {
          const bansData = await apiFetch('/api/bans');
          const raw = Array.isArray(bansData) ? bansData : (bansData?.data || []);
          setBans(raw);
        } catch (err) {
          console.error('Failed to fetch bans:', err);
        }

        // 7. Fetch conversations
        try {
          const convsData = await apiFetch('/api/conversations');
          const raw = Array.isArray(convsData) ? convsData : (convsData?.data || []);
          setConversations(raw);
        } catch (err) {
          console.error('Failed to fetch conversations:', err);
        }

        // 8. Fetch allowed domains
        try {
          const domainsData = await apiFetch('/api/allowed-domains');
          const raw = Array.isArray(domainsData) ? domainsData : (domainsData?.data || []);
          if (raw.length > 0) {
            // If array of objects with .domain, extract; otherwise treat as string[]
            const domains = raw.map((d: any) => (typeof d === 'string' ? d : d.domain)).filter(Boolean);
            if (domains.length > 0) setAllowedDomains(domains);
          }
        } catch (err) {
          console.error('Failed to fetch allowed domains:', err);
        }

        // 9. Fetch audit log
        try {
          const auditData = await apiFetch('/api/audit');
          const raw = Array.isArray(auditData) ? auditData : (auditData?.data || []);
          setAuditLog(raw);
        } catch (err) {
          console.error('Failed to fetch audit log:', err);
        }

      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Update language effect - persist UI preference to localStorage
  useEffect(() => {
    localStorage.setItem(KEYS.LANG, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Actions

  // Full login with password - async, throws on error
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const emailLower = email.toLowerCase();
    const isAdminEmail = ADMIN_EMAILS.includes(emailLower);
    const isMod = (data?.isModerator ?? false) || emailLower === MODERATOR_EMAIL.toLowerCase();

    setUser({
      email: data?.email || email,
      isAdmin: isAdminEmail,
      isModerator: isMod,
      profile: data?.profile,
      account: data?.account,
    });
  };

  // Simple login - DISABLED for security
  const loginSimple = (_email: string) => {
    throw new Error(lang === 'ar'
      ? 'الدخول السريع معطل. يرجى استخدام تسجيل الدخول بكلمة المرور.'
      : 'Quick login is disabled. Please use password login.');
  };

  // Register new account - synchronous interface, fires API in background
  // NOTE: The context interface requires synchronous return of PendingVerification.
  // We fire the API call in the background and return an optimistic verification object.
  // Callers that need true async behaviour should be updated to use the API directly.
  const register = (data: RegistrationData): PendingVerification => {
    // Fire API call in background
    apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(err => console.error('register API error:', err));

    // Return verification object immediately (for backward compatibility)
    const verification: PendingVerification = {
      email: data.email,
      token: '',
      expiry: ''
    };

    return verification;
  };

  // Reset password - fires API in background (interface requires synchronous void)
  const resetPassword = (email: string, newPassword: string): void => {
    apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }).catch(err => console.error('resetPassword API error:', err));
  };

  // Verify email with token (kept synchronous for interface compatibility, uses local state)
  const verifyEmail = (token: string): boolean => {
    // Find account with this token in local state
    const accountEntry = Object.entries(accounts).find(
      ([_, acc]) => (acc as any).verificationToken === token
    );

    if (!accountEntry) {
      return false;
    }

    const [email, account] = accountEntry;

    // Check expiry
    if ((account as any).verificationExpiry && new Date((account as any).verificationExpiry) < new Date()) {
      return false;
    }

    // Mark as verified optimistically
    setAccounts(prev => ({
      ...prev,
      [email]: {
        ...account,
        verified: true,
        verificationToken: undefined,
        verificationExpiry: undefined
      }
    }));

    // Clear pending verification
    setPendingVerification(null);

    return true;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout API error:', err);
    }
    setUser(null);
  };

  const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const createPost = (
    content: string,
    postType: PostType = 'discussion',
    subject?: string,
    imageUrl?: string,
    attachments?: Attachment[]
  ) => {
    if (!user || !content.trim()) return;

    const newPost: LocalPost = {
      id: generateId(),
      authorEmail: user.email,
      content,
      createdAt: new Date().toISOString(),
      likedBy: [],
      replies: [],
      postType,
      subject,
      savedBy: [],
      imageUrl,
      attachments
    };

    setPosts(prev => [newPost, ...prev]);

    // Fire API call in background
    apiFetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content, postType, subject, imageUrl, attachments }),
    }).catch(err => console.error('createPost API error:', err));
  };

  const updateProfile = (email: string, profileData: Partial<UserProfile>) => {
    // Optimistic update
    setProfiles(prev => ({
      ...prev,
      [email]: { ...prev[email], ...profileData }
    }));

    // Update user object if it's the current user
    if (user?.email === email) {
      setUser(prev => prev ? { ...prev, profile: { ...prev.profile, ...profileData } as UserProfile } : prev);
    }

    // Fire API call in background
    apiFetch(`/api/profiles/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }).catch(err => console.error('updateProfile API error:', err));
  };

  const getProfile = useCallback((email: string): UserProfile | undefined => {
    if (profiles[email]) return profiles[email];
    // Fetch in background and update state
    apiFetch(`/api/profiles/${encodeURIComponent(email)}`)
      .then(data => {
        if (data) setProfiles(prev => ({ ...prev, [email]: data }));
      })
      .catch(() => {});
    return undefined;
  }, [profiles]);

  const getAccount = useCallback((email: string): UserAccount | undefined => {
    if (accounts[email]) return accounts[email];
    const emailLower = email.toLowerCase();
    if (accounts[emailLower]) return accounts[emailLower];
    // Fetch in background and update state
    apiFetch(`/api/accounts/${encodeURIComponent(email)}`)
      .then(data => {
        if (data) setAccounts(prev => ({ ...prev, [email]: data }));
      })
      .catch(() => {});
    return undefined;
  }, [accounts]);

  const updateAccount = useCallback((email: string, data: { phone?: string; region?: { governorate: string; wilayat: string }; allowDM?: 'everyone' | 'none' }) => {
    const emailLower = email.toLowerCase();

    // Optimistic update
    setAccounts(prev => {
      const existing = prev[emailLower] || prev[email];
      if (!existing) return prev;
      return {
        ...prev,
        [emailLower]: { ...existing, ...data }
      };
    });

    // Fire API call in background
    apiFetch(`/api/accounts/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).catch(err => console.error('updateAccount API error:', err));
  }, [accounts]);

  const toggleSave = (postId: string) => {
    if (!user) return;

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const savedBy = post.savedBy || [];
      const isSaved = savedBy.includes(user.email);
      return {
        ...post,
        savedBy: isSaved
          ? savedBy.filter(email => email !== user.email)
          : [...savedBy, user.email]
      };
    }));

    // Fire API call in background
    apiFetch(`/api/posts/${encodeURIComponent(postId)}/save`, {
      method: 'POST',
    }).catch(err => console.error('toggleSave API error:', err));
  };

  const deletePost = (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Allow deletion if user is admin, moderator, or the post author
    if (!user.isAdmin && !user.isModerator && post.authorEmail !== user.email) return;

    setPosts(prev => prev.filter(p => p.id !== postId));

    // Fire API call in background
    apiFetch(`/api/posts/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    }).catch(err => console.error('deletePost API error:', err));
  };

  const updatePost = (postId: string, content: string, postType?: PostType, subject?: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Allow update if user is moderator or the post author
    if (!user.isModerator && post.authorEmail !== user.email) return;

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        content,
        postType: postType || p.postType,
        subject: subject !== undefined ? subject : p.subject,
        updatedAt: new Date().toISOString()
      };
    }));

    // Fire API call in background
    apiFetch(`/api/posts/${encodeURIComponent(postId)}`, {
      method: 'PUT',
      body: JSON.stringify({ content, postType, subject }),
    }).catch(err => console.error('updatePost API error:', err));
  };

  const toggleLike = (postId: string) => {
    if (!user) return;

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(user.email);
      return {
        ...post,
        likedBy: isLiked
          ? likedBy.filter(email => email !== user.email)
          : [...likedBy, user.email]
      };
    }));

    // Fire API call in background
    apiFetch(`/api/posts/${encodeURIComponent(postId)}/like`, {
      method: 'POST',
    }).catch(err => console.error('toggleLike API error:', err));
  };

  const addReply = (postId: string, content: string, parentReplyId?: string) => {
    if (!user || !content.trim()) return;
    const newReply: LocalReply = {
      id: generateId(),
      authorEmail: user.email,
      content,
      createdAt: new Date().toISOString(),
      parentId: parentReplyId
    };

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        replies: [...(post.replies || []), newReply]
      };
    }));

    // Fire API call in background
    apiFetch(`/api/posts/${encodeURIComponent(postId)}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content, parentReplyId }),
    }).catch(err => console.error('addReply API error:', err));
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(KEYS.THEME, newTheme);

      // Add transition class for smooth color change
      document.documentElement.classList.add('theme-transition');
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);

      // Remove transition class after animation completes
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300);

      return newTheme;
    });
  };

  const toggleFollow = (targetEmail: string) => {
    if (!user || user.email === targetEmail) return;

    const currentUserProfile = profiles[user.email] || { email: user.email, name: '', major: '', university: '' };
    const targetProfile = profiles[targetEmail] || { email: targetEmail, name: '', major: '', university: '' };

    const currentFollowing = currentUserProfile.following || [];
    const targetFollowers = targetProfile.followers || [];

    const isCurrentlyFollowing = currentFollowing.includes(targetEmail);

    setProfiles(prev => ({
      ...prev,
      [user.email]: {
        ...currentUserProfile,
        following: isCurrentlyFollowing
          ? currentFollowing.filter(e => e !== targetEmail)
          : [...currentFollowing, targetEmail]
      },
      [targetEmail]: {
        ...targetProfile,
        followers: isCurrentlyFollowing
          ? targetFollowers.filter(e => e !== user.email)
          : [...targetFollowers, user.email]
      }
    }));

    // Fire API call in background
    apiFetch(`/api/follows/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
    }).catch(err => console.error('toggleFollow API error:', err));
  };

  const isFollowing = (targetEmail: string): boolean => {
    if (!user) return false;
    const currentUserProfile = profiles[user.email];
    return currentUserProfile?.following?.includes(targetEmail) || false;
  };

  // Moderator functions (legacy - kept for interface compatibility)
  const banUser = (email: string, reason: string) => {
    if (!user?.isModerator) return;
    const emailLower = email.toLowerCase();

    setAccounts(prev => {
      const account = prev[emailLower];
      if (!account) return prev;
      return {
        ...prev,
        [emailLower]: { ...account, banned: true, bannedReason: reason }
      };
    });
  };

  const unbanUser = (email: string) => {
    if (!user?.isModerator) return;
    const emailLower = email.toLowerCase();

    setAccounts(prev => {
      const account = prev[emailLower];
      if (!account) return prev;
      return {
        ...prev,
        [emailLower]: { ...account, banned: false, bannedReason: undefined }
      };
    });
  };

  const deleteReply = (postId: string, replyId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const reply = post.replies?.find(r => r.id === replyId);
    if (!reply) return;

    // Allow deletion if user is moderator or the reply author
    if (!user.isModerator && reply.authorEmail !== user.email) return;

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        replies: p.replies?.filter(r => r.id !== replyId) || []
      };
    }));

    // Fire API call in background
    apiFetch(`/api/posts/${encodeURIComponent(postId)}/replies/${encodeURIComponent(replyId)}`, {
      method: 'DELETE',
    }).catch(err => console.error('deleteReply API error:', err));
  };

  const editReply = (postId: string, replyId: string, content: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const reply = post.replies?.find(r => r.id === replyId);
    if (!reply) return;

    // Allow edit if user is moderator or the reply author
    if (!user.isModerator && reply.authorEmail !== user.email) return;

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        replies: p.replies?.map(r =>
          r.id === replyId ? { ...r, content } : r
        ) || []
      };
    }));

    // Fire API call in background
    apiFetch(`/api/posts/${encodeURIComponent(postId)}/replies/${encodeURIComponent(replyId)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }).catch(err => console.error('editReply API error:', err));
  };

  // Check if user has already reported this target
  const hasUserReported = useCallback((targetType: ReportTargetType, targetId: string) => {
    if (!user) return false;
    return reports.some(r => r.targetType === targetType && r.targetId === targetId && r.reporterEmail === user.email);
  }, [user, reports]);

  const submitReport = useCallback((
    targetType: ReportTargetType,
    targetId: string,
    targetTitle: string,
    reason: ReportReason,
    note?: string
  ) => {
    if (!user) return;

    // Prevent duplicate reports from same user on same target
    if (reports.some(r => r.targetType === targetType && r.targetId === targetId && r.reporterEmail === user.email)) {
      return; // Already reported
    }

    const profile = profiles[user.email];
    const reporterName = profile?.name || user.email.split('@')[0];

    const newReport: Report = {
      id: `report-${Date.now()}`,
      targetType,
      targetId,
      targetTitle,
      reason,
      note,
      reporter: reporterName,
      reporterEmail: user.email,
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setReports(prev => [newReport, ...prev]);

    // Fire API call in background
    apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId, targetTitle, reason, note }),
    }).catch(err => console.error('submitReport API error:', err));

    // Add audit event optimistically
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      action: 'report.create',
      targetType: targetType as any,
      targetId,
      byEmail: user.email,
      at: Date.now(),
      meta: { reason, targetTitle }
    };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));

    // Fire audit API in background
    apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify(auditEvent),
    }).catch(err => console.error('audit API error:', err));
  }, [user, profiles, reports]);

  const updateReportStatus = useCallback((reportId: string, status: ReportStatus, resolutionReason?: string) => {
    const report = reports.find(r => r.id === reportId);

    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, status, resolutionReason }
        : r
    ));

    // Fire API call in background
    apiFetch(`/api/reports/${encodeURIComponent(reportId)}`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolutionReason }),
    }).catch(err => console.error('updateReportStatus API error:', err));

    // Add audit event optimistically
    if (user && report) {
      const auditEvent: AuditEvent = {
        id: crypto.randomUUID(),
        action: 'report.status.update',
        targetType: 'report',
        targetId: reportId,
        byEmail: user.email,
        at: Date.now(),
        meta: { status, targetTitle: report.targetTitle, resolutionReason }
      };
      setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));

      apiFetch('/api/audit', {
        method: 'POST',
        body: JSON.stringify(auditEvent),
      }).catch(err => console.error('audit API error:', err));
    }
  }, [user, reports]);

  // Domain management functions
  const addAllowedDomain = useCallback((domain: string): boolean => {
    const normalized = domain.toLowerCase().trim().replace(/^@/, '');
    if (!normalized || !/^[a-z0-9]+([\-.][a-z0-9]+)*\.[a-z]{2,}$/i.test(normalized)) {
      return false; // Invalid format
    }
    if (allowedDomains.includes(normalized)) {
      return false; // Already exists
    }
    const updated = [...allowedDomains, normalized];
    setAllowedDomains(updated);

    // Fire API call in background
    apiFetch('/api/allowed-domains', {
      method: 'POST',
      body: JSON.stringify({ domain: normalized }),
    }).catch(err => console.error('addAllowedDomain API error:', err));

    return true;
  }, [allowedDomains]);

  const removeAllowedDomain = useCallback((domain: string): boolean => {
    const normalized = domain.toLowerCase().trim();
    if (!allowedDomains.includes(normalized)) {
      return false;
    }
    if (allowedDomains.length <= 1) {
      return false; // Cannot remove last domain
    }
    setAllowedDomains(prev => prev.filter(d => d !== normalized));

    // Fire API call in background
    apiFetch(`/api/allowed-domains/${encodeURIComponent(normalized)}`, {
      method: 'DELETE',
    }).catch(err => console.error('removeAllowedDomain API error:', err));

    return true;
  }, [allowedDomains]);

  const isEmailDomainAllowed = useCallback((email: string): boolean => {
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return false;
    // Always allow moderator email
    if (email.toLowerCase() === MODERATOR_EMAIL.toLowerCase()) return true;
    return allowedDomains.includes(domain);
  }, [allowedDomains]);

  // ========== RBAC Actions ==========

  // Compute current user's role
  const getCurrentUserRole = useCallback((): DaamRole => {
    if (!user) return "student";
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) return "admin";
    const mod = moderators.find(m => m.email.toLowerCase() === user.email.toLowerCase());
    if (mod) return "moderator";
    return "student";
  }, [user, moderators]);

  // Compute current user permissions
  const currentUserPermissions: DaamPermission[] = (() => {
    if (!user) return [];
    const role = getCurrentUserRole();
    if (role === "admin") return ALL_PERMISSIONS;
    if (role === "moderator") {
      const mod = moderators.find(m => m.email.toLowerCase() === user.email.toLowerCase());
      if (mod && mod.isActive) return mod.permissions;
      return [];
    }
    return [];
  })();

  // Check if current user has a specific permission
  const canCurrentUser = useCallback((permission: DaamPermission): boolean => {
    const role = getCurrentUserRole();
    return can(role, currentUserPermissions, permission);
  }, [getCurrentUserRole, currentUserPermissions]);

  // Add audit event
  const addAuditEvent = useCallback((event: Omit<AuditEvent, 'id' | 'at'>) => {
    const fullEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      at: Date.now()
    };

    setAuditLog(prev => [fullEvent, ...prev].slice(0, 200));

    // Fire API call in background
    apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify(fullEvent),
    }).catch(err => console.error('addAuditEvent API error:', err));
  }, []);

  // Create moderator account
  const createModeratorAccount = useCallback((data: {
    email: string;
    displayName: string;
    tempPassword: string;
    permissions: DaamPermission[]
  }): ModeratorAccount => {
    const emailLower = data.email.toLowerCase();

    // Check for duplicate email in moderators
    if (moderators.some(m => m.email.toLowerCase() === emailLower)) {
      throw new Error(lang === 'ar' ? 'هذا البريد مسجل كمشرف مسبقاً' : 'Email already registered as moderator');
    }

    // Check for duplicate email in authUsers
    if (authUsers.some(a => a.email.toLowerCase() === emailLower)) {
      throw new Error(lang === 'ar' ? 'هذا البريد مسجل مسبقاً' : 'Email already registered');
    }

    const moderatorId = crypto.randomUUID();
    const authUserId = crypto.randomUUID();
    const now = Date.now();

    // Create ModeratorAccount
    const newModerator: ModeratorAccount = {
      id: moderatorId,
      email: data.email,
      displayName: data.displayName,
      role: "moderator",
      permissions: uniq(data.permissions),
      isActive: true,
      createdAt: now,
      createdBy: user?.email || 'system'
    };

    // Create LocalAuthUser
    const newAuthUser: LocalAuthUser = {
      id: authUserId,
      email: data.email,
      passwordHash: data.tempPassword, // TODO: Replace with proper hash
      role: "moderator",
      linkedModeratorId: moderatorId,
      createdAt: now
    };

    // Optimistic update
    setModerators(prev => [...prev, newModerator]);
    setAuthUsers(prev => [...prev, newAuthUser]);

    // Fire API calls in background
    apiFetch('/api/moderators', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        displayName: data.displayName,
        permissions: uniq(data.permissions),
      }),
    }).catch(err => console.error('createModeratorAccount API error:', err));

    apiFetch('/api/auth-users', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.tempPassword,
        role: 'moderator',
        linkedModeratorId: moderatorId,
      }),
    }).catch(err => console.error('createAuthUser API error:', err));

    return newModerator;
  }, [moderators, authUsers, user, lang]);

  // Update moderator permissions
  const updateModeratorPermissions = useCallback((moderatorId: string, permissions: DaamPermission[]): void => {
    setModerators(prev => prev.map(m =>
      m.id === moderatorId
        ? { ...m, permissions: uniq(permissions) }
        : m
    ));

    // Fire API call in background
    apiFetch(`/api/moderators/${encodeURIComponent(moderatorId)}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: uniq(permissions) }),
    }).catch(err => console.error('updateModeratorPermissions API error:', err));
  }, [moderators]);

  // Toggle moderator active status
  const toggleModeratorActive = useCallback((moderatorId: string): void => {
    setModerators(prev => prev.map(m =>
      m.id === moderatorId
        ? { ...m, isActive: !m.isActive }
        : m
    ));

    // Fire API call in background
    apiFetch(`/api/moderators/${encodeURIComponent(moderatorId)}/toggle-active`, {
      method: 'PUT',
    }).catch(err => console.error('toggleModeratorActive API error:', err));
  }, [moderators]);

  // Delete moderator (and linked authUser)
  const deleteModerator = useCallback((moderatorId: string): void => {
    const mod = moderators.find(m => m.id === moderatorId);
    if (!mod) return;

    setModerators(prev => prev.filter(m => m.id !== moderatorId));
    setAuthUsers(prev => prev.filter(a => a.linkedModeratorId !== moderatorId));

    // Fire API call in background
    apiFetch(`/api/moderators/${encodeURIComponent(moderatorId)}`, {
      method: 'DELETE',
    }).catch(err => console.error('deleteModerator API error:', err));
  }, [moderators, authUsers]);

  // Get moderator by email
  const getModeratorByEmail = useCallback((email: string): ModeratorAccount | undefined => {
    return moderators.find(m => m.email.toLowerCase() === email.toLowerCase());
  }, [moderators]);

  // ========== Mute System Actions ==========

  // Check if user is currently muted (auto-removes expired mutes)
  const isUserMuted = useCallback((userEmail: string): boolean => {
    const record = mutes.find(m => m.userEmail.toLowerCase() === userEmail.toLowerCase());
    if (!record) return false;

    // Check if mute has expired
    if (record.expiresAt && record.expiresAt < Date.now()) {
      // Auto-remove expired mute
      setMutes(prev => prev.filter(m => m.userEmail.toLowerCase() !== userEmail.toLowerCase()));
      apiFetch(`/api/mutes/${encodeURIComponent(userEmail)}`, { method: 'DELETE' })
        .catch(() => {});
      return false;
    }

    return true;
  }, [mutes]);

  // Get mute record for a user
  const getMuteRecord = useCallback((userEmail: string): MuteRecord | undefined => {
    const record = mutes.find(m => m.userEmail.toLowerCase() === userEmail.toLowerCase());
    if (!record) return undefined;

    // Check if mute has expired
    if (record.expiresAt && record.expiresAt < Date.now()) {
      setMutes(prev => prev.filter(m => m.userEmail.toLowerCase() !== userEmail.toLowerCase()));
      apiFetch(`/api/mutes/${encodeURIComponent(userEmail)}`, { method: 'DELETE' })
        .catch(() => {});
      return undefined;
    }

    return record;
  }, [mutes]);

  // Mute a user
  const muteUser = useCallback((userEmail: string, reason?: string, durationMinutes?: number): void => {
    if (!user) return;

    const now = Date.now();
    const expiresAt = durationMinutes ? now + (durationMinutes * 60 * 1000) : undefined;

    const newMuteRecord: MuteRecord = {
      userEmail: userEmail.toLowerCase(),
      mutedBy: user.email,
      reason,
      mutedAt: now,
      expiresAt
    };

    // Optimistic update
    setMutes(prev => {
      const existingIndex = prev.findIndex(m => m.userEmail.toLowerCase() === userEmail.toLowerCase());
      if (existingIndex >= 0) {
        return prev.map((m, i) => i === existingIndex ? newMuteRecord : m);
      }
      return [...prev, newMuteRecord];
    });

    // Fire API call in background
    apiFetch('/api/mutes', {
      method: 'POST',
      body: JSON.stringify({ userEmail: userEmail.toLowerCase(), reason, durationMinutes }),
    }).catch(err => console.error('muteUser API error:', err));

    // Add audit event
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      action: 'user.mute',
      targetType: 'user',
      targetId: userEmail,
      byEmail: user.email,
      at: now,
      meta: { reason, expiresAt }
    };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify(auditEvent),
    }).catch(err => console.error('audit API error:', err));
  }, [user, mutes]);

  // Unmute a user
  const unmuteUser = useCallback((userEmail: string): void => {
    if (!user) return;

    setMutes(prev => prev.filter(m => m.userEmail.toLowerCase() !== userEmail.toLowerCase()));

    // Fire API call in background
    apiFetch(`/api/mutes/${encodeURIComponent(userEmail)}`, {
      method: 'DELETE',
    }).catch(err => console.error('unmuteUser API error:', err));

    // Add audit event
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      action: 'user.unmute',
      targetType: 'user',
      targetId: userEmail,
      byEmail: user.email,
      at: Date.now()
    };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify(auditEvent),
    }).catch(err => console.error('audit API error:', err));
  }, [user, mutes]);

  // ========== Ban System Functions ==========

  // Ban a user with optional duration
  const banUserWithDuration = useCallback((userEmail: string, reason?: string, durationDays?: number): void => {
    if (!user) return;

    const now = Date.now();
    const expiresAt = durationDays ? now + (durationDays * 24 * 60 * 60 * 1000) : undefined;

    const newBanRecord: BanRecord = {
      userEmail: userEmail.toLowerCase(),
      bannedBy: user.email,
      reason,
      bannedAt: now,
      expiresAt
    };

    // Optimistic update
    setBans(prev => {
      const existingIndex = prev.findIndex(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());
      if (existingIndex >= 0) {
        return prev.map((b, i) => i === existingIndex ? newBanRecord : b);
      }
      return [...prev, newBanRecord];
    });

    // Fire API call in background
    apiFetch('/api/bans', {
      method: 'POST',
      body: JSON.stringify({ userEmail: userEmail.toLowerCase(), reason, durationDays }),
    }).catch(err => console.error('banUserWithDuration API error:', err));

    // Add audit event
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      action: 'user.ban',
      targetType: 'user',
      targetId: userEmail,
      byEmail: user.email,
      at: now,
      meta: { reason, expiresAt }
    };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify(auditEvent),
    }).catch(err => console.error('audit API error:', err));

    // If banning current user, log them out
    if (user.email.toLowerCase() === userEmail.toLowerCase()) {
      logout();
    }
  }, [user, bans]);

  // Unban a user
  const unbanUserRecord = useCallback((userEmail: string): void => {
    if (!user) return;

    setBans(prev => prev.filter(b => b.userEmail.toLowerCase() !== userEmail.toLowerCase()));

    // Fire API call in background
    apiFetch(`/api/bans/${encodeURIComponent(userEmail)}`, {
      method: 'DELETE',
    }).catch(err => console.error('unbanUserRecord API error:', err));

    // Add audit event
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      action: 'user.unban',
      targetType: 'user',
      targetId: userEmail,
      byEmail: user.email,
      at: Date.now()
    };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify(auditEvent),
    }).catch(err => console.error('audit API error:', err));
  }, [user, bans]);

  // Check if a user is banned
  const isUserBanned = useCallback((userEmail: string): { banned: boolean; expiresAt?: number; reason?: string } => {
    const record = bans.find(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());

    if (!record) {
      return { banned: false };
    }

    // Check if ban has expired
    if (record.expiresAt && record.expiresAt < Date.now()) {
      // Auto-remove expired ban
      setBans(prev => prev.filter(b => b.userEmail.toLowerCase() !== userEmail.toLowerCase()));
      apiFetch(`/api/bans/${encodeURIComponent(userEmail)}`, { method: 'DELETE' })
        .catch(() => {});
      return { banned: false };
    }

    return { banned: true, expiresAt: record.expiresAt, reason: record.reason };
  }, [bans]);

  // Get ban record for a user
  const getBanRecord = useCallback((userEmail: string): BanRecord | undefined => {
    const record = bans.find(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());

    if (!record) return undefined;

    // Check if ban has expired
    if (record.expiresAt && record.expiresAt < Date.now()) {
      setBans(prev => prev.filter(b => b.userEmail.toLowerCase() !== userEmail.toLowerCase()));
      apiFetch(`/api/bans/${encodeURIComponent(userEmail)}`, { method: 'DELETE' })
        .catch(() => {});
      return undefined;
    }

    return record;
  }, [bans]);

  // ========== DM System Functions ==========

  const canSendDM = useCallback((targetEmail: string): { allowed: boolean; reason?: string } => {
    const targetAccount = accounts[targetEmail.toLowerCase()];
    const allowDM = targetAccount?.allowDM ?? 'everyone';

    if (allowDM === 'none') {
      return { allowed: false, reason: 'dm_closed' };
    }

    return { allowed: true };
  }, [accounts]);

  const getOrCreateConversation = useCallback((otherEmail: string): Conversation | null => {
    if (!user?.email) return null;

    const myEmail = user.email.toLowerCase();
    const theirEmail = otherEmail.toLowerCase();

    // Check if conversation already exists
    const existing = conversations.find(c =>
      c.participants.includes(myEmail) && c.participants.includes(theirEmail)
    );

    if (existing) return existing;

    // Create new conversation optimistically
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      participants: [myEmail, theirEmail],
      lastMessageAt: new Date(0).toISOString(), // Epoch - sorts at bottom until first message
      lastMessagePreview: '',
      unreadCount: { [myEmail]: 0, [theirEmail]: 0 }
    };

    setConversations(prev => [...prev, newConv]);

    // Fire API call in background
    apiFetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ otherEmail: theirEmail }),
    }).then(data => {
      // Optionally replace the optimistic conversation with the server one
      if (data && data.id && data.id !== newConv.id) {
        setConversations(prev => prev.map(c => c.id === newConv.id ? data : c));
      }
    }).catch(err => console.error('getOrCreateConversation API error:', err));

    return newConv;
  }, [user, conversations]);

  const getConversationsForUser = useCallback((userEmail: string): Conversation[] => {
    const email = userEmail.toLowerCase();
    return conversations
      .filter(c => c.participants.includes(email))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [conversations]);

  const getMessages = useCallback((conversationId: string): DirectMessage[] => {
    // Also trigger a background fetch to populate messages if not loaded
    if (!directMessages.some(m => m.conversationId === conversationId)) {
      apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`)
        .then(data => {
          const raw = Array.isArray(data) ? data : (data?.data || []);
          if (raw.length > 0) {
            setDirectMessages(prev => {
              const existing = prev.filter(m => m.conversationId !== conversationId);
              return [...existing, ...raw];
            });
          }
        })
        .catch(() => {});
    }
    return directMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }, [directMessages]);

  const sendDirectMessage = useCallback((conversationId: string, senderEmail: string, content: string): { success: boolean; error?: string } => {
    const sender = senderEmail.toLowerCase();
    const conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) {
      return { success: false, error: 'conversation_not_found' };
    }

    // Find the other participant
    const otherEmail = conversation.participants.find(p => p !== sender);
    if (!otherEmail) {
      return { success: false, error: 'invalid_conversation' };
    }

    // Check allowDM for receiver
    const dmCheck = canSendDM(otherEmail);
    if (!dmCheck.allowed) {
      return { success: false, error: dmCheck.reason };
    }

    // Check rate limit (10 messages per 60 seconds)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const senderEntry = rateLimitEntries.find(e => e.senderEmail === sender);
    const recentTimestamps = senderEntry?.timestamps.filter(t => t > oneMinuteAgo) || [];

    if (recentTimestamps.length >= 10) {
      return { success: false, error: 'rate_limit' };
    }

    // Update rate limit
    setRateLimitEntries(prev => {
      const filtered = prev.filter(e => e.senderEmail !== sender);
      return [...filtered, { senderEmail: sender, timestamps: [...recentTimestamps, now] }];
    });

    // Create the message optimistically
    const newMessage: DirectMessage = {
      id: crypto.randomUUID(),
      conversationId,
      senderEmail: sender,
      content,
      sentAt: new Date().toISOString(),
      readBy: [sender]
    };

    setDirectMessages(prev => [...prev, newMessage]);

    // Update conversation optimistically
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        lastMessageAt: newMessage.sentAt,
        lastMessagePreview: content.slice(0, 50),
        unreadCount: {
          ...c.unreadCount,
          [otherEmail]: (c.unreadCount[otherEmail] || 0) + 1
        }
      };
    }));

    // Fire API call in background
    apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }).catch(err => console.error('sendDirectMessage API error:', err));

    return { success: true };
  }, [conversations, directMessages, rateLimitEntries, canSendDM]);

  const markConversationRead = useCallback((conversationId: string, userEmail: string): void => {
    const email = userEmail.toLowerCase();

    // Optimistic update - conversations
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        unreadCount: { ...c.unreadCount, [email]: 0 }
      };
    }));

    // Optimistic update - messages readBy
    setDirectMessages(prev => prev.map(m => {
      if (m.conversationId !== conversationId) return m;
      if (m.readBy.includes(email)) return m;
      return { ...m, readBy: [...m.readBy, email] };
    }));

    // Fire API call in background
    apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/read`, {
      method: 'PUT',
      body: JSON.stringify({ userEmail: email }),
    }).catch(err => console.error('markConversationRead API error:', err));
  }, [conversations, directMessages]);

  // Get count of unread conversations for a user
  const getUnreadConversationCount = useCallback((userEmail: string): number => {
    const email = userEmail.toLowerCase();
    return conversations.filter(c =>
      c.participants.includes(email) && (c.unreadCount?.[email] ?? 0) > 0
    ).length;
  }, [conversations]);

  const value: DaamStoreContextType = {
    user,
    lang,
    theme,
    posts,
    profiles,
    accounts,
    pendingVerification,
    isLoading,
    t: DICTIONARY[lang],
    login,
    loginSimple,
    logout,
    register,
    resetPassword,
    verifyEmail,
    createPost,
    deletePost,
    updatePost,
    toggleLike,
    toggleSave,
    addReply,
    toggleLang,
    toggleTheme,
    updateProfile,
    getProfile,
    getAccount,
    updateAccount,
    toggleFollow,
    isFollowing,
    banUser,
    unbanUser,
    deleteReply,
    editReply,
    reports,
    hasUserReported,
    submitReport,
    updateReportStatus,
    allowedDomains,
    addAllowedDomain,
    removeAllowedDomain,
    isEmailDomainAllowed,
    // RBAC
    moderators,
    authUsers,
    currentUserPermissions,
    createModeratorAccount,
    updateModeratorPermissions,
    toggleModeratorActive,
    deleteModerator,
    getModeratorByEmail,
    canCurrentUser,
    // Audit Log
    auditLog,
    addAuditEvent,
    // Mute System
    mutes,
    muteUser,
    unmuteUser,
    isUserMuted,
    getMuteRecord,
    // Ban System
    bans,
    banUserWithDuration,
    unbanUserRecord,
    isUserBanned,
    getBanRecord,
    // DM System
    conversations,
    directMessages,
    getOrCreateConversation,
    getConversationsForUser,
    getMessages,
    sendDirectMessage,
    markConversationRead,
    getUnreadConversationCount,
    canSendDM
  };

  return (
    <DaamStoreContext.Provider value={value}>
      {children}
    </DaamStoreContext.Provider>
  );
}

export function useDaamStore() {
  const context = useContext(DaamStoreContext);
  if (!context) {
    throw new Error('useDaamStore must be used within a DaamStoreProvider');
  }
  return context;
}
