export type CampaignType = 'banner' | 'popup' | 'announcement' | 'notification';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
export type CampaignTarget = 'all' | 'students' | 'moderators' | 'new_users';
export type CampaignPlacement = 'home' | 'feed' | 'profile' | 'global';
export type CampaignAttachmentKind = 'image' | 'video' | 'file';

export interface CampaignAttachment {
  id: string;
  kind: CampaignAttachmentKind;
  name: string;
  mime: string;
  sizeBytes: number;
  durationSec?: number;
}

export interface CampaignSurvey {
  url: string;
  label?: { ar: string; en: string };
}

export interface Campaign {
  id: string;
  title: {
    ar: string;
    en: string;
  };
  content: {
    ar: string;
    en: string;
  };
  type: CampaignType;
  status: CampaignStatus;
  target: CampaignTarget;
  placement: CampaignPlacement;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: {
    ar: string;
    en: string;
  };
  startDate: string;
  endDate: string;
  priority: number;
  showOnce: boolean;
  dismissible: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  video?: {
    id: string;
    mime: string;
    durationSec: number;
    sizeBytes: number;
  };
  attachments?: CampaignAttachment[];
  survey?: CampaignSurvey;
}

export interface CampaignImpression {
  campaignId: string;
  visitorId: string;
  timestamp: string;
  placement: CampaignPlacement;
}

export interface CampaignClick {
  campaignId: string;
  visitorId: string;
  timestamp: string;
}

export interface CampaignDismissal {
  campaignId: string;
  visitorId: string;
  timestamp: string;
}

export interface CampaignStats {
  campaignId: string;
  impressions: number;
  clicks: number;
  dismissals: number;
  ctr: number;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  placement?: CampaignPlacement;
  search?: string;
}
