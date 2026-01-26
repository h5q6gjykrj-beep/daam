import type { 
  Campaign, 
  CampaignImpression, 
  CampaignClick, 
  CampaignDismissal,
  CampaignStats,
  CampaignFilters,
  CampaignStatus
} from '@/types/campaign';
import { deleteCampaignMedia, saveCampaignMedia, validateCampaignVideo } from './campaign-media';

const STORAGE_KEYS = {
  CAMPAIGNS: 'daam_campaigns_v1',
  IMPRESSIONS: 'daam_campaign_impressions_v1',
  CLICKS: 'daam_campaign_clicks_v1',
  DISMISSALS: 'daam_campaign_dismissals_v1',
  VISITOR_SEEN: 'daam_campaign_seen_v1'
} as const;

export function getCampaigns(): Campaign[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCampaigns(campaigns: Campaign[]): void {
  localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
}

export function getCampaignById(id: string): Campaign | undefined {
  return getCampaigns().find(c => c.id === id);
}

export function createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign {
  const campaigns = getCampaigns();
  const now = new Date().toISOString();
  const newCampaign: Campaign = {
    ...campaign,
    id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now
  };
  campaigns.push(newCampaign);
  saveCampaigns(campaigns);
  return newCampaign;
}

export function updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  campaigns[index] = {
    ...campaigns[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveCampaigns(campaigns);
  return campaigns[index];
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.id === id);
  if (!campaign) return false;
  
  if (campaign.video?.id) {
    try {
      await deleteCampaignMedia(campaign.video.id);
    } catch {
      // Continue even if media deletion fails
    }
  }
  
  const filtered = campaigns.filter(c => c.id !== id);
  saveCampaigns(filtered);
  return true;
}

export function updateCampaignStatus(id: string, status: CampaignStatus): Campaign | null {
  return updateCampaign(id, { status });
}

export function filterCampaigns(filters: CampaignFilters): Campaign[] {
  let campaigns = getCampaigns();
  
  if (filters.status) {
    campaigns = campaigns.filter(c => c.status === filters.status);
  }
  if (filters.type) {
    campaigns = campaigns.filter(c => c.type === filters.type);
  }
  if (filters.placement) {
    campaigns = campaigns.filter(c => c.placement === filters.placement);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    campaigns = campaigns.filter(c => 
      c.title.en.toLowerCase().includes(search) ||
      c.title.ar.includes(search) ||
      c.content.en.toLowerCase().includes(search) ||
      c.content.ar.includes(search)
    );
  }
  
  return campaigns.sort((a, b) => b.priority - a.priority);
}

export function getImpressions(): CampaignImpression[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.IMPRESSIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveImpression(impression: CampaignImpression): void {
  const impressions = getImpressions();
  impressions.push(impression);
  localStorage.setItem(STORAGE_KEYS.IMPRESSIONS, JSON.stringify(impressions));
}

export function getClicks(): CampaignClick[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CLICKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveClick(click: CampaignClick): void {
  const clicks = getClicks();
  clicks.push(click);
  localStorage.setItem(STORAGE_KEYS.CLICKS, JSON.stringify(clicks));
}

export function getDismissals(): CampaignDismissal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DISMISSALS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDismissal(dismissal: CampaignDismissal): void {
  const dismissals = getDismissals();
  dismissals.push(dismissal);
  localStorage.setItem(STORAGE_KEYS.DISMISSALS, JSON.stringify(dismissals));
}

interface SeenCampaignEntry {
  campaignId: string;
  seenUntil: number;
}

export function getVisitorSeenCampaignsWithTTL(): SeenCampaignEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VISITOR_SEEN);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((id: string) => ({ campaignId: id, seenUntil: Date.now() + 24 * 60 * 60 * 1000 }));
    }
    return parsed as SeenCampaignEntry[];
  } catch {
    return [];
  }
}

export function getVisitorSeenCampaigns(): string[] {
  const now = Date.now();
  return getVisitorSeenCampaignsWithTTL()
    .filter(entry => entry.seenUntil > now)
    .map(entry => entry.campaignId);
}

export function markCampaignAsSeen(campaignId: string, ttlHours: number = 24): void {
  const seen = getVisitorSeenCampaignsWithTTL().filter(e => e.seenUntil > Date.now());
  const existingIndex = seen.findIndex(e => e.campaignId === campaignId);
  const seenUntil = Date.now() + ttlHours * 60 * 60 * 1000;
  
  if (existingIndex >= 0) {
    seen[existingIndex].seenUntil = seenUntil;
  } else {
    seen.push({ campaignId, seenUntil });
  }
  localStorage.setItem(STORAGE_KEYS.VISITOR_SEEN, JSON.stringify(seen));
}

export function hasCampaignBeenSeen(campaignId: string): boolean {
  const now = Date.now();
  return getVisitorSeenCampaignsWithTTL().some(
    entry => entry.campaignId === campaignId && entry.seenUntil > now
  );
}

export function getCampaignStats(campaignId: string): CampaignStats {
  const impressions = getImpressions().filter(i => i.campaignId === campaignId).length;
  const clicks = getClicks().filter(c => c.campaignId === campaignId).length;
  const dismissals = getDismissals().filter(d => d.campaignId === campaignId).length;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  
  return {
    campaignId,
    impressions,
    clicks,
    dismissals,
    ctr: Math.round(ctr * 100) / 100
  };
}

export function getAllCampaignStats(): CampaignStats[] {
  return getCampaigns().map(c => getCampaignStats(c.id));
}

export async function attachCampaignVideo(campaignId: string, file: File): Promise<Campaign> {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaignId);
  if (index === -1) {
    throw new Error('Campaign not found');
  }
  
  const validation = await validateCampaignVideo(file);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }
  
  const campaign = campaigns[index];
  
  if (campaign.video?.id) {
    try {
      await deleteCampaignMedia(campaign.video.id);
    } catch {
      // Continue even if old media deletion fails
    }
  }
  
  const mediaId = await saveCampaignMedia(file);
  
  campaigns[index] = {
    ...campaign,
    video: {
      id: mediaId,
      mime: validation.meta.mime,
      durationSec: validation.meta.durationSec,
      sizeBytes: validation.meta.sizeBytes
    },
    updatedAt: new Date().toISOString()
  };
  
  saveCampaigns(campaigns);
  return campaigns[index];
}

export async function removeCampaignVideo(campaignId: string): Promise<Campaign> {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaignId);
  if (index === -1) {
    throw new Error('Campaign not found');
  }
  
  const campaign = campaigns[index];
  
  if (campaign.video?.id) {
    try {
      await deleteCampaignMedia(campaign.video.id);
    } catch {
      // Continue even if media deletion fails
    }
  }
  
  const { video, ...rest } = campaign;
  campaigns[index] = {
    ...rest,
    updatedAt: new Date().toISOString()
  } as Campaign;
  
  saveCampaigns(campaigns);
  return campaigns[index];
}

export const CAMPAIGN_STORAGE_KEYS = STORAGE_KEYS;
