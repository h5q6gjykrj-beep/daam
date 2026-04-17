import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Globe, ArrowRight, ArrowLeft, ArrowUpLeft, Sun, Moon, Eye, EyeOff, Fingerprint, KeyRound, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Biometric quick-login state
  const [biometricInfo, setBiometricInfo] = useState<{ email: string; name: string } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('daam_biometric');
      if (stored && 'PublicKeyCredential' in window) {
        setBiometricInfo(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const { login, biometricLogin, lang, toggleLang, theme, toggleTheme } = useDaamStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const isRTL = lang === 'ar';
  
  const tr = {
    title: lang === 'ar' ? 'تسجيل الدخول' : 'Login',
    subtitle: lang === 'ar' ? 'منصة التعاون الطلابي' : 'Student Collaboration Platform',
    email: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',
    emailPlaceholder: lang === 'ar' ? 'البريد الجامعي (@utas.edu.om)' : 'University Email (@utas.edu.om)',
    password: lang === 'ar' ? 'كلمة المرور' : 'Password',
    rememberMe: lang === 'ar' ? 'تذكرني' : 'Remember me',
    loginBtn: lang === 'ar' ? 'دخول' : 'Login',
    noAccount: lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?",
    createAccount: lang === 'ar' ? 'إنشاء حساب' : 'Create Account',
    biometric: lang === 'ar' ? 'الدخول بالبصمة' : 'Biometric Login',
    home: lang === 'ar' ? 'الرئيسية' : 'Home',
    onlyUniversity: lang === 'ar' ? 'متاح فقط لحسابات @utas.edu.om' : 'Only @utas.edu.om accounts supported',
    forgotPassword: lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    forgotTitle: lang === 'ar' ? 'استعادة كلمة المرور' : 'Reset Password',
    forgotDesc: lang === 'ar' ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين' : 'Enter your email and we\'ll send you a reset link',
    sendLink: lang === 'ar' ? 'إرسال رابط الاستعادة' : 'Send Reset Link',
    sentTitle: lang === 'ar' ? 'تم الإرسال!' : 'Email Sent!',
    sentDesc: lang === 'ar' ? 'إذا كان البريد مسجلاً، ستصله رسالة تحتوي على رابط إعادة تعيين كلمة المرور. تحقق من صندوق الوارد.' : 'If this email is registered, you\'ll receive a password reset link. Check your inbox.',
    backToLogin: lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login',
    tapBiometric: lang === 'ar' ? 'اضغط للدخول بالبصمة' : 'Tap to sign in with biometrics',
    usePassword: lang === 'ar' ? 'تسجيل الدخول بكلمة المرور' : 'Sign in with password',
    notYou: lang === 'ar' ? 'ليس أنت؟' : 'Not you?',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, rememberMe);
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

  const [biometricLoading, setBiometricLoading] = useState(false);

  // Called from biometric screen (no email required — uses stored email)
  const handleBiometricLogin = async (targetEmail?: string) => {
    const loginEmail = targetEmail ?? biometricInfo?.email ?? email;
    if (!loginEmail) {
      toast({ title: lang === 'ar' ? 'أدخل البريد الإلكتروني أولاً' : 'Enter your email first', variant: 'destructive' });
      return;
    }
    setBiometricLoading(true);
    try {
      await biometricLogin(loginEmail, rememberMe);
      setLocation('/dashboard');
      toast({ title: lang === 'ar' ? 'أهلاً بك!' : 'Welcome back!', description: lang === 'ar' ? 'تم الدخول بالبصمة بنجاح' : 'Biometric login successful' });
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') return;
      // If no credentials found on server, clear localStorage and show password form
      if (err?.message?.includes('يجب تسجيل البصمة') || err?.message?.includes('register biometrics')) {
        localStorage.removeItem('daam_biometric');
        setBiometricInfo(null);
      }
      toast({ title: lang === 'ar' ? 'فشل الدخول بالبصمة' : 'Biometric login failed', description: err?.message, variant: 'destructive' });
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetSent(true);
    } catch {
      // show sent state anyway to avoid email enumeration
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 pt-16 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-background to-background">
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 rtl:left-auto rtl:right-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="rounded-full border-white/10 bg-black/20 backdrop-blur-md hover:bg-white/10 gap-2"
          data-testid="button-back-home"
        >
          <ArrowUpLeft className="w-4 h-4" />
          {tr.home}
        </Button>
      </div>
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 rtl:right-auto rtl:left-4 flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleTheme}
          className="rounded-full border-white/10 dark:border-white/10 bg-black/20 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/10 w-9 h-9"
          data-testid="button-toggle-theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button 
          variant="outline" 
          onClick={toggleLang}
          className="rounded-full border-white/10 dark:border-white/10 bg-black/20 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/10"
        >
          <Globe className="w-4 h-4 me-2" />
          {lang === 'en' ? 'العربية' : 'English'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
      {biometricInfo && !showPasswordForm ? (
        /* ── Biometric quick-login screen ── */
        <motion.div
          key="biometric-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="glass-panel border-0 overflow-hidden shadow-2xl shadow-black/50">
            <div className="h-2 bg-gradient-to-r from-primary to-gray-500 w-full" />
            <CardContent className="p-8 flex flex-col items-center text-center gap-6">
              <img src={daamLogo} alt="DAAM Logo" className="h-16 mx-auto" />

              <div>
                <h2 className="text-2xl font-bold">
                  {lang === 'ar' ? `مرحباً ${biometricInfo.name}!` : `Welcome back, ${biometricInfo.name}!`}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{biometricInfo.email}</p>
              </div>

              {/* Fingerprint icon button */}
              <button
                onClick={() => handleBiometricLogin()}
                disabled={biometricLoading}
                className="group relative flex items-center justify-center w-32 h-32 rounded-full border-2 border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label={tr.tapBiometric}
              >
                {biometricLoading
                  ? <Loader2 className="w-14 h-14 text-primary animate-spin" />
                  : <Fingerprint className="w-14 h-14 text-primary group-hover:text-primary/80 transition-colors" />
                }
                {/* Pulse ring */}
                {!biometricLoading && (
                  <span className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
                )}
              </button>

              <p className="text-sm text-muted-foreground">{tr.tapBiometric}</p>

              {/* Divider */}
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'أو' : 'or'}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowPasswordForm(true)}
              >
                <Lock className="w-4 h-4" />
                {tr.usePassword}
              </Button>

              <button
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline transition-colors"
                onClick={() => {
                  localStorage.removeItem('daam_biometric');
                  setBiometricInfo(null);
                }}
              >
                {tr.notYou}
              </button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
      /* ── Normal login screen ── */
      <motion.div
        key="password-screen"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
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
              {tr.subtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{tr.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={tr.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/20 border-white/10 h-12 text-base focus:border-primary/50 transition-colors"
                  dir="ltr"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{tr.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/20 border-white/10 h-12 text-base focus:border-primary/50 transition-colors"
                    style={{ paddingLeft: '1rem', paddingRight: '3rem' }}
                    dir="ltr"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox 
                    id="rememberMe" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    data-testid="checkbox-remember-me"
                  />
                  <label 
                    htmlFor="rememberMe" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {tr.rememberMe}
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotPassword(true);
                  }}
                  data-testid="button-forgot-password"
                >
                  {tr.forgotPassword}
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                data-testid="button-login"
              >
                {tr.loginBtn}
                {isRTL ? <ArrowLeft className="w-5 h-5 me-2" /> : <ArrowRight className="w-5 h-5 ms-2" />}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base gap-2"
                onClick={() => handleBiometricLogin(email || undefined)}
                disabled={biometricLoading}
                data-testid="button-biometric"
              >
                {biometricLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
                {tr.biometric}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {tr.noAccount}{' '}
                <Button 
                  variant="ghost" 
                  className="p-0 h-auto text-primary hover:bg-transparent hover:underline"
                  onClick={() => setLocation('/register')}
                  data-testid="link-register"
                >
                  {tr.createAccount}
                </Button>
              </p>
              <p className="text-xs text-muted-foreground/50">
                {tr.onlyUniversity}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      )}
      </AnimatePresence>

      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        if (!open) { setShowForgotPassword(false); setResetEmail(""); setResetSent(false); }
      }}>
        <DialogContent className="sm:max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          {!resetSent ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  {tr.forgotTitle}
                </DialogTitle>
                <DialogDescription>{tr.forgotDesc}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleForgotPassword} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{tr.email}</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="example@utas.edu.om"
                    dir="ltr"
                    required
                    data-testid="input-reset-email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resetLoading} data-testid="button-send-reset">
                  {resetLoading ? (isRTL ? 'جاري الإرسال...' : 'Sending...') : tr.sendLink}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mb-4">
                <KeyRound className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{tr.sentTitle}</h3>
              <p className="text-sm text-muted-foreground mb-5">{tr.sentDesc}</p>
              <Button className="w-full" onClick={() => { setShowForgotPassword(false); setResetEmail(""); setResetSent(false); }} data-testid="button-back-to-login">
                {tr.backToLogin}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
