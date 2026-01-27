import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Bug, Sparkles, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDaamStore } from '@/hooks/use-daam-store';
import type { Campaign, CampaignPlacement } from '@/types/campaign';
import { getCampaigns, hasCampaignBeenSeen, markCampaignAsSeen } from '@/lib/campaign-storage';
import { getCampaignAttachmentBlob } from '@/lib/campaign-media';
import { trackImpression, trackDismissal } from '@/lib/campaign-tracking';
import { isCampaignActive } from '@/lib/campaign-helpers';
import { ADMIN_EMAILS } from '@/config/admin';
import { CampaignModal } from './CampaignModal';

const thumbCache = new Map<string, string>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    thumbCache.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    thumbCache.clear();
  });
}

interface InFeedCampaignCardProps {
  placement: CampaignPlacement;
}

interface DebugInfo {
  totalCampaigns: number;
  bannerType: number;
  active: number;
  matchingPlacement: number;
  blockedBySeen: number;
  lastRejected: { title: string; reason: string } | null;
}

const translations = {
  ar: {
    sponsored: 'مُموّل',
    explore: 'اكتشف',
    hide: 'إخفاء',
    imageError: 'تعذر عرض الصورة',
  },
  en: {
    sponsored: 'Sponsored',
    explore: 'Explore',
    hide: 'Hide',
    imageError: 'Could not load image',
  }
};

