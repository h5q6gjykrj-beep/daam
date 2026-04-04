import type {
  Campaign,
  CampaignImpression,
  CampaignClick,
  CampaignDismissal,
  CampaignStats,
  CampaignFilters,
  CampaignStatus,
  CampaignAttachmentKind,
} from '@/types/campaign';
import {
  deleteCampaignMedia,
  saveCampaignMedia,
  validateCampaignVideo,
  validateAttachment,
  detectAttachmentKind,
  saveCampaignAttachment as saveAttachmentToIndexedDB,
  deleteCampaignAttachment as deleteAttachmentFromIndexedDB,
  ATTACHMENT_LIMITS,
} from './campaign-media';

// ── Per-device analytics keys (intentionally kept in localStorage) ──────────
const ANALYTICS_KEYS = {
  IMPRESSIONS: 'daam_campaign_impressions_v1',
  CLICKS: 'daam_campaign_clicks_v1',
  DISMISSALS: 'daam_campaign_dismissals_v1',
  VISITOR_SEEN: 'daam_campaign_seen_v1',
} as const;

// ── In-memory cache populated by loadCampaignsFromApi() ─────────────────────
let _cache: Campaign[] = [];

export function getCampaigns(): Campaign[] {
  return _cache;
}

export async function loadCampaignsFromApi(): Promise<Campaign[]> {
  try {
    const res = await fetch('/api/campaigns');
    if (!res.ok) return _cache;
    const data: Campaign[] = await res.json();
    _cache = Array.isArray(data) ? data : [];
    return _cache;
  } catch {
    return _cache;
  }
}

export function getCampaignById(id: string): Campaign | undefined {
  return _cache.find(c => c.id === id);
}

export async function createCampaign(
  campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Campaign> {
  const now = new Date().toISOString();
  const newCampaign: Campaign = {
    ...campaign,
    id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  const res = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newCampaign),
  });
  if (!res.ok) throw new Error('Failed to create campaign');
  _cache = [..._cache, newCampaign];
  return newCampaign;
}

export async function updateCampaign(
  id: string,
  updates: Partial<Campaign>
): Promise<Campaign | null> {
  const idx = _cache.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const updated: Campaign = { ..._cache[idx], ...updates, updatedAt: new Date().toISOString() };
  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });
  if (!res.ok) throw new Error('Failed to update campaign');
  _cache = _cache.map(c => c.id === id ? updated : c);
  return updated;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const campaign = _cache.find(c => c.id === id);
  if (!campaign) return false;

  if (campaign.video?.id) {
    try { await deleteCampaignMedia(campaign.video.id); } catch {}
  }
  if (campaign.attachments?.length) {
    for (const att of campaign.attachments) {
      try { await deleteAttachmentFromIndexedDB(att.id); } catch {}
    }
  }

  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete campaign');
  _cache = _cache.filter(c => c.id !== id);
  return true;
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus
): Promise<Campaign | null> {
  return updateCampaign(id, { status });
}

export function filterCampaigns(filters: CampaignFilters): Campaign[] {
  let campaigns = getCampaigns();
  if (filters.status) campaigns = campaigns.filter(c => c.status === filters.status);
  if (filters.type) campaigns = campaigns.filter(c => c.type === filters.type);
  if (filters.placement) campaigns = campaigns.filter(c => c.placement === filters.placement);
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

// ── Analytics (per-device, localStorage) ─────────────────────────────────────

export function getImpressions(): CampaignImpression[] {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEYS.IMPRESSIONS) || '[]'); } catch { return []; }
}
export function saveImpression(impression: CampaignImpression): void {
  const list = getImpressions();
  list.push(impression);
  localStorage.setItem(ANALYTICS_KEYS.IMPRESSIONS, JSON.stringify(list));
}

export function getClicks(): CampaignClick[] {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEYS.CLICKS) || '[]'); } catch { return []; }
}
export function saveClick(click: CampaignClick): void {
  const list = getClicks();
  list.push(click);
  localStorage.setItem(ANALYTICS_KEYS.CLICKS, JSON.stringify(list));
}

export function getDismissals(): CampaignDismissal[] {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEYS.DISMISSALS) || '[]'); } catch { return []; }
}
export function saveDismissal(dismissal: CampaignDismissal): void {
  const list = getDismissals();
  list.push(dismissal);
  localStorage.setItem(ANALYTICS_KEYS.DISMISSALS, JSON.stringify(list));
}

interface SeenCampaignEntry { campaignId: string; seenUntil: number; }

export function getVisitorSeenCampaignsWithTTL(): SeenCampaignEntry[] {
  try {
    const data = localStorage.getItem(ANALYTICS_KEYS.VISITOR_SEEN);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((id: string) => ({ campaignId: id, seenUntil: Date.now() + 24 * 60 * 60 * 1000 }));
    }
    return parsed as SeenCampaignEntry[];
  } catch { return []; }
}

