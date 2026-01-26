import type { CampaignPlacement } from '@/types/campaign';
import { 
  saveImpression, 
  saveClick, 
  saveDismissal, 
  markCampaignAsSeen 
} from './campaign-storage';
import { getVisitorId } from './campaign-helpers';

export function trackImpression(campaignId: string, placement: CampaignPlacement): void {
  const visitorId = getVisitorId();
  const timestamp = new Date().toISOString();
  
  saveImpression({
    campaignId,
    visitorId,
    timestamp,
    placement
  });
}

export function trackClick(campaignId: string): void {
  const visitorId = getVisitorId();
  const timestamp = new Date().toISOString();
  
  saveClick({
    campaignId,
    visitorId,
    timestamp
  });
}

export function trackDismissal(campaignId: string, markAsSeen: boolean = true): void {
  const visitorId = getVisitorId();
  const timestamp = new Date().toISOString();
  
  saveDismissal({
    campaignId,
    visitorId,
    timestamp
  });
  
  if (markAsSeen) {
    markCampaignAsSeen(campaignId);
  }
}

export function trackCampaignView(campaignId: string, placement: CampaignPlacement): void {
  trackImpression(campaignId, placement);
}

export function handleCampaignClick(campaignId: string, linkUrl?: string): void {
  trackClick(campaignId);
  
  if (linkUrl) {
    if (linkUrl.startsWith('http')) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = linkUrl;
    }
  }
}

export function handleCampaignDismiss(campaignId: string, showOnce: boolean): void {
  trackDismissal(campaignId, showOnce);
}
