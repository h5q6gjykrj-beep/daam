import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Bot, Shield, Home, MessageSquare, User, Menu, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

interface LayoutShellProps {
  children: ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const { user, logout, t, lang, toggleLang, theme, toggleTheme } = useDaamStore();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMobileMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen, isMobile]);

  if (!user) return <>{children}</>;

  const tr = {
    home: lang === 'ar' ? 'الرئيسية' : 'Home',
    feed: lang === 'ar' ? 'ساحة النقاش' : 'Discussion Arena',
    tutor: lang === 'ar' ? 'المساعد الذكي' : 'AI Tutor',
    profile: lang === 'ar' ? 'الملف الشخصي' : 'Profile',
    admin: lang === 'ar' ? 'مشرف' : 'Admin',
    login: lang === 'ar' ? 'تسجيل الدخول' : 'Login',
  };

  const navItems = [
    { path: '/dashboard', label: tr.home, icon: Home },
    { path: '/feed', label: tr.feed, icon: MessageSquare },
    { path: '/tutor', label: tr.tutor, icon: Bot },
    { path: '/profile', label: tr.profile, icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/profile') return location.startsWith('/profile');
    return location === path;
  };

  const handleNavClick = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-9 h-9"
              data-testid="button-hamburger-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setLocation('/dashboard')}
              data-testid="link-logo-home"
            >
              <img 
                src={daamLogo} 
                alt="DAAM Logo" 
                className="h-8 md:h-9"
                data-testid="img-logo-header"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    active 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                  data-testid={`nav-desktop-${item.path.replace('/', '')}`}
                >
                  <item.icon className={`w-4 h-4 ${active ? 'text-primary' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user.isAdmin && (
              <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary border-primary/30 hidden sm:flex">
                <Shield className="w-3 h-3 me-1" />
                {tr.admin}
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="w-8 h-8 border-white/10 dark:border-white/10 hover:bg-white/5 dark:hover:bg-white/5"
              data-testid="button-toggle-theme"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleLang}
              className="w-8 h-8 border-white/10 dark:border-white/10 hover:bg-white/5 dark:hover:bg-white/5 text-xs font-bold"
              data-testid="button-toggle-lang"
            >
              {lang === 'en' ? 'ع' : 'EN'}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 w-8 h-8 hidden md:flex"
              title={t.logoutBtn}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              data-testid="overlay-mobile-menu"
            />
            
            <motion.div
              initial={{ x: lang === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-0 ${lang === 'ar' ? 'right-0' : 'left-0'} z-[70] h-full w-72 bg-background border-e border-white/10 shadow-2xl md:hidden`}
              data-testid="sidebar-mobile-menu"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <img 
                    src={daamLogo} 
                    alt="DAAM Logo" 
                    className="h-8"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-9 h-9"
                    data-testid="button-close-menu"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavClick(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-base ${
                          active 
                            ? 'text-primary bg-primary/10 font-medium' 
                            : 'text-foreground hover:bg-white/5'
                        }`}
                        data-testid={`nav-mobile-${item.path.replace('/', '')}`}
                      >
                        <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-3">
                  {user.isAdmin && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary font-medium">{tr.admin}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={toggleTheme}
                      className="flex-1 border-border"
                      data-testid="button-toggle-theme-mobile"
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4 me-2" /> : <Moon className="w-4 h-4 me-2" />}
                      {theme === 'dark' ? (lang === 'ar' ? 'نهاري' : 'Light') : (lang === 'ar' ? 'ليلي' : 'Dark')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={toggleLang}
                      className="flex-1 border-border"
                      data-testid="button-toggle-lang-mobile"
                    >
                      {lang === 'en' ? 'العربية' : 'English'}
                    </Button>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="w-full"
                    data-testid="button-logout-mobile"
                  >
                    <LogOut className="w-4 h-4 me-2" />
                    {t.logoutBtn}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 container mx-auto px-4 py-4 md:py-6 max-w-4xl relative pb-20 md:pb-6">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/95 backdrop-blur-md safe-area-bottom md:hidden">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    active 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                  data-testid={`nav-bottom-${item.path.replace('/', '')}`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                  <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>
                    {item.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
