import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Globe, MessageSquare, Sparkles, Users, FileText, Heart, 
  ArrowLeft, ArrowRight, BookOpen, Zap, GraduationCap, TrendingUp,
  Sun, Moon
} from "lucide-react";
import { motion } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";
import { COLLEGES, getCollegeLabel, getCollegeColor } from "@/lib/colleges";
import { getWhyDaamCardsSettings, WHY_DAAM_CARDS_KEY, type WhyDaamCardsSettings } from "@/pages/admin";
import { 
  getLandingNavbarConfig, 
  LANDING_NAVBAR_CONFIG_KEY, 
  type LandingNavbarConfig, 
  type LandingNavbarItem 
} from "@/lib/landing-navbar-config";

interface OfficialPage {
  id: 'privacy' | 'contact' | 'terms';
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  status: 'draft' | 'published' | 'archived';
  updatedAt: string;
  updatedBy: string;
}

const OFFICIAL_PAGES_KEY = 'daam_official_pages_v1';

function getPublishedOfficialPage(pageId: 'privacy' | 'contact' | 'terms'): OfficialPage | null {
  try {
    const stored = localStorage.getItem(OFFICIAL_PAGES_KEY);
    if (stored) {
      const pages: OfficialPage[] = JSON.parse(stored);
      const page = pages.find(p => p.id === pageId && p.status === 'published');
      return page || null;
    }
  } catch {}
  return null;
}

