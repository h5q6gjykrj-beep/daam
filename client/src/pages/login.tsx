import { useState } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, ArrowRight, ArrowLeft, ArrowUpLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const { login, t, lang, toggleLang } = useDaamStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      login(email);
      setLocation("/dashboard");
      toast({
        title: lang === 'en' ? "Welcome back!" : "أهلاً بك!",
        description: lang === 'en' ? "Successfully logged in to DAAM." : "تم تسجيل الدخول بنجاح لمنصة دام.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: lang === 'en' ? "Access Denied" : "خطأ في الدخول",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isRTL = lang === 'ar';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-background to-background">
      <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="rounded-full border-white/10 bg-black/20 backdrop-blur-md hover:bg-white/10 gap-2"
          data-testid="button-back-home"
        >
          <ArrowUpLeft className="w-4 h-4" />
          {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </Button>
      </div>
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
        <Button 
          variant="outline" 
          onClick={toggleLang}
          className="rounded-full border-white/10 bg-black/20 backdrop-blur-md hover:bg-white/10"
        >
          <Globe className="w-4 h-4 mr-2" />
          {lang === 'en' ? 'العربية' : 'English'}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="glass-panel border-0 overflow-hidden shadow-2xl shadow-black/50">
          <div className="h-2 bg-gradient-to-r from-primary to-gray-500 w-full" />
          
          <CardHeader className="text-center pt-8 pb-2 space-y-3">
            <img 
              src={daamLogo} 
              alt="DAAM Logo" 
              className="h-20 mx-auto mb-2"
              data-testid="img-logo-login"
            />
            <CardTitle className="text-3xl font-bold tracking-tight">منصة دام</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {t.loginSubtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/20 border-white/10 h-12 text-base focus:border-primary/50 transition-colors"
                  dir="ltr" // Email is always LTR
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                {t.loginBtn}
                {isRTL ? <ArrowLeft className="w-5 h-5 mr-2" /> : <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground/50">
                {lang === 'en' ? 'Only @utas.edu.om accounts supported' : 'متاح فقط لحسابات @utas.edu.om'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
