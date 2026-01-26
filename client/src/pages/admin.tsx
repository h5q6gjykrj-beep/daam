import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDaamStore, type Report as StoreReport, type ReportStatus as StoreReportStatus } from "@/hooks/use-daam-store";
import { 
  Users, MessageSquare, FileText, Flag, ClipboardList, LayoutDashboard,
  Search, Trash2, Ban, Eye, EyeOff, CheckCircle, XCircle, ChevronDown, ChevronUp,
  User as UserIcon, Calendar, Filter, MoreHorizontal, Shield, AlertTriangle,
  LogOut, RotateCcw, StickyNote, Plus, Activity, History, Download, Building, Globe,
  Megaphone, Video, Image, Bell, Square, Play, Pause, Copy, X, File, Paperclip
} from "lucide-react";
import type { Campaign, CampaignType, CampaignStatus, CampaignTarget, CampaignPlacement, CampaignStats, CampaignAttachment, CampaignAttachmentKind } from "@/types/campaign";
import { 
  getCampaigns, createCampaign, updateCampaign, deleteCampaign, 
  updateCampaignStatus, getCampaignStats, attachCampaignVideo, removeCampaignVideo,
  attachCampaignAttachment, removeCampaignAttachment, getAttachmentCountByKind, ATTACHMENT_LIMITS
} from "@/lib/campaign-storage";
import { getCampaignMedia, detectAttachmentKind, validateAttachment } from "@/lib/campaign-media";
import { CAMPAIGN_TRANSLATIONS, formatCampaignDate, getCampaignStatusColor } from "@/lib/campaign-helpers";
import { motion, AnimatePresence } from "framer-motion";

type UserStatus = 'active' | 'suspended' | 'banned';
type PostStatus = 'visible' | 'hidden' | 'deleted';
type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
type ActionType = 'user_suspended' | 'user_banned' | 'user_activated' | 'user_unsuspended' | 'user_unbanned' | 'user_force_logout' | 'user_settings_reset' | 'post_hidden' | 'post_deleted' | 'post_restored' | 'comment_hidden' | 'comment_deleted' | 'file_deleted' | 'report_resolved' | 'report_dismissed' | 'report_reopened' | 'report_status_changed' | 'target_hidden' | 'author_suspended' | 'domain_added' | 'domain_removed' | 'campaign_created' | 'campaign_updated' | 'campaign_deleted' | 'campaign_activated' | 'campaign_paused' | 'campaign_ended' | 'campaign_duplicated';
type ReportPriority = 'low' | 'medium' | 'high';
type ReportSortOption = 'newest' | 'oldest' | 'priority';

interface AdminNote {
  id: string;
  userEmail: string;
  note: string;
  addedBy: string;
  addedAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  role: 'user' | 'moderator';
  joinedAt: string;
  postsCount: number;
  commentsCount: number;
  university?: string;
  lastActive?: string;
  phone?: string;
  forceLogoutFlag?: boolean;
  settingsResetFlag?: boolean;
}

interface AdminPost {
  id: string;
  title: string;
  author: string;
  authorEmail: string;
  status: PostStatus;
  type: 'question' | 'discussion' | 'announcement';
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

interface AdminComment {
  id: string;
  content: string;
  author: string;
  authorEmail: string;
  postId: string;
  postTitle: string;
  status: PostStatus;
  createdAt: string;
}

interface AdminFile {
  id: string;
  filename: string;
  uploader: string;
  uploaderEmail: string;
  postId: string;
  postTitle: string;
  size: string;
  type: string;
  uploadedAt: string;
}

interface Report {
  id: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  targetTitle: string;
  reason: string;
  reporter: string;
  reporterEmail: string;
  status: ReportStatus;
  createdAt: string;
  resolutionReason?: string;
  priority?: ReportPriority;
  targetAction?: 'hidden';
  userAction?: 'suspended';
  authorEmail?: string;
}

interface AuditLogEntry {
  id: string;
  action: ActionType;
  targetType: 'user' | 'post' | 'comment' | 'file' | 'report' | 'campaign';
  targetId: string;
  targetName: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

const initialUsers: AdminUser[] = [
  { id: '1', email: 'ahmed@utas.edu.om', name: 'أحمد الحارثي', status: 'active', role: 'user', joinedAt: '2024-01-15', postsCount: 12, commentsCount: 45, phone: '+968 9123 4567', lastActive: '2024-12-20' },
  { id: '2', email: 'fatima@utas.edu.om', name: 'فاطمة البلوشي', status: 'active', role: 'user', joinedAt: '2024-02-20', postsCount: 8, commentsCount: 23, phone: '+968 9234 5678', lastActive: '2024-12-18' },
  { id: '3', email: 'mohammed@utas.edu.om', name: 'محمد الكندي', status: 'suspended', role: 'user', joinedAt: '2024-03-10', postsCount: 3, commentsCount: 15, phone: '+968 9345 6789', lastActive: '2024-12-15' },
  { id: '4', email: 'sara@utas.edu.om', name: 'سارة المعمري', status: 'active', role: 'user', joinedAt: '2024-01-25', postsCount: 20, commentsCount: 67, phone: '+968 9456 7890', lastActive: '2024-12-21' },
  { id: '5', email: 'omar@utas.edu.om', name: 'عمر الراشدي', status: 'banned', role: 'user', joinedAt: '2024-04-05', postsCount: 1, commentsCount: 2, phone: '+968 9567 8901', lastActive: '2024-11-20' },
  { id: '6', email: 'w.qq89@hotmail.com', name: 'المشرف العام', status: 'active', role: 'moderator', joinedAt: '2024-01-01', postsCount: 5, commentsCount: 100 },
];

const initialPosts: AdminPost[] = [
  { id: 'p1', title: 'كيف أحسن مستواي في البرمجة؟', author: 'أحمد الحارثي', authorEmail: 'ahmed@utas.edu.om', status: 'visible', type: 'question', createdAt: '2024-12-01', likesCount: 15, commentsCount: 8 },
  { id: 'p2', title: 'نقاش حول مشروع التخرج', author: 'فاطمة البلوشي', authorEmail: 'fatima@utas.edu.om', status: 'visible', type: 'discussion', createdAt: '2024-12-05', likesCount: 23, commentsCount: 12 },
  { id: 'p3', title: 'إعلان: موعد الامتحانات النهائية', author: 'المشرف العام', authorEmail: 'w.qq89@hotmail.com', status: 'visible', type: 'announcement', createdAt: '2024-12-10', likesCount: 45, commentsCount: 5 },
  { id: 'p4', title: 'محتوى غير لائق', author: 'عمر الراشدي', authorEmail: 'omar@utas.edu.om', status: 'hidden', type: 'discussion', createdAt: '2024-12-08', likesCount: 2, commentsCount: 1 },
];

const initialComments: AdminComment[] = [
  { id: 'c1', content: 'شكراً على المشاركة المفيدة!', author: 'سارة المعمري', authorEmail: 'sara@utas.edu.om', postId: 'p1', postTitle: 'كيف أحسن مستواي في البرمجة؟', status: 'visible', createdAt: '2024-12-02' },
  { id: 'c2', content: 'أوافقك الرأي تماماً', author: 'محمد الكندي', authorEmail: 'mohammed@utas.edu.om', postId: 'p2', postTitle: 'نقاش حول مشروع التخرج', status: 'visible', createdAt: '2024-12-06' },
  { id: 'c3', content: 'تعليق مخالف للقواعد', author: 'عمر الراشدي', authorEmail: 'omar@utas.edu.om', postId: 'p1', postTitle: 'كيف أحسن مستواي في البرمجة؟', status: 'hidden', createdAt: '2024-12-03' },
];

const initialFiles: AdminFile[] = [
  { id: 'f1', filename: 'project_proposal.pdf', uploader: 'أحمد الحارثي', uploaderEmail: 'ahmed@utas.edu.om', postId: 'p1', postTitle: 'كيف أحسن مستواي في البرمجة؟', size: '2.5 MB', type: 'PDF', uploadedAt: '2024-12-01' },
  { id: 'f2', filename: 'presentation.pptx', uploader: 'فاطمة البلوشي', uploaderEmail: 'fatima@utas.edu.om', postId: 'p2', postTitle: 'نقاش حول مشروع التخرج', size: '5.1 MB', type: 'PPTX', uploadedAt: '2024-12-05' },
  { id: 'f3', filename: 'exam_schedule.pdf', uploader: 'المشرف العام', uploaderEmail: 'w.qq89@hotmail.com', postId: 'p3', postTitle: 'إعلان: موعد الامتحانات النهائية', size: '1.2 MB', type: 'PDF', uploadedAt: '2024-12-10' },
];

const initialReports: Report[] = [
  { id: 'r1', targetType: 'post', targetId: 'p4', targetTitle: 'محتوى غير لائق', reason: 'harassment', reporter: 'سارة المعمري', reporterEmail: 'sara@utas.edu.om', status: 'open', createdAt: '2024-12-08', authorEmail: 'omar@utas.edu.om' },
  { id: 'r2', targetType: 'comment', targetId: 'c3', targetTitle: 'تعليق مخالف للقواعد', reason: 'spam', reporter: 'فاطمة البلوشي', reporterEmail: 'fatima@utas.edu.om', status: 'resolved', createdAt: '2024-12-04', authorEmail: 'omar@utas.edu.om' },
  { id: 'r3', targetType: 'user', targetId: '5', targetTitle: 'عمر الراشدي', reason: 'impersonation', reporter: 'أحمد الحارثي', reporterEmail: 'ahmed@utas.edu.om', status: 'open', createdAt: '2024-12-07' },
];

// Helper to compute priority from reason
const computePriority = (reason: string): ReportPriority => {
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes('harassment') || lowerReason.includes('hate') || lowerReason.includes('impersonation')) {
    return 'high';
  }
  if (lowerReason.includes('spam')) {
    return 'medium';
  }
  return 'low';
};

export default function Admin() {
  const { lang, user, reports: storeReports, updateReportStatus, allowedDomains, addAllowedDomain, removeAllowedDomain } = useDaamStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [contentSubTab, setContentSubTab] = useState('posts');
  
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [posts, setPosts] = useState<AdminPost[]>(initialPosts);
  const [comments, setComments] = useState<AdminComment[]>(initialComments);
  const [files, setFiles] = useState<AdminFile[]>(initialFiles);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [localDemoReports, setLocalDemoReports] = useState<Report[]>(initialReports);
  
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonModalAction, setReasonModalAction] = useState<{ reportId: string; targetStatus: ReportStatus } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [editStatusMode, setEditStatusMode] = useState(false);
  const [selectedEditStatus, setSelectedEditStatus] = useState<ReportStatus>('open');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [reportSortOption, setReportSortOption] = useState<ReportSortOption>('newest');
  
