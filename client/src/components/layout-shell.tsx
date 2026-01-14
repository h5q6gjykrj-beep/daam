import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Bot, Shield, Home, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

interface LayoutShellProps {
  children: ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const { user, logout, t, lang, toggleLang } = useDaamStore();
  const [location, setLocation] = useLocation();

  if (!user) return <>{children}</>;

  const tr = {
    home: lang === 'ar' ? 'الرئيسية' : 'Home',
    feed: lang === 'ar' ? 'الساحة' : 'Feed',
    tutor: lang === 'ar' ? 'المساعد' : 'AI',
    profile: lang === 'ar' ? 'الملف' : 'Profile',
    admin: lang === 'ar' ? 'مشرف' : 'Admin',
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => setLocation('/dashboard')}
            data-testid="link-logo-home"
          >
            <img 
              src={daamLogo} 
              alt="DAAM Logo" 
              className="h-9"
              data-testid="img-logo-header"
            />
          </div>

          <div className="flex items-center gap-2">
            {user.isAdmin && (
              <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary border-primary/30 hidden sm:flex">
                <Shield className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                {tr.admin}
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleLang}
              className="w-8 h-8 border-white/10 hover:bg-white/5 text-xs font-bold"
              data-testid="button-toggle-lang"
            >
              {lang === 'en' ? 'ع' : 'EN'}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 w-8 h-8"
              title={t.logoutBtn}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl relative pb-24">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/95 backdrop-blur-md safe-area-bottom">
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
                    {item.label}
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
