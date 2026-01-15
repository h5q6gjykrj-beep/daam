import { useState } from "react";
import { useLocation } from "wouter";
import { useDaamStore, type RegistrationData } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, ArrowRight, ArrowLeft, ArrowUpLeft, Sun, Moon, Eye, EyeOff, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import daamLogo from "@assets/لوجو_خلفية_1768385143943.png";

const GOVERNORATES = {
  ar: [
    { value: 'muscat', label: 'محافظة مسقط' },
    { value: 'dhofar', label: 'محافظة ظفار' },
    { value: 'musandam', label: 'محافظة مسندم' },
    { value: 'buraimi', label: 'محافظة البريمي' },
    { value: 'dakhiliyah', label: 'محافظة الداخلية' },
    { value: 'north_batinah', label: 'محافظة شمال الباطنة' },
    { value: 'south_batinah', label: 'محافظة جنوب الباطنة' },
    { value: 'north_sharqiyah', label: 'محافظة شمال الشرقية' },
    { value: 'south_sharqiyah', label: 'محافظة جنوب الشرقية' },
    { value: 'dhahirah', label: 'محافظة الظاهرة' },
    { value: 'wusta', label: 'محافظة الوسطى' },
  ],
  en: [
    { value: 'muscat', label: 'Muscat Governorate' },
    { value: 'dhofar', label: 'Dhofar Governorate' },
    { value: 'musandam', label: 'Musandam Governorate' },
    { value: 'buraimi', label: 'Al Buraimi Governorate' },
    { value: 'dakhiliyah', label: 'Ad Dakhiliyah Governorate' },
    { value: 'north_batinah', label: 'North Al Batinah Governorate' },
    { value: 'south_batinah', label: 'South Al Batinah Governorate' },
    { value: 'north_sharqiyah', label: 'North Ash Sharqiyah Governorate' },
    { value: 'south_sharqiyah', label: 'South Ash Sharqiyah Governorate' },
    { value: 'dhahirah', label: 'Ad Dhahirah Governorate' },
    { value: 'wusta', label: 'Al Wusta Governorate' },
  ]
};

const WILAYAT: Record<string, { ar: string; en: string }[]> = {
  muscat: [
    { ar: 'مسقط', en: 'Muscat' },
    { ar: 'مطرح', en: 'Muttrah' },
    { ar: 'بوشر', en: 'Bawshar' },
    { ar: 'السيب', en: 'As Seeb' },
    { ar: 'العامرات', en: 'Al Amrat' },
    { ar: 'قريات', en: 'Qurayyat' },
  ],
  dhofar: [
    { ar: 'صلالة', en: 'Salalah' },
    { ar: 'طاقة', en: 'Taqah' },
    { ar: 'مرباط', en: 'Mirbat' },
    { ar: 'ثمريت', en: 'Thumrait' },
    { ar: 'رخيوت', en: 'Rakhyut' },
  ],
  dakhiliyah: [
    { ar: 'نزوى', en: 'Nizwa' },
    { ar: 'بهلاء', en: 'Bahla' },
    { ar: 'منح', en: 'Manah' },
    { ar: 'أدم', en: 'Adam' },
    { ar: 'الحمراء', en: 'Al Hamra' },
    { ar: 'إزكي', en: 'Izki' },
    { ar: 'سمائل', en: 'Samail' },
    { ar: 'بدبد', en: 'Bidbid' },
  ],
  north_batinah: [
    { ar: 'صحار', en: 'Sohar' },
    { ar: 'شناص', en: 'Shinas' },
    { ar: 'لوى', en: 'Liwa' },
    { ar: 'صحم', en: 'Saham' },
    { ar: 'الخابورة', en: 'Al Khaburah' },
    { ar: 'السويق', en: 'As Suwaiq' },
  ],
  south_batinah: [
    { ar: 'الرستاق', en: 'Rustaq' },
    { ar: 'العوابي', en: 'Al Awabi' },
    { ar: 'نخل', en: 'Nakhal' },
    { ar: 'وادي المعاول', en: 'Wadi Al Maawil' },
    { ar: 'بركاء', en: 'Barka' },
    { ar: 'المصنعة', en: 'Al Musannah' },
  ],
  north_sharqiyah: [
    { ar: 'إبراء', en: 'Ibra' },
    { ar: 'المضيبي', en: 'Al Mudhaibi' },
    { ar: 'بدية', en: 'Bidiyah' },
    { ar: 'القابل', en: 'Al Qabil' },
    { ar: 'وادي بني خالد', en: 'Wadi Bani Khalid' },
    { ar: 'دماء والطائيين', en: 'Dama Wa At Taiyyin' },
  ],
  south_sharqiyah: [
    { ar: 'صور', en: 'Sur' },
    { ar: 'جعلان بني بو علي', en: 'Jaalan Bani Bu Ali' },
    { ar: 'جعلان بني بو حسن', en: 'Jaalan Bani Bu Hassan' },
    { ar: 'الكامل والوافي', en: 'Al Kamil Wal Wafi' },
    { ar: 'مصيرة', en: 'Masirah' },
  ],
  dhahirah: [
    { ar: 'عبري', en: 'Ibri' },
    { ar: 'ينقل', en: 'Yanqul' },
    { ar: 'ضنك', en: 'Dhank' },
  ],
  buraimi: [
    { ar: 'البريمي', en: 'Al Buraimi' },
    { ar: 'محضة', en: 'Mahdah' },
    { ar: 'السنينة', en: 'As Sunaynah' },
  ],
  musandam: [
    { ar: 'خصب', en: 'Khasab' },
    { ar: 'بخا', en: 'Bukha' },
    { ar: 'دبا', en: 'Dibba' },
    { ar: 'مدحاء', en: 'Madha' },
  ],
  wusta: [
    { ar: 'هيماء', en: 'Haima' },
    { ar: 'محوت', en: 'Mahout' },
    { ar: 'الدقم', en: 'Ad Duqm' },
    { ar: 'الجازر', en: 'Al Jazir' },
  ],
};

