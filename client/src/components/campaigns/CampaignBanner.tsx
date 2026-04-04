import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Bug, ImageOff, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDaamStore } from '@/hooks/use-daam-store';
import { useToast } from '@/hooks/use-toast';
import type { Campaign, CampaignPlacement } from '@/types/campaign';
import { loadCampaignsFromApi, hasCampaignBeenSeen, markCampaignAsSeen } from '@/lib/campaign-storage';
import { getCampaignAttachmentBlob } from '@/lib/campaign-media';
import { trackImpression, trackDismissal } from '@/lib/campaign-tracking';
import { isCampaignActive } from '@/lib/campaign-helpers';
import { ADMIN_EMAILS } from '@/config/admin';
import { CampaignModal } from './CampaignModal';

const LIKES_STORAGE_KEY = 'daam_campaign_likes_v1';

function getCampaignLikes(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(LIKES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function toggleCampaignLike(campaignId: string): boolean {
  const likes = getCampaignLikes();
  const newState = !likes[campaignId];
  likes[campaignId] = newState;
  localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
  return newState;
}

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
    ad: 'إعلان',
    hide: 'إخفاء',
    imageError: 'تعذر عرض الصورة',
    like: 'إعجاب',
    liked: 'أعجبني',
    share: 'مشاركة',
    copied: 'تم نسخ رابط الإعلان من دام',
    shareError: 'تعذرت المشاركة',
    sharePrefix: 'إعلان على دام:',
  },
  en: {
    ad: 'Ad',
    hide: 'Hide',
    imageError: 'Could not load image',
    like: 'Like',
    liked: 'Liked',
    share: 'Share',
    copied: 'DAAM ad link copied',
    shareError: 'Could not share',
    sharePrefix: 'Ad on DAAM:',
  }
};

export function InFeedCampaignCard({ placement }: InFeedCampaignCardProps) {
  const { lang, user } = useDaamStore();
  const { toast } = useToast();
  const t = translations[lang];
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const impressionTracked = useRef(false);
  const isRTL = lang === 'ar';
  const isFeedPlacement = placement === 'feed';

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
    let cancelled = false;

    loadCampaignsFromApi().then(campaigns => {
      if (cancelled) return;

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
    });

    return () => { cancelled = true; };
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

    // New uploads store a Cloudinary URL as the id — use it directly.
    if (mediaId.startsWith('https://') || mediaId.startsWith('http://')) {
      setThumbUrl(mediaId);
      setThumbLoading(false);
      setThumbError(false);
      return;
    }

    // Legacy: id is an IndexedDB key — load blob locally.
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

        let mimeType = blob.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
          const ext = imageAtt.name.toLowerCase().split('.').pop();
          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
          else if (ext === 'webp') mimeType = 'image/webp';
          else if (ext === 'gif') mimeType = 'image/gif';
          else mimeType = 'image/png';
        }
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

  // Initialize like state from localStorage
  useEffect(() => {
    if (campaign) {
      const likes = getCampaignLikes();
      setIsLiked(!!likes[campaign.id]);
    }
  }, [campaign?.id]);

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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (campaign) {
      const newState = toggleCampaignLike(campaign.id);
      setIsLiked(newState);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!campaign) return;

    const title = lang === 'ar' ? campaign.title.ar : campaign.title.en;
    const origin = window.location.origin;
    const shareUrl = `${origin}/c/${campaign.id}`;
    const shareText = `${t.sharePrefix} ${title}\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({ 
          title: `${t.sharePrefix} ${title}`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast({ description: t.shareError, variant: 'destructive' });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({ description: t.copied });
      } catch {
        toast({ description: t.shareError, variant: 'destructive' });
      }
    }
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
        className="overflow-hidden border-primary/20 ring-1 ring-primary/10 bg-gradient-to-br from-primary/5 via-card to-card cursor-pointer hover:border-primary/30 hover:ring-primary/20 transition-all mb-6"
        onClick={handleCardClick}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid="campaign-card"
      >
        {/* Image area - aspect ratio container */}
        {hasImageAttachment && (
          <div className="relative w-full overflow-hidden bg-muted aspect-square md:aspect-[4/3]">
            {thumbLoading && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            {thumbUrl && !thumbLoading && (
              <img
                src={thumbUrl}
                alt=""
                className="w-full h-full object-cover object-center"
                onError={() => setThumbError(true)}
                data-testid="campaign-card-image"
              />
            )}
            {thumbError && !thumbLoading && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center gap-2 text-muted-foreground bg-muted/50">
                <ImageOff className="w-5 h-5 opacity-50" />
                <span className="text-sm">{t.imageError}</span>
              </div>
            )}
            {/* Ad badge overlay on image */}
            <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'}`}>
              <Badge 
                variant="secondary" 
                className={`text-[10px] font-semibold bg-background/90 backdrop-blur-sm border border-border/50 text-muted-foreground ${!isRTL ? 'tracking-widest uppercase' : ''}`}
              >
                {t.ad}
              </Badge>
            </div>
            {/* Dismiss button - only show for non-feed placements */}
            {!isFeedPlacement && (
              <Button
                size="icon"
                variant="secondary"
                onClick={handleDismiss}
                className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} h-7 w-7 bg-background/90 backdrop-blur-sm border border-border/50`}
                data-testid="button-dismiss-campaign"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content area */}
        <CardContent className="p-4">
          {/* Ad badge - only when no image */}
          {!hasImageAttachment && (
            <div className="flex items-start justify-between gap-2 mb-3">
              <Badge 
                variant="secondary" 
                className={`text-[10px] font-semibold border border-border/50 text-muted-foreground ${!isRTL ? 'tracking-widest uppercase' : ''}`}
              >
                {t.ad}
              </Badge>
              {/* Dismiss button for non-feed placements when no image */}
              {!isFeedPlacement && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  data-testid="button-dismiss-campaign"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          <div className="space-y-1">
            {title && (
              <h3 className="font-semibold text-base line-clamp-2" data-testid="campaign-card-title">
                {title}
              </h3>
            )}
            {content && (
              <p className="text-sm text-muted-foreground line-clamp-1" data-testid="campaign-card-content">
                {content}
              </p>
            )}
          </div>

          {/* Action buttons - Like & Share */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLike}
              className={`h-8 px-3 gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              data-testid="button-like-campaign"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{isLiked ? t.liked : t.like}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleShare}
              className="h-8 px-3 gap-2 text-muted-foreground"
              data-testid="button-share-campaign"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">{t.share}</span>
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
