import { useState } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Sun, Moon, Eye, EyeOff, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { lang, toggleLang, theme, toggleTheme } = useDaamStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const isRTL = lang === 'ar';

  // Read token from URL query string
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';

  const tr = {
    title: lang === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password',
    subtitle: lang === 'ar' ? 'منصة التعاون الطلابي' : 'Student Collaboration Platform',
    newPassword: lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password',
    confirmPassword: lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password',
    changeBtn: lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password',
    mismatch: lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
    tooShort: lang === 'ar' ? 'كلمة المرور قصيرة جداً (٦ أحرف على الأقل)' : 'Password too short (min 6 characters)',
    invalidToken: lang === 'ar' ? 'الرابط غير صالح أو منتهي الصلاحية' : 'Invalid or expired reset link',
    expiredToken: lang === 'ar' ? 'انتهت صلاحية الرابط' : 'Reset link has expired',
    missingFields: lang === 'ar' ? 'البيانات غير مكتملة' : 'Token and password required',
    serverError: lang === 'ar' ? 'حدث خطأ في الخادم' : 'Server error',
    connectionError: lang === 'ar' ? 'خطأ في الاتصال' : 'Connection error',
    errorTitle: lang === 'ar' ? 'خطأ' : 'Error',
    successTitle: lang === 'ar' ? 'تم التغيير!' : 'Password Changed!',
    successDesc: lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.' : 'Your password has been changed. You can now log in.',
    backToLogin: lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login',
    noToken: lang === 'ar' ? 'لا يوجد رمز إعادة تعيين في الرابط' : 'No reset token found in link',
  };

  const localizeServerError = (error?: string) => {
    if (!error) return tr.invalidToken;
    if (error.includes('expired')) return tr.expiredToken;
    if (error.includes('Invalid') || error.includes('invalid')) return tr.invalidToken;
    if (error.includes('Token and password') || error.includes('required')) return tr.missingFields;
    if (error.includes('characters') || error.includes('6')) return tr.tooShort;
    return lang === 'ar' ? tr.serverError : error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({ title: tr.invalidToken, description: tr.noToken, variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: tr.tooShort, variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: tr.mismatch, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: tr.errorTitle, description: localizeServerError(data.error ?? data.message), variant: 'destructive' });
        return;
      }
      toast({ title: tr.successTitle, description: tr.successDesc });
      setLocation('/login');
    } catch {
      toast({ title: tr.connectionError, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 pt-16 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-background to-background">
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 rtl:right-auto rtl:left-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full border-white/10 dark:border-white/10 bg-black/20 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/10 w-9 h-9"
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
            />
            <div className="flex items-center justify-center gap-2">
              <KeyRound className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-bold tracking-tight">{tr.title}</CardTitle>
            </div>
            <CardDescription className="text-base text-muted-foreground">
              {tr.subtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">{tr.newPassword}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/20 border-white/10 h-12 text-base focus:border-primary/50 transition-colors"
                    style={{ paddingLeft: '1rem', paddingRight: '3rem' }}
                    dir="ltr"
                    required
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

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{tr.confirmPassword}</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-black/20 border-white/10 h-12 text-base focus:border-primary/50 transition-colors"
                    style={{ paddingLeft: '1rem', paddingRight: '3rem' }}
                    dir="ltr"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                disabled={loading}
              >
                {loading ? (isRTL ? 'جاري التغيير...' : 'Changing...') : tr.changeBtn}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setLocation('/login')}
              >
                {tr.backToLogin}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
