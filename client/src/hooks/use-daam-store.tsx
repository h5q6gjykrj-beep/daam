import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from "react";
import { type LocalPost, type LocalReply, type PostType, type PostStatus, type UserProfile, type Attachment, type UserAccount, type UserRole, type Region } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark';
export type User = {
  email: string;
  isAdmin: boolean;
  isModerator: boolean;
  profile?: UserProfile;
  account?: UserAccount;
};

export type DaamRole = "admin" | "moderator" | "student";
export type DaamPermission =
  | "mod.posts.delete" | "mod.posts.hide" | "mod.comments.delete"
  | "mod.users.mute" | "mod.users.ban" | "admin.moderators.manage"
  | "admin.settings.manage" | "ai.view" | "ai.settings.edit"
  | "ai.sources.create" | "ai.sources.review" | "ai.train.run"
  | "ai.train.publish" | "ai.analytics.view" | "ai.audit.view";

export const ALL_PERMISSIONS: DaamPermission[] = [
  "mod.posts.delete", "mod.posts.hide", "mod.comments.delete",
  "mod.users.mute", "mod.users.ban", "admin.moderators.manage",
  "admin.settings.manage", "ai.view", "ai.settings.edit",
  "ai.sources.create", "ai.sources.review", "ai.train.run",
  "ai.train.publish", "ai.analytics.view", "ai.audit.view"
];

export type ModeratorAccount = {
  id: string; email: string; displayName: string; role: "moderator";
  permissions: DaamPermission[]; isActive: boolean; createdAt: number; createdBy: string;
};

export type LocalAuthUser = {
  id: string; email: string; passwordHash: string;
  role: DaamRole; linkedModeratorId?: string; createdAt: number;
};

export type ReportReason = 'spam' | 'harassment' | 'hate' | 'impersonation' | 'inappropriate' | 'other';
export type ReportTargetType = 'post' | 'comment' | 'user';
export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type AuditAction =
  | "post.hide" | "post.show" | "post.delete" | "reply.delete"
  | "moderator.create" | "moderator.permissions.update" | "moderator.toggleActive"
  | "moderator.delete" | "report.create" | "report.status.update"
  | "user.mute" | "user.unmute" | "user.ban" | "user.unban";

export interface Report {
  id: string; targetType: ReportTargetType; targetId: string; targetTitle: string;
  reason: ReportReason; note?: string; reporter: string; reporterEmail: string;
  status: ReportStatus; createdAt: string; resolutionReason?: string;
}

export interface MuteRecord {
  userEmail: string; mutedBy: string; reason?: string; mutedAt: number; expiresAt?: number;
}

export interface BanRecord {
  userEmail: string; bannedBy: string; reason?: string; bannedAt: number; expiresAt?: number;
}

export interface AuditEvent {
  id: string; action: AuditAction;
  targetType: "post" | "reply" | "moderator" | "report" | "user" | "comment" | "file";
  targetId: string; byEmail: string; at: number; meta?: Record<string, unknown>;
}

export interface Conversation {
  id: string; participants: [string, string]; lastMessageAt: string;
  lastMessagePreview: string; unreadCount: Record<string, number>;
}

export interface DirectMessage {
  id: string; conversationId: string; senderEmail: string;
  content: string; sentAt: string; readBy: string[];
}

export interface RegistrationData {
  email: string; password: string; name: string;
  phone: string; governorate: string; wilayat: string;
}

export interface PendingVerification {
  email: string; token: string; expiry: string;
}

export const MODERATOR_EMAIL = 'w.qq89@hotmail.com';
export const ADMIN_EMAILS = [MODERATOR_EMAIL];

// ─── RBAC Helpers ─────────────────────────────────────────────────────────────
function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
export function can(role: DaamRole, perms: DaamPermission[], permission: DaamPermission): boolean {
  if (role === "admin") return true;
  return perms.includes(permission);
}
export function getRolePermissions(role: DaamRole, moderatorPermissions: DaamPermission[] = []): DaamPermission[] {
  if (role === "admin") return ALL_PERMISSIONS;
  if (role === "moderator") return moderatorPermissions;
  return [];
}

