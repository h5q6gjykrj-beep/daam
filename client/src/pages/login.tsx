import { useState } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Globe, ArrowRight, ArrowLeft, ArrowUpLeft, Sun, Moon, Eye, EyeOff, Fingerprint, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const { login, resetPassword, lang, toggleLang, theme, toggleTheme } = useDaamStore();
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
    resetPassword: lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password',
    resetPasswordDesc: lang === 'ar' ? 'متاح فقط لحسابات المشرفين' : 'Available only for moderator accounts',
    newPassword: lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password',
    confirmPassword: lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password',
    passwordMismatch: lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
    resetBtn: lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password',
    passwordResetSuccess: lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
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

  const handleBiometricLogin = async () => {
    if (!('credentials' in navigator) || !('PublicKeyCredential' in window)) {
      toast({
        title: lang === 'ar' ? 'غير مدعوم' : 'Not Supported',
        description: lang === 'ar' ? 'المتصفح لا يدعم الدخول بالبصمة' : 'Browser does not support biometric login',
        variant: 'destructive'
      });
      return;
    }
    
    toast({
      title: lang === 'ar' ? 'قريباً' : 'Coming Soon',
      description: lang === 'ar' ? 'سيتم دعم الدخول بالبصمة قريباً' : 'Biometric login will be available soon',
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: tr.passwordMismatch,
        variant: 'destructive'
      });
      return;
    }
    
    try {
      resetPassword(resetEmail, newPassword);
      toast({
        title: lang === 'ar' ? 'تم بنجاح' : 'Success',
        description: tr.passwordResetSuccess,
      });
      setShowForgotPassword(false);
      setResetEmail("");
      setNewPassword("");
      setConfirmNewPassword("");
      // Pre-fill login email
      setEmail(resetEmail);
    } catch (error: any) {
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
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
          {tr.home}
        </Button>
      </div>
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex items-center gap-2">
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
                    className="bg-black/20 border-white/10 h-12 text-base focus:border-primary/50 transition-colors pe-12"
                    dir="ltr"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0 h-12 w-12 hover:bg-transparent"
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
                onClick={handleBiometricLogin}
                data-testid="button-biometric"
              >
                <Fingerprint className="w-5 h-5" />
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

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              {tr.resetPassword}
            </DialogTitle>
            <DialogDescription>
              {tr.resetPasswordDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{tr.email}</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="w.qq89@hotmail.com"
                dir="ltr"
                required
                data-testid="input-reset-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{tr.newPassword}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pe-12"
                  dir="ltr"
                  required
                  minLength={6}
                  data-testid="input-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-10 w-10 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{tr.confirmPassword}</Label>
              <Input
                id="confirm-password"
                type={showNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                dir="ltr"
                required
                minLength={6}
                data-testid="input-confirm-password"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="button-reset-password">
              {tr.resetBtn}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
