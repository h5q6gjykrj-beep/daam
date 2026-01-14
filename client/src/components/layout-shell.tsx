import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Bot, Globe, Shield, Home, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

interface LayoutShellProps {
  children: ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const { user, logout, t, lang, toggleLang } = useDaamStore();
  const [location, setLocation] = useLocation();

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setLocation('/dashboard')}
            data-testid="link-logo-home"
          >
            <img 
              src={daamLogo} 
              alt="DAAM Logo" 
              className="h-10"
              data-testid="img-logo-header"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Nav Items */}
            <div className="hidden md:flex items-center gap-2 mr-2 rtl:mr-0 rtl:ml-2">
              {user.isAdmin && (
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                  <Shield className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                  {lang === 'ar' ? 'مشرف' : 'Admin'}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-white/5">
                {user.email}
              </span>
            </div>

            <Button
              variant={location === '/dashboard' ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className={location === '/dashboard' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}
              data-testid="nav-dashboard"
            >
              <Home className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Button>

            <Button
              variant={location === '/feed' ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation('/feed')}
              className={location === '/feed' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}
              data-testid="nav-feed"
            >
              <MessageSquare className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'المنتدى' : 'Feed'}</span>
            </Button>

            <Button
              variant={location === '/tutor' ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation('/tutor')}
              className={location === '/tutor' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}
              data-testid="nav-tutor"
            >
              <Bot className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              <span className="hidden sm:inline">{t.tutorBtn}</span>
            </Button>

            <Button
              variant={location.startsWith('/profile') ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation('/profile')}
              className={location.startsWith('/profile') ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}
              data-testid="nav-profile"
            >
              <User className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'الملف' : 'Profile'}</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleLang}
              className="w-9 h-9 border-white/10 hover:bg-white/5"
            >
              <span className="font-bold text-xs">{lang === 'en' ? 'ع' : 'EN'}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 w-9 h-9"
              title={t.logoutBtn}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl relative">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} DAAM Platform. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </div>
      </footer>
    </div>
  );
}