// ─── API Helper ───────────────────────────────────────────────────────────────
async function api(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─── Hash ─────────────────────────────────────────────────────────────────────
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

const generateId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

// ─── Translations ─────────────────────────────────────────────────────────────
const DICTIONARY = {
  en: {
    welcome: "Welcome to DAAM", loginSubtitle: "Student Collaboration Platform",
    emailPlaceholder: "University Email (@utas.edu.om)", loginBtn: "Login", logoutBtn: "Logout",
    invalidEmail: "Please use a valid @utas.edu.om email", feedTitle: "Student Feed",
    createPost: "Share something with your peers...", postBtn: "Post", tutorBtn: "AI Tutor",
    backToFeed: "Back to Feed", tutorWelcome: "AI Tutor Assistant",
    tutorPlaceholder: "Ask me anything about your courses...", tutorSend: "Send",
    tutorResponse: "Your question is received. AI tutor will be enabled and connected to DAAM materials soon.",
    emptyFeed: "No posts yet. Be the first to share!", postedJustNow: "Just now",
    by: "by", recentPosts: "Recent Discussions", adminBadge: "Admin", deletePost: "Delete"
  },
  ar: {
    welcome: "مرحباً بكم في دام", loginSubtitle: "منصة التعاون الطلابي",
    emailPlaceholder: "البريد الجامعي (@utas.edu.om)", loginBtn: "دخول", logoutBtn: "تسجيل خروج",
    invalidEmail: "يرجى استخدام بريد جامعي صحيح @utas.edu.om", feedTitle: "ساحة النقاش",
    createPost: "شارك أفكارك مع زملائك...", postBtn: "نشر", tutorBtn: "المعلم الذكي",
    backToFeed: "العودة للرئيسية", tutorWelcome: "المساعد الذكي",
    tutorPlaceholder: "اسألني أي شيء عن موادك الدراسية...", tutorSend: "إرسال",
    tutorResponse: "تم استلام سؤالك. سيتم تفعيل الذكاء الاصطناعي وربطه بمواد DAAM قريبًا.",
    emptyFeed: "لا توجد منشورات بعد. كن أول من يشارك!", postedJustNow: "الآن",
    by: "بواسطة", recentPosts: "أحدث النقاشات", adminBadge: "مشرف", deletePost: "حذف"
  }
};

// ─── Context Type ─────────────────────────────────────────────────────────────
interface DaamStoreContextType {
  user: User | null; lang: Language; theme: Theme; posts: LocalPost[];
  profiles: Record<string, UserProfile>; accounts: Record<string, UserAccount>;
  pendingVerification: PendingVerification | null; isLoading: boolean;
  t: typeof DICTIONARY.en;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginSimple: (email: string) => void;
  logout: () => void;
  register: (data: RegistrationData) => Promise<PendingVerification>;
  resetPassword: (email: string, newPassword: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => void;
  verifyEmail: (token: string) => boolean;
  createPost: (content: string, postType?: PostType, subject?: string, imageUrl?: string, attachments?: Attachment[]) => void;
  deletePost: (postId: string) => void;
  updatePost: (postId: string, content: string, postType?: PostType, subject?: string) => void;
  updatePostStatus: (postId: string, status: PostStatus) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addReply: (postId: string, content: string, parentReplyId?: string) => void;
  toggleLang: () => void; toggleTheme: () => void;
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
  moderators: ModeratorAccount[]; authUsers: LocalAuthUser[];
  currentUserPermissions: DaamPermission[];
  createModeratorAccount: (data: { email: string; displayName: string; tempPassword: string; permissions: DaamPermission[] }) => ModeratorAccount;
  updateModeratorPermissions: (moderatorId: string, permissions: DaamPermission[]) => void;
  toggleModeratorActive: (moderatorId: string) => void;
  deleteModerator: (moderatorId: string) => void;
  getModeratorByEmail: (email: string) => ModeratorAccount | undefined;
  canCurrentUser: (permission: DaamPermission) => boolean;
  auditLog: AuditEvent[];
  addAuditEvent: (event: Omit<AuditEvent, 'id' | 'at'>) => void;
  mutes: MuteRecord[];
  muteUser: (userEmail: string, reason?: string, durationMinutes?: number) => void;
  unmuteUser: (userEmail: string) => void;
  isUserMuted: (userEmail: string) => boolean;
  getMuteRecord: (userEmail: string) => MuteRecord | undefined;
  bans: BanRecord[];
  banUserWithDuration: (userEmail: string, reason?: string, durationDays?: number) => void;
  unbanUserRecord: (userEmail: string) => void;
  isUserBanned: (userEmail: string) => { banned: boolean; expiresAt?: number; reason?: string };
  getBanRecord: (userEmail: string) => BanRecord | undefined;
  conversations: Conversation[]; directMessages: DirectMessage[];
  getOrCreateConversation: (otherEmail: string) => Conversation | null;
  getConversationsForUser: (userEmail: string) => Conversation[];
  getMessages: (conversationId: string) => DirectMessage[];
  sendDirectMessage: (conversationId: string, senderEmail: string, content: string) => { success: boolean; error?: string };
  markConversationRead: (conversationId: string, userEmail: string) => void;
  getUnreadConversationCount: (userEmail: string) => number;
  canSendDM: (targetEmail: string) => { allowed: boolean; reason?: string };
  refreshMessages: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  setActiveConversationId: (id: string | null) => void;
}

const DaamStoreContext = createContext<DaamStoreContextType | null>(null);

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('daam_theme') as Theme | null;
  if (stored) return stored;
  if (typeof window !== 'undefined' && window.matchMedia)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return 'dark';
};


export function DaamStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>('dark');
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [accounts, setAccounts] = useState<Record<string, UserAccount>>({});
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<string[]>(['utas.edu.om']);
  const [isLoading, setIsLoading] = useState(true);
  const [moderators, setModerators] = useState<ModeratorAccount[]>([]);
  const [authUsers, setAuthUsers] = useState<LocalAuthUser[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [mutes, setMutes] = useState<MuteRecord[]>([]);
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const activeConversationIdRef = useRef<string | null>(null);
  const setActiveConversationId = (id: string | null) => { activeConversationIdRef.current = id; };

  // ── Initialize from API ───────────────────────────────────────────────────
  useEffect(() => {
    const storedLang = localStorage.getItem('daam_lang') as Language;
    const storedUser = localStorage.getItem('daam_user');
    if (storedLang) { setLang(storedLang); document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = storedLang; }
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);

    (async () => {
      try {
        const data = await api('GET', '/api/data');

        const loadedProfiles: Record<string, UserProfile> = data.profiles || {};
        const loadedAccounts: Record<string, UserAccount> = data.accounts || {};
        const loadedModerators: ModeratorAccount[] = data.moderators || [];
        const loadedAuthUsers: LocalAuthUser[] = data.authUsers || [];

        setProfiles(loadedProfiles);
        setAccounts(loadedAccounts);
        setPosts(data.posts || []);
        setReports((data.reports || []).map((r: any) => ({ ...r, status: r.status === 'pending' ? 'open' : r.status })));
        setModerators(loadedModerators);
        setAuthUsers(loadedAuthUsers);
        setAuditLog(data.auditLog || []);
        setMutes(data.mutes || []);
        setBans(data.bans || []);
        setConversations(data.conversations || []);
        setDirectMessages(data.messages || []);
        if (data.allowedDomains?.length > 0) setAllowedDomains(data.allowedDomains);

        if (storedUser) {
          const emailLower = storedUser.toLowerCase();
          const isAdmin = ADMIN_EMAILS.includes(emailLower);
          const authUser = loadedAuthUsers.find((a: any) => a.email.toLowerCase() === emailLower);
          const isMod = emailLower === MODERATOR_EMAIL.toLowerCase() || authUser?.role === 'moderator';
          setUser({ email: storedUser, isAdmin, isModerator: isMod, profile: loadedProfiles[storedUser], account: loadedAccounts[emailLower] });
        }
      } catch (e) {
        console.error('Failed to load data from API:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('daam_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // ── Posts polling (every 30s) ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await api('GET', '/api/posts');
        const fetchedPosts: LocalPost[] = data || [];
        setPosts(prev => {
          if (fetchedPosts.length === prev.length &&
              fetchedPosts[0]?.id === prev[0]?.id &&
              fetchedPosts.every((p, i) => (p.replies?.length ?? 0) === (prev[i]?.replies?.length ?? 0))) return prev;
          return fetchedPosts;
        });
      } catch {}
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const emailLower = email.toLowerCase();
    let result: any;
    try {
      result = await api('POST', '/api/auth/login', { email: emailLower, password });
    } catch (err: any) {
      // Translate server error messages to the current language
      const msg: string = err.message || '';
      if (lang === 'ar') {
        if (msg.includes('not registered')) throw new Error('هذا الحساب غير مسجل');
        if (msg.includes('Incorrect password')) throw new Error('كلمة المرور غير صحيحة');
        if (msg.includes('verify your email')) throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً');
        if (msg.includes('banned')) throw new Error('حسابك محظور: ' + msg.split(': ').slice(1).join(': '));
      }
      throw err;
    }

    const isAdminEmail = ADMIN_EMAILS.includes(emailLower);

    if (result.type === 'authUser') {
      const authUser = result.authUser;
      const isMod = authUser.role === 'moderator' || emailLower === MODERATOR_EMAIL.toLowerCase();
      localStorage.setItem('daam_user', email);
      setAuthUsers(prev => prev.some(a => a.email.toLowerCase() === emailLower) ? prev : [...prev, authUser]);
      setUser({ email, isAdmin: isAdminEmail, isModerator: isMod, profile: profiles[email] });
      return;
    }

    // type === 'account'
    const account: UserAccount = result.account;
    const updatedAcc = { ...account, rememberMe };
    setAccounts(prev => ({ ...prev, [emailLower]: updatedAcc }));
    api('PATCH', `/api/accounts/${encodeURIComponent(emailLower)}`, { rememberMe }).catch(() => {});

    const isMod = emailLower === MODERATOR_EMAIL.toLowerCase();
    localStorage.setItem('daam_user', email);
    setUser({ email, isAdmin: isAdminEmail, isModerator: isMod, account: updatedAcc, profile: profiles[email] });
  };

  const loginSimple = (_email: string) => {
    throw new Error(lang === 'ar' ? 'الدخول السريع معطل. يرجى استخدام تسجيل الدخول بكلمة المرور.' : 'Quick login is disabled. Please use password login.');
  };

  const register = async (data: RegistrationData): Promise<PendingVerification> => {
    const emailLower = data.email.toLowerCase();
    if (accounts[emailLower]) throw new Error(lang === 'ar' ? 'هذا البريد مسجل مسبقاً' : 'Email already registered');
    const isModerator = emailLower === MODERATOR_EMAIL.toLowerCase();
    const emailDomain = emailLower.split('@')[1];
    const isDomainAllowed = emailDomain && allowedDomains.includes(emailDomain);
    if (!isModerator && !isDomainAllowed) throw new Error(lang === 'ar' ? 'يرجى استخدام بريد جامعي معتمد' : 'Please use an approved university email');
    if (!isModerator && data.email.toLowerCase().includes('@hotmail.')) throw new Error(lang === 'ar' ? 'بريد Hotmail غير مسموح به' : 'Hotmail emails are not allowed');

    const newAccount: UserAccount = {
      email: data.email, passwordHash: simpleHash(data.password), phone: data.phone,
      region: { governorate: data.governorate, wilayat: data.wilayat },
      role: isModerator ? 'moderator' : 'student', verified: true, createdAt: new Date().toISOString()
    };
    await api('POST', '/api/accounts', newAccount);
    setAccounts(prev => ({ ...prev, [emailLower]: newAccount }));

    const defaultProfile: UserProfile = { email: data.email, name: data.name, bio: '', major: '', university: 'UTAS', followers: [], following: [] };
    await api('PATCH', `/api/profiles/${encodeURIComponent(data.email)}`, defaultProfile);
    setProfiles(prev => ({ ...prev, [data.email]: defaultProfile }));

    return { email: data.email, token: '', expiry: '' };
  };

  const changePassword = (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error(lang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Must be logged in');
    const emailLower = user.email.toLowerCase();
    const account = accounts[emailLower];
    if (!account) throw new Error(lang === 'ar' ? 'الحساب غير موجود' : 'Account not found');
    if (account.passwordHash !== simpleHash(currentPassword)) {
      throw new Error(lang === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect');
    }
    if (newPassword.length < 8) {
      throw new Error(lang === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
    }
    const newHash = simpleHash(newPassword);
    const updatedAccount = { ...account, passwordHash: newHash };
    setAccounts(prev => ({ ...prev, [emailLower]: updatedAccount }));
    setUser(prev => prev ? { ...prev, account: updatedAccount } : prev);
    api('PATCH', `/api/accounts/${encodeURIComponent(emailLower)}`, { passwordHash: newHash }).catch(() => {});
  };

  const resetPassword = (email: string, newPassword: string) => {
    const emailLower = email.toLowerCase();
    const account = accounts[emailLower];
    if (!account) throw new Error(lang === 'ar' ? 'هذا الحساب غير مسجل' : 'Account not registered');
    const isAdminOrMod = ADMIN_EMAILS.includes(emailLower) || emailLower === MODERATOR_EMAIL.toLowerCase();
    if (!isAdminOrMod) throw new Error(lang === 'ar' ? 'إعادة تعيين كلمة المرور متاحة فقط للمشرفين' : 'Password reset only available for moderators');
    if (newPassword.length < 6) throw new Error(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
    const updatedAccount = { ...account, passwordHash: simpleHash(newPassword) };
    const updatedAccounts = { ...accounts, [emailLower]: updatedAccount };
    setAccounts(updatedAccounts);
    api('PATCH', `/api/accounts/${encodeURIComponent(emailLower)}`, { passwordHash: simpleHash(newPassword) }).catch(() => {});
  };

  const verifyEmail = (token: string): boolean => {
    const accountEntry = Object.entries(accounts).find(([_, acc]) => acc.verificationToken === token);
    if (!accountEntry) return false;
    const [email, account] = accountEntry;
    if (account.verificationExpiry && new Date(account.verificationExpiry) < new Date()) return false;
    const updatedAcc = { ...account, verified: true, verificationToken: undefined, verificationExpiry: undefined };
    const updatedAccounts = { ...accounts, [email]: updatedAcc };
    setAccounts(updatedAccounts);
    api('PATCH', `/api/accounts/${encodeURIComponent(email)}`, { verified: true, verificationToken: null, verificationExpiry: null }).catch(() => {});
    setPendingVerification(null);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('daam_user');
    setUser(null);
  };

  // ── Posts ─────────────────────────────────────────────────────────────────
  const createPost = (content: string, postType: PostType = 'discussion', subject?: string, imageUrl?: string, attachments?: Attachment[]) => {
    if (!user || !content.trim()) return;
    const newPost: LocalPost = {
      id: generateId(), authorEmail: user.email, content, createdAt: new Date().toISOString(),
      likedBy: [], replies: [], postType, subject, savedBy: [], imageUrl, attachments, status: 'visible'
    };
    setPosts(prev => [newPost, ...prev]);
    api('POST', '/api/posts', newPost).catch(() => {});
  };

  const updatePost = (postId: string, content: string, postType?: PostType, subject?: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (!user.isModerator && post.authorEmail !== user.email) return;
    const updatedAt = new Date().toISOString();
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, content, postType: postType || p.postType, subject: subject !== undefined ? subject : p.subject, updatedAt }));
    api('PATCH', `/api/posts/${postId}`, { content, postType: postType, subject, updatedAt }).catch(() => {});
  };

  const deletePost = (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (!user.isAdmin && !user.isModerator && post.authorEmail !== user.email) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    api('DELETE', `/api/posts/${postId}`).catch(() => {});
  };

  const updatePostStatus = (postId: string, status: PostStatus) => {
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, status }));
    api('PATCH', `/api/posts/${postId}`, { status }).catch(() => {});
  };

  const toggleLike = (postId: string) => {
    if (!user) return;
    setPosts(prev => {
      const updated = prev.map(post => {
        if (post.id !== postId) return post;
        const likedBy = post.likedBy || [];
        const isLiked = likedBy.includes(user.email);
        const newLikedBy = isLiked ? likedBy.filter(e => e !== user.email) : [...likedBy, user.email];
        api('PATCH', `/api/posts/${postId}`, { likedBy: newLikedBy }).catch(() => {});
        return { ...post, likedBy: newLikedBy };
      });
      return updated;
    });
  };

  const toggleSave = (postId: string) => {
    if (!user) return;
    setPosts(prev => {
      const updated = prev.map(post => {
        if (post.id !== postId) return post;
        const savedBy = post.savedBy || [];
        const isSaved = savedBy.includes(user.email);
        const newSavedBy = isSaved ? savedBy.filter(e => e !== user.email) : [...savedBy, user.email];
        api('PATCH', `/api/posts/${postId}`, { savedBy: newSavedBy }).catch(() => {});
        return { ...post, savedBy: newSavedBy };
      });
      return updated;
    });
  };

  const addReply = (postId: string, content: string, parentReplyId?: string) => {
    if (!user || !content.trim()) return;
    const newReply: LocalReply = { id: generateId(), authorEmail: user.email, content, createdAt: new Date().toISOString(), parentId: parentReplyId };
    setPosts(prev => prev.map(post => post.id !== postId ? post : { ...post, replies: [...(post.replies || []), newReply] }));
    api('POST', `/api/posts/${postId}/replies`, newReply).catch(() => {});
  };

  const deleteReply = (postId: string, replyId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const reply = post.replies?.find(r => r.id === replyId);
    if (!reply) return;
    if (!user.isModerator && reply.authorEmail !== user.email) return;
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, replies: p.replies?.filter(r => r.id !== replyId) || [] }));
    api('DELETE', `/api/replies/${replyId}`).catch(() => {});
  };

  const editReply = (postId: string, replyId: string, content: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const reply = post.replies?.find(r => r.id === replyId);
    if (!reply) return;
    if (!user.isModerator && reply.authorEmail !== user.email) return;
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, replies: p.replies?.map(r => r.id === replyId ? { ...r, content } : r) || [] }));
    api('PATCH', `/api/replies/${replyId}`, { content }).catch(() => {});
  };

  // ── UI Preferences ────────────────────────────────────────────────────────
  const toggleLang = () => setLang(prev => prev === 'en' ? 'ar' : 'en');
  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('daam_theme', newTheme);
      document.documentElement.classList.add('theme-transition');
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
      setTimeout(() => document.documentElement.classList.remove('theme-transition'), 300);
      return newTheme;
    });
  };

  // ── Profiles ──────────────────────────────────────────────────────────────
  const updateProfile = (email: string, profileData: Partial<UserProfile>) => {
    const updatedProfiles = { ...profiles, [email]: { ...profiles[email], ...profileData } };
    setProfiles(updatedProfiles);
    api('PATCH', `/api/profiles/${encodeURIComponent(email)}`, profileData).catch(() => {});
    if (user?.email === email) setUser({ ...user, profile: updatedProfiles[email] });
  };

  const getProfile = useCallback((email: string): UserProfile | undefined => profiles[email], [profiles]);
  const getAccount = useCallback((email: string): UserAccount | undefined => accounts[email], [accounts]);

  const updateAccount = useCallback((email: string, data: { phone?: string; region?: { governorate: string; wilayat: string }; allowDM?: 'everyone' | 'none' }) => {
    const emailLower = email.toLowerCase();
    const existing = accounts[emailLower];
    if (!existing) return;
    const updatedAccount = { ...existing, ...data };
    setAccounts(prev => ({ ...prev, [emailLower]: updatedAccount }));
    api('PATCH', `/api/accounts/${encodeURIComponent(emailLower)}`, data).catch(() => {});
  }, [accounts]);

  // ── Follow ────────────────────────────────────────────────────────────────
  const toggleFollow = (targetEmail: string) => {
    if (!user || user.email === targetEmail) return;
    const currentProfile = profiles[user.email] || { email: user.email, name: '', major: '', university: '' };
    const targetProfile = profiles[targetEmail] || { email: targetEmail, name: '', major: '', university: '' };
    const currentFollowing = currentProfile.following || [];
    const targetFollowers = targetProfile.followers || [];
    const isCurrentlyFollowing = currentFollowing.includes(targetEmail);

    const newCurrentProfile = { ...currentProfile, following: isCurrentlyFollowing ? currentFollowing.filter(e => e !== targetEmail) : [...currentFollowing, targetEmail] };
    const newTargetProfile = { ...targetProfile, followers: isCurrentlyFollowing ? targetFollowers.filter(e => e !== user.email) : [...targetFollowers, user.email] };

    setProfiles(prev => ({ ...prev, [user.email]: newCurrentProfile, [targetEmail]: newTargetProfile }));
    api('PATCH', `/api/profiles/${encodeURIComponent(user.email)}`, { following: newCurrentProfile.following }).catch(() => {});
    api('PATCH', `/api/profiles/${encodeURIComponent(targetEmail)}`, { followers: newTargetProfile.followers }).catch(() => {});
  };

  const isFollowing = (targetEmail: string): boolean => {
    if (!user) return false;
    return profiles[user.email]?.following?.includes(targetEmail) || false;
  };

  // ── Moderation ────────────────────────────────────────────────────────────
  const banUser = (email: string, reason: string) => {
    if (!user?.isModerator) return;
    const emailLower = email.toLowerCase();
    const account = accounts[emailLower];
    if (!account) return;
    const updated = { ...accounts, [emailLower]: { ...account, banned: true, bannedReason: reason } };
    setAccounts(updated);
    api('PATCH', `/api/accounts/${encodeURIComponent(emailLower)}`, { banned: true, bannedReason: reason }).catch(() => {});
  };

  const unbanUser = (email: string) => {
    if (!user?.isModerator) return;
    const emailLower = email.toLowerCase();
    const account = accounts[emailLower];
    if (!account) return;
    const updated = { ...accounts, [emailLower]: { ...account, banned: false, bannedReason: undefined } };
    setAccounts(updated);
    api('PATCH', `/api/accounts/${encodeURIComponent(emailLower)}`, { banned: false, bannedReason: null }).catch(() => {});
  };

  // ── Reports ───────────────────────────────────────────────────────────────
  const hasUserReported = useCallback((targetType: ReportTargetType, targetId: string) => {
    if (!user) return false;
    return reports.some(r => r.targetType === targetType && r.targetId === targetId && r.reporterEmail === user.email);
  }, [user, reports]);

  const submitReport = useCallback((targetType: ReportTargetType, targetId: string, targetTitle: string, reason: ReportReason, note?: string) => {
    if (!user) return;
    if (reports.some(r => r.targetType === targetType && r.targetId === targetId && r.reporterEmail === user.email)) return;
    const profile = profiles[user.email];
    const reporterName = profile?.name || user.email.split('@')[0];
    const newReport: Report = { id: `report-${Date.now()}`, targetType, targetId, targetTitle, reason, note, reporter: reporterName, reporterEmail: user.email, status: 'open', createdAt: new Date().toISOString().split('T')[0] };
    setReports(prev => [newReport, ...prev]);
    api('POST', '/api/reports', newReport).catch(() => {});

    const auditEvent: AuditEvent = { id: crypto.randomUUID(), action: 'report.create', targetType: targetType as any, targetId, byEmail: user.email, at: Date.now(), meta: { reason, targetTitle } };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    api('POST', '/api/audit-log', auditEvent).catch(() => {});
  }, [user, profiles, reports]);

  const updateReportStatus = useCallback((reportId: string, status: ReportStatus, resolutionReason?: string) => {
    const report = reports.find(r => r.id === reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status, resolutionReason } : r));
    api('PATCH', `/api/reports/${reportId}`, { status, resolutionReason }).catch(() => {});
    if (user && report) {
      const auditEvent: AuditEvent = { id: crypto.randomUUID(), action: 'report.status.update', targetType: 'report', targetId: reportId, byEmail: user.email, at: Date.now(), meta: { status, targetTitle: report.targetTitle, resolutionReason } };
      setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
      api('POST', '/api/audit-log', auditEvent).catch(() => {});
    }
  }, [user, reports]);

  // ── Domains ───────────────────────────────────────────────────────────────
  const addAllowedDomain = useCallback((domain: string): boolean => {
    const normalized = domain.toLowerCase().trim().replace(/^@/, '');
    if (!normalized || !/^[a-z0-9]+([\-.][a-z0-9]+)*\.[a-z]{2,}$/i.test(normalized)) return false;
    if (allowedDomains.includes(normalized)) return false;
    setAllowedDomains(prev => [...prev, normalized]);
    api('POST', '/api/settings/domains', { domain: normalized }).catch(() => {});
    return true;
  }, [allowedDomains]);

  const removeAllowedDomain = useCallback((domain: string): boolean => {
    const normalized = domain.toLowerCase().trim();
    if (!allowedDomains.includes(normalized)) return false;
    if (allowedDomains.length <= 1) return false;
    setAllowedDomains(prev => prev.filter(d => d !== normalized));
    api('DELETE', `/api/settings/domains/${encodeURIComponent(normalized)}`).catch(() => {});
    return true;
  }, [allowedDomains]);

  const isEmailDomainAllowed = useCallback((email: string): boolean => {
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return false;
    if (email.toLowerCase() === MODERATOR_EMAIL.toLowerCase()) return true;
    return allowedDomains.includes(domain);
  }, [allowedDomains]);

  // ── RBAC ─────────────────────────────────────────────────────────────────
  const getCurrentUserRole = useCallback((): DaamRole => {
    if (!user) return "student";
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) return "admin";
    const mod = moderators.find(m => m.email.toLowerCase() === user.email.toLowerCase());
    if (mod) return "moderator";
    return "student";
  }, [user, moderators]);

  const currentUserPermissions: DaamPermission[] = (() => {
    if (!user) return [];
    const role = getCurrentUserRole();
    if (role === "admin") return ALL_PERMISSIONS;
    if (role === "moderator") {
      const mod = moderators.find(m => m.email.toLowerCase() === user.email.toLowerCase());
      if (mod && mod.isActive) return mod.permissions;
    }
    return [];
  })();

  const canCurrentUser = useCallback((permission: DaamPermission): boolean => can(getCurrentUserRole(), currentUserPermissions, permission), [getCurrentUserRole, currentUserPermissions]);

  const addAuditEvent = useCallback((event: Omit<AuditEvent, 'id' | 'at'>) => {
    const fullEvent: AuditEvent = { ...event, id: crypto.randomUUID(), at: Date.now() };
    setAuditLog(prev => [fullEvent, ...prev].slice(0, 200));
    api('POST', '/api/audit-log', fullEvent).catch(() => {});
  }, []);

  const createModeratorAccount = useCallback((data: { email: string; displayName: string; tempPassword: string; permissions: DaamPermission[] }): ModeratorAccount => {
    const emailLower = data.email.toLowerCase();
    if (moderators.some(m => m.email.toLowerCase() === emailLower)) throw new Error(lang === 'ar' ? 'هذا البريد مسجل كمشرف مسبقاً' : 'Email already registered as moderator');
    if (authUsers.some(a => a.email.toLowerCase() === emailLower)) throw new Error(lang === 'ar' ? 'هذا البريد مسجل مسبقاً' : 'Email already registered');

    const moderatorId = crypto.randomUUID();
    const authUserId = crypto.randomUUID();
    const now = Date.now();

    const newModerator: ModeratorAccount = { id: moderatorId, email: data.email, displayName: data.displayName, role: "moderator", permissions: uniq(data.permissions), isActive: true, createdAt: now, createdBy: user?.email || 'system' };
    const newAuthUser: LocalAuthUser = { id: authUserId, email: data.email, passwordHash: data.tempPassword, role: "moderator", linkedModeratorId: moderatorId, createdAt: now };

    setModerators(prev => [...prev, newModerator]);
    setAuthUsers(prev => [...prev, newAuthUser]);
    api('POST', '/api/moderators', { moderator: newModerator, authUser: newAuthUser }).catch(() => {});
    return newModerator;
  }, [moderators, authUsers, user, lang]);

  const updateModeratorPermissions = useCallback((moderatorId: string, permissions: DaamPermission[]): void => {
    setModerators(prev => prev.map(m => m.id === moderatorId ? { ...m, permissions: uniq(permissions) } : m));
    api('PATCH', `/api/moderators/${moderatorId}/permissions`, { permissions }).catch(() => {});
  }, []);

  const toggleModeratorActive = useCallback((moderatorId: string): void => {
    setModerators(prev => prev.map(m => m.id === moderatorId ? { ...m, isActive: !m.isActive } : m));
    api('PATCH', `/api/moderators/${moderatorId}/toggle`, {}).catch(() => {});
  }, []);

  const deleteModerator = useCallback((moderatorId: string): void => {
    const mod = moderators.find(m => m.id === moderatorId);
    if (!mod) return;
    setModerators(prev => prev.filter(m => m.id !== moderatorId));
    setAuthUsers(prev => prev.filter(a => a.linkedModeratorId !== moderatorId));
    api('DELETE', `/api/moderators/${moderatorId}`).catch(() => {});
  }, [moderators]);

  const getModeratorByEmail = useCallback((email: string): ModeratorAccount | undefined => moderators.find(m => m.email.toLowerCase() === email.toLowerCase()), [moderators]);

  // ── Mutes ─────────────────────────────────────────────────────────────────
  const isUserMuted = useCallback((userEmail: string): boolean => {
    const record = mutes.find(m => m.userEmail.toLowerCase() === userEmail.toLowerCase());
    if (!record) return false;
    if (record.expiresAt && record.expiresAt < Date.now()) {
      setMutes(prev => prev.filter(m => m.userEmail.toLowerCase() !== userEmail.toLowerCase()));
      api('DELETE', `/api/mutes/${encodeURIComponent(userEmail.toLowerCase())}`).catch(() => {});
      return false;
    }
    return true;
  }, [mutes]);

  const getMuteRecord = useCallback((userEmail: string): MuteRecord | undefined => {
    const record = mutes.find(m => m.userEmail.toLowerCase() === userEmail.toLowerCase());
    if (!record) return undefined;
    if (record.expiresAt && record.expiresAt < Date.now()) {
      setMutes(prev => prev.filter(m => m.userEmail.toLowerCase() !== userEmail.toLowerCase()));
      api('DELETE', `/api/mutes/${encodeURIComponent(userEmail.toLowerCase())}`).catch(() => {});
      return undefined;
    }
    return record;
  }, [mutes]);

  const muteUser = useCallback((userEmail: string, reason?: string, durationMinutes?: number): void => {
    if (!user) return;
    const now = Date.now();
    const expiresAt = durationMinutes ? now + (durationMinutes * 60 * 1000) : undefined;
    const newMuteRecord: MuteRecord = { userEmail: userEmail.toLowerCase(), mutedBy: user.email, reason, mutedAt: now, expiresAt };
    setMutes(prev => { const filtered = prev.filter(m => m.userEmail.toLowerCase() !== userEmail.toLowerCase()); return [...filtered, newMuteRecord]; });
    api('POST', '/api/mutes', newMuteRecord).catch(() => {});
    const auditEvent: AuditEvent = { id: crypto.randomUUID(), action: 'user.mute', targetType: 'user', targetId: userEmail, byEmail: user.email, at: now, meta: { reason, expiresAt } };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    api('POST', '/api/audit-log', auditEvent).catch(() => {});
  }, [user]);

  const unmuteUser = useCallback((userEmail: string): void => {
    if (!user) return;
    setMutes(prev => prev.filter(m => m.userEmail.toLowerCase() !== userEmail.toLowerCase()));
    api('DELETE', `/api/mutes/${encodeURIComponent(userEmail.toLowerCase())}`).catch(() => {});
    const auditEvent: AuditEvent = { id: crypto.randomUUID(), action: 'user.unmute', targetType: 'user', targetId: userEmail, byEmail: user.email, at: Date.now() };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    api('POST', '/api/audit-log', auditEvent).catch(() => {});
  }, [user]);

  // ── Bans ─────────────────────────────────────────────────────────────────
  const banUserWithDuration = useCallback((userEmail: string, reason?: string, durationDays?: number): void => {
    if (!user) return;
    const now = Date.now();
    const expiresAt = durationDays ? now + (durationDays * 24 * 60 * 60 * 1000) : undefined;
    const newBanRecord: BanRecord = { userEmail: userEmail.toLowerCase(), bannedBy: user.email, reason, bannedAt: now, expiresAt };
    setBans(prev => { const filtered = prev.filter(b => b.userEmail.toLowerCase() !== userEmail.toLowerCase()); return [...filtered, newBanRecord]; });
    api('POST', '/api/bans', newBanRecord).catch(() => {});
    const auditEvent: AuditEvent = { id: crypto.randomUUID(), action: 'user.ban', targetType: 'user', targetId: userEmail, byEmail: user.email, at: now, meta: { reason, expiresAt } };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    api('POST', '/api/audit-log', auditEvent).catch(() => {});
    if (user.email.toLowerCase() === userEmail.toLowerCase()) logout();
  }, [user]);

  const unbanUserRecord = useCallback((userEmail: string): void => {
    if (!user) return;
    setBans(prev => prev.filter(b => b.userEmail.toLowerCase() !== userEmail.toLowerCase()));
    api('DELETE', `/api/bans/${encodeURIComponent(userEmail.toLowerCase())}`).catch(() => {});
    const auditEvent: AuditEvent = { id: crypto.randomUUID(), action: 'user.unban', targetType: 'user', targetId: userEmail, byEmail: user.email, at: Date.now() };
    setAuditLog(prev => [auditEvent, ...prev].slice(0, 200));
    api('POST', '/api/audit-log', auditEvent).catch(() => {});
  }, [user]);

  const isUserBanned = useCallback((userEmail: string): { banned: boolean; expiresAt?: number; reason?: string } => {
    const record = bans.find(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());
    if (!record) return { banned: false };
    if (record.expiresAt && record.expiresAt < Date.now()) {
      setBans(prev => prev.filter(b => b.userEmail.toLowerCase() !== userEmail.toLowerCase()));
      api('DELETE', `/api/bans/${encodeURIComponent(userEmail.toLowerCase())}`).catch(() => {});
      return { banned: false };
    }
    return { banned: true, expiresAt: record.expiresAt, reason: record.reason };
  }, [bans]);

  const getBanRecord = useCallback((userEmail: string): BanRecord | undefined => {
    const record = bans.find(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());
    if (!record) return undefined;
    if (record.expiresAt && record.expiresAt < Date.now()) {
      setBans(prev => prev.filter(b => b.userEmail.toLowerCase() !== userEmail.toLowerCase()));
      api('DELETE', `/api/bans/${encodeURIComponent(userEmail.toLowerCase())}`).catch(() => {});
      return undefined;
    }
    return record;
  }, [bans]);

  // ── DM System ─────────────────────────────────────────────────────────────
  const canSendDM = useCallback((targetEmail: string): { allowed: boolean; reason?: string } => {
    const targetAccount = accounts[targetEmail.toLowerCase()];
    if (targetAccount?.allowDM === 'none') return { allowed: false, reason: 'dm_closed' };
    return { allowed: true };
  }, [accounts]);

  const getOrCreateConversation = useCallback((otherEmail: string): Conversation | null => {
    if (!user?.email) return null;
    const myEmail = user.email.toLowerCase();
    const theirEmail = otherEmail.toLowerCase();
    const existing = conversations.find(c => c.participants.includes(myEmail) && c.participants.includes(theirEmail));
    if (existing) return existing;
    const newConv: Conversation = { id: crypto.randomUUID(), participants: [myEmail, theirEmail], lastMessageAt: new Date(0).toISOString(), lastMessagePreview: '', unreadCount: { [myEmail]: 0, [theirEmail]: 0 } };
    setConversations(prev => [...prev, newConv]);
    api('POST', '/api/conversations', newConv).catch(() => {});
    return newConv;
  }, [user, conversations]);

  const getConversationsForUser = useCallback((userEmail: string): Conversation[] => {
    const email = userEmail.toLowerCase();
    return conversations.filter(c => c.participants.includes(email)).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [conversations]);

  const getMessages = useCallback((conversationId: string): DirectMessage[] => {
    return directMessages.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }, [directMessages]);

  const sendDirectMessage = useCallback((conversationId: string, senderEmail: string, content: string): { success: boolean; error?: string } => {
    const sender = senderEmail.toLowerCase();
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return { success: false, error: 'conversation_not_found' };
    const otherEmail = conversation.participants.find(p => p !== sender);
    if (!otherEmail) return { success: false, error: 'invalid_conversation' };
    const dmCheck = canSendDM(otherEmail);
    if (!dmCheck.allowed) return { success: false, error: dmCheck.reason };

    const now = Date.now();
    const recentMessages = directMessages.filter(m => m.conversationId === conversationId && m.senderEmail === sender && new Date(m.sentAt).getTime() > now - 60000);
    if (recentMessages.length >= 10) return { success: false, error: 'rate_limit' };

    const newMessage: DirectMessage = { id: crypto.randomUUID(), conversationId, senderEmail: sender, content, sentAt: new Date().toISOString(), readBy: [sender] };
    setDirectMessages(prev => [...prev, newMessage]);
    api('POST', '/api/messages', newMessage).catch(() => {});

    const updatedConv = { ...conversation, lastMessageAt: newMessage.sentAt, lastMessagePreview: content.slice(0, 50), unreadCount: { ...conversation.unreadCount, [otherEmail]: (conversation.unreadCount[otherEmail] || 0) + 1 } };
    setConversations(prev => prev.map(c => c.id !== conversationId ? c : updatedConv));
    api('PATCH', `/api/conversations/${conversationId}`, updatedConv).catch(() => {});
    return { success: true };
  }, [conversations, directMessages, canSendDM]);

  const markConversationRead = useCallback((conversationId: string, userEmail: string): void => {
    const email = userEmail.toLowerCase();
    setConversations(prev => prev.map(c => c.id !== conversationId ? c : { ...c, unreadCount: { ...c.unreadCount, [email]: 0 } }));
    setDirectMessages(prev => prev.map(m => { if (m.conversationId !== conversationId || m.readBy.includes(email)) return m; return { ...m, readBy: [...m.readBy, email] }; }));
    api('POST', `/api/conversations/${conversationId}/read`, { userEmail: email }).catch(() => {});
  }, []);

  const getUnreadConversationCount = useCallback((userEmail: string): number => {
    const email = userEmail.toLowerCase();
    return conversations.filter(c => c.participants.includes(email) && (c.unreadCount?.[email] ?? 0) > 0).length;
  }, [conversations]);

  const refreshMessages = useCallback(async (): Promise<void> => {
    try {
      const [convData, msgData] = await Promise.all([
        api('GET', '/api/conversations'),
        api('GET', '/api/messages'),
      ]);
      const activeId = activeConversationIdRef.current;
      const userEmail = (localStorage.getItem('daam_user') || '').toLowerCase() || undefined;
      const fetchedConvs: Conversation[] = (convData || []).map((c: Conversation) => {
        // Don't increment unread for the currently open conversation
        if (activeId && c.id === activeId && userEmail) {
          return { ...c, unreadCount: { ...c.unreadCount, [userEmail]: 0 } };
        }
        return c;
      });
      const fetchedMsgs: DirectMessage[] = msgData || [];
      setConversations(prev => {
        // Update if count, ordering, unreadCount, or lastMessageAt changed
        if (prev.length !== fetchedConvs.length) return fetchedConvs;
        const changed = fetchedConvs.some((c, i) => {
          const p = prev[i];
          return c.id !== p.id
            || c.lastMessageAt !== p.lastMessageAt
            || JSON.stringify(c.unreadCount) !== JSON.stringify(p.unreadCount);
        });
        return changed ? fetchedConvs : prev;
      });
      setDirectMessages(prev => {
        if (prev.length === fetchedMsgs.length
          && fetchedMsgs[fetchedMsgs.length - 1]?.id === prev[prev.length - 1]?.id) return prev;
        return fetchedMsgs;
      });
    } catch {}
  }, []);



  // ── Messages polling (every 3s, active from any page after login) ──────────
  useEffect(() => {
    if (!user?.email) return;
    const interval = setInterval(refreshMessages, 3_000);
    return () => clearInterval(interval);
  }, [user?.email, refreshMessages]);

  const refreshPosts = useCallback(async (): Promise<void> => {
    try {
      const data = await api('GET', '/api/posts');
      const fetchedPosts: LocalPost[] = data || [];
      setPosts(prev => {
        if (fetchedPosts.length === prev.length &&
            fetchedPosts[0]?.id === prev[0]?.id &&
            fetchedPosts.every((p, i) => (p.replies?.length ?? 0) === (prev[i]?.replies?.length ?? 0))) return prev;
        return fetchedPosts;
      });
    } catch {}
  }, []);

  const value: DaamStoreContextType = {
    user, lang, theme, posts, profiles, accounts, pendingVerification, isLoading,
    t: DICTIONARY[lang], login, loginSimple, logout, register, resetPassword, changePassword, verifyEmail,
    createPost, deletePost, updatePost, updatePostStatus, toggleLike, toggleSave, addReply, toggleLang, toggleTheme,
    updateProfile, getProfile, getAccount, updateAccount, toggleFollow, isFollowing, banUser, unbanUser,
    deleteReply, editReply, reports, hasUserReported, submitReport, updateReportStatus,
    allowedDomains, addAllowedDomain, removeAllowedDomain, isEmailDomainAllowed,
    moderators, authUsers, currentUserPermissions, createModeratorAccount,
    updateModeratorPermissions, toggleModeratorActive, deleteModerator, getModeratorByEmail, canCurrentUser,
    auditLog, addAuditEvent, mutes, muteUser, unmuteUser, isUserMuted, getMuteRecord,
    bans, banUserWithDuration, unbanUserRecord, isUserBanned, getBanRecord,
    conversations, directMessages, getOrCreateConversation, getConversationsForUser,
    getMessages, sendDirectMessage, markConversationRead, getUnreadConversationCount, canSendDM,
    refreshMessages, refreshPosts, setActiveConversationId,
  };

  return <DaamStoreContext.Provider value={value}>{children}</DaamStoreContext.Provider>;
}

export function useDaamStore() {
  const context = useContext(DaamStoreContext);
  if (!context) throw new Error('useDaamStore must be used within a DaamStoreProvider');
  return context;
}
