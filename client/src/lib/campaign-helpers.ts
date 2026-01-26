import type { Campaign, CampaignPlacement, CampaignTarget } from '@/types/campaign';
import { getCampaigns, hasCampaignBeenSeen } from './campaign-storage';

export function getVisitorId(): string {
  const key = 'daam_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function isCampaignActive(campaign: Campaign): boolean {
  if (campaign.status !== 'active') return false;
  
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  
  return now >= start && now <= end;
}

export function isCampaignScheduled(campaign: Campaign): boolean {
  if (campaign.status !== 'scheduled') return false;
  
  const now = new Date();
  const start = new Date(campaign.startDate);
  
  return now < start;
}

export function isCampaignEnded(campaign: Campaign): boolean {
  const now = new Date();
  const end = new Date(campaign.endDate);
  return now > end;
}

export function shouldShowCampaign(
  campaign: Campaign,
  placement: CampaignPlacement,
  userRole?: 'student' | 'moderator',
  isNewUser?: boolean
): boolean {
  if (!isCampaignActive(campaign)) return false;
  
  if (campaign.placement !== 'global' && campaign.placement !== placement) {
    return false;
  }
  
  if (campaign.showOnce && hasCampaignBeenSeen(campaign.id)) {
    return false;
  }
  
  if (!matchesTarget(campaign.target, userRole, isNewUser)) {
    return false;
  }
  
  return true;
}

function matchesTarget(
  target: CampaignTarget,
  userRole?: 'student' | 'moderator',
  isNewUser?: boolean
): boolean {
  switch (target) {
    case 'all':
      return true;
    case 'students':
      return userRole === 'student' || !userRole;
    case 'moderators':
      return userRole === 'moderator';
    case 'new_users':
      return isNewUser === true;
    default:
      return true;
  }
}

export function getActiveCampaignsForPlacement(
  placement: CampaignPlacement,
  userRole?: 'student' | 'moderator',
  isNewUser?: boolean
): Campaign[] {
  return getCampaigns()
    .filter(c => shouldShowCampaign(c, placement, userRole, isNewUser))
    .sort((a, b) => b.priority - a.priority);
}

export function getHighestPriorityCampaign(
  placement: CampaignPlacement,
  userRole?: 'student' | 'moderator',
  isNewUser?: boolean
): Campaign | null {
  const campaigns = getActiveCampaignsForPlacement(placement, userRole, isNewUser);
  return campaigns.length > 0 ? campaigns[0] : null;
}

export function formatCampaignDate(dateString: string, lang: 'ar' | 'en'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getCampaignStatusColor(status: Campaign['status']): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'scheduled':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'paused':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'ended':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'draft':
    default:
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }
}

export function getCampaignTypeIcon(type: Campaign['type']): string {
  switch (type) {
    case 'banner':
      return 'Image';
    case 'popup':
      return 'Square';
    case 'announcement':
      return 'Megaphone';
    case 'notification':
      return 'Bell';
    default:
      return 'FileText';
  }
}

export function autoUpdateCampaignStatuses(): number {
  const campaigns = getCampaigns();
  let updated = 0;
  const now = new Date();
  
  campaigns.forEach(campaign => {
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    
    if (campaign.status === 'scheduled' && now >= start && now <= end) {
      campaign.status = 'active';
      campaign.updatedAt = now.toISOString();
      updated++;
    }
    
    if ((campaign.status === 'active' || campaign.status === 'scheduled') && now > end) {
      campaign.status = 'ended';
      campaign.updatedAt = now.toISOString();
      updated++;
    }
  });
  
  if (updated > 0) {
    localStorage.setItem('daam_campaigns_v1', JSON.stringify(campaigns));
  }
  
  return updated;
}

export const CAMPAIGN_TRANSLATIONS = {
  ar: {
    campaigns: 'الحملات',
    createCampaign: 'إنشاء حملة',
    editCampaign: 'تعديل الحملة',
    deleteCampaign: 'حذف الحملة',
    campaignTitle: 'عنوان الحملة',
    campaignContent: 'محتوى الحملة',
    campaignType: 'نوع الحملة',
    campaignStatus: 'حالة الحملة',
    campaignTarget: 'الجمهور المستهدف',
    campaignPlacement: 'موضع العرض',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    priority: 'الأولوية',
    showOnce: 'عرض مرة واحدة',
    dismissible: 'قابل للإغلاق',
    banner: 'بانر',
    popup: 'نافذة منبثقة',
    announcement: 'إعلان',
    notification: 'إشعار',
    draft: 'مسودة',
    scheduled: 'مجدول',
    active: 'نشط',
    paused: 'متوقف',
    ended: 'منتهي',
    all: 'الجميع',
    students: 'الطلاب',
    moderators: 'المشرفين',
    new_users: 'المستخدمين الجدد',
    home: 'الصفحة الرئيسية',
    feed: 'الساحة',
    profile: 'الملف الشخصي',
    global: 'عام',
    impressions: 'المشاهدات',
    clicks: 'النقرات',
    dismissals: 'الإغلاقات',
    ctr: 'معدل النقر',
    noCampaigns: 'لا توجد حملات',
    confirmDelete: 'هل أنت متأكد من حذف هذه الحملة؟',
    campaignCreated: 'تم إنشاء الحملة بنجاح',
    campaignUpdated: 'تم تحديث الحملة بنجاح',
    campaignDeleted: 'تم حذف الحملة بنجاح',
    linkUrl: 'رابط الحملة',
    linkText: 'نص الرابط',
    imageUrl: 'رابط الصورة',
    learnMore: 'اعرف المزيد'
  },
  en: {
    campaigns: 'Campaigns',
    createCampaign: 'Create Campaign',
    editCampaign: 'Edit Campaign',
    deleteCampaign: 'Delete Campaign',
    campaignTitle: 'Campaign Title',
    campaignContent: 'Campaign Content',
    campaignType: 'Campaign Type',
    campaignStatus: 'Campaign Status',
    campaignTarget: 'Target Audience',
    campaignPlacement: 'Display Placement',
    startDate: 'Start Date',
    endDate: 'End Date',
    priority: 'Priority',
    showOnce: 'Show Once',
    dismissible: 'Dismissible',
    banner: 'Banner',
    popup: 'Popup',
    announcement: 'Announcement',
    notification: 'Notification',
    draft: 'Draft',
    scheduled: 'Scheduled',
    active: 'Active',
    paused: 'Paused',
    ended: 'Ended',
    all: 'Everyone',
    students: 'Students',
    moderators: 'Moderators',
    new_users: 'New Users',
    home: 'Home',
    feed: 'Arena',
    profile: 'Profile',
    global: 'Global',
    impressions: 'Impressions',
    clicks: 'Clicks',
    dismissals: 'Dismissals',
    ctr: 'CTR',
    noCampaigns: 'No campaigns',
    confirmDelete: 'Are you sure you want to delete this campaign?',
    campaignCreated: 'Campaign created successfully',
    campaignUpdated: 'Campaign updated successfully',
    campaignDeleted: 'Campaign deleted successfully',
    linkUrl: 'Campaign Link',
    linkText: 'Link Text',
    imageUrl: 'Image URL',
    learnMore: 'Learn More'
  }
};
