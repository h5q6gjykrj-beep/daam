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
  | "admin.settings.manage";

export const ALL_PERMISSIONS: DaamPermission[] = [
  "mod.posts.delete",
  "mod.posts.hide",
  "mod.comments.delete",
  "mod.users.mute",
  "mod.users.ban",
  "admin.moderators.manage",
  "admin.settings.manage"
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

const KEYS = {
  USER: 'daam_user',
  POSTS: 'daam_posts_v2',
  LANG: 'daam_lang',
  PROFILES: 'daam_profiles',
  THEME: 'daam_theme',
  ACCOUNTS: 'daam_accounts',
  PENDING_VERIFICATION: 'daam_pending_verification',
  REPORTS: 'daam_reports_v1',
  REPORTS_OLD: 'daam_reports',
  ALLOWED_DOMAINS: 'daam_allowed_domains_v1'
};

// RBAC localStorage keys
const LS_MODS = "daam_moderators_v1";
const LS_AUTH = "daam_auth_users_v1";
const LS_AUDIT = "daam_audit_v1";

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
  | "report.status.update";

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

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(KEYS.USER);
    const storedLang = localStorage.getItem(KEYS.LANG) as Language;
    const storedPosts = localStorage.getItem(KEYS.POSTS);
    const storedProfiles = localStorage.getItem(KEYS.PROFILES);
    const storedAccounts = localStorage.getItem(KEYS.ACCOUNTS);
    const storedPendingVerification = localStorage.getItem(KEYS.PENDING_VERIFICATION);
    const storedAllowedDomains = localStorage.getItem(KEYS.ALLOWED_DOMAINS);

    if (storedProfiles) {
      try {
        setProfiles(JSON.parse(storedProfiles));
      } catch (e) {
        console.error("Failed to parse profiles", e);
      }
    }
    
    let parsedAccounts: Record<string, UserAccount> = {};
    if (storedAccounts) {
      try {
        parsedAccounts = JSON.parse(storedAccounts);
        setAccounts(parsedAccounts);
      } catch (e) {
        console.error("Failed to parse accounts", e);
      }
    }
    
    if (storedPendingVerification) {
      try {
        setPendingVerification(JSON.parse(storedPendingVerification));
      } catch (e) {
        console.error("Failed to parse pending verification", e);
      }
    }
    
    let storedReports = localStorage.getItem(KEYS.REPORTS);
    if (!storedReports) {
      const oldReports = localStorage.getItem(KEYS.REPORTS_OLD);
      if (oldReports) {
        try {
          const parsed = JSON.parse(oldReports);
          const migrated = parsed.map((r: any) => ({
            ...r,
            status: r.status === 'pending' ? 'open' : r.status
          }));
          localStorage.setItem(KEYS.REPORTS, JSON.stringify(migrated));
          storedReports = JSON.stringify(migrated);
        } catch (e) {
          console.error("Failed to migrate old reports", e);
        }
      }
    }
    if (storedReports) {
      try {
        const parsed = JSON.parse(storedReports);
        const normalized = parsed.map((r: any) => ({
          ...r,
          status: r.status === 'pending' ? 'open' : r.status
        }));
        setReports(normalized);
      } catch (e) {
        console.error("Failed to parse reports", e);
      }
    }

    if (storedUser) {
      let parsedProfiles: Record<string, UserProfile> = {};
      try {
        parsedProfiles = storedProfiles ? JSON.parse(storedProfiles) : {};
      } catch (e) {
        console.error("Failed to parse profiles for user", e);
      }
      const isMod = storedUser.toLowerCase() === MODERATOR_EMAIL.toLowerCase();
      const userAccount = parsedAccounts[storedUser];
      setUser({ 
        email: storedUser, 
        isAdmin: ADMIN_EMAILS.includes(storedUser.toLowerCase()),
        isModerator: isMod,
        profile: parsedProfiles[storedUser],
        account: userAccount
      });
    }
    if (storedLang) setLang(storedLang);
    if (storedPosts) {
      try {
        setPosts(JSON.parse(storedPosts));
      } catch (e) {
        console.error("Failed to parse posts", e);
      }
    }
    
    // Update document direction
    document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = storedLang || 'ar';
    
    // Initialize theme
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
    
    // Initialize demo users if none exist
    const existingProfiles = storedProfiles ? JSON.parse(storedProfiles) : {};
    const existingAccounts = parsedAccounts;
    const demoUsers = [
      {
        email: 'ahmed@utas.edu.om',
        name: 'أحمد محمد',
        major: 'علوم الحاسب',
        university: 'جامعة التقنية والعلوم التطبيقية',
        level: 'السنة الثالثة',
        bio: 'مهتم بالبرمجة والذكاء الاصطناعي',
        college: 'computer_science',
        interests: ['programming', 'it', 'math']
      },
      {
        email: 'fatima@utas.edu.om',
        name: 'فاطمة علي',
        major: 'إدارة الأعمال',
        university: 'جامعة التقنية والعلوم التطبيقية',
        level: 'السنة الثانية',
        bio: 'أحب التعلم ومشاركة المعرفة',
        college: 'economics_business',
        interests: ['business', 'english', 'summaries']
      },
      {
        email: 'mohammed@utas.edu.om',
        name: 'محمد سالم',
        major: 'الهندسة الميكانيكية',
        university: 'جامعة التقنية والعلوم التطبيقية',
        level: 'السنة الرابعة',
        bio: 'مهندس المستقبل',
        college: 'engineering_technology',
        interests: ['engineering', 'physics', 'math']
      },
      {
        email: 'sara@utas.edu.om',
        name: 'سارة خالد',
        major: 'الصيدلة',
        university: 'جامعة التقنية والعلوم التطبيقية',
        level: 'السنة الثالثة',
        bio: 'شغوفة بالعلوم الطبية',
        college: 'applied_sciences_pharmacy',
        interests: ['chemistry', 'biology', 'summaries']
      },
      {
        email: 'omar@utas.edu.om',
        name: 'عمر يوسف',
        major: 'التصميم الجرافيكي',
        university: 'جامعة التقنية والعلوم التطبيقية',
        level: 'السنة الأولى',
        bio: 'مصمم مبدع',
        college: 'creative_industries',
        interests: ['design', 'media', 'it']
      }
    ];
    
    let updatedProfiles = { ...existingProfiles };
    let updatedAccounts = { ...existingAccounts };
    let hasNewData = false;
    
    demoUsers.forEach(demoUser => {
      if (!updatedProfiles[demoUser.email]) {
        updatedProfiles[demoUser.email] = {
          name: demoUser.name,
          major: demoUser.major,
          university: demoUser.university,
          level: demoUser.level,
          bio: demoUser.bio,
          college: demoUser.college,
          interests: demoUser.interests,
          followers: [],
          following: [],
          showFavorites: true,
          showInterests: true
        };
        hasNewData = true;
      }
      if (!updatedAccounts[demoUser.email]) {
        updatedAccounts[demoUser.email] = {
          email: demoUser.email,
          passwordHash: simpleHash('Demo123!'),
          phone: '99999999',
          region: { governorate: 'muscat', wilayat: 'muscat' },
          role: 'student' as const,
          verified: true,
          rememberMe: false,
          createdAt: new Date().toISOString(),
          isDemo: true
        };
        hasNewData = true;
      } else if (!updatedAccounts[demoUser.email].isDemo) {
        updatedAccounts[demoUser.email] = {
          ...updatedAccounts[demoUser.email],
          isDemo: true
        };
        hasNewData = true;
      }
    });
    
    if (hasNewData) {
      setProfiles(updatedProfiles);
      setAccounts(updatedAccounts);
      localStorage.setItem(KEYS.PROFILES, JSON.stringify(updatedProfiles));
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    }

    // Load allowed domains from localStorage
    if (storedAllowedDomains) {
      try {
        const parsedDomains = JSON.parse(storedAllowedDomains);
        if (Array.isArray(parsedDomains) && parsedDomains.length > 0) {
          setAllowedDomains(parsedDomains);
        }
      } catch (e) {
        console.error("Failed to parse allowed domains", e);
      }
    }

    // Load RBAC data from localStorage
    const storedMods = localStorage.getItem(LS_MODS);
    if (storedMods) {
      try {
        setModerators(JSON.parse(storedMods));
      } catch (e) {
        console.error("Failed to parse moderators", e);
      }
    }
    
    const storedAuthUsers = localStorage.getItem(LS_AUTH);
    if (storedAuthUsers) {
      try {
        setAuthUsers(JSON.parse(storedAuthUsers));
      } catch (e) {
        console.error("Failed to parse auth users", e);
      }
    }
    
    // Load audit log
    const storedAudit = localStorage.getItem(LS_AUDIT);
    if (storedAudit) {
      try {
        setAuditLog(JSON.parse(storedAudit));
      } catch (e) {
        console.error("Failed to parse audit log", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Update language effect
  useEffect(() => {
    localStorage.setItem(KEYS.LANG, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Actions
  
  // Full login with password (for registered users)
  const login = (email: string, password: string, rememberMe: boolean = false) => {
    const emailLower = email.toLowerCase();
    const account = accounts[emailLower];
    
    if (!account) {
      throw new Error(lang === 'ar' ? 'هذا الحساب غير مسجل' : 'Account not registered');
    }
    
    if (!account.verified) {
      throw new Error(lang === 'ar' ? 'يرجى تأكيد بريدك الإلكتروني أولاً' : 'Please verify your email first');
    }
    
    if (account.banned) {
      throw new Error(lang === 'ar' ? 'حسابك محظور: ' + account.bannedReason : 'Your account is banned: ' + account.bannedReason);
    }
    
    if (account.passwordHash !== simpleHash(password)) {
      throw new Error(lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
    }
    
    // Update rememberMe status
    const updatedAccounts = {
      ...accounts,
      [emailLower]: { ...account, rememberMe }
    };
    setAccounts(updatedAccounts);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    
    const isAdminEmail = ADMIN_EMAILS.includes(emailLower);
    const isMod = emailLower === MODERATOR_EMAIL.toLowerCase();
    
    localStorage.setItem(KEYS.USER, email);
    setUser({ 
      email, 
      isAdmin: isAdminEmail,
      isModerator: isMod,
      account: updatedAccounts[emailLower],
      profile: profiles[email]
    });
  };
  
  // Simple login - DISABLED for security
  // This function is kept for backward compatibility but always throws an error
  const loginSimple = (_email: string) => {
    throw new Error(lang === 'ar' 
      ? 'الدخول السريع معطل. يرجى استخدام تسجيل الدخول بكلمة المرور.' 
      : 'Quick login is disabled. Please use password login.');
  };
  
  // Register new account - Auto-verified (no email verification required)
  const register = (data: RegistrationData): PendingVerification => {
    const emailLower = data.email.toLowerCase();
    
    // Check if already registered
    if (accounts[emailLower]) {
      throw new Error(lang === 'ar' ? 'هذا البريد مسجل مسبقاً' : 'Email already registered');
    }
    
    // Validate email domain against allowed domains
    const isModerator = emailLower === MODERATOR_EMAIL.toLowerCase();
    const emailDomain = emailLower.split('@')[1];
    const isDomainAllowed = emailDomain && allowedDomains.includes(emailDomain);
    
    if (!isModerator && !isDomainAllowed) {
      throw new Error(lang === 'ar' ? 'يرجى استخدام بريد جامعي معتمد' : 'Please use an approved university email');
    }
    
    // Reject other hotmail emails (unless moderator)
    if (!isModerator && data.email.toLowerCase().includes('@hotmail.')) {
      throw new Error(lang === 'ar' ? 'بريد Hotmail غير مسموح به' : 'Hotmail emails are not allowed');
    }
    
    // Create account - automatically verified
    const newAccount: UserAccount = {
      email: data.email,
      passwordHash: simpleHash(data.password),
      phone: data.phone,
      region: {
        governorate: data.governorate,
        wilayat: data.wilayat
      },
      role: isModerator ? 'moderator' : 'student',
      verified: true, // Auto-verified
      createdAt: new Date().toISOString()
    };
    
    const updatedAccounts = { ...accounts, [emailLower]: newAccount };
    setAccounts(updatedAccounts);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    
    // Create default profile
    const defaultProfile: UserProfile = {
      email: data.email,
      name: data.name,
      bio: '',
      major: '',
      university: 'UTAS',
      followers: [],
      following: []
    };
    const updatedProfiles = { ...profiles, [data.email]: defaultProfile };
    setProfiles(updatedProfiles);
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(updatedProfiles));
    
    // Return verification object (for backward compatibility)
    const verification: PendingVerification = {
      email: data.email,
      token: '',
      expiry: ''
    };
    
    return verification;
  };
  
  // Verify email with token
  const verifyEmail = (token: string): boolean => {
    // Find account with this token
    const accountEntry = Object.entries(accounts).find(
      ([_, acc]) => acc.verificationToken === token
    );
    
    if (!accountEntry) {
      return false;
    }
    
    const [email, account] = accountEntry;
    
    // Check expiry
    if (account.verificationExpiry && new Date(account.verificationExpiry) < new Date()) {
      return false;
    }
    
    // Mark as verified
    const updatedAccounts = {
      ...accounts,
      [email]: {
        ...account,
        verified: true,
        verificationToken: undefined,
        verificationExpiry: undefined
      }
    };
    setAccounts(updatedAccounts);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    
    // Clear pending verification
    setPendingVerification(null);
    localStorage.removeItem(KEYS.PENDING_VERIFICATION);
    
    return true;
  };

  const logout = () => {
    localStorage.removeItem(KEYS.USER);
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
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
  };

  const updateProfile = (email: string, profileData: Partial<UserProfile>) => {
    const updatedProfiles = {
      ...profiles,
      [email]: {
        ...profiles[email],
        ...profileData
      }
    };
    setProfiles(updatedProfiles);
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(updatedProfiles));
    
    // Update user object if it's the current user
    if (user?.email === email) {
      setUser({
        ...user,
        profile: updatedProfiles[email]
      });
    }
  };

  const getProfile = useCallback((email: string): UserProfile | undefined => {
    return profiles[email];
  }, [profiles]);

  const getAccount = useCallback((email: string): UserAccount | undefined => {
    // Only return account data if the requester is the account owner (checked by caller)
    return accounts[email];
  }, [accounts]);

  const toggleSave = (postId: string) => {
    if (!user) return;
    const updatedPosts = posts.map(post => {
      if (post.id !== postId) return post;
      const savedBy = post.savedBy || [];
      const isSaved = savedBy.includes(user.email);
      return {
        ...post,
        savedBy: isSaved 
          ? savedBy.filter(email => email !== user.email)
          : [...savedBy, user.email]
      };
    });
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
  };

  const deletePost = (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Allow deletion if user is admin, moderator, or the post author
    if (!user.isAdmin && !user.isModerator && post.authorEmail !== user.email) return;
    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
  };

  const updatePost = (postId: string, content: string, postType?: PostType, subject?: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Allow update if user is moderator or the post author
    if (!user.isModerator && post.authorEmail !== user.email) return;
    const updatedPosts = posts.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        content,
        postType: postType || p.postType,
        subject: subject !== undefined ? subject : p.subject,
        updatedAt: new Date().toISOString()
      };
    });
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
  };

  const toggleLike = (postId: string) => {
    if (!user) return;
    const updatedPosts = posts.map(post => {
      if (post.id !== postId) return post;
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(user.email);
      return {
        ...post,
        likedBy: isLiked 
          ? likedBy.filter(email => email !== user.email)
          : [...likedBy, user.email]
      };
    });
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
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
    const updatedPosts = posts.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        replies: [...(post.replies || []), newReply]
      };
    });
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
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
    
    const updatedProfiles = {
      ...profiles,
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
    };
    
    setProfiles(updatedProfiles);
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(updatedProfiles));
  };

  const isFollowing = (targetEmail: string): boolean => {
    if (!user) return false;
    const currentUserProfile = profiles[user.email];
    return currentUserProfile?.following?.includes(targetEmail) || false;
  };
  
  // Moderator functions
  const banUser = (email: string, reason: string) => {
    if (!user?.isModerator) return;
    const emailLower = email.toLowerCase();
    const account = accounts[emailLower];
    if (!account) return;
    
    const updatedAccounts = {
      ...accounts,
      [emailLower]: {
        ...account,
        banned: true,
        bannedReason: reason
      }
    };
    setAccounts(updatedAccounts);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
  };
  
  const unbanUser = (email: string) => {
    if (!user?.isModerator) return;
    const emailLower = email.toLowerCase();
    const account = accounts[emailLower];
    if (!account) return;
    
    const updatedAccounts = {
      ...accounts,
      [emailLower]: {
        ...account,
        banned: false,
        bannedReason: undefined
      }
    };
    setAccounts(updatedAccounts);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
  };
  
  const deleteReply = (postId: string, replyId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const reply = post.replies?.find(r => r.id === replyId);
    if (!reply) return;
    
    // Allow deletion if user is moderator or the reply author
    if (!user.isModerator && reply.authorEmail !== user.email) return;
    
    const updatedPosts = posts.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        replies: p.replies?.filter(r => r.id !== replyId) || []
      };
    });
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
  };
  
  const editReply = (postId: string, replyId: string, content: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const reply = post.replies?.find(r => r.id === replyId);
    if (!reply) return;
    
    // Allow edit if user is moderator or the reply author
    if (!user.isModerator && reply.authorEmail !== user.email) return;
    
    const updatedPosts = posts.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        replies: p.replies?.map(r => 
          r.id === replyId ? { ...r, content } : r
        ) || []
      };
    });
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
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
    
    const updatedReports = [newReport, ...reports];
    setReports(updatedReports);
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(updatedReports));
    
    // Add audit event for report creation
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      action: 'report.create',
      targetType: targetType as any, // post, comment, or user
      targetId,
      byEmail: user.email,
      at: Date.now(),
      meta: { reason, targetTitle }
    };
    setAuditLog(prev => {
      const updated = [auditEvent, ...prev].slice(0, 200);
      localStorage.setItem(LS_AUDIT, JSON.stringify(updated));
      return updated;
    });
  }, [user, profiles, reports]);

  const updateReportStatus = useCallback((reportId: string, status: ReportStatus, resolutionReason?: string) => {
    const report = reports.find(r => r.id === reportId);
    const updatedReports = reports.map(r => 
      r.id === reportId 
        ? { ...r, status, resolutionReason } 
        : r
    );
    setReports(updatedReports);
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(updatedReports));
    
    // Add audit event for status update (if user is logged in)
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
      setAuditLog(prev => {
        const updated = [auditEvent, ...prev].slice(0, 200);
        localStorage.setItem(LS_AUDIT, JSON.stringify(updated));
        return updated;
      });
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
    localStorage.setItem(KEYS.ALLOWED_DOMAINS, JSON.stringify(updated));
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
    const updated = allowedDomains.filter(d => d !== normalized);
    setAllowedDomains(updated);
    localStorage.setItem(KEYS.ALLOWED_DOMAINS, JSON.stringify(updated));
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
    
    setAuditLog(prev => {
      // Add at the beginning, limit to 200 entries
      const updated = [fullEvent, ...prev].slice(0, 200);
      localStorage.setItem(LS_AUDIT, JSON.stringify(updated));
      return updated;
    });
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
    // TODO: Use Web Crypto SHA-256 for proper hashing
    const newAuthUser: LocalAuthUser = {
      id: authUserId,
      email: data.email,
      passwordHash: data.tempPassword, // TODO: Replace with proper hash
      role: "moderator",
      linkedModeratorId: moderatorId,
      createdAt: now
    };
    
    // Update state and localStorage
    const updatedMods = [...moderators, newModerator];
    const updatedAuthUsers = [...authUsers, newAuthUser];
    
    setModerators(updatedMods);
    setAuthUsers(updatedAuthUsers);
    localStorage.setItem(LS_MODS, JSON.stringify(updatedMods));
    localStorage.setItem(LS_AUTH, JSON.stringify(updatedAuthUsers));
    
    return newModerator;
  }, [moderators, authUsers, user, lang]);

  // Update moderator permissions
  const updateModeratorPermissions = useCallback((moderatorId: string, permissions: DaamPermission[]): void => {
    const updatedMods = moderators.map(m => 
      m.id === moderatorId 
        ? { ...m, permissions: uniq(permissions) } 
        : m
    );
    setModerators(updatedMods);
    localStorage.setItem(LS_MODS, JSON.stringify(updatedMods));
  }, [moderators]);

  // Toggle moderator active status
  const toggleModeratorActive = useCallback((moderatorId: string): void => {
    const updatedMods = moderators.map(m => 
      m.id === moderatorId 
        ? { ...m, isActive: !m.isActive } 
        : m
    );
    setModerators(updatedMods);
    localStorage.setItem(LS_MODS, JSON.stringify(updatedMods));
  }, [moderators]);

  // Delete moderator (and linked authUser)
  const deleteModerator = useCallback((moderatorId: string): void => {
    const mod = moderators.find(m => m.id === moderatorId);
    if (!mod) return;
    
    const updatedMods = moderators.filter(m => m.id !== moderatorId);
    const updatedAuthUsers = authUsers.filter(a => a.linkedModeratorId !== moderatorId);
    
    setModerators(updatedMods);
    setAuthUsers(updatedAuthUsers);
    localStorage.setItem(LS_MODS, JSON.stringify(updatedMods));
    localStorage.setItem(LS_AUTH, JSON.stringify(updatedAuthUsers));
  }, [moderators, authUsers]);

  // Get moderator by email
  const getModeratorByEmail = useCallback((email: string): ModeratorAccount | undefined => {
    return moderators.find(m => m.email.toLowerCase() === email.toLowerCase());
  }, [moderators]);

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
    addAuditEvent
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
