import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDaamStore } from '@/hooks/use-daam-store';
import type { Campaign, CampaignPlacement } from '@/types/campaign';
import { getCampaigns, hasCampaignBeenSeen, markCampaignAsSeen } from '@/lib/campaign-storage';
import { getCampaignMedia } from '@/lib/campaign-media';
import { trackImpression, trackDismissal } from '@/lib/campaign-tracking';
import { getVisitorId, isCampaignActive } from '@/lib/campaign-helpers';

interface CampaignBannerProps {
  placement: CampaignPlacement;
}

export function CampaignBanner({ placement }: CampaignBannerProps) {
  const { lang } = useDaamStore();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const impressionTracked = useRef(false);
  const isRTL = lang === 'ar';

  useEffect(() => {
    const visitorId = getVisitorId();
    const campaigns = getCampaigns();
    
    const eligibleCampaigns = campaigns.filter(c => {
      if (c.status !== 'active') return false;
      if (c.type !== 'banner') return false;
      if (c.placement !== placement && c.placement !== 'global') return false;
      if (!isCampaignActive(c)) return false;
      if (hasCampaignBeenSeen(c.id)) return false;
      return true;
    });

    if (eligibleCampaigns.length === 0) {
      setCampaign(null);
      return;
    }

    const sorted = eligibleCampaigns.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    setCampaign(sorted[0]);
  }, [placement]);

  useEffect(() => {
    if (campaign && !impressionTracked.current) {
      trackImpression(campaign.id, placement);
      impressionTracked.current = true;
    }
  }, [campaign, placement]);

  useEffect(() => {
    if (campaign?.video?.id) {
      getCampaignMedia(campaign.video.id).then(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        }
      });
    }

    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [campaign?.video?.id]);

  const handleDismiss = () => {
    if (campaign) {
      trackDismissal(campaign.id);
      markCampaignAsSeen(campaign.id, 24);
      setDismissed(true);
    }
  };

  if (!campaign || dismissed) {
    return null;
  }

  const title = lang === 'ar' ? campaign.title.ar : campaign.title.en;
  const content = lang === 'ar' ? campaign.content.ar : campaign.content.en;

  return (
    <div 
      className="relative w-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/20 py-3 px-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="campaign-banner"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
        {videoUrl && (
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            data-testid="campaign-banner-video"
          />
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-sm text-foreground" data-testid="campaign-banner-title">
              {title}
            </p>
          )}
          {content && (
            <p className="text-xs text-muted-foreground line-clamp-2" data-testid="campaign-banner-content">
              {content}
            </p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          className="flex-shrink-0"
          data-testid="button-dismiss-banner"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default CampaignBanner;
