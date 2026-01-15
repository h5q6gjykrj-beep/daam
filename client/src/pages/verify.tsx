import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

export default function Verify() {
  const search = useSearch();
  const [_, setLocation] = useLocation();
  const { verifyEmail, lang } = useDaamStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const token = new URLSearchParams(search).get('token');

  const tr = {
    verifying: lang === 'ar' ? 'جاري التحقق...' : 'Verifying...',
    successTitle: lang === 'ar' ? 'تم التحقق بنجاح!' : 'Verified Successfully!',
    successDesc: lang === 'ar' ? 'تم تفعيل حسابك. يمكنك الآن تسجيل الدخول.' : 'Your account is now active. You can now login.',
    errorTitle: lang === 'ar' ? 'فشل التحقق' : 'Verification Failed',
    errorDesc: lang === 'ar' ? 'الرابط غير صالح أو منتهي الصلاحية. يرجى التسجيل مرة أخرى.' : 'Invalid or expired link. Please register again.',
    goToLogin: lang === 'ar' ? 'الذهاب لتسجيل الدخول' : 'Go to Login',
    goToRegister: lang === 'ar' ? 'التسجيل مرة أخرى' : 'Register Again',
  };

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const timer = setTimeout(() => {
      const success = verifyEmail(token);
      setStatus(success ? 'success' : 'error');
    }, 1500);

    return () => clearTimeout(timer);
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-background to-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="glass-panel border-0 overflow-hidden shadow-2xl shadow-black/50">
          <div className={`h-2 w-full ${status === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : status === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-primary to-gray-500'}`} />
          
          <CardHeader className="text-center pt-8 pb-4 space-y-4">
            <img 
              src={daamLogo} 
              alt="DAAM Logo" 
              className="h-16 mx-auto mb-2"
              data-testid="img-logo-verify"
            />
            
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">{tr.verifying}</CardTitle>
              </>
            )}
            
            {status === 'success' && (
              <>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                <CardTitle className="text-2xl font-bold tracking-tight text-green-500" data-testid="text-success-title">
                  {tr.successTitle}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {tr.successDesc}
                </CardDescription>
              </>
            )}
            
            {status === 'error' && (
              <>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center"
                >
                  <XCircle className="w-8 h-8 text-red-500" />
                </motion.div>
                <CardTitle className="text-2xl font-bold tracking-tight text-red-500" data-testid="text-error-title">
                  {tr.errorTitle}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {tr.errorDesc}
                </CardDescription>
              </>
            )}
          </CardHeader>

          {status !== 'loading' && (
            <CardContent className="p-6">
              {status === 'success' ? (
                <Button 
                  onClick={() => setLocation('/login')}
                  className="w-full h-11 bg-green-500 hover:bg-green-600"
                  data-testid="button-go-to-login"
                >
                  {tr.goToLogin}
                </Button>
              ) : (
                <Button 
                  onClick={() => setLocation('/register')}
                  className="w-full h-11"
                  data-testid="button-go-to-register"
                >
                  {tr.goToRegister}
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