export function InFeedCampaignCard({ placement }: InFeedCampaignCardProps) {
  const { lang, user } = useDaamStore();
  const t = translations[lang];
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const impressionTracked = useRef(false);
  const isRTL = lang === 'ar';

  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbLoading, setThumbLoading] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const isDebugMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const hasDebugParam = params.get('campaignDebug') === '1';
    const isSuperAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
    return hasDebugParam || isSuperAdmin;
  }, [user?.email]);

  useEffect(() => {
    const campaigns = getCampaigns();
    
    let lastRejected: { title: string; reason: string } | null = null;
    let blockedBySeen = 0;
    
    const eligibleCampaigns = campaigns.filter(c => {
      if (c.status !== 'active') {
        lastRejected = { title: c.title.en || c.title.ar, reason: `status=${c.status}` };
        return false;
      }
      if (c.type !== 'banner') {
        lastRejected = { title: c.title.en || c.title.ar, reason: `type=${c.type} (not banner)` };
        return false;
      }
      if (c.placement !== placement && c.placement !== 'global') {
        lastRejected = { title: c.title.en || c.title.ar, reason: `placement=${c.placement} (need ${placement})` };
        return false;
      }
      if (!isCampaignActive(c)) {
        lastRejected = { title: c.title.en || c.title.ar, reason: `schedule: ${c.startDate} - ${c.endDate}` };
        return false;
      }
      if (hasCampaignBeenSeen(c.id)) {
        blockedBySeen++;
        lastRejected = { title: c.title.en || c.title.ar, reason: 'seen (TTL not expired)' };
        return false;
      }
      return true;
    });

    if (isDebugMode) {
      setDebugInfo({
        totalCampaigns: campaigns.length,
        bannerType: campaigns.filter(c => c.type === 'banner').length,
        active: campaigns.filter(c => c.status === 'active').length,
        matchingPlacement: campaigns.filter(c => c.placement === placement || c.placement === 'global').length,
        blockedBySeen,
        lastRejected: eligibleCampaigns.length === 0 ? lastRejected : null,
      });
    }

    if (eligibleCampaigns.length === 0) {
      setCampaign(null);
      return;
    }

    const sorted = eligibleCampaigns.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    setCampaign(sorted[0]);
  }, [placement, isDebugMode]);

  useEffect(() => {
    if (campaign && !impressionTracked.current) {
      trackImpression(campaign.id, placement);
      impressionTracked.current = true;
    }
  }, [campaign, placement]);

  useEffect(() => {
    if (!campaign) {
      setThumbUrl(null);
      setThumbLoading(false);
      setThumbError(false);
      return;
    }

    const imageAtt = campaign.attachments?.find(a => a.kind === 'image');
    if (!imageAtt) {
      setThumbUrl(null);
      setThumbLoading(false);
      setThumbError(false);
      return;
    }

    const mediaId = imageAtt.id;

    if (thumbCache.has(mediaId)) {
      setThumbUrl(thumbCache.get(mediaId)!);
      setThumbLoading(false);
      setThumbError(false);
      return;
    }

    let cancelled = false;
    setThumbLoading(true);
    setThumbError(false);
    setThumbUrl(null);

    const loadThumb = async () => {
      try {
        const blob = await getCampaignAttachmentBlob(mediaId);
        if (cancelled) return;

        if (!blob) {
          setThumbError(true);
          setThumbLoading(false);
          return;
        }

        // Detect MIME type from filename or use blob type
        let mimeType = blob.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
          const ext = imageAtt.name.toLowerCase().split('.').pop();
          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
          else if (ext === 'webp') mimeType = 'image/webp';
          else if (ext === 'gif') mimeType = 'image/gif';
          else mimeType = 'image/png'; // fallback
        }
        // Create new blob with correct MIME type
        const typedBlob = new Blob([blob], { type: mimeType });
        const url = URL.createObjectURL(typedBlob);
        thumbCache.set(mediaId, url);

        if (!cancelled) {
          setThumbUrl(url);
          setThumbLoading(false);
        }
      } catch {
        if (!cancelled) {
          setThumbError(true);
          setThumbLoading(false);
        }
      }
    };

    loadThumb();

    return () => {
      cancelled = true;
    };
  }, [campaign?.id, campaign?.updatedAt]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (campaign) {
      trackDismissal(campaign.id);
      markCampaignAsSeen(campaign.id, 24);
      setDismissed(true);
    }
  };

  const handleCardClick = () => {
    setModalOpen(true);
  };

  const debugPanel = isDebugMode && debugInfo && (
    <div 
      className="mb-4 bg-zinc-900 rounded-lg border border-amber-500/30 py-2 px-4 text-xs font-mono"
      dir="ltr"
      data-testid="campaign-debug-panel"
    >
      <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-amber-400">
        <span className="flex items-center gap-1">
          <Bug className="w-3 h-3" />
          Campaign Debug ({placement})
        </span>
        <span className="text-zinc-400">|</span>
        <span>Total: <span className="text-white">{debugInfo.totalCampaigns}</span></span>
        <span>Banner: <span className="text-white">{debugInfo.bannerType}</span></span>
        <span>Active: <span className="text-white">{debugInfo.active}</span></span>
        <span>Placement: <span className="text-white">{debugInfo.matchingPlacement}</span></span>
        <span>Seen: <span className="text-white">{debugInfo.blockedBySeen}</span></span>
        {debugInfo.lastRejected && (
          <>
            <span className="text-zinc-400">|</span>
            <span className="text-red-400">
              Rejected: "{debugInfo.lastRejected.title}" - {debugInfo.lastRejected.reason}
            </span>
          </>
        )}
        {campaign && (
          <>
            <span className="text-zinc-400">|</span>
            <span className="text-green-400">Showing: "{campaign.title.en}"</span>
          </>
        )}
      </div>
    </div>
  );

  if (!campaign || dismissed) {
    return debugPanel || null;
  }

  const title = lang === 'ar' ? campaign.title.ar : campaign.title.en;
  const content = lang === 'ar' ? campaign.content.ar : campaign.content.en;
  const hasImageAttachment = campaign.attachments?.some(a => a.kind === 'image');

  return (
    <>
      {debugPanel}
      <Card 
        className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card cursor-pointer hover:border-primary/40 transition-all mb-6"
        onClick={handleCardClick}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid="campaign-card"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <Badge 
              variant="outline" 
              className="text-xs border-primary/30 text-primary bg-primary/10"
            >
              <Sparkles className="w-3 h-3 me-1" />
              {t.sponsored}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              data-testid="button-dismiss-campaign"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {hasImageAttachment && (
            <div className="mb-3">
              {thumbLoading && (
                <Skeleton className="w-full h-40 rounded-lg" />
              )}
              {thumbUrl && !thumbLoading && (
                <img
                  src={thumbUrl}
                  alt=""
                  className="w-full max-h-40 object-cover rounded-lg border"
                  onError={() => setThumbError(true)}
                  data-testid="campaign-card-image"
                />
              )}
              {thumbError && !thumbLoading && (
                <div className="w-full h-24 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="w-4 h-4 opacity-50" />
                  <span className="text-xs">{t.imageError}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {title && (
              <h3 className="font-semibold text-base" data-testid="campaign-card-title">
                {title}
              </h3>
            )}
            {content && (
              <p className="text-sm text-muted-foreground line-clamp-3" data-testid="campaign-card-content">
                {content}
              </p>
            )}
          </div>

          <div className="mt-4">
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              data-testid="button-explore-campaign"
            >
              <Sparkles className="w-4 h-4 me-2" />
              {t.explore}
            </Button>
          </div>
        </CardContent>
      </Card>

      {campaign && (
        <CampaignModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          campaign={campaign}
        />
      )}
    </>
  );
}

export { InFeedCampaignCard as CampaignBanner };
export default InFeedCampaignCard;
