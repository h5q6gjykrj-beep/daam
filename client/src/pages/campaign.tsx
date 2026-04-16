import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { AlertCircle, Megaphone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDaamStore } from '@/hooks/use-daam-store';
import { getCampaignById, loadCampaignsFromApi } from '@/lib/campaign-storage';
import { getCampaignAttachmentBlob } from '@/lib/campaign-media';
import { CampaignModal } from '@/components/campaigns/CampaignModal';
import type { Campaign } from '@/types/campaign';

const translations = {
  ar: {
    ad: 'إعلان',
    notFound: 'الإعلان غير موجود',
    notFoundDesc: 'قد يكون الإعلان قد انتهى أو تم حذفه',
    viewDetails: 'عرض التفاصيل',
    backHome: 'العودة للرئيسية',
    loading: 'جاري تحميل الإعلان...',
    pageTitle: 'إعلان على دام',
  },
  en: {
    ad: 'Ad',
    notFound: 'Ad not found',
    notFoundDesc: 'This ad may have expired or been removed',
    viewDetails: 'View Details',
    backHome: 'Back to Home',
    loading: 'Loading ad...',
    pageTitle: 'Ad on DAAM',
  }
};

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { lang, user } = useDaamStore();
  const t = translations[lang];
  const isRTL = lang === 'ar';

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      document.title = `DAAM | ${t.pageTitle}`;
      setLoading(true);
      loadCampaignsFromApi().then(() => {
        const found = getCampaignById(id);
        setCampaign(found || null);
        setLoading(false);
        if (found) {
          document.title = `DAAM | ${lang === 'ar' ? found.title.ar : found.title.en}`;
        }
      });
    }
  }, [id, lang, t.pageTitle]);

  useEffect(() => {
    if (!campaign) return;

    const thumbId = campaign.attachments?.find(a => a.kind === 'image')?.id;
    if (!thumbId) return;

    let cancelled = false;
    let createdUrl: string | null = null;

    getCampaignAttachmentBlob(thumbId).then(blob => {
      if (blob && !cancelled) {
        createdUrl = URL.createObjectURL(blob);
        setThumbUrl(createdUrl);
      }
    });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [campaign?.id]);

  const handleBack = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-background flex items-center justify-center p-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Card className="w-full max-w-lg">
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div 
        className="min-h-screen bg-background flex items-center justify-center p-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold mb-2">{t.notFound}</h1>
            <p className="text-muted-foreground mb-6">{t.notFoundDesc}</p>
            <Button onClick={handleBack} data-testid="button-back-home">
              <ChevronRight className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t.backHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = lang === 'ar' ? campaign.title.ar : campaign.title.en;
  const content = lang === 'ar' ? campaign.content.ar : campaign.content.en;

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-lg">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
          data-testid="button-back"
        >
          <ChevronRight className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
          {t.backHome}
        </Button>

        <Card className="overflow-hidden ring-1 ring-primary/10">
          {thumbUrl && (
            <div className="aspect-video w-full overflow-hidden bg-muted">
              <img 
                src={thumbUrl} 
                alt={title}
                className="w-full h-full object-cover"
                data-testid="campaign-image"
              />
            </div>
          )}
          
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary border-0 text-xs font-medium tracking-widest uppercase"
              >
                <Megaphone className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                {t.ad}
              </Badge>
            </div>

            <h1 
              className="text-xl font-semibold mb-2 line-clamp-2"
              data-testid="campaign-title"
            >
              {title}
            </h1>

            {content && (
              <p 
                className="text-muted-foreground text-sm mb-4 line-clamp-3"
                data-testid="campaign-content"
              >
                {content}
              </p>
            )}

            <Button 
              onClick={() => setModalOpen(true)}
              className="w-full"
              data-testid="button-view-details"
            >
              {t.viewDetails}
            </Button>
          </CardContent>
        </Card>
      </div>

      {campaign && (
        <CampaignModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          campaign={campaign} 
        />
      )}
    </div>
  );
}
