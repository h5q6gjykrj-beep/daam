import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Bug, Sparkles, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDaamStore } from '@/hooks/use-daam-store';
import type { Campaign, CampaignPlacement } from '@/types/campaign';
import { getCampaigns, hasCampaignBeenSeen, markCampaignAsSeen } from '@/lib/campaign-storage';
import { getCampaignAttachmentBlob } from '@/lib/campaign-media';
import { trackImpression, trackDismissal } from '@/lib/campaign-tracking';
import { isCampaignActive } from '@/lib/campaign-helpers';
import { ADMIN_EMAILS } from '@/config/admin';
import { CampaignModal } from './CampaignModal';

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
    loadError: 'لا يمكن تحميل المعاينة',
  },
  en: {
    sponsored: 'Sponsored',
    explore: 'Explore',
    hide: 'Hide',
    loadError: 'Cannot load preview',
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
  const [thumbType, setThumbType] = useState<'image' | 'video' | null>(null);
  const [thumbErr, setThumbErr] = useState<string | null>(null);

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

  const videoMediaId = campaign?.video?.id;
  const attachmentsKey = campaign?.attachments?.map(a => a.id).join(',') || '';

  useEffect(() => {
    let cancelled = false;
    let currentUrl: string | null = null;

    setThumbUrl(null);
    setThumbType(null);
    setThumbErr(null);

    if (!campaign) return;

    const imageAtt = campaign.attachments?.find(a => a.kind === 'image');
    const videoAtt = campaign.attachments?.find(a => a.kind === 'video');

    let chosenId: string | null = null;
    let chosenKind: 'image' | 'video' | null = null;

    if (imageAtt) {
      chosenId = imageAtt.id;
      chosenKind = 'image';
    } else if (videoAtt) {
      chosenId = videoAtt.id;
      chosenKind = 'video';
    } else if (videoMediaId) {
      chosenId = videoMediaId;
      chosenKind = 'video';
    }

    if (!chosenId || !chosenKind) {
      return;
    }

    const loadThumb = async () => {
      try {
        const blob = await getCampaignAttachmentBlob(chosenId!);
        
        if (cancelled) return;

        if (!blob) {
          setThumbErr(`blob_null:${chosenKind}`);
          return;
        }

        const url = URL.createObjectURL(blob);
        
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        currentUrl = url;
        setThumbUrl(url);
        setThumbType(chosenKind);
      } catch (err) {
        if (!cancelled) {
          setThumbErr(`exception:${chosenKind}:${String(err)}`);
        }
      }
    };

    loadThumb();

    return () => {
      cancelled = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [campaign?.id, campaign?.updatedAt, videoMediaId, attachmentsKey]);

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
        {thumbErr && (
          <>
            <span className="text-zinc-400">|</span>
            <span className="text-orange-400">ThumbErr: {thumbErr}</span>
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
  const hasMediaAttachments = campaign.video || campaign.attachments?.some(a => a.kind === 'image' || a.kind === 'video');

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

          {thumbUrl && thumbType === 'image' && (
            <div className="mb-3 rounded-lg overflow-hidden bg-muted/30">
              <img
                src={thumbUrl}
                alt=""
                className="max-h-48 w-full object-cover rounded-lg border"
                onError={() => setThumbErr('img_onError')}
                data-testid="campaign-card-image"
              />
            </div>
          )}

          {thumbUrl && thumbType === 'video' && (
            <div className="mb-3 rounded-lg overflow-hidden bg-muted/30">
              <video
                src={thumbUrl}
                autoPlay
                loop
                muted
                playsInline
                className="max-h-48 w-full object-cover rounded-lg border"
                onError={() => setThumbErr('video_onError')}
                data-testid="campaign-card-video"
              />
            </div>
          )}

          {thumbErr && hasMediaAttachments && (
            <div className="mb-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageOff className="w-8 h-8 opacity-50" />
              <span className="text-xs">{t.loadError}</span>
              {isDebugMode && (
                <span className="text-[10px] text-red-400 font-mono">{thumbErr}</span>
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