export default function Landing() {
  const { posts, t, lang, toggleLang, theme, toggleTheme, getProfile } = useDaamStore();
  const [_, setLocation] = useLocation();
  const isRTL = lang === 'ar';

  // Official page modals - reactive to localStorage changes
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [privacyPage, setPrivacyPage] = useState<OfficialPage | null>(null);
  const [contactPage, setContactPage] = useState<OfficialPage | null>(null);
  
  // Why DAAM cards visibility - reactive to admin changes
  const [whyDaamCards, setWhyDaamCards] = useState<WhyDaamCardsSettings>(getWhyDaamCardsSettings());

  // Landing Navbar config - reactive to admin changes
  const [landingNavbarConfig, setLandingNavbarConfig] = useState<LandingNavbarConfig>(getLandingNavbarConfig());

  const refreshOfficialPages = useCallback(() => {
    setPrivacyPage(getPublishedOfficialPage('privacy'));
    setContactPage(getPublishedOfficialPage('contact'));
  }, []);
  
  const refreshWhyDaamCards = useCallback(() => {
    setWhyDaamCards(getWhyDaamCardsSettings());
  }, []);

  const refreshLandingNavbarConfig = useCallback(() => {
    setLandingNavbarConfig(getLandingNavbarConfig());
  }, []);

  useEffect(() => {
    // Initial load
    refreshOfficialPages();
    refreshWhyDaamCards();
    refreshLandingNavbarConfig();

    // Listen for storage events (when admin updates content in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === OFFICIAL_PAGES_KEY) {
        refreshOfficialPages();
      }
      if (e.key === WHY_DAAM_CARDS_KEY) {
        refreshWhyDaamCards();
      }
      if (e.key === LANDING_NAVBAR_CONFIG_KEY) {
        refreshLandingNavbarConfig();
      }
    };

    // Listen for custom event (when admin updates content in the same tab)
    const handleOfficialPagesUpdated = () => {
      refreshOfficialPages();
    };
    
    const handleWhyDaamCardsUpdated = () => {
      refreshWhyDaamCards();
    };

    const handleLandingNavbarConfigUpdated = () => {
      refreshLandingNavbarConfig();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('officialPagesUpdated', handleOfficialPagesUpdated);
    window.addEventListener('whyDaamCardsUpdated', handleWhyDaamCardsUpdated);
    window.addEventListener('landingNavbarConfigUpdated', handleLandingNavbarConfigUpdated);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('officialPagesUpdated', handleOfficialPagesUpdated);
      window.removeEventListener('whyDaamCardsUpdated', handleWhyDaamCardsUpdated);
      window.removeEventListener('landingNavbarConfigUpdated', handleLandingNavbarConfigUpdated);
    };
  }, [refreshOfficialPages, refreshWhyDaamCards, refreshLandingNavbarConfig]);

  const trendingPosts = [...posts]
    .sort((a, b) => {
      const aScore = (a.likedBy?.length || 0) + (a.replies?.length || 0) * 2;
      const bScore = (b.likedBy?.length || 0) + (b.replies?.length || 0) * 2;
      return bScore - aScore;
    })
    .slice(0, 4);

  const todayPosts = posts.filter(p => {
    const postDate = new Date(p.createdAt);
    const today = new Date();
    return postDate.toDateString() === today.toDateString();
  });

  const subjectCounts = posts.reduce((acc, post) => {
    if (post.subject) {
      acc[post.subject] = (acc[post.subject] || 0) +
        (post.likedBy?.length || 0) + (post.replies?.length || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const hotTopics = Object.entries(subjectCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([subject]) => subject);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    const profile = getProfile(email);
    if (profile?.name) return profile.name;
    return email.split('@')[0];
  };

  const tr = {
    heroTitle: lang === 'ar' ? 'مجتمع طلابي يناقش، يشرح، ويتعلم معًا' : 'A student community that discusses, explains, and learns together',
    heroSubtitle: lang === 'ar' ? 'انضم لزملائك في ساحة نقاش تفاعلية واستفد من المساعد الذكي' : 'Join your peers in an interactive discussion arena with AI assistance',
    enterArena: lang === 'ar' ? 'ادخل ساحة النقاش' : 'Enter Discussion Arena',
    startNow: lang === 'ar' ? 'ابدأ الآن' : 'Start Now',
    login: lang === 'ar' ? 'تسجيل الدخول' : 'Login',
    createAccount: lang === 'ar' ? 'إنشاء حساب' : 'Create Account',
    home: lang === 'ar' ? 'الرئيسية' : 'Home',
    arena: lang === 'ar' ? 'ساحة النقاش' : 'Discussion Arena',
    aiAssistant: lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant',
    liveActivity: lang === 'ar' ? 'النشاط الحي' : 'Live Activity',
    activeDiscussions: lang === 'ar' ? 'نقاشات نشطة' : 'Active Discussions',
    studentsOnline: lang === 'ar' ? 'طلاب متواجدون' : 'Students Online',
    trendingSubject: lang === 'ar' ? 'المادة الأكثر تفاعلاً' : 'Trending Subject',
    trendingDiscussions: lang === 'ar' ? 'المنشورات الأكثر تفاعلاً' : 'Trending Discussions',
    hotTopics: lang === 'ar' ? 'المواضيع الساخنة' : 'Hot Topics',
    whyDaam: lang === 'ar' ? 'لماذا دام؟' : 'Why DAAM?',
    feature1Title: lang === 'ar' ? 'ساحة نقاش طلابية' : 'Student Discussion Arena',
    feature1Desc: lang === 'ar' ? 'شارك أسئلتك وأفكارك مع زملائك' : 'Share questions and ideas with peers',
    feature2Title: lang === 'ar' ? 'مساعد ذكي يشرح لك' : 'AI Assistant Explains',
    feature2Desc: lang === 'ar' ? 'احصل على تفسيرات فورية لأي موضوع' : 'Get instant explanations for any topic',
    feature3Title: lang === 'ar' ? 'ملخصات وملفات' : 'Summaries & Files',
    feature3Desc: lang === 'ar' ? 'شارك وحمّل ملفات دراسية مفيدة' : 'Share and download useful study files',
    feature4Title: lang === 'ar' ? 'مجتمع جامعي حقيقي' : 'Real University Community',
    feature4Desc: lang === 'ar' ? 'تواصل مع طلاب من تخصصك' : 'Connect with students from your major',
    footerLinks: lang === 'ar' ? 'روابط سريعة' : 'Quick Links',
    privacy: lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
    contact: lang === 'ar' ? 'تواصل معنا' : 'Contact Us',
    terms: lang === 'ar' ? 'الشروط والأحكام' : 'Terms',
    likes: lang === 'ar' ? 'إعجاب' : 'likes',
    comments: lang === 'ar' ? 'تعليق' : 'comments',
    pageUnderConstruction: lang === 'ar' ? 'هذه الصفحة قيد الإعداد' : 'This page is under construction',
    close: lang === 'ar' ? 'إغلاق' : 'Close',
  };

  const topSubject = hotTopics[0];
  const topSubjectLabel = getCollegeLabel(topSubject, lang) || topSubject;

  // Helper to handle navbar item actions
  const handleNavItemAction = (item: LandingNavbarItem) => {
    if (item.action === 'toggle:lang') {
      toggleLang();
    } else if (item.action === 'toggle:theme') {
      toggleTheme();
    } else if (item.action.startsWith('route:')) {
      const route = item.action.replace('route:', '');
      setLocation(route);
    } else if (item.action.startsWith('scroll:')) {
      const target = item.action.replace('scroll:', '');
      if (target === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const element = document.querySelector(target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  // Get sorted and enabled navbar items
  const enabledNavItems = landingNavbarConfig.items
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  // Separate nav links (scroll/route items that aren't buttons) from action items (buttons, toggles)
  const navLinkItems = enabledNavItems.filter(item => 
    !item.isButton && !item.isIcon && item.action !== 'toggle:lang' && item.action !== 'toggle:theme'
  );
  const actionItems = enabledNavItems.filter(item => 
    item.isButton || item.isIcon || item.action === 'toggle:lang' || item.action === 'toggle:theme'
  );

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={daamLogo} alt="DAAM" className="h-10" data-testid="img-logo-nav" />
            <span className="font-bold text-lg hidden sm:block">دام</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            {navLinkItems.map(item => (
              <button
                key={item.key}
                onClick={() => handleNavItemAction(item)}
                className="text-sm font-medium transition-colors bg-transparent border-none cursor-pointer hover-elevate"
                data-testid={`link-landing-${item.key}`}
              >
                {item.label[lang]}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-2">
            {actionItems.map(item => {
              // Theme toggle
              if (item.action === 'toggle:theme') {
                return (
                  <Button 
                    key={item.key}
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleNavItemAction(item)}
                    data-testid="button-toggle-theme"
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                );
              }
              // Language toggle
              if (item.action === 'toggle:lang') {
                return (
                  <Button 
                    key={item.key}
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleNavItemAction(item)}
                    className="gap-1.5"
                    data-testid="button-toggle-lang"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label[lang]}</span>
                  </Button>
                );
              }
              // Button items (login, register, or any generic button)
              if (item.isButton) {
                return (
                  <Button 
                    key={item.key}
                    variant={item.buttonVariant || 'default'}
                    size="sm"
                    onClick={() => handleNavItemAction(item)}
                    data-testid={item.key === 'login' ? 'button-login' : item.key === 'register' ? 'button-create-account' : `button-landing-${item.key}`}
                  >
                    {item.label[lang]}
                  </Button>
                );
              }
              return null;
            })}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/30 via-background to-background" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1
              data-testid="hero-title"
              className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 gradient-text ${isRTL ? "inline-block pb-2 py-[0.06em] [text-wrap:balance] [font-family:'IBM_Plex_Sans_Arabic',var(--font-ar)]" : 'leading-tight'}`}
              style={isRTL ? { lineHeight: 1.6 } : undefined}
            >
              {tr.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {tr.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setLocation('/login')}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 text-lg h-12 px-8 gap-2"
                data-testid="button-start-now"
              >
                {tr.startNow}
                {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setLocation('/login')}
                className="border-white/20 hover:bg-white/5 text-lg h-12 px-8"
                data-testid="button-enter-arena"
              >
                {tr.enterArena}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Activity Section */}
      <section className="py-12 border-y border-white/5 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6 text-center">{tr.liveActivity}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 text-center bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-violet-400" />
                <p className="text-2xl font-bold">{posts.length}</p>
                <p className="text-sm text-muted-foreground">{tr.activeDiscussions}</p>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 text-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="text-2xl font-bold">{Math.max(todayPosts.length * 3, 12)}</p>
                <p className="text-sm text-muted-foreground">{tr.studentsOnline}</p>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 text-center bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-lg font-bold">{topSubjectLabel || '-'}</p>
                <p className="text-sm text-muted-foreground">{tr.trendingSubject}</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Discussions Section */}
      {trendingPosts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">{tr.trendingDiscussions}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {trendingPosts.map((post, index) => {
                const profile = getProfile(post.authorEmail);
                
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="p-4 hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => setLocation('/login')}
                      data-testid={`card-trending-post-${index}`}
                    >
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10 border border-violet-500/30">
                          <AvatarImage src={profile?.avatarUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-600 to-gray-500 text-white text-sm">
                            {getInitials(post.authorEmail)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{getDisplayName(post.authorEmail)}</span>
                            {post.subject && (
                              <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${getCollegeColor(post.subject)}`}>
                                {getCollegeLabel(post.subject, lang)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {post.likedBy?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {post.replies?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Hot Topics Section */}
      {hotTopics.length > 0 && (
        <section className="py-12 bg-card/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-center">{tr.hotTopics}</h2>
            <div className="flex flex-col gap-2 max-w-3xl mx-auto">
              {hotTopics.map((topic, index) => {
                return (
                  <motion.div
                    key={topic}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setLocation('/login')}
                      className={`w-full justify-start border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-base ${getCollegeColor(topic)}`}
                      data-testid={`button-topic-${topic}`}
                    >
                      #{getCollegeLabel(topic, lang)}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why DAAM Section - only show if at least one card is enabled */}
      {(() => {
        const allCards = [
          { id: 'why_discussion' as const, icon: MessageSquare, title: tr.feature1Title, desc: tr.feature1Desc, color: 'violet' },
          { id: 'why_ai' as const, icon: Sparkles, title: tr.feature2Title, desc: tr.feature2Desc, color: 'blue' },
          { id: 'why_files' as const, icon: FileText, title: tr.feature3Title, desc: tr.feature3Desc, color: 'green' },
          { id: 'why_community' as const, icon: GraduationCap, title: tr.feature4Title, desc: tr.feature4Desc, color: 'orange' },
        ];
        const visibleCards = allCards.filter(card => whyDaamCards[card.id]);
        
        if (visibleCards.length === 0) return null;
        
        return (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-12 text-center">{tr.whyDaam}</h2>
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${visibleCards.length <= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6 max-w-5xl mx-auto`}>
                {visibleCards.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`why-card-${feature.id}`}
                  >
                    <Card className="p-6 text-center h-full hover:border-primary/30 transition-all">
                      <feature.icon className={`w-10 h-10 mx-auto mb-4 text-${feature.color}-400`} />
                      <h3 className="font-bold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={daamLogo} alt="DAAM" className="h-8" />
              <span className="font-bold">دام - DAAM</span>
            </div>
            
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPrivacyModalOpen(true)}
                data-testid="button-footer-privacy"
              >
                {tr.privacy}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setContactModalOpen(true)}
                data-testid="button-footer-contact"
              >
                {tr.contact}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/terms')}
                data-testid="button-footer-terms"
              >
                {tr.terms}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleLang}
                className="gap-1.5"
                data-testid="button-footer-language"
              >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'العربية' : 'English'}
              </Button>
            </nav>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-8">
            &copy; 2024 DAAM - {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </p>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{tr.privacy}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {privacyPage ? (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                {lang === 'ar' ? privacyPage.content_ar : privacyPage.content_en}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">{tr.pageUnderConstruction}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Us Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{tr.contact}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {contactPage ? (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                {lang === 'ar' ? contactPage.content_ar : contactPage.content_en}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">{tr.pageUnderConstruction}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
