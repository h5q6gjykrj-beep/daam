import { useState, useEffect, useCallback } from "react";
import { type LocalPost } from "@shared/schema";

// Types
export type Language = 'ar' | 'en';
export type User = { email: string };

const KEYS = {
  USER: 'daam_user',
  POSTS: 'daam_posts_v1',
  LANG: 'daam_lang'
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
    recentPosts: "Recent Discussions"
  },
  ar: {
    welcome: "مرحباً بكم في داعم",
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
    recentPosts: "أحدث النقاشات"
  }
};

export function useDaamStore() {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(KEYS.USER);
    const storedLang = localStorage.getItem(KEYS.LANG) as Language;
    const storedPosts = localStorage.getItem(KEYS.POSTS);

    if (storedUser) setUser({ email: storedUser });
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
    document.documentElement.lang = storedLang || 'en';
    
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
    if (!email.endsWith('@utas.edu.om')) {
      throw new Error(DICTIONARY[lang].invalidEmail);
    }
    localStorage.setItem(KEYS.USER, email);
    setUser({ email });
  };

  const logout = () => {
    localStorage.removeItem(KEYS.USER);
    setUser(null);
  };

  const createPost = (content: string) => {
    if (!user || !content.trim()) return;
    
    const newPost: LocalPost = {
      id: crypto.randomUUID(),
      authorEmail: user.email,
      content,
      createdAt: new Date().toISOString()
    };
    
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(updatedPosts));
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  return {
    user,
    lang,
    posts,
    isLoading,
    t: DICTIONARY[lang],
    login,
    logout,
    createPost,
    toggleLang
  };
}
