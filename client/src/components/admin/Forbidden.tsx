import { useDaamStore } from "@/hooks/use-daam-store";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function Forbidden() {
  const { lang } = useDaamStore();
  const [, setLocation] = useLocation();

  const tr = {
    title: lang === 'ar' ? 'غير مصرح' : 'Access Denied',
    code: '403',
    message: lang === 'ar' 
      ? 'عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.' 
      : 'Sorry, you do not have permission to access this page.',
    subtitle: lang === 'ar'
      ? 'هذه الصفحة مخصصة للمشرفين فقط.'
      : 'This page is restricted to administrators only.',
    backHome: lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'
  };

  return (
    <div 
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      data-testid="forbidden-page"
    >
      <div className="mb-6">
        <ShieldX className="w-20 h-20 text-destructive mx-auto" />
      </div>
      <h1 className="text-6xl font-bold text-destructive mb-2" data-testid="text-forbidden-code">
        {tr.code}
      </h1>
      <h2 className="text-2xl font-semibold mb-4" data-testid="text-forbidden-title">
        {tr.title}
      </h2>
      <p className="text-muted-foreground mb-2 max-w-md" data-testid="text-forbidden-message">
        {tr.message}
      </p>
      <p className="text-muted-foreground/70 text-sm mb-8" data-testid="text-forbidden-subtitle">
        {tr.subtitle}
      </p>
      <Button 
        onClick={() => setLocation('/dashboard')}
        className="gap-2"
        data-testid="button-back-home"
      >
        <ArrowLeft className="w-4 h-4" />
        {tr.backHome}
      </Button>
    </div>
  );
}
