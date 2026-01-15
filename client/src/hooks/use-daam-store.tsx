import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { type LocalPost, type LocalReply, type PostType, type UserProfile, type Attachment } from "@shared/schema";

// Types
export type Language = 'ar' | 'en';
export type User = { email: string; isAdmin: boolean; profile?: UserProfile };

// Admin Configuration - add admin emails here
export const ADMIN_EMAILS = [
  'w.qq89@hotmail.com'
];

const KEYS = {
  USER: 'daam_user',
  POSTS: 'daam_posts_v2',
  LANG: 'daam_lang',
  PROFILES: 'daam_profiles'
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

interface DaamStoreContextType {
  user: User | null;
  lang: Language;
  posts: LocalPost[];
  profiles: Record<string, UserProfile>;
  isLoading: boolean;
  t: typeof DICTIONARY.en;
  login: (email: string) => void;
  logout: () => void;
  createPost: (content: string, postType?: PostType, subject?: string, imageUrl?: string, attachments?: Attachment[]) => void;
  deletePost: (postId: string) => void;
  updatePost: (postId: string, content: string, postType?: PostType, subject?: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addReply: (postId: string, content: string, parentReplyId?: string) => void;
  toggleLang: () => void;
  updateProfile: (email: string, profile: Partial<UserProfile>) => void;
  getProfile: (email: string) => UserProfile | undefined;
  toggleFollow: (targetEmail: string) => void;
  isFollowing: (targetEmail: string) => boolean;
}

const DaamStoreContext = createContext<DaamStoreContextType | null>(null);

export function DaamStoreProvider({ children }: { children: ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ar');
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(KEYS.USER);
    const storedLang = localStorage.getItem(KEYS.LANG) as Language;
    const storedPosts = localStorage.getItem(KEYS.POSTS);
    const storedProfiles = localStorage.getItem(KEYS.PROFILES);

    if (storedProfiles) {
      try {
        setProfiles(JSON.parse(storedProfiles));
      } catch (e) {
        console.error("Failed to parse profiles", e);
      }
    }

    if (storedUser) {
      let parsedProfiles: Record<string, UserProfile> = {};
      try {
        parsedProfiles = storedProfiles ? JSON.parse(storedProfiles) : {};
      } catch (e) {
        console.error("Failed to parse profiles for user", e);
      }
      setUser({ 
        email: storedUser, 
        isAdmin: ADMIN_EMAILS.includes(storedUser.toLowerCase()),
        profile: parsedProfiles[storedUser]
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
    
    setIsLoading(false);
  }, []);

  // Update language effect
  useEffect(() => {
    localStorage.setItem(KEYS.LANG, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Actions
  const login = (email: string) => {
    const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
    // Allow admin emails OR university emails
    if (!isAdminEmail && !email.endsWith('@utas.edu.om')) {
      throw new Error(DICTIONARY[lang].invalidEmail);
    }
    localStorage.setItem(KEYS.USER, email);
    setUser({ 
      email, 
      isAdmin: isAdminEmail 
    });
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
    // Allow deletion if user is admin or the post author
    if (!user.isAdmin && post.authorEmail !== user.email) return;
    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
  };

  const updatePost = (postId: string, content: string, postType?: PostType, subject?: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Only allow update if user is the post author
    if (post.authorEmail !== user.email) return;
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

  const value: DaamStoreContextType = {
    user,
    lang,
    posts,
    profiles,
    isLoading,
    t: DICTIONARY[lang],
    login,
    logout,
    createPost,
    deletePost,
    updatePost,
    toggleLike,
    toggleSave,
    addReply,
    toggleLang,
    updateProfile,
    getProfile,
    toggleFollow,
    isFollowing
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
