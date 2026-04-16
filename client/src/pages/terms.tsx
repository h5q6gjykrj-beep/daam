import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { loadSetting } from "@/lib/settings-api";

interface OfficialPage {
  id: 'privacy' | 'contact' | 'terms';
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  status: 'draft' | 'published' | 'archived';
  updatedAt: string;
  updatedBy: string;
}

const OFFICIAL_PAGES_KEY = 'daam_official_pages_v1';

export default function Terms() {
  const { lang } = useDaamStore();
  const [_, setLocation] = useLocation();
  const isRTL = lang === 'ar';
  
  const [termsPage, setTermsPage] = useState<OfficialPage | null>(null);

  const loadTermsPage = async () => {
    const pages = await loadSetting<OfficialPage[]>(OFFICIAL_PAGES_KEY, []);
    const page = pages.find(p => p.id === 'terms' && p.status === 'published');
    setTermsPage(page || null);
  };

  useEffect(() => {
    loadTermsPage();

    const handleOfficialPagesUpdated = () => loadTermsPage();
    window.addEventListener('officialPagesUpdated', handleOfficialPagesUpdated);
    return () => {
      window.removeEventListener('officialPagesUpdated', handleOfficialPagesUpdated);
    };
  }, []);

  const tr = {
    title: lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions',
    back: lang === 'ar' ? 'العودة' : 'Back',
    pageUnderConstruction: lang === 'ar' ? 'هذه الصفحة قيد الإعداد' : 'This page is under construction',
  };

  const BackIcon = ChevronRight;

  return (
    <div 
      className="min-h-screen bg-background" 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="gap-2"
              data-testid="button-back-terms"
            >
              <BackIcon className="w-4 h-4" />
              {tr.back}
            </Button>
          </div>

          <Card className="border-white/10 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {tr.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {termsPage ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                  {lang === 'ar' ? termsPage.content_ar : termsPage.content_en}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">{tr.pageUnderConstruction}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