export function getVisitorSeenCampaigns(): string[] {
  const now = Date.now();
  return getVisitorSeenCampaignsWithTTL()
    .filter(e => e.seenUntil > now)
    .map(e => e.campaignId);
}

export function markCampaignAsSeen(campaignId: string, ttlHours = 24): void {
  const seen = getVisitorSeenCampaignsWithTTL().filter(e => e.seenUntil > Date.now());
  const seenUntil = Date.now() + ttlHours * 60 * 60 * 1000;
  const idx = seen.findIndex(e => e.campaignId === campaignId);
  if (idx >= 0) seen[idx].seenUntil = seenUntil;
  else seen.push({ campaignId, seenUntil });
  localStorage.setItem(ANALYTICS_KEYS.VISITOR_SEEN, JSON.stringify(seen));
}

export function hasCampaignBeenSeen(campaignId: string): boolean {
  const now = Date.now();
  return getVisitorSeenCampaignsWithTTL().some(e => e.campaignId === campaignId && e.seenUntil > now);
}

export function getCampaignStats(campaignId: string): CampaignStats {
  const impressions = getImpressions().filter(i => i.campaignId === campaignId).length;
  const clicks = getClicks().filter(c => c.campaignId === campaignId).length;
  const dismissals = getDismissals().filter(d => d.campaignId === campaignId).length;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  return { campaignId, impressions, clicks, dismissals, ctr: Math.round(ctr * 100) / 100 };
}

export function getAllCampaignStats(): CampaignStats[] {
  return getCampaigns().map(c => getCampaignStats(c.id));
}

// ── Video & attachment helpers (unchanged API) ───────────────────────────────

export async function attachCampaignVideo(campaignId: string, file: File): Promise<Campaign> {
  const campaign = _cache.find(c => c.id === campaignId);
  if (!campaign) throw new Error('Campaign not found');
  const validation = await validateCampaignVideo(file);
  if (!validation.ok) throw new Error(validation.reason);
  if (campaign.video?.id) { try { await deleteCampaignMedia(campaign.video.id); } catch {} }
  const mediaId = await saveCampaignMedia(file);
  return updateCampaign(campaignId, {
    video: { id: mediaId, mime: validation.meta.mime, durationSec: validation.meta.durationSec, sizeBytes: validation.meta.sizeBytes },
  }) as Promise<Campaign>;
}

export async function removeCampaignVideo(campaignId: string): Promise<Campaign> {
  const campaign = _cache.find(c => c.id === campaignId);
  if (!campaign) throw new Error('Campaign not found');
  if (campaign.video?.id) { try { await deleteCampaignMedia(campaign.video.id); } catch {} }
  const { video, ...rest } = campaign;
  return updateCampaign(campaignId, rest as Partial<Campaign>) as Promise<Campaign>;
}

export async function attachCampaignAttachment(
  campaignId: string,
  file: File,
  kind: CampaignAttachmentKind
): Promise<Campaign> {
  const campaign = _cache.find(c => c.id === campaignId);
  if (!campaign) throw new Error('Campaign not found');
  const currentAttachments = campaign.attachments || [];
  const currentKindCount = currentAttachments.filter(a => a.kind === kind).length;
  const validation = await validateAttachment(file, kind, currentKindCount);
  if (!validation.ok) throw new Error(validation.reason);
  const attachment = await saveAttachmentToIndexedDB(file);
  return updateCampaign(campaignId, { attachments: [...currentAttachments, attachment] }) as Promise<Campaign>;
}

export async function removeCampaignAttachment(campaignId: string, attachmentId: string): Promise<Campaign> {
  const campaign = _cache.find(c => c.id === campaignId);
  if (!campaign) throw new Error('Campaign not found');
  const attachments = campaign.attachments || [];
  if (!attachments.find(a => a.id === attachmentId)) throw new Error('Attachment not found');
  try { await deleteAttachmentFromIndexedDB(attachmentId); } catch {}
  return updateCampaign(campaignId, { attachments: attachments.filter(a => a.id !== attachmentId) }) as Promise<Campaign>;
}

export function getAttachmentCountByKind(campaign: Campaign | undefined, kind: CampaignAttachmentKind): number {
  if (!campaign?.attachments) return 0;
  return campaign.attachments.filter(a => a.kind === kind).length;
}

export function canAddAttachment(campaign: Campaign | undefined, kind: CampaignAttachmentKind): boolean {
  return getAttachmentCountByKind(campaign, kind) < ATTACHMENT_LIMITS[kind].maxCount;
}

export { ATTACHMENT_LIMITS };

// Keep old key export for backwards compatibility with any remaining references
export const CAMPAIGN_STORAGE_KEYS = ANALYTICS_KEYS;