export default function Register() {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    phone: '',
    governorate: '',
    wilayat: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [verificationLink, setVerificationLink] = useState('');
  
  const { register, lang, toggleLang, theme, toggleTheme } = useDaamStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const isRTL = lang === 'ar';
  const governorates = GOVERNORATES[lang];
  const wilayatOptions = formData.governorate ? WILAYAT[formData.governorate] || [] : [];

  const tr = {
    title: lang === 'ar' ? 'إنشاء حساب' : 'Create Account',
    subtitle: lang === 'ar' ? 'انضم إلى مجتمع دام الطلابي' : 'Join the DAAM student community',
    email: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',
    emailPlaceholder: lang === 'ar' ? 'البريد الجامعي (@utas.edu.om)' : 'University Email (@utas.edu.om)',
    password: lang === 'ar' ? 'كلمة المرور' : 'Password',
    confirmPassword: lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    phonePlaceholder: lang === 'ar' ? '+968 XXXXXXXX' : '+968 XXXXXXXX',
    governorate: lang === 'ar' ? 'المحافظة' : 'Governorate',
    wilayat: lang === 'ar' ? 'الولاية' : 'Wilayat',
    selectGovernorate: lang === 'ar' ? 'اختر المحافظة' : 'Select Governorate',
    selectWilayat: lang === 'ar' ? 'اختر الولاية' : 'Select Wilayat',
    register: lang === 'ar' ? 'تسجيل' : 'Register',
    haveAccount: lang === 'ar' ? 'لديك حساب؟' : 'Already have an account?',
    login: lang === 'ar' ? 'تسجيل الدخول' : 'Login',
    passwordMismatch: lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
    passwordTooShort: lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
    fillAllFields: lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
    verificationTitle: lang === 'ar' ? 'تحقق من بريدك' : 'Verify Your Email',
    verificationDesc: lang === 'ar' ? 'تم إرسال رابط التحقق إلى بريدك الإلكتروني. انقر على الرابط لتفعيل حسابك.' : 'A verification link has been sent to your email. Click the link to activate your account.',
    simulatedLink: lang === 'ar' ? 'رابط التحقق (للتطوير):' : 'Verification Link (Development):',
    copyLink: lang === 'ar' ? 'نسخ الرابط' : 'Copy Link',
    copied: lang === 'ar' ? 'تم النسخ!' : 'Copied!',
    goToVerify: lang === 'ar' ? 'الذهاب للتحقق' : 'Go to Verify',
    backToLogin: lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.phone || !formData.governorate || !formData.wilayat) {
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: tr.fillAllFields,
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: tr.passwordTooShort,
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.password !== confirmPassword) {
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: tr.passwordMismatch,
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const verification = register(formData);
      setVerificationLink(`${window.location.origin}/verify?token=${verification.token}`);
      setStep('verification');
      toast({
        title: lang === 'ar' ? 'تم التسجيل!' : 'Registered!',
        description: lang === 'ar' ? 'يرجى التحقق من بريدك الإلكتروني' : 'Please verify your email',
      });
    } catch (error: any) {
      toast({
        title: lang === 'ar' ? 'خطأ في التسجيل' : 'Registration Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationLink);
    toast({
      title: tr.copied,
      duration: 2000
    });
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
          {lang === 'ar' ? 'الرئيسية' : 'Home'}
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
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="glass-panel border-0 overflow-hidden shadow-2xl shadow-black/50">
                <div className="h-2 bg-gradient-to-r from-primary to-gray-500 w-full" />
                
                <CardHeader className="text-center pt-6 pb-2 space-y-2">
                  <img 
                    src={daamLogo} 
                    alt="DAAM Logo" 
                    className="h-16 mx-auto mb-2"
                    data-testid="img-logo-register"
                  />
                  <CardTitle className="text-2xl font-bold tracking-tight">{tr.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {tr.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{tr.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={tr.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-black/20 border-white/10 h-11 focus:border-primary/50"
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
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="bg-black/20 border-white/10 h-11 focus:border-primary/50 pe-10"
                          dir="ltr"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-0 top-0 h-11 w-11 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{tr.confirmPassword}</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-black/20 border-white/10 h-11 focus:border-primary/50"
                        dir="ltr"
                        data-testid="input-confirm-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{tr.phone}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={tr.phonePlaceholder}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-black/20 border-white/10 h-11 focus:border-primary/50"
                        dir="ltr"
                        data-testid="input-phone"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{tr.governorate}</Label>
                        <Select 
                          value={formData.governorate} 
                          onValueChange={(val) => setFormData({ ...formData, governorate: val, wilayat: '' })}
                        >
                          <SelectTrigger className="bg-black/20 border-white/10 h-11" data-testid="select-governorate">
                            <SelectValue placeholder={tr.selectGovernorate} />
                          </SelectTrigger>
                          <SelectContent>
                            {governorates.map((gov) => (
                              <SelectItem key={gov.value} value={gov.value}>{gov.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{tr.wilayat}</Label>
                        <Select 
                          value={formData.wilayat} 
                          onValueChange={(val) => setFormData({ ...formData, wilayat: val })}
                          disabled={!formData.governorate}
                        >
                          <SelectTrigger className="bg-black/20 border-white/10 h-11" data-testid="select-wilayat">
                            <SelectValue placeholder={tr.selectWilayat} />
                          </SelectTrigger>
                          <SelectContent>
                            {wilayatOptions.map((wil, idx) => (
                              <SelectItem key={idx} value={wil.en}>{isRTL ? wil.ar : wil.en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                      data-testid="button-register"
                    >
                      {tr.register}
                      {isRTL ? <ArrowLeft className="w-5 h-5 me-2" /> : <ArrowRight className="w-5 h-5 ms-2" />}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {tr.haveAccount}{' '}
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto text-primary hover:bg-transparent hover:underline"
                        onClick={() => setLocation('/login')}
                        data-testid="link-login"
                      >
                        {tr.login}
                      </Button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass-panel border-0 overflow-hidden shadow-2xl shadow-black/50">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 w-full" />
                
                <CardHeader className="text-center pt-8 pb-4 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold tracking-tight">{tr.verificationTitle}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {tr.verificationDesc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="bg-black/30 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-muted-foreground">{tr.simulatedLink}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-black/20 p-2 rounded break-all" data-testid="text-verification-link">
                        {verificationLink}
                      </code>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={copyToClipboard}
                        data-testid="button-copy-link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/login')}
                      className="w-full"
                      data-testid="button-back-to-login"
                    >
                      {tr.backToLogin}
                    </Button>
                    <Button 
                      onClick={() => setLocation(`/verify?token=${verificationLink.split('token=')[1]}`)}
                      className="w-full bg-green-500 hover:bg-green-600"
                      data-testid="button-go-to-verify"
                    >
                      {tr.goToVerify}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
