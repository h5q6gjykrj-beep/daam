import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Bug, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDaamStore } from '@/hooks/use-daam-store';
import type { Campaign, CampaignPlacement } from '@/types/campaign';
import { getCampaigns, hasCampaignBeenSeen, markCampaignAsSeen } from '@/lib/campaign-storage';
import { getCampaignMedia } from '@/lib/campaign-media';
import { trackImpression, trackDismissal } from '@/lib/campaign-tracking';
import { getVisitorId, isCampaignActive } from '@/lib/campaign-helpers';
import { ADMIN_EMAILS } from '@/config/admin';
import { CampaignModal } from './CampaignModal';

interface CampaignBannerProps {
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

export function CampaignBanner({ placement }: CampaignBannerProps) {
  const { lang, user } = useDaamStore();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const impressionTracked = useRef(false);
  const isRTL = lang === 'ar';

  // Check if campaign has additional content worth viewing in modal
  const hasModalContent = campaign && (
    (campaign.attachments && campaign.attachments.length > 0) ||
    campaign.video ||
    campaign.survey?.url
  );

  // Check if debug mode should be enabled
  const isDebugMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const hasDebugParam = params.get('campaignDebug') === '1';
    const isSuperAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
    return hasDebugParam || isSuperAdmin;
  }, [user?.email]);

  useEffect(() => {
    const visitorId = getVisitorId();
    const campaigns = getCampaigns();
    
    // Debug counters
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

    // Build debug info
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

  // Debug panel (always renders if debug mode, regardless of campaign)
  const debugPanel = isDebugMode && debugInfo && (
    <div 
      className="w-full bg-zinc-900 border-b border-amber-500/30 py-2 px-4 text-xs font-mono"
      dir="ltr"
      data-testid="campaign-debug-panel"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap gap-x-4 gap-y-1 items-center text-amber-400">
        <span className="flex items-center gap-1">
          <Bug className="w-3 h-3" />
          Campaign Debug ({placement})
        </span>
        <span className="text-zinc-400">|</span>
        <span>Total: <span className="text-white">{debugInfo.totalCampaigns}</span></span>
        <span>Banner: <span className="text-white">{debugInfo.bannerType}</span></span>
        <span>Active: <span className="text-white">{debugInfo.active}</span></span>
        <span>Placement match: <span className="text-white">{debugInfo.matchingPlacement}</span></span>
        <span>Blocked (seen): <span className="text-white">{debugInfo.blockedBySeen}</span></span>
        {debugInfo.lastRejected && (
          <>
            <span className="text-zinc-400">|</span>
            <span className="text-red-400">
              Last rejected: "{debugInfo.lastRejected.title}" → {debugInfo.lastRejected.reason}
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
  const viewLabel = lang === 'ar' ? 'عرض' : 'View';

  return (
    <>
      {debugPanel}
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
          <div 
            className={`flex-1 min-w-0 ${hasModalContent ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={hasModalContent ? () => setModalOpen(true) : undefined}
            role={hasModalContent ? 'button' : undefined}
            tabIndex={hasModalContent ? 0 : undefined}
            onKeyDown={hasModalContent ? (e) => e.key === 'Enter' && setModalOpen(true) : undefined}
          >
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasModalContent && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalOpen(true)}
                className="gap-1"
                data-testid="button-view-campaign"
              >
                <Eye className="w-3 h-3" />
                {viewLabel}
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              data-testid="button-dismiss-banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
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

export default CampaignBanner;