  // Merge store reports with local demo reports for display
  const reports: Report[] = useMemo(() => {
    const storeReportsMapped: Report[] = storeReports.map(r => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      targetTitle: r.targetTitle,
      reason: r.reason,
      reporter: r.reporter,
      reporterEmail: r.reporterEmail,
      status: r.status,
      createdAt: r.createdAt,
      resolutionReason: (r as any).resolutionReason,
      priority: (r as any).priority || computePriority(r.reason),
      targetAction: (r as any).targetAction,
      userAction: (r as any).userAction,
      authorEmail: (r as any).authorEmail
    }));
    // Add priority to local demo reports
    const localWithPriority = localDemoReports.map(r => ({
      ...r,
      priority: r.priority || computePriority(r.reason)
    }));
    // Combine store reports (new) with local demo reports
    return [...storeReportsMapped, ...localWithPriority.filter(r => !storeReportsMapped.some(sr => sr.id === r.id))];
  }, [storeReports, localDemoReports]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [universityFilter, setUniversityFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailType, setDetailType] = useState<string>('');
  
  // User Details state
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUser | null>(null);
  const [userDetailTab, setUserDetailTab] = useState<'account' | 'actions' | 'activity' | 'moderation' | 'notes'>('account');
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newDomainInput, setNewDomainInput] = useState('');

  // Campaign state
  const [campaignsList, setCampaignsList] = useState<Campaign[]>(getCampaigns());
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>('all');
  const [campaignPlacementFilter, setCampaignPlacementFilter] = useState<string>('all');
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteConfirmCampaign, setDeleteConfirmCampaign] = useState<Campaign | null>(null);
  const [campaignVideoFile, setCampaignVideoFile] = useState<File | null>(null);
  const [campaignVideoPreview, setCampaignVideoPreview] = useState<string | null>(null);
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campaignForm, setCampaignForm] = useState({
    titleAr: '',
    titleEn: '',
    contentAr: '',
    contentEn: '',
    type: 'banner' as CampaignType,
    placement: 'home' as CampaignPlacement,
    target: 'all' as CampaignTarget,
    status: 'draft' as CampaignStatus,
    startDate: '',
    endDate: '',
    priority: 1,
    showOnce: false,
    dismissible: true,
  });

  const isRTL = lang === 'ar';
  const currentUser = user?.email || 'admin@utas.edu.om';

  const addAuditLog = (action: ActionType, targetType: AuditLogEntry['targetType'], targetId: string, targetName: string, details?: string) => {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      action,
      targetType,
      targetId,
      targetName,
      performedBy: currentUser,
      performedAt: new Date().toISOString().split('T')[0],
      details
    };
    setAuditLog(prev => [entry, ...prev]);
  };

  const tr = {
    title: lang === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard',
    overview: lang === 'ar' ? 'نظرة عامة' : 'Overview',
    users: lang === 'ar' ? 'المستخدمون' : 'Users',
    content: lang === 'ar' ? 'المحتوى' : 'Content',
    reports: lang === 'ar' ? 'البلاغات' : 'Reports',
    auditLog: lang === 'ar' ? 'سجل العمليات' : 'Audit Log',
    posts: lang === 'ar' ? 'المنشورات' : 'Posts',
    comments: lang === 'ar' ? 'التعليقات' : 'Comments',
    files: lang === 'ar' ? 'الملفات' : 'Files',
    search: lang === 'ar' ? 'بحث...' : 'Search...',
    filter: lang === 'ar' ? 'تصفية' : 'Filter',
    all: lang === 'ar' ? 'الكل' : 'All',
    active: lang === 'ar' ? 'نشط' : 'Active',
    suspended: lang === 'ar' ? 'موقوف' : 'Suspended',
    banned: lang === 'ar' ? 'محظور' : 'Banned',
    visible: lang === 'ar' ? 'مرئي' : 'Visible',
    hidden: lang === 'ar' ? 'مخفي' : 'Hidden',
    deleted: lang === 'ar' ? 'محذوف' : 'Deleted',
    open: lang === 'ar' ? 'مفتوح' : 'Open',
    in_review: lang === 'ar' ? 'قيد المراجعة' : 'In Review',
    resolved: lang === 'ar' ? 'تم الحل' : 'Resolved',
    dismissed: lang === 'ar' ? 'مرفوض' : 'Dismissed',
    question: lang === 'ar' ? 'سؤال' : 'Question',
    discussion: lang === 'ar' ? 'نقاش' : 'Discussion',
    announcement: lang === 'ar' ? 'إعلان' : 'Announcement',
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    suspend: lang === 'ar' ? 'إيقاف' : 'Suspend',
    ban: lang === 'ar' ? 'حظر' : 'Ban',
    activate: lang === 'ar' ? 'تفعيل' : 'Activate',
    hide: lang === 'ar' ? 'إخفاء' : 'Hide',
    show: lang === 'ar' ? 'إظهار' : 'Show',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    resolve: lang === 'ar' ? 'حل' : 'Resolve',
    dismiss: lang === 'ar' ? 'رفض' : 'Dismiss',
    reopen: lang === 'ar' ? 'إعادة فتح' : 'Reopen',
    editStatus: lang === 'ar' ? 'تعديل الحالة' : 'Edit Status',
    changeStatus: lang === 'ar' ? 'تغيير الحالة' : 'Change Status',
    selectStatus: lang === 'ar' ? 'اختر الحالة' : 'Select Status',
    reasonRequired: lang === 'ar' ? 'السبب مطلوب' : 'Reason is required',
    enterReason: lang === 'ar' ? 'أدخل السبب...' : 'Enter reason...',
    reasonForAction: lang === 'ar' ? 'سبب الإجراء' : 'Reason for Action',
    confirm: lang === 'ar' ? 'تأكيد' : 'Confirm',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    reportDetails: lang === 'ar' ? 'تفاصيل البلاغ' : 'Report Details',
    resolutionReason: lang === 'ar' ? 'سبب القرار' : 'Resolution Reason',
    targetTypePost: lang === 'ar' ? 'منشور' : 'Post',
    targetTypeComment: lang === 'ar' ? 'تعليق' : 'Comment',
    targetTypeUser: lang === 'ar' ? 'مستخدم' : 'User',
    openReports: lang === 'ar' ? 'البلاغات المفتوحة' : 'Open Reports',
    viewDetails: lang === 'ar' ? 'عرض التفاصيل' : 'View Details',
    close: lang === 'ar' ? 'إغلاق' : 'Close',
    totalUsers: lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
    totalPosts: lang === 'ar' ? 'إجمالي المنشورات' : 'Total Posts',
    totalComments: lang === 'ar' ? 'إجمالي التعليقات' : 'Total Comments',
    totalReports: lang === 'ar' ? 'البلاغات المعلقة' : 'Pending Reports',
    email: lang === 'ar' ? 'البريد' : 'Email',
    name: lang === 'ar' ? 'الاسم' : 'Name',
    status: lang === 'ar' ? 'الحالة' : 'Status',
    role: lang === 'ar' ? 'الدور' : 'Role',
    joinedAt: lang === 'ar' ? 'تاريخ الانضمام' : 'Joined',
    postsCount: lang === 'ar' ? 'المنشورات' : 'Posts',
    commentsCount: lang === 'ar' ? 'التعليقات' : 'Comments',
    author: lang === 'ar' ? 'الكاتب' : 'Author',
    type: lang === 'ar' ? 'النوع' : 'Type',
    date: lang === 'ar' ? 'التاريخ' : 'Date',
    likes: lang === 'ar' ? 'الإعجابات' : 'Likes',
    postTitle: lang === 'ar' ? 'عنوان المنشور' : 'Post Title',
    uploader: lang === 'ar' ? 'الرافع' : 'Uploader',
    filename: lang === 'ar' ? 'اسم الملف' : 'Filename',
    size: lang === 'ar' ? 'الحجم' : 'Size',
    target: lang === 'ar' ? 'الهدف' : 'Target',
    reason: lang === 'ar' ? 'السبب' : 'Reason',
    reporter: lang === 'ar' ? 'المُبلّغ' : 'Reporter',
    action: lang === 'ar' ? 'الإجراء' : 'Action',
    performedBy: lang === 'ar' ? 'بواسطة' : 'Performed By',
    noData: lang === 'ar' ? 'لا توجد بيانات' : 'No data available',
    moderator: lang === 'ar' ? 'مشرف' : 'Moderator',
    user: lang === 'ar' ? 'مستخدم' : 'User',
    sort: lang === 'ar' ? 'ترتيب' : 'Sort',
    newest: lang === 'ar' ? 'الأحدث' : 'Newest',
    oldest: lang === 'ar' ? 'الأقدم' : 'Oldest',
    actionLabels: {
      user_suspended: lang === 'ar' ? 'إيقاف مستخدم' : 'User Suspended',
      user_banned: lang === 'ar' ? 'حظر مستخدم' : 'User Banned',
      user_activated: lang === 'ar' ? 'تفعيل مستخدم' : 'User Activated',
      user_unsuspended: lang === 'ar' ? 'إلغاء إيقاف مستخدم' : 'User Unsuspended',
      user_unbanned: lang === 'ar' ? 'إلغاء حظر مستخدم' : 'User Unbanned',
      user_force_logout: lang === 'ar' ? 'تسجيل خروج إجباري' : 'Force Logout',
      user_settings_reset: lang === 'ar' ? 'إعادة تعيين الإعدادات' : 'Settings Reset',
      post_hidden: lang === 'ar' ? 'إخفاء منشور' : 'Post Hidden',
      post_deleted: lang === 'ar' ? 'حذف منشور' : 'Post Deleted',
      post_restored: lang === 'ar' ? 'استعادة منشور' : 'Post Restored',
      comment_hidden: lang === 'ar' ? 'إخفاء تعليق' : 'Comment Hidden',
      comment_deleted: lang === 'ar' ? 'حذف تعليق' : 'Comment Deleted',
      file_deleted: lang === 'ar' ? 'حذف ملف' : 'File Deleted',
      report_resolved: lang === 'ar' ? 'حل بلاغ' : 'Report Resolved',
      report_dismissed: lang === 'ar' ? 'رفض بلاغ' : 'Report Dismissed',
      report_reopened: lang === 'ar' ? 'إعادة فتح بلاغ' : 'Report Reopened',
      report_status_changed: lang === 'ar' ? 'تغيير حالة بلاغ' : 'Report Status Changed',
      target_hidden: lang === 'ar' ? 'إخفاء الهدف' : 'Target Hidden',
      author_suspended: lang === 'ar' ? 'إيقاف المؤلف' : 'Author Suspended',
      domain_added: lang === 'ar' ? 'إضافة نطاق' : 'Domain Added',
      domain_removed: lang === 'ar' ? 'حذف نطاق' : 'Domain Removed',
      campaign_created: lang === 'ar' ? 'إنشاء حملة' : 'Campaign Created',
      campaign_updated: lang === 'ar' ? 'تحديث حملة' : 'Campaign Updated',
      campaign_deleted: lang === 'ar' ? 'حذف حملة' : 'Campaign Deleted',
      campaign_activated: lang === 'ar' ? 'تفعيل حملة' : 'Campaign Activated',
      campaign_paused: lang === 'ar' ? 'إيقاف حملة' : 'Campaign Paused',
      campaign_ended: lang === 'ar' ? 'إنهاء حملة' : 'Campaign Ended',
      campaign_duplicated: lang === 'ar' ? 'نسخ حملة' : 'Campaign Duplicated',
    },
    // Priority translations
    priority: lang === 'ar' ? 'الأولوية' : 'Priority',
    low: lang === 'ar' ? 'منخفضة' : 'Low',
    medium: lang === 'ar' ? 'متوسطة' : 'Medium',
    high: lang === 'ar' ? 'عالية' : 'High',
    // Quick actions
    hideTarget: lang === 'ar' ? 'إخفاء الهدف' : 'Hide Target',
    suspendUser: lang === 'ar' ? 'إيقاف المستخدم' : 'Suspend User',
    targetHidden: lang === 'ar' ? 'تم إخفاء الهدف' : 'Target hidden by admin',
    userSuspended: lang === 'ar' ? 'تم إيقاف المستخدم' : 'User suspended by admin',
    // Sort options
    sortBy: lang === 'ar' ? 'ترتيب حسب' : 'Sort by',
    highestPriority: lang === 'ar' ? 'الأعلى أولوية' : 'Highest Priority',
    // User Details translations
    userDetails: lang === 'ar' ? 'تفاصيل المستخدم' : 'User Details',
    accountInfo: lang === 'ar' ? 'معلومات الحساب' : 'Account',
    supportActions: lang === 'ar' ? 'إجراءات الدعم' : 'Support Actions',
    activityTab: lang === 'ar' ? 'النشاط' : 'Activity',
    moderationHistory: lang === 'ar' ? 'سجل الإشراف' : 'Moderation History',
    adminNotes: lang === 'ar' ? 'ملاحظات الإدارة' : 'Admin Notes',
    displayName: lang === 'ar' ? 'الاسم المعروض' : 'Display Name',
    university: lang === 'ar' ? 'الجامعة' : 'University',
    lastActive: lang === 'ar' ? 'آخر نشاط' : 'Last Active',
    unsuspend: lang === 'ar' ? 'إلغاء الإيقاف' : 'Unsuspend',
    unban: lang === 'ar' ? 'إلغاء الحظر' : 'Unban',
    forceLogout: lang === 'ar' ? 'تسجيل خروج إجباري' : 'Force Logout',
    resetSettings: lang === 'ar' ? 'إعادة تعيين الإعدادات' : 'Reset Settings',
    recentPosts: lang === 'ar' ? 'المنشورات الأخيرة' : 'Recent Posts',
    recentComments: lang === 'ar' ? 'التعليقات الأخيرة' : 'Recent Comments',
    relatedReports: lang === 'ar' ? 'البلاغات المتعلقة' : 'Related Reports',
    noActivity: lang === 'ar' ? 'لا يوجد نشاط' : 'No activity',
    noModerationHistory: lang === 'ar' ? 'لا يوجد سجل إشراف' : 'No moderation history',
    noNotes: lang === 'ar' ? 'لا توجد ملاحظات' : 'No notes',
    addNote: lang === 'ar' ? 'إضافة ملاحظة' : 'Add Note',
    noteAdded: lang === 'ar' ? 'تمت إضافة الملاحظة' : 'Note added',
    superAdmin: lang === 'ar' ? 'المشرف العام' : 'Super Admin',
    forceLogoutMarked: lang === 'ar' ? 'تم وضع علامة تسجيل الخروج الإجباري' : 'Force logout flag set',
    settingsResetMarked: lang === 'ar' ? 'تم وضع علامة إعادة التعيين' : 'Settings reset flag set',
    asTarget: lang === 'ar' ? 'كهدف' : 'As Target',
    asAuthor: lang === 'ar' ? 'ككاتب' : 'As Author',
    enterNote: lang === 'ar' ? 'أدخل ملاحظة...' : 'Enter note...',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone',
    universityFilter: lang === 'ar' ? 'الجامعة' : 'University',
    domainFilter: lang === 'ar' ? 'النطاق' : 'Domain',
    exportCSV: lang === 'ar' ? 'تصدير CSV' : 'Export CSV',
    universities: lang === 'ar' ? 'الجامعات' : 'Universities',
    allowedDomains: lang === 'ar' ? 'نطاقات البريد المسموحة' : 'Allowed Email Domains',
    addDomain: lang === 'ar' ? 'إضافة نطاق' : 'Add Domain',
    domainPlaceholder: lang === 'ar' ? 'مثال: university.edu.om' : 'e.g., university.edu.om',
    domainAdded: lang === 'ar' ? 'تم إضافة النطاق بنجاح' : 'Domain added successfully',
    domainRemoved: lang === 'ar' ? 'تم حذف النطاق بنجاح' : 'Domain removed successfully',
    domainExists: lang === 'ar' ? 'النطاق موجود مسبقاً' : 'Domain already exists',
    invalidDomain: lang === 'ar' ? 'نطاق غير صالح' : 'Invalid domain format',
    cannotRemoveLast: lang === 'ar' ? 'لا يمكن حذف آخر نطاق' : 'Cannot remove the last domain',
    removeDomain: lang === 'ar' ? 'حذف النطاق' : 'Remove Domain',
    // Campaign translations
    campaigns: lang === 'ar' ? 'الحملات' : 'Campaigns',
    newCampaign: lang === 'ar' ? 'حملة جديدة' : 'New Campaign',
    editCampaign: lang === 'ar' ? 'تعديل الحملة' : 'Edit Campaign',
    campaignTitle: lang === 'ar' ? 'العنوان' : 'Title',
    campaignTitleAr: lang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)',
    campaignTitleEn: lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)',
    campaignBody: lang === 'ar' ? 'المحتوى' : 'Content',
    campaignBodyAr: lang === 'ar' ? 'المحتوى (عربي)' : 'Content (Arabic)',
    campaignBodyEn: lang === 'ar' ? 'المحتوى (إنجليزي)' : 'Content (English)',
    campaignType: lang === 'ar' ? 'النوع' : 'Type',
    campaignPlacement: lang === 'ar' ? 'موضع العرض' : 'Placement',
    campaignTarget: lang === 'ar' ? 'الجمهور' : 'Target',
    campaignStatus: lang === 'ar' ? 'الحالة' : 'Status',
    campaignVideo: lang === 'ar' ? 'فيديو' : 'Video',
    hasVideo: lang === 'ar' ? 'نعم' : 'Yes',
    noVideo: lang === 'ar' ? 'لا' : 'No',
    uploadVideo: lang === 'ar' ? 'رفع فيديو' : 'Upload Video',
    removeVideo: lang === 'ar' ? 'إزالة الفيديو' : 'Remove Video',
    attachments: lang === 'ar' ? 'المرفقات' : 'Attachments',
    uploadImages: lang === 'ar' ? 'رفع صور' : 'Upload Images',
    uploadFiles: lang === 'ar' ? 'رفع ملفات PDF' : 'Upload PDF Files',
    removeAttachment: lang === 'ar' ? 'إزالة' : 'Remove',
    imagesLimit: lang === 'ar' ? `الحد: 5 صور، 2MB لكل صورة (PNG/JPG/WebP)` : `Limit: 5 images, 2MB each (PNG/JPG/WebP)`,
    filesLimit: lang === 'ar' ? `الحد: 3 ملفات PDF، 10MB لكل ملف` : `Limit: 3 PDF files, 10MB each`,
    videoLimit: lang === 'ar' ? `الحد: فيديو واحد، 10 ثواني، 8MB (MP4/WebM)` : `Limit: 1 video, 10 seconds, 8MB (MP4/WebM)`,
    noAttachments: lang === 'ar' ? 'لا توجد مرفقات' : 'No attachments',
    attachmentError: lang === 'ar' ? 'خطأ في رفع المرفق' : 'Error uploading attachment',
    videoRequirements: lang === 'ar' ? 'MP4/WebM، أقصى 10 ثواني، 8MB' : 'MP4/WebM, max 10 sec, 8MB',
    startDate: lang === 'ar' ? 'تاريخ البدء' : 'Start Date',
    endDate: lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date',
    impressions: lang === 'ar' ? 'المشاهدات' : 'Impressions',
    clicks: lang === 'ar' ? 'النقرات' : 'Clicks',
    dismissals: lang === 'ar' ? 'الإغلاقات' : 'Dismissals',
    duplicate: lang === 'ar' ? 'نسخ' : 'Duplicate',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    pause: lang === 'ar' ? 'إيقاف' : 'Pause',
    end: lang === 'ar' ? 'إنهاء' : 'End',
    confirmDeleteCampaign: lang === 'ar' ? 'هل أنت متأكد من حذف هذه الحملة؟' : 'Are you sure you want to delete this campaign?',
    noCampaigns: lang === 'ar' ? 'لا توجد حملات' : 'No campaigns',
    campaignCreated: lang === 'ar' ? 'تم إنشاء الحملة بنجاح' : 'Campaign created successfully',
    campaignUpdated: lang === 'ar' ? 'تم تحديث الحملة بنجاح' : 'Campaign updated successfully',
    campaignDeleted: lang === 'ar' ? 'تم حذف الحملة بنجاح' : 'Campaign deleted successfully',
    campaignDuplicated: lang === 'ar' ? 'تم نسخ الحملة بنجاح' : 'Campaign duplicated successfully',
    // Campaign types
    banner: lang === 'ar' ? 'بانر' : 'Banner',
    popup: lang === 'ar' ? 'نافذة منبثقة' : 'Popup',
    announcementType: lang === 'ar' ? 'إعلان' : 'Announcement',
    notification: lang === 'ar' ? 'إشعار' : 'Notification',
    // Campaign statuses
    draft: lang === 'ar' ? 'مسودة' : 'Draft',
    scheduled: lang === 'ar' ? 'مجدول' : 'Scheduled',
    paused: lang === 'ar' ? 'متوقف' : 'Paused',
    ended: lang === 'ar' ? 'منتهي' : 'Ended',
    // Campaign targets
    everyone: lang === 'ar' ? 'الجميع' : 'Everyone',
    students: lang === 'ar' ? 'الطلاب' : 'Students',
    moderators: lang === 'ar' ? 'المشرفين' : 'Moderators',
    newUsers: lang === 'ar' ? 'المستخدمين الجدد' : 'New Users',
    // Campaign placements
    homePlacement: lang === 'ar' ? 'الصفحة الرئيسية' : 'Home',
    feedPlacement: lang === 'ar' ? 'الساحة' : 'Arena',
    profilePlacement: lang === 'ar' ? 'الملف الشخصي' : 'Profile',
    globalPlacement: lang === 'ar' ? 'عام' : 'Global',
  };

  const navItems = [
    { id: 'overview', label: tr.overview, icon: LayoutDashboard },
    { id: 'users', label: tr.users, icon: Users },
    { id: 'content', label: tr.content, icon: FileText },
    { id: 'reports', label: tr.reports, icon: Flag },
    { id: 'campaigns', label: tr.campaigns, icon: Megaphone },
    { id: 'universities', label: tr.universities, icon: Building },
    { id: 'auditLog', label: tr.auditLog, icon: ClipboardList },
  ];

  const stats = [
    { label: tr.totalUsers, value: users.length, icon: Users, color: 'from-violet-600 to-purple-500' },
    { label: tr.totalPosts, value: posts.filter(p => p.status !== 'deleted').length, icon: MessageSquare, color: 'from-blue-600 to-cyan-500' },
    { label: tr.totalComments, value: comments.filter(c => c.status !== 'deleted').length, icon: FileText, color: 'from-green-600 to-emerald-500' },
    { label: tr.totalReports, value: reports.filter(r => r.status === 'open').length, icon: Flag, color: 'from-amber-600 to-orange-500' },
  ];

  const handleUserAction = (userId: string, action: 'suspend' | 'ban' | 'activate') => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newStatus: UserStatus = action === 'suspend' ? 'suspended' : action === 'ban' ? 'banned' : 'active';
        const actionType: ActionType = action === 'suspend' ? 'user_suspended' : action === 'ban' ? 'user_banned' : 'user_activated';
        addAuditLog(actionType, 'user', u.id, u.name);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const handlePostAction = (postId: string, action: 'hide' | 'show' | 'delete') => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newStatus: PostStatus = action === 'hide' ? 'hidden' : action === 'delete' ? 'deleted' : 'visible';
        const actionType: ActionType = action === 'hide' ? 'post_hidden' : action === 'delete' ? 'post_deleted' : 'post_restored';
        addAuditLog(actionType, 'post', p.id, p.title);
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  const handleCommentAction = (commentId: string, action: 'hide' | 'delete') => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const newStatus: PostStatus = action === 'hide' ? 'hidden' : 'deleted';
        const actionType: ActionType = action === 'hide' ? 'comment_hidden' : 'comment_deleted';
        addAuditLog(actionType, 'comment', c.id, c.content.substring(0, 30) + '...');
        return { ...c, status: newStatus };
      }
      return c;
    }));
  };

  const handleFileAction = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      addAuditLog('file_deleted', 'file', file.id, file.filename);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const openReasonModal = (reportId: string, targetStatus: ReportStatus) => {
    setReasonModalAction({ reportId, targetStatus });
    setActionReason('');
    setReasonModalOpen(true);
  };

  const executeReportStatusChange = (reportId: string, newStatus: ReportStatus, reason?: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    const oldStatus = report.status;
    let actionType: ActionType;
    
    if (newStatus === 'resolved') {
      actionType = 'report_resolved';
    } else if (newStatus === 'dismissed') {
      actionType = 'report_dismissed';
    } else if (newStatus === 'open' && (oldStatus === 'resolved' || oldStatus === 'dismissed')) {
      actionType = 'report_reopened';
    } else {
      actionType = 'report_status_changed';
    }
    
    const details = reason ? `${oldStatus} → ${newStatus}: ${reason}` : `${oldStatus} → ${newStatus}`;
    addAuditLog(actionType, 'report', report.id, report.targetTitle, details);
    
    if (reportId.startsWith('report-')) {
      updateReportStatus(reportId, newStatus, reason);
    } else {
      setLocalDemoReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, status: newStatus, resolutionReason: reason } 
          : r
      ));
    }
  };

  const handleReportAction = (reportId: string, action: 'resolve' | 'dismiss' | 'reopen') => {
    if (action === 'reopen') {
      executeReportStatusChange(reportId, 'open');
    } else {
      const targetStatus: ReportStatus = action === 'resolve' ? 'resolved' : 'dismissed';
      openReasonModal(reportId, targetStatus);
    }
  };

  const confirmReasonModal = () => {
    if (!reasonModalAction) return;
    const { reportId, targetStatus } = reasonModalAction;
    
    if ((targetStatus === 'resolved' || targetStatus === 'dismissed') && !actionReason.trim()) {
      return;
    }
    
    executeReportStatusChange(reportId, targetStatus, actionReason.trim() || undefined);
    setReasonModalOpen(false);
    setReasonModalAction(null);
    setActionReason('');
  };

  // Quick Action: Hide Target
  const handleHideTarget = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Only for post/comment targets
    if (report.targetType !== 'post' && report.targetType !== 'comment') return;
    
    addAuditLog('target_hidden', report.targetType, report.targetId, report.targetTitle, `Report: ${reportId}`);
    
    // Update report with targetAction
    if (reportId.startsWith('report-')) {
      // For store reports, we can't modify them directly, so we track locally
      // In a real app, this would update the store
    }
    setLocalDemoReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, targetAction: 'hidden' as const } : r
    ));
  };

  // Quick Action: Suspend User/Author
  const handleSuspendUser = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    const targetEmail = report.targetType === 'user' 
      ? report.targetId 
      : report.authorEmail;
    
    if (!targetEmail) return;
    
    addAuditLog('author_suspended', 'user', targetEmail, report.targetTitle, `Report: ${reportId}`);
    
    // Update report with userAction
    setLocalDemoReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, userAction: 'suspended' as const } : r
    ));
  };

  // User Details: Open modal
  const openUserDetail = (user: AdminUser) => {
    setSelectedUserDetail(user);
    setUserDetailTab('account');
    setNewNoteText('');
    setUserDetailModalOpen(true);
  };

  // User Details: Support Actions
  const handleUserDetailAction = (userId: string, action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'forceLogout' | 'resetSettings') => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        let newStatus = u.status;
        let actionType: ActionType;
        let updatedUser = { ...u };
        
        switch (action) {
          case 'suspend':
            newStatus = 'suspended';
            actionType = 'user_suspended';
            break;
          case 'unsuspend':
            newStatus = 'active';
            actionType = 'user_unsuspended';
            break;
          case 'ban':
            newStatus = 'banned';
            actionType = 'user_banned';
            break;
          case 'unban':
            newStatus = 'active';
            actionType = 'user_unbanned';
            break;
          case 'forceLogout':
            actionType = 'user_force_logout';
            updatedUser.forceLogoutFlag = true;
            break;
          case 'resetSettings':
            actionType = 'user_settings_reset';
            updatedUser.settingsResetFlag = true;
            break;
          default:
            return u;
        }
        
        addAuditLog(actionType, 'user', u.id, u.name);
        updatedUser.status = newStatus;
        
        // Update selected user detail if open
        if (selectedUserDetail?.id === userId) {
          setSelectedUserDetail(updatedUser);
        }
        
        return updatedUser;
      }
      return u;
    }));
  };

  // User Details: Add admin note
  const addAdminNote = (userEmail: string) => {
    if (!newNoteText.trim()) return;
    
    const note: AdminNote = {
      id: `note-${Date.now()}`,
      userEmail,
      note: newNoteText.trim(),
      addedBy: tr.superAdmin,
      addedAt: new Date().toISOString().split('T')[0]
    };
    
    setAdminNotes(prev => [note, ...prev]);
    setNewNoteText('');
  };

  // User Details: Get user's posts
  const getUserPosts = (userEmail: string) => posts.filter(p => p.authorEmail === userEmail);

  // User Details: Get user's comments
  const getUserComments = (userEmail: string) => comments.filter(c => c.authorEmail === userEmail);

  // User Details: Get related reports (as target or author)
  const getUserRelatedReports = (user: AdminUser) => {
    return reports.filter(r => 
      (r.targetType === 'user' && r.targetId === user.id) || 
      r.reporterEmail === user.email ||
      r.authorEmail === user.email
    );
  };

  // User Details: Get moderation history for user
  const getUserModerationHistory = (user: AdminUser) => {
    return auditLog.filter(log => 
      log.targetType === 'user' && (log.targetId === user.id || log.targetName === user.name || log.targetId === user.email)
    );
  };

  // User Details: Get notes for user
  const getUserNotes = (userEmail: string) => adminNotes.filter(n => n.userEmail === userEmail);

  const handleEditStatusSubmit = () => {
    if (!selectedItem) return;
    
    if ((selectedEditStatus === 'resolved' || selectedEditStatus === 'dismissed') && !actionReason.trim()) {
      return;
    }
    
    executeReportStatusChange(selectedItem.id, selectedEditStatus, actionReason.trim() || undefined);
    setEditStatusMode(false);
    setActionReason('');
    setDetailModalOpen(false);
  };

  const openDetailModal = (item: any, type: string) => {
    setSelectedItem(item);
    setDetailType(type);
    setDetailModalOpen(true);
  };

  // Derived lists for university and domain filters
  const universityList = useMemo(() => {
    const unis = new Set<string>();
    users.forEach(u => {
      const uni = u.university || u.email.split('@')[1] || '';
      if (uni) unis.add(uni);
    });
    return Array.from(unis).sort();
  }, [users]);

  const domainList = useMemo(() => {
    const domains = new Set<string>();
    users.forEach(u => {
      const domain = u.email.split('@')[1];
      if (domain) domains.add(domain);
    });
    return Array.from(domains).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        const userUniversity = u.university || u.email.split('@')[1] || '';
        const matchesUniversity = universityFilter === 'all' || userUniversity === universityFilter;
        const userDomain = u.email.split('@')[1] || '';
        const matchesDomain = domainFilter === 'all' || userDomain === domainFilter;
        return matchesSearch && matchesStatus && matchesUniversity && matchesDomain;
      })
      .sort((a, b) => sortOrder === 'desc' ? 
        new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime() :
        new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
      );
  }, [users, searchQuery, statusFilter, universityFilter, domainFilter, sortOrder]);

  // CSV Export function
  const exportUsersCSV = () => {
    const headers = ['email', 'displayName', 'university', 'status', 'role', 'createdAt', 'lastActive'];
    const rows = filteredUsers.map(u => [
      u.email,
      u.name,
      u.university || u.email.split('@')[1] || '',
      u.status,
      u.role,
      u.joinedAt,
      u.lastActive || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Domain management handlers
  const handleAddDomain = () => {
    const normalized = newDomainInput.toLowerCase().trim().replace(/^@/, '');
    if (!normalized) return;
    
    const success = addAllowedDomain(normalized);
    if (success) {
      addAuditLog('domain_added', 'user', normalized, normalized);
      setNewDomainInput('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    const success = removeAllowedDomain(domain);
    if (success) {
      addAuditLog('domain_removed', 'user', domain, domain);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts
      .filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesType = typeFilter === 'all' || p.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => sortOrder === 'desc' ? 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() :
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [posts, searchQuery, statusFilter, typeFilter, sortOrder]);

  const filteredComments = useMemo(() => {
    return comments
      .filter(c => {
        const matchesSearch = c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => sortOrder === 'desc' ? 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() :
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [comments, searchQuery, statusFilter, sortOrder]);

  const filteredFiles = useMemo(() => {
    return files
      .filter(f => {
        const matchesSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              f.uploader.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => sortOrder === 'desc' ? 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime() :
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );
  }, [files, searchQuery, sortOrder]);

  const filteredReports = useMemo(() => {
    const priorityOrder: Record<ReportPriority, number> = { high: 3, medium: 2, low: 1 };
    
    return reports
      .filter(r => {
        const matchesSearch = r.targetTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.reason.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || (r.priority || 'low') === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (reportSortOption === 'priority') {
          const aPriority = priorityOrder[a.priority || 'low'];
          const bPriority = priorityOrder[b.priority || 'low'];
          if (bPriority !== aPriority) return bPriority - aPriority;
          // Secondary sort by date for same priority
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Date sort
        return reportSortOption === 'oldest' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reports, searchQuery, statusFilter, priorityFilter, reportSortOption]);

  const filteredAuditLog = useMemo(() => {
    return auditLog
      .filter(log => {
        const matchesSearch = log.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              log.performedBy.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => sortOrder === 'desc' ? 
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime() :
        new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime()
      );
  }, [auditLog, searchQuery, sortOrder]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const getStatusBadge = (status: string, type: 'user' | 'post' | 'report') => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      suspended: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      banned: 'bg-red-500/20 text-red-400 border-red-500/30',
      visible: 'bg-green-500/20 text-green-400 border-green-500/30',
      hidden: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      deleted: 'bg-red-500/20 text-red-400 border-red-500/30',
      open: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      in_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      dismissed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const labels: Record<string, string> = {
      active: tr.active,
      suspended: tr.suspended,
      banned: tr.banned,
      visible: tr.visible,
      hidden: tr.hidden,
      deleted: tr.deleted,
      open: tr.open,
      in_review: tr.in_review,
      resolved: tr.resolved,
      dismissed: tr.dismissed,
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[status] || 'bg-gray-500/20'}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      question: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      discussion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      announcement: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    const labels: Record<string, string> = {
      question: tr.question,
      discussion: tr.discussion,
      announcement: tr.announcement,
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[type] || 'bg-gray-500/20'}`}>
        {labels[type] || type}
      </Badge>
    );
  };

  const SearchAndFilters = ({ showTypeFilter = false, showStatusFilter = true, statusOptions = ['active', 'suspended', 'banned'] }: { showTypeFilter?: boolean; showStatusFilter?: boolean; statusOptions?: string[] }) => (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={tr.search}
          className={`${isRTL ? 'pr-10' : 'pl-10'} bg-background/50 border-white/10`}
          data-testid="input-admin-search"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {showStatusFilter && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-background/50 border-white/10" data-testid="select-status-filter">
              <Filter className="w-4 h-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              {statusOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{(tr as any)[opt]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showTypeFilter && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 bg-background/50 border-white/10" data-testid="select-type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              <SelectItem value="question">{tr.question}</SelectItem>
              <SelectItem value="discussion">{tr.discussion}</SelectItem>
              <SelectItem value="announcement">{tr.announcement}</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="border-white/10"
          title={sortOrder === 'desc' ? tr.newest : tr.oldest}
          data-testid="button-sort-toggle"
        >
          {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="border-white/10 bg-card/50 hover:border-primary/30 transition-all">
              <CardContent className="p-4 sm:p-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {tr.auditLog} ({lang === 'ar' ? 'آخر 5' : 'Last 5'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{tr.noData}</p>
          ) : (
            <div className="space-y-2">
              {auditLog.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {tr.actionLabels[log.action]}
                    </Badge>
                    <span className="text-sm">{log.targetName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.performedAt}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <Card className="border-white/10 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {tr.users}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={exportUsersCSV} className="border-white/10" data-testid="button-export-csv">
          <Download className="w-4 h-4 me-2" />
          {tr.exportCSV}
        </Button>
      </CardHeader>
      <CardContent>
        <SearchAndFilters showStatusFilter statusOptions={['active', 'suspended', 'banned']} />
        {/* Additional Filters: University and Domain */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger className="w-40 bg-background/50 border-white/10" data-testid="select-university-filter">
              <Building className="w-4 h-4 me-2" />
              <SelectValue placeholder={tr.universityFilter} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              {universityList.map(uni => (
                <SelectItem key={uni} value={uni}>{uni}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-40 bg-background/50 border-white/10" data-testid="select-domain-filter">
              <Globe className="w-4 h-4 me-2" />
              <SelectValue placeholder={tr.domainFilter} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              {domainList.map(domain => (
                <SelectItem key={domain} value={domain}>{domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.name}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.email}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.status}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.role}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.joinedAt}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{tr.noData}</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">{getStatusBadge(u.status, 'user')}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={u.role === 'moderator' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}>
                        {u.role === 'moderator' ? tr.moderator : tr.user}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.joinedAt}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openUserDetail(u)} data-testid={`button-view-user-${u.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {u.status === 'active' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleUserAction(u.id, 'suspend')} className="text-amber-400" data-testid={`button-suspend-user-${u.id}`}>
                              <Ban className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleUserAction(u.id, 'ban')} className="text-red-400" data-testid={`button-ban-user-${u.id}`}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {(u.status === 'suspended' || u.status === 'banned') && (
                          <Button size="sm" variant="ghost" onClick={() => handleUserAction(u.id, 'activate')} className="text-green-400" data-testid={`button-activate-user-${u.id}`}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderPosts = () => (
    <Card className="border-white/10 bg-card/50">
      <CardContent className="pt-6">
        <SearchAndFilters showStatusFilter showTypeFilter statusOptions={['visible', 'hidden', 'deleted']} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.postTitle}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.author}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.type}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.status}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.date}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{tr.noData}</td></tr>
              ) : (
                filteredPosts.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium max-w-xs truncate">{p.title}</td>
                    <td className="p-3 text-muted-foreground">{p.author}</td>
                    <td className="p-3">{getTypeBadge(p.type)}</td>
                    <td className="p-3">{getStatusBadge(p.status, 'post')}</td>
                    <td className="p-3 text-muted-foreground">{p.createdAt}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDetailModal(p, 'post')} data-testid={`button-view-post-${p.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {p.status === 'visible' && (
                          <Button size="sm" variant="ghost" onClick={() => handlePostAction(p.id, 'hide')} className="text-amber-400" data-testid={`button-hide-post-${p.id}`}>
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        )}
                        {p.status === 'hidden' && (
                          <Button size="sm" variant="ghost" onClick={() => handlePostAction(p.id, 'show')} className="text-green-400" data-testid={`button-show-post-${p.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {p.status !== 'deleted' && (
                          <Button size="sm" variant="ghost" onClick={() => handlePostAction(p.id, 'delete')} className="text-red-400" data-testid={`button-delete-post-${p.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderComments = () => (
    <Card className="border-white/10 bg-card/50">
      <CardContent className="pt-6">
        <SearchAndFilters showStatusFilter statusOptions={['visible', 'hidden', 'deleted']} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.comments}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.author}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.postTitle}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.status}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.date}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{tr.noData}</td></tr>
              ) : (
                filteredComments.map(c => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium max-w-xs truncate">{c.content}</td>
                    <td className="p-3 text-muted-foreground">{c.author}</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{c.postTitle}</td>
                    <td className="p-3">{getStatusBadge(c.status, 'post')}</td>
                    <td className="p-3 text-muted-foreground">{c.createdAt}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDetailModal(c, 'comment')} data-testid={`button-view-comment-${c.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {c.status === 'visible' && (
                          <Button size="sm" variant="ghost" onClick={() => handleCommentAction(c.id, 'hide')} className="text-amber-400" data-testid={`button-hide-comment-${c.id}`}>
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        )}
                        {c.status !== 'deleted' && (
                          <Button size="sm" variant="ghost" onClick={() => handleCommentAction(c.id, 'delete')} className="text-red-400" data-testid={`button-delete-comment-${c.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderFiles = () => (
    <Card className="border-white/10 bg-card/50">
      <CardContent className="pt-6">
        <SearchAndFilters showStatusFilter={false} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.filename}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.uploader}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.postTitle}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.size}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.date}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{tr.noData}</td></tr>
              ) : (
                filteredFiles.map(f => (
                  <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium">{f.filename}</td>
                    <td className="p-3 text-muted-foreground">{f.uploader}</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{f.postTitle}</td>
                    <td className="p-3 text-muted-foreground">{f.size}</td>
                    <td className="p-3 text-muted-foreground">{f.uploadedAt}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDetailModal(f, 'file')} data-testid={`button-view-file-${f.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleFileAction(f.id)} className="text-red-400" data-testid={`button-delete-file-${f.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {['posts', 'comments', 'files'].map(tab => (
          <Button
            key={tab}
            variant={contentSubTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setContentSubTab(tab); resetFilters(); }}
            data-testid={`tab-content-${tab}`}
          >
            {tab === 'posts' ? tr.posts : tab === 'comments' ? tr.comments : tr.files}
          </Button>
        ))}
      </div>
      {contentSubTab === 'posts' && renderPosts()}
      {contentSubTab === 'comments' && renderComments()}
      {contentSubTab === 'files' && renderFiles()}
    </div>
  );

  const getPriorityBadge = (priority: ReportPriority) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      low: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    const labels = { high: tr.high, medium: tr.medium, low: tr.low };
    return (
      <Badge variant="outline" className={`text-xs ${colors[priority]}`}>
        {labels[priority]}
      </Badge>
    );
  };

  const renderReports = () => (
    <Card className="border-white/10 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5" />
          {tr.reports}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search + Filters + Sort */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={tr.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-background/50 border-white/10 ${isRTL ? 'pr-10' : 'pl-10'}`}
              data-testid="input-search-reports"
            />
          </div>
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background/50 border-white/10" data-testid="select-status-filter">
              <Filter className="w-4 h-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              <SelectItem value="open">{tr.open}</SelectItem>
              <SelectItem value="in_review">{tr.in_review}</SelectItem>
              <SelectItem value="resolved">{tr.resolved}</SelectItem>
              <SelectItem value="dismissed">{tr.dismissed}</SelectItem>
            </SelectContent>
          </Select>
          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] bg-background/50 border-white/10" data-testid="select-priority-filter">
              <SelectValue placeholder={tr.priority} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              <SelectItem value="high">{tr.high}</SelectItem>
              <SelectItem value="medium">{tr.medium}</SelectItem>
              <SelectItem value="low">{tr.low}</SelectItem>
            </SelectContent>
          </Select>
          {/* Sort */}
          <Select value={reportSortOption} onValueChange={(v) => setReportSortOption(v as ReportSortOption)}>
            <SelectTrigger className="w-[160px] bg-background/50 border-white/10" data-testid="select-sort-reports">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{tr.newest}</SelectItem>
              <SelectItem value="oldest">{tr.oldest}</SelectItem>
              <SelectItem value="priority">{tr.highestPriority}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.target}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.type}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.priority}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.reason}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.status}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.date}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">{tr.noData}</td></tr>
              ) : (
                filteredReports.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium max-w-xs truncate">
                      {r.targetTitle}
                      {r.targetAction === 'hidden' && (
                        <Badge variant="outline" className="ms-2 text-xs bg-gray-500/20 text-gray-400">{tr.hidden}</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {r.targetType === 'post' ? tr.targetTypePost : r.targetType === 'comment' ? tr.targetTypeComment : tr.targetTypeUser}
                      </Badge>
                    </td>
                    <td className="p-3">{getPriorityBadge(r.priority || 'low')}</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{r.reason}</td>
                    <td className="p-3">{getStatusBadge(r.status, 'report')}</td>
                    <td className="p-3 text-muted-foreground">{r.createdAt}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        <Button size="sm" variant="ghost" onClick={() => openDetailModal(r, 'report')} data-testid={`button-view-report-${r.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(r.status === 'open' || r.status === 'in_review') && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleReportAction(r.id, 'resolve')} className="text-green-400" data-testid={`button-resolve-report-${r.id}`}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleReportAction(r.id, 'dismiss')} className="text-gray-400" data-testid={`button-dismiss-report-${r.id}`}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {(r.status === 'resolved' || r.status === 'dismissed') && (
                          <Button size="sm" variant="ghost" onClick={() => handleReportAction(r.id, 'reopen')} className="text-amber-400" data-testid={`button-reopen-report-${r.id}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Quick Actions */}
                        {(r.targetType === 'post' || r.targetType === 'comment') && !r.targetAction && (
                          <Button size="sm" variant="ghost" onClick={() => handleHideTarget(r.id)} className="text-purple-400" data-testid={`button-hide-target-${r.id}`} title={tr.hideTarget}>
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        )}
                        {(r.targetType === 'user' || r.authorEmail) && !r.userAction && (
                          <Button size="sm" variant="ghost" onClick={() => handleSuspendUser(r.id)} className="text-orange-400" data-testid={`button-suspend-user-${r.id}`} title={tr.suspendUser}>
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const refreshCampaigns = () => {
    setCampaignsList(getCampaigns());
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      titleAr: '',
      titleEn: '',
      contentAr: '',
      contentEn: '',
      type: 'banner',
      placement: 'home',
      target: 'all',
      status: 'draft',
      startDate: '',
      endDate: '',
      priority: 1,
      showOnce: false,
      dismissible: true,
    });
    setCampaignVideoFile(null);
    setCampaignVideoPreview(null);
  };

  const openNewCampaignDialog = () => {
    resetCampaignForm();
    setEditingCampaign(null);
    setCampaignDialogOpen(true);
  };

  const openEditCampaignDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      titleAr: campaign.title.ar,
      titleEn: campaign.title.en,
      contentAr: campaign.content.ar,
      contentEn: campaign.content.en,
      type: campaign.type,
      placement: campaign.placement,
      target: campaign.target,
      status: campaign.status,
      startDate: campaign.startDate?.split('T')[0] || '',
      endDate: campaign.endDate?.split('T')[0] || '',
      priority: campaign.priority,
      showOnce: campaign.showOnce,
      dismissible: campaign.dismissible,
    });
    setCampaignVideoFile(null);
    if (campaign.video?.id) {
      getCampaignMedia(campaign.video.id).then(blob => {
        if (blob) {
          setCampaignVideoPreview(URL.createObjectURL(blob));
        }
      });
    } else {
      setCampaignVideoPreview(null);
    }
    setCampaignDialogOpen(true);
  };

  const handleCampaignVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCampaignVideoFile(file);
      setCampaignVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCampaignVideo = async () => {
    if (editingCampaign?.video?.id) {
      try {
        await removeCampaignVideo(editingCampaign.id);
        refreshCampaigns();
      } catch {}
    }
    setCampaignVideoFile(null);
    setCampaignVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: CampaignAttachmentKind) => {
    if (!editingCampaign) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setAttachmentUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const currentCount = getAttachmentCountByKind(editingCampaign, kind);
        const validation = await validateAttachment(file, kind, currentCount);
        
        if (!validation.ok) {
          alert(lang === 'ar' ? validation.reasonAr : validation.reason);
          continue;
        }
        
        await attachCampaignAttachment(editingCampaign.id, file, kind);
        addAuditLog('campaign_updated', 'campaign', editingCampaign.id, `Attachment added: ${file.name}`);
      }
      refreshCampaigns();
      // Update editingCampaign to reflect new attachments
      const updatedCampaign = getCampaigns().find(c => c.id === editingCampaign.id);
      if (updatedCampaign) {
        setEditingCampaign(updatedCampaign);
      }
    } catch (err) {
      alert(tr.attachmentError);
    } finally {
      setAttachmentUploading(false);
      // Reset inputs
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentId: string, attachmentName: string) => {
    if (!editingCampaign) return;
    
    try {
      await removeCampaignAttachment(editingCampaign.id, attachmentId);
      addAuditLog('campaign_updated', 'campaign', editingCampaign.id, `Attachment removed: ${attachmentName}`);
      refreshCampaigns();
      // Update editingCampaign
      const updatedCampaign = getCampaigns().find(c => c.id === editingCampaign.id);
      if (updatedCampaign) {
        setEditingCampaign(updatedCampaign);
      }
    } catch {}
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getAttachmentIcon = (kind: CampaignAttachmentKind) => {
    switch (kind) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'file': return <File className="w-4 h-4" />;
    }
  };

  const handleSaveCampaign = async () => {
    if (!campaignForm.titleAr || !campaignForm.titleEn) return;
    
    setCampaignSaving(true);
    try {
      const campaignData = {
        title: { ar: campaignForm.titleAr, en: campaignForm.titleEn },
        content: { ar: campaignForm.contentAr, en: campaignForm.contentEn },
        type: campaignForm.type,
        placement: campaignForm.placement,
        target: campaignForm.target,
        status: campaignForm.status,
        startDate: campaignForm.startDate ? new Date(campaignForm.startDate).toISOString() : new Date().toISOString(),
        endDate: campaignForm.endDate ? new Date(campaignForm.endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        priority: campaignForm.priority,
        showOnce: campaignForm.showOnce,
        dismissible: campaignForm.dismissible,
        createdBy: currentUser,
      };

      let savedCampaign: Campaign;
      if (editingCampaign) {
        savedCampaign = updateCampaign(editingCampaign.id, campaignData) as Campaign;
        addAuditLog('campaign_updated', 'campaign', editingCampaign.id, campaignForm.titleEn);
      } else {
        savedCampaign = createCampaign(campaignData);
        addAuditLog('campaign_created', 'campaign', savedCampaign.id, campaignForm.titleEn);
      }

      if (campaignVideoFile) {
        await attachCampaignVideo(savedCampaign.id, campaignVideoFile);
      }

      refreshCampaigns();
      setCampaignDialogOpen(false);
      resetCampaignForm();
    } catch (error) {
      console.error('Failed to save campaign:', error);
    } finally {
      setCampaignSaving(false);
    }
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    await deleteCampaign(campaign.id);
    addAuditLog('campaign_deleted', 'campaign', campaign.id, campaign.title.en);
    refreshCampaigns();
    setDeleteConfirmCampaign(null);
  };

  const handleDuplicateCampaign = (campaign: Campaign) => {
    const newCampaign = createCampaign({
      title: { ar: campaign.title.ar + ' (نسخة)', en: campaign.title.en + ' (Copy)' },
      content: campaign.content,
      type: campaign.type,
      placement: campaign.placement,
      target: campaign.target,
      status: 'draft',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      priority: campaign.priority,
      showOnce: campaign.showOnce,
      dismissible: campaign.dismissible,
      createdBy: currentUser,
    });
    addAuditLog('campaign_duplicated', 'campaign', newCampaign.id, newCampaign.title.en);
    refreshCampaigns();
  };

  const handleCampaignStatusChange = (campaign: Campaign, newStatus: CampaignStatus) => {
    updateCampaignStatus(campaign.id, newStatus);
    const actionType: ActionType = 
      newStatus === 'active' ? 'campaign_activated' : 
      newStatus === 'paused' ? 'campaign_paused' : 
      newStatus === 'ended' ? 'campaign_ended' : 'campaign_updated';
    addAuditLog(actionType, 'campaign', campaign.id, campaign.title.en);
    refreshCampaigns();
  };

  const getCampaignTypeLabel = (type: CampaignType) => {
    switch (type) {
      case 'banner': return tr.banner;
      case 'popup': return tr.popup;
      case 'announcement': return tr.announcementType;
      case 'notification': return tr.notification;
      default: return type;
    }
  };

  const getCampaignStatusLabel = (status: CampaignStatus) => {
    switch (status) {
      case 'draft': return tr.draft;
      case 'scheduled': return tr.scheduled;
      case 'active': return tr.active;
      case 'paused': return tr.paused;
      case 'ended': return tr.ended;
      default: return status;
    }
  };

  const getCampaignPlacementLabel = (placement: CampaignPlacement) => {
    switch (placement) {
      case 'home': return tr.homePlacement;
      case 'feed': return tr.feedPlacement;
      case 'profile': return tr.profilePlacement;
      case 'global': return tr.globalPlacement;
      default: return placement;
    }
  };

  const getCampaignTargetLabel = (target: CampaignTarget) => {
    switch (target) {
      case 'all': return tr.everyone;
      case 'students': return tr.students;
      case 'moderators': return tr.moderators;
      case 'new_users': return tr.newUsers;
      default: return target;
    }
  };

  const filteredCampaigns = useMemo(() => {
    let result = campaignsList;
    if (campaignStatusFilter !== 'all') {
      result = result.filter(c => c.status === campaignStatusFilter);
    }
    if (campaignPlacementFilter !== 'all') {
      result = result.filter(c => c.placement === campaignPlacementFilter);
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [campaignsList, campaignStatusFilter, campaignPlacementFilter]);

  const renderCampaigns = () => (
    <Card className="border-white/10 bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {tr.campaigns}
          </CardTitle>
          <Button onClick={openNewCampaignDialog} data-testid="button-new-campaign">
            <Plus className="w-4 h-4 me-2" />
            {tr.newCampaign}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Select value={campaignStatusFilter} onValueChange={setCampaignStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-campaign-status-filter">
              <SelectValue placeholder={tr.campaignStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              <SelectItem value="draft">{tr.draft}</SelectItem>
              <SelectItem value="scheduled">{tr.scheduled}</SelectItem>
              <SelectItem value="active">{tr.active}</SelectItem>
              <SelectItem value="paused">{tr.paused}</SelectItem>
              <SelectItem value="ended">{tr.ended}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={campaignPlacementFilter} onValueChange={setCampaignPlacementFilter}>
            <SelectTrigger className="w-40" data-testid="select-campaign-placement-filter">
              <SelectValue placeholder={tr.campaignPlacement} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              <SelectItem value="home">{tr.homePlacement}</SelectItem>
              <SelectItem value="feed">{tr.feedPlacement}</SelectItem>
              <SelectItem value="profile">{tr.profilePlacement}</SelectItem>
              <SelectItem value="global">{tr.globalPlacement}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{tr.noCampaigns}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.campaignTitle}</th>
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.campaignType}</th>
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.campaignStatus}</th>
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.campaignPlacement}</th>
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.campaignTarget}</th>
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.campaignVideo}</th>
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.impressions}</th>
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.clicks}</th>
                  <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{tr.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map(campaign => {
                  const stats = getCampaignStats(campaign.id);
                  return (
                    <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`row-campaign-${campaign.id}`}>
                      <td className="p-3">
                        <span className="font-medium">{lang === 'ar' ? campaign.title.ar : campaign.title.en}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{getCampaignTypeLabel(campaign.type)}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getCampaignStatusColor(campaign.status)}>{getCampaignStatusLabel(campaign.status)}</Badge>
                      </td>
                      <td className="p-3">{getCampaignPlacementLabel(campaign.placement)}</td>
                      <td className="p-3">{getCampaignTargetLabel(campaign.target)}</td>
                      <td className="p-3">
                        {campaign.video ? (
                          <Badge variant="secondary" className="gap-1"><Video className="w-3 h-3" />{tr.hasVideo}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{tr.noVideo}</span>
                        )}
                      </td>
                      <td className="p-3">{stats.impressions}</td>
                      <td className="p-3">{stats.clicks}</td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="ghost" onClick={() => openEditCampaignDialog(campaign)} data-testid={`button-edit-campaign-${campaign.id}`}>
                            {tr.edit}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDuplicateCampaign(campaign)} data-testid={`button-duplicate-campaign-${campaign.id}`}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          {campaign.status === 'active' && (
                            <Button size="sm" variant="ghost" onClick={() => handleCampaignStatusChange(campaign, 'paused')} data-testid={`button-pause-campaign-${campaign.id}`}>
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                          {(campaign.status === 'draft' || campaign.status === 'paused' || campaign.status === 'scheduled') && (
                            <Button size="sm" variant="ghost" onClick={() => handleCampaignStatusChange(campaign, 'active')} data-testid={`button-activate-campaign-${campaign.id}`}>
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          {campaign.status !== 'ended' && (
                            <Button size="sm" variant="ghost" onClick={() => handleCampaignStatusChange(campaign, 'ended')} data-testid={`button-end-campaign-${campaign.id}`}>
                              {tr.end}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-400" onClick={() => setDeleteConfirmCampaign(campaign)} data-testid={`button-delete-campaign-${campaign.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Campaign Dialog */}
        <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{editingCampaign ? tr.editCampaign : tr.newCampaign}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.campaignTitleAr}</label>
                  <Input
                    value={campaignForm.titleAr}
                    onChange={e => setCampaignForm(f => ({ ...f, titleAr: e.target.value }))}
                    className="text-right"
                    dir="rtl"
                    data-testid="input-campaign-title-ar"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.campaignTitleEn}</label>
                  <Input
                    value={campaignForm.titleEn}
                    onChange={e => setCampaignForm(f => ({ ...f, titleEn: e.target.value }))}
                    dir="ltr"
                    data-testid="input-campaign-title-en"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.campaignBodyAr}</label>
                  <Textarea
                    value={campaignForm.contentAr}
                    onChange={e => setCampaignForm(f => ({ ...f, contentAr: e.target.value }))}
                    className="text-right min-h-20"
                    dir="rtl"
                    data-testid="input-campaign-content-ar"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.campaignBodyEn}</label>
                  <Textarea
                    value={campaignForm.contentEn}
                    onChange={e => setCampaignForm(f => ({ ...f, contentEn: e.target.value }))}
                    className="min-h-20"
                    dir="ltr"
                    data-testid="input-campaign-content-en"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.campaignType}</label>
                  <Select value={campaignForm.type} onValueChange={v => setCampaignForm(f => ({ ...f, type: v as CampaignType }))}>
                    <SelectTrigger data-testid="select-campaign-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">{tr.banner}</SelectItem>
                      <SelectItem value="popup">{tr.popup}</SelectItem>
                      <SelectItem value="announcement">{tr.announcementType}</SelectItem>
                      <SelectItem value="notification">{tr.notification}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.campaignPlacement}</label>
                  <Select value={campaignForm.placement} onValueChange={v => setCampaignForm(f => ({ ...f, placement: v as CampaignPlacement }))}>
                    <SelectTrigger data-testid="select-campaign-placement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">{tr.homePlacement}</SelectItem>
                      <SelectItem value="feed">{tr.feedPlacement}</SelectItem>
                      <SelectItem value="profile">{tr.profilePlacement}</SelectItem>
                      <SelectItem value="global">{tr.globalPlacement}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.campaignTarget}</label>
                  <Select value={campaignForm.target} onValueChange={v => setCampaignForm(f => ({ ...f, target: v as CampaignTarget }))}>
                    <SelectTrigger data-testid="select-campaign-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tr.everyone}</SelectItem>
                      <SelectItem value="students">{tr.students}</SelectItem>
                      <SelectItem value="moderators">{tr.moderators}</SelectItem>
                      <SelectItem value="new_users">{tr.newUsers}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.campaignStatus}</label>
                  <Select value={campaignForm.status} onValueChange={v => setCampaignForm(f => ({ ...f, status: v as CampaignStatus }))}>
                    <SelectTrigger data-testid="select-campaign-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{tr.draft}</SelectItem>
                      <SelectItem value="scheduled">{tr.scheduled}</SelectItem>
                      <SelectItem value="active">{tr.active}</SelectItem>
                      <SelectItem value="paused">{tr.paused}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.startDate}</label>
                  <Input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={e => setCampaignForm(f => ({ ...f, startDate: e.target.value }))}
                    data-testid="input-campaign-start-date"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{tr.endDate}</label>
                  <Input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={e => setCampaignForm(f => ({ ...f, endDate: e.target.value }))}
                    data-testid="input-campaign-end-date"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{tr.campaignVideo}</label>
                <p className="text-xs text-muted-foreground mb-2">{tr.videoRequirements}</p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleCampaignVideoChange}
                  className="hidden"
                  data-testid="input-campaign-video"
                />
                {campaignVideoPreview ? (
                  <div className="space-y-2">
                    <video src={campaignVideoPreview} controls className="w-full max-h-40 rounded-lg bg-black" />
                    <Button size="sm" variant="outline" onClick={handleRemoveCampaignVideo} data-testid="button-remove-campaign-video">
                      <X className="w-3 h-3 me-1" />
                      {tr.removeVideo}
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => videoInputRef.current?.click()} data-testid="button-upload-campaign-video">
                    <Video className="w-3 h-3 me-1" />
                    {tr.uploadVideo}
                  </Button>
                )}
              </div>

              {/* Attachments Section - Only visible when editing existing campaign */}
              {editingCampaign && (
                <div className="border-t border-white/10 pt-4">
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    {tr.attachments}
                  </label>
                  
                  {/* Upload buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      multiple
                      onChange={(e) => handleAttachmentUpload(e, 'image')}
                      className="hidden"
                      data-testid="input-campaign-images"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => handleAttachmentUpload(e, 'file')}
                      className="hidden"
                      data-testid="input-campaign-files"
                    />
                    
                    <div className="flex flex-col gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => imageInputRef.current?.click()}
                        disabled={attachmentUploading || getAttachmentCountByKind(editingCampaign, 'image') >= ATTACHMENT_LIMITS.image.maxCount}
                        data-testid="button-upload-campaign-images"
                      >
                        <Image className="w-3 h-3 me-1" />
                        {tr.uploadImages} ({getAttachmentCountByKind(editingCampaign, 'image')}/{ATTACHMENT_LIMITS.image.maxCount})
                      </Button>
                      <span className="text-xs text-muted-foreground">{tr.imagesLimit}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={attachmentUploading || getAttachmentCountByKind(editingCampaign, 'file') >= ATTACHMENT_LIMITS.file.maxCount}
                        data-testid="button-upload-campaign-files"
                      >
                        <File className="w-3 h-3 me-1" />
                        {tr.uploadFiles} ({getAttachmentCountByKind(editingCampaign, 'file')}/{ATTACHMENT_LIMITS.file.maxCount})
                      </Button>
                      <span className="text-xs text-muted-foreground">{tr.filesLimit}</span>
                    </div>
                  </div>

                  {/* Attachments list */}
                  {editingCampaign.attachments && editingCampaign.attachments.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {editingCampaign.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 bg-background/50 rounded-md border border-white/5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getAttachmentIcon(attachment.kind)}
                            <span className="text-sm truncate">{attachment.name}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {formatFileSize(attachment.sizeBytes)}
                            </Badge>
                            {attachment.durationSec && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                {attachment.durationSec}s
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveAttachment(attachment.id, attachment.name)}
                            className="shrink-0 text-destructive hover:text-destructive"
                            data-testid={`button-remove-attachment-${attachment.id}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{tr.noAttachments}</p>
                  )}

                  {attachmentUploading && (
                    <p className="text-sm text-primary animate-pulse mt-2">
                      {lang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>{tr.cancel}</Button>
              <Button onClick={handleSaveCampaign} disabled={campaignSaving || !campaignForm.titleAr || !campaignForm.titleEn} data-testid="button-save-campaign">
                {campaignSaving ? '...' : tr.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmCampaign} onOpenChange={() => setDeleteConfirmCampaign(null)}>
          <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{tr.delete}</DialogTitle>
            </DialogHeader>
            <p>{tr.confirmDeleteCampaign}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmCampaign(null)}>{tr.cancel}</Button>
              <Button variant="destructive" onClick={() => deleteConfirmCampaign && handleDeleteCampaign(deleteConfirmCampaign)} data-testid="button-confirm-delete-campaign">
                {tr.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );

  const renderUniversities = () => (
    <Card className="border-white/10 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          {tr.allowedDomains}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Domain Form */}
          <div className="flex gap-2 flex-wrap">
            <Input
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
              placeholder={tr.domainPlaceholder}
              className={`flex-1 min-w-48 bg-background/50 border-white/10 ${isRTL ? 'text-right' : 'text-left'}`}
              data-testid="input-new-domain"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
            />
            <Button onClick={handleAddDomain} data-testid="button-add-domain">
              <Plus className="w-4 h-4 me-2" />
              {tr.addDomain}
            </Button>
          </div>

          {/* Domain List */}
          <div className="space-y-2">
            {allowedDomains.map(domain => (
              <div 
                key={domain} 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{domain}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleRemoveDomain(domain)}
                  className="text-red-400"
                  disabled={allowedDomains.length <= 1}
                  data-testid={`button-remove-domain-${domain}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {allowedDomains.length <= 1 && (
            <p className="text-xs text-muted-foreground">{tr.cannotRemoveLast}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAuditLog = () => (
    <Card className="border-white/10 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          {tr.auditLog}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SearchAndFilters showStatusFilter={false} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.action}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.target}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.type}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.performedBy}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.date}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLog.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{tr.noData}</td></tr>
              ) : (
                filteredAuditLog.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {tr.actionLabels[log.action]}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium max-w-xs truncate">{log.targetName}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {log.targetType === 'user' ? tr.users : 
                         log.targetType === 'post' ? tr.posts :
                         log.targetType === 'comment' ? tr.comments :
                         log.targetType === 'file' ? tr.files : tr.reports}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{log.performedBy}</td>
                    <td className="p-3 text-muted-foreground">{log.performedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderDetailModal = () => {
    if (!selectedItem) return null;
    
    return (
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailType === 'user' && <UserIcon className="w-5 h-5" />}
              {detailType === 'post' && <MessageSquare className="w-5 h-5" />}
              {detailType === 'comment' && <FileText className="w-5 h-5" />}
              {detailType === 'file' && <FileText className="w-5 h-5" />}
              {detailType === 'report' && <Flag className="w-5 h-5" />}
              {tr.viewDetails}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {detailType === 'user' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.name}</p>
                    <p className="font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.email}</p>
                    <p className="font-medium">{selectedItem.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.status}</p>
                    {getStatusBadge(selectedItem.status, 'user')}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.role}</p>
                    <Badge variant="outline">{selectedItem.role === 'moderator' ? tr.moderator : tr.user}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.postsCount}</p>
                    <p className="font-medium">{selectedItem.postsCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.commentsCount}</p>
                    <p className="font-medium">{selectedItem.commentsCount}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  {selectedItem.status === 'active' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { handleUserAction(selectedItem.id, 'suspend'); setDetailModalOpen(false); }} className="text-amber-400 border-amber-500/30">
                        <Ban className="w-4 h-4 me-2" /> {tr.suspend}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { handleUserAction(selectedItem.id, 'ban'); setDetailModalOpen(false); }} className="text-red-400 border-red-500/30">
                        <XCircle className="w-4 h-4 me-2" /> {tr.ban}
                      </Button>
                    </>
                  )}
                  {(selectedItem.status === 'suspended' || selectedItem.status === 'banned') && (
                    <Button size="sm" variant="outline" onClick={() => { handleUserAction(selectedItem.id, 'activate'); setDetailModalOpen(false); }} className="text-green-400 border-green-500/30">
                      <CheckCircle className="w-4 h-4 me-2" /> {tr.activate}
                    </Button>
                  )}
                </div>
              </>
            )}
            
            {detailType === 'post' && (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.postTitle}</p>
                    <p className="font-medium">{selectedItem.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.author}</p>
                      <p className="font-medium">{selectedItem.author}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.type}</p>
                      {getTypeBadge(selectedItem.type)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.status}</p>
                      {getStatusBadge(selectedItem.status, 'post')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.date}</p>
                      <p>{selectedItem.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.likes}</p>
                      <p>{selectedItem.likesCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.commentsCount}</p>
                      <p>{selectedItem.commentsCount}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  {selectedItem.status === 'visible' && (
                    <Button size="sm" variant="outline" onClick={() => { handlePostAction(selectedItem.id, 'hide'); setDetailModalOpen(false); }} className="text-amber-400 border-amber-500/30">
                      <EyeOff className="w-4 h-4 me-2" /> {tr.hide}
                    </Button>
                  )}
                  {selectedItem.status === 'hidden' && (
                    <Button size="sm" variant="outline" onClick={() => { handlePostAction(selectedItem.id, 'show'); setDetailModalOpen(false); }} className="text-green-400 border-green-500/30">
                      <Eye className="w-4 h-4 me-2" /> {tr.show}
                    </Button>
                  )}
                  {selectedItem.status !== 'deleted' && (
                    <Button size="sm" variant="outline" onClick={() => { handlePostAction(selectedItem.id, 'delete'); setDetailModalOpen(false); }} className="text-red-400 border-red-500/30">
                      <Trash2 className="w-4 h-4 me-2" /> {tr.delete}
                    </Button>
                  )}
                </div>
              </>
            )}

            {detailType === 'comment' && (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.comments}</p>
                    <p className="font-medium p-3 bg-white/5 rounded-lg">{selectedItem.content}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.author}</p>
                      <p className="font-medium">{selectedItem.author}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.postTitle}</p>
                      <p className="font-medium truncate">{selectedItem.postTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.status}</p>
                      {getStatusBadge(selectedItem.status, 'post')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.date}</p>
                      <p>{selectedItem.createdAt}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  {selectedItem.status === 'visible' && (
                    <Button size="sm" variant="outline" onClick={() => { handleCommentAction(selectedItem.id, 'hide'); setDetailModalOpen(false); }} className="text-amber-400 border-amber-500/30">
                      <EyeOff className="w-4 h-4 me-2" /> {tr.hide}
                    </Button>
                  )}
                  {selectedItem.status !== 'deleted' && (
                    <Button size="sm" variant="outline" onClick={() => { handleCommentAction(selectedItem.id, 'delete'); setDetailModalOpen(false); }} className="text-red-400 border-red-500/30">
                      <Trash2 className="w-4 h-4 me-2" /> {tr.delete}
                    </Button>
                  )}
                </div>
              </>
            )}

            {detailType === 'file' && (
              <>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.filename}</p>
                      <p className="font-medium">{selectedItem.filename}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.type}</p>
                      <Badge variant="outline">{selectedItem.type}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.uploader}</p>
                      <p className="font-medium">{selectedItem.uploader}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.size}</p>
                      <p>{selectedItem.size}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.postTitle}</p>
                      <p className="font-medium truncate">{selectedItem.postTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.date}</p>
                      <p>{selectedItem.uploadedAt}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button size="sm" variant="outline" onClick={() => { handleFileAction(selectedItem.id); setDetailModalOpen(false); }} className="text-red-400 border-red-500/30">
                    <Trash2 className="w-4 h-4 me-2" /> {tr.delete}
                  </Button>
                </div>
              </>
            )}

            {detailType === 'report' && (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.target}</p>
                    <p className="font-medium">{selectedItem.targetTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.reason}</p>
                    <p className="font-medium p-3 bg-white/5 rounded-lg">{selectedItem.reason}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.type}</p>
                      <Badge variant="outline">
                        {selectedItem.targetType === 'post' ? tr.targetTypePost : selectedItem.targetType === 'comment' ? tr.targetTypeComment : tr.targetTypeUser}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.priority}</p>
                      {getPriorityBadge(selectedItem.priority || 'low')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.reporter}</p>
                      <p className="font-medium">{selectedItem.reporter}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.status}</p>
                      {getStatusBadge(selectedItem.status, 'report')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.date}</p>
                      <p>{selectedItem.createdAt}</p>
                    </div>
                  </div>
                  {/* Quick Action Status */}
                  {(selectedItem.targetAction || selectedItem.userAction) && (
                    <div className="p-3 bg-white/5 rounded-lg space-y-1">
                      {selectedItem.targetAction === 'hidden' && (
                        <p className="text-sm text-purple-400">{tr.targetHidden}</p>
                      )}
                      {selectedItem.userAction === 'suspended' && (
                        <p className="text-sm text-orange-400">{tr.userSuspended}</p>
                      )}
                    </div>
                  )}
                  {selectedItem.resolutionReason && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{tr.resolutionReason}</p>
                      <p className="font-medium p-3 bg-white/5 rounded-lg">{selectedItem.resolutionReason}</p>
                    </div>
                  )}
                </div>
                
                {editStatusMode ? (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{tr.selectStatus}</p>
                      <Select value={selectedEditStatus} onValueChange={(v) => setSelectedEditStatus(v as ReportStatus)}>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">{tr.open}</SelectItem>
                          <SelectItem value="in_review">{tr.in_review}</SelectItem>
                          <SelectItem value="resolved">{tr.resolved}</SelectItem>
                          <SelectItem value="dismissed">{tr.dismissed}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(selectedEditStatus === 'resolved' || selectedEditStatus === 'dismissed') && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">{tr.reasonForAction} *</p>
                        <Input 
                          value={actionReason} 
                          onChange={(e) => setActionReason(e.target.value)}
                          placeholder={tr.enterReason}
                          data-testid="input-action-reason"
                        />
                        {!actionReason.trim() && (
                          <p className="text-xs text-red-400 mt-1">{tr.reasonRequired}</p>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleEditStatusSubmit} disabled={(selectedEditStatus === 'resolved' || selectedEditStatus === 'dismissed') && !actionReason.trim()} data-testid="button-save-status">
                        {tr.save}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditStatusMode(false); setActionReason(''); }} data-testid="button-cancel-edit">
                        {tr.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    {/* Status Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedEditStatus(selectedItem.status); setEditStatusMode(true); }} data-testid="button-edit-status">
                        {tr.editStatus}
                      </Button>
                      {(selectedItem.status === 'open' || selectedItem.status === 'in_review') && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleReportAction(selectedItem.id, 'resolve')} className="text-green-400 border-green-500/30" data-testid="button-modal-resolve">
                            <CheckCircle className="w-4 h-4 me-2" /> {tr.resolve}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReportAction(selectedItem.id, 'dismiss')} className="text-gray-400 border-gray-500/30" data-testid="button-modal-dismiss">
                            <XCircle className="w-4 h-4 me-2" /> {tr.dismiss}
                          </Button>
                        </>
                      )}
                      {(selectedItem.status === 'resolved' || selectedItem.status === 'dismissed') && (
                        <Button size="sm" variant="outline" onClick={() => { handleReportAction(selectedItem.id, 'reopen'); setDetailModalOpen(false); }} className="text-amber-400 border-amber-500/30" data-testid="button-modal-reopen">
                          <AlertTriangle className="w-4 h-4 me-2" /> {tr.reopen}
                        </Button>
                      )}
                    </div>
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      {(selectedItem.targetType === 'post' || selectedItem.targetType === 'comment') && !selectedItem.targetAction && (
                        <Button size="sm" variant="outline" onClick={() => { handleHideTarget(selectedItem.id); }} className="text-purple-400 border-purple-500/30" data-testid="button-modal-hide-target">
                          <EyeOff className="w-4 h-4 me-2" /> {tr.hideTarget}
                        </Button>
                      )}
                      {(selectedItem.targetType === 'user' || selectedItem.authorEmail) && !selectedItem.userAction && (
                        <Button size="sm" variant="outline" onClick={() => { handleSuspendUser(selectedItem.id); }} className="text-orange-400 border-orange-500/30" data-testid="button-modal-suspend-user">
                          <Ban className="w-4 h-4 me-2" /> {tr.suspendUser}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              {tr.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // User Details Modal
  const renderUserDetailModal = () => {
    if (!selectedUserDetail) return null;
    
    const userPosts = getUserPosts(selectedUserDetail.email);
    const userComments = getUserComments(selectedUserDetail.email);
    const relatedReports = getUserRelatedReports(selectedUserDetail);
    const moderationHistory = getUserModerationHistory(selectedUserDetail);
    const userNotes = getUserNotes(selectedUserDetail.email);

    const tabs = [
      { id: 'account', label: tr.accountInfo, icon: UserIcon },
      { id: 'actions', label: tr.supportActions, icon: Shield },
      { id: 'activity', label: tr.activityTab, icon: Activity },
      { id: 'moderation', label: tr.moderationHistory, icon: History },
      { id: 'notes', label: tr.adminNotes, icon: StickyNote },
    ];

    return (
      <Dialog open={userDetailModalOpen} onOpenChange={setUserDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              {tr.userDetails}: {selectedUserDetail.name}
            </DialogTitle>
          </DialogHeader>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setUserDetailTab(tab.id as typeof userDetailTab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  userDetailTab === tab.id
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-white/5 text-muted-foreground'
                }`}
                data-testid={`tab-user-detail-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* Account Tab */}
            {userDetailTab === 'account' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.email}</p>
                    <p className="font-medium">{selectedUserDetail.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.displayName}</p>
                    <p className="font-medium">{selectedUserDetail.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.university}</p>
                    <p className="font-medium">{selectedUserDetail.university || selectedUserDetail.email.split('@')[1] || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.joinedAt}</p>
                    <p className="font-medium">{selectedUserDetail.joinedAt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.lastActive}</p>
                    <p className="font-medium">{selectedUserDetail.lastActive || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.status}</p>
                    {getStatusBadge(selectedUserDetail.status, 'user')}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.role}</p>
                    <Badge variant="outline" className={selectedUserDetail.role === 'moderator' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}>
                      {selectedUserDetail.role === 'moderator' ? tr.moderator : tr.user}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tr.phone}</p>
                    <p className="font-medium">{selectedUserDetail.phone || '-'}</p>
                  </div>
                </div>
                {/* Flags */}
                {(selectedUserDetail.forceLogoutFlag || selectedUserDetail.settingsResetFlag) && (
                  <div className="p-3 bg-white/5 rounded-lg space-y-1">
                    {selectedUserDetail.forceLogoutFlag && (
                      <p className="text-sm text-amber-400">{tr.forceLogoutMarked}</p>
                    )}
                    {selectedUserDetail.settingsResetFlag && (
                      <p className="text-sm text-purple-400">{tr.settingsResetMarked}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Support Actions Tab */}
            {userDetailTab === 'actions' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Suspend / Unsuspend */}
                  {selectedUserDetail.status === 'active' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleUserDetailAction(selectedUserDetail.id, 'suspend')}
                      className="text-amber-400 border-amber-500/30"
                      data-testid="button-detail-suspend"
                    >
                      <Ban className="w-4 h-4 me-2" /> {tr.suspend}
                    </Button>
                  )}
                  {selectedUserDetail.status === 'suspended' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleUserDetailAction(selectedUserDetail.id, 'unsuspend')}
                      className="text-green-400 border-green-500/30"
                      data-testid="button-detail-unsuspend"
                    >
                      <CheckCircle className="w-4 h-4 me-2" /> {tr.unsuspend}
                    </Button>
                  )}
                  
                  {/* Ban / Unban */}
                  {selectedUserDetail.status !== 'banned' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleUserDetailAction(selectedUserDetail.id, 'ban')}
                      className="text-red-400 border-red-500/30"
                      data-testid="button-detail-ban"
                    >
                      <XCircle className="w-4 h-4 me-2" /> {tr.ban}
                    </Button>
                  )}
                  {selectedUserDetail.status === 'banned' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleUserDetailAction(selectedUserDetail.id, 'unban')}
                      className="text-green-400 border-green-500/30"
                      data-testid="button-detail-unban"
                    >
                      <CheckCircle className="w-4 h-4 me-2" /> {tr.unban}
                    </Button>
                  )}
                  
                  {/* Force Logout */}
                  <Button 
                    variant="outline" 
                    onClick={() => handleUserDetailAction(selectedUserDetail.id, 'forceLogout')}
                    className="text-orange-400 border-orange-500/30"
                    disabled={selectedUserDetail.forceLogoutFlag}
                    data-testid="button-detail-force-logout"
                  >
                    <LogOut className="w-4 h-4 me-2" /> {tr.forceLogout}
                  </Button>
                  
                  {/* Reset Settings */}
                  <Button 
                    variant="outline" 
                    onClick={() => handleUserDetailAction(selectedUserDetail.id, 'resetSettings')}
                    className="text-purple-400 border-purple-500/30"
                    disabled={selectedUserDetail.settingsResetFlag}
                    data-testid="button-detail-reset-settings"
                  >
                    <RotateCcw className="w-4 h-4 me-2" /> {tr.resetSettings}
                  </Button>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {userDetailTab === 'activity' && (
              <div className="space-y-4">
                {/* Recent Posts */}
                <div>
                  <p className="text-sm font-medium mb-2">{tr.recentPosts} ({userPosts.length})</p>
                  {userPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{tr.noActivity}</p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {userPosts.slice(0, 5).map(p => (
                        <div key={p.id} className="p-2 bg-white/5 rounded-lg flex items-center justify-between gap-2">
                          <span className="text-sm truncate">{p.title}</span>
                          {getStatusBadge(p.status, 'post')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Recent Comments */}
                <div>
                  <p className="text-sm font-medium mb-2">{tr.recentComments} ({userComments.length})</p>
                  {userComments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{tr.noActivity}</p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {userComments.slice(0, 5).map(c => (
                        <div key={c.id} className="p-2 bg-white/5 rounded-lg flex items-center justify-between gap-2">
                          <span className="text-sm truncate">{c.content}</span>
                          {getStatusBadge(c.status, 'post')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Related Reports */}
                <div>
                  <p className="text-sm font-medium mb-2">{tr.relatedReports} ({relatedReports.length})</p>
                  {relatedReports.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{tr.noActivity}</p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {relatedReports.slice(0, 5).map(r => (
                        <div key={r.id} className="p-2 bg-white/5 rounded-lg flex items-center justify-between gap-2">
                          <span className="text-sm truncate">{r.targetTitle}</span>
                          <div className="flex gap-1">
                            {getStatusBadge(r.status, 'report')}
                            <Badge variant="outline" className="text-xs">
                              {r.targetType === 'user' && r.targetId === selectedUserDetail.id ? tr.asTarget : tr.asAuthor}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Moderation History Tab */}
            {userDetailTab === 'moderation' && (
              <div className="space-y-2">
                {moderationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{tr.noModerationHistory}</p>
                ) : (
                  moderationHistory.map(log => (
                    <div key={log.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {tr.actionLabels[log.action]}
                        </Badge>
                        {log.details && (
                          <span className="text-xs text-muted-foreground truncate max-w-xs">{log.details}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{log.performedAt}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Admin Notes Tab */}
            {userDetailTab === 'notes' && (
              <div className="space-y-4">
                {/* Add Note */}
                <div className="flex gap-2">
                  <Input 
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={tr.enterNote}
                    className="flex-1"
                    data-testid="input-admin-note"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => addAdminNote(selectedUserDetail.email)}
                    disabled={!newNoteText.trim()}
                    data-testid="button-add-note"
                  >
                    <Plus className="w-4 h-4 me-2" /> {tr.addNote}
                  </Button>
                </div>
                
                {/* Notes List */}
                <div className="space-y-2">
                  {userNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{tr.noNotes}</p>
                  ) : (
                    userNotes.map(note => (
                      <div key={note.id} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-sm">{note.note}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{note.addedBy}</span>
                          <span>•</span>
                          <span>{note.addedAt}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDetailModalOpen(false)}>
              {tr.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen pb-20" dir={isRTL ? 'rtl' : 'ltr'} data-testid="admin-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 gradient-text flex items-center gap-3">
          <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
          {tr.title}
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-52 flex-shrink-0">
            <Card className="border-white/10 bg-card/50">
              <CardContent className="p-2">
                <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); resetFilters(); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all whitespace-nowrap ${
                        activeTab === item.id
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-white/5 text-muted-foreground'
                      }`}
                      data-testid={`nav-admin-${item.id}`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                      {item.id === 'reports' && reports.filter(r => r.status === 'open').length > 0 && (
                        <Badge variant="destructive" className="ms-auto text-xs px-1.5 py-0">
                          {reports.filter(r => r.status === 'open').length}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + contentSubTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'content' && renderContent()}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'campaigns' && renderCampaigns()}
                {activeTab === 'universities' && renderUniversities()}
                {activeTab === 'auditLog' && renderAuditLog()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      {renderDetailModal()}
      {renderUserDetailModal()}
      
      <Dialog open={reasonModalOpen} onOpenChange={(open) => { if (!open) { setReasonModalOpen(false); setReasonModalAction(null); setActionReason(''); } }}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{tr.reasonForAction}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {reasonModalAction?.targetStatus === 'resolved' ? tr.resolve : tr.dismiss}
              </p>
              <Input 
                value={actionReason} 
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={tr.enterReason}
                data-testid="input-reason-modal"
              />
              {!actionReason.trim() && (
                <p className="text-xs text-red-400 mt-1">{tr.reasonRequired}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setReasonModalOpen(false); setReasonModalAction(null); setActionReason(''); }} data-testid="button-reason-cancel">
              {tr.cancel}
            </Button>
            <Button onClick={confirmReasonModal} disabled={!actionReason.trim()} data-testid="button-reason-confirm">
              {tr.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
