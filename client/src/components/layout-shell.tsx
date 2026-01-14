import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { LogOut, Bot, LayoutGrid, Globe } from "lucide-react";
import { motion } from "framer-motion";

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
            onClick={() => setLocation('/feed')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
              D
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">DAAM</span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Nav Items */}
            <div className="hidden md:flex items-center gap-1 mr-2 rtl:mr-0 rtl:ml-2">
              <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-white/5">
                {user.email}
              </span>
            </div>

            <Button
              variant={location === '/tutor' ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation(location === '/tutor' ? '/feed' : '/tutor')}
              className={location === '/tutor' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}
            >
              {location === '/tutor' ? <LayoutGrid className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> : <Bot className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />}
              {location === '/tutor' ? t.backToFeed : t.tutorBtn}
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
