import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDaamStore, type Report as StoreReport, type ReportStatus as StoreReportStatus } from "@/hooks/use-daam-store";
import { 
  Users, MessageSquare, FileText, Flag, ClipboardList, LayoutDashboard,
  Search, Trash2, Ban, Eye, EyeOff, CheckCircle, XCircle, ChevronDown, ChevronUp,
  User as UserIcon, Calendar, Filter, MoreHorizontal, Shield, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UserStatus = 'active' | 'suspended' | 'banned';
type PostStatus = 'visible' | 'hidden' | 'deleted';
type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
type ActionType = 'user_suspended' | 'user_banned' | 'user_activated' | 'post_hidden' | 'post_deleted' | 'post_restored' | 'comment_hidden' | 'comment_deleted' | 'file_deleted' | 'report_resolved' | 'report_dismissed';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  role: 'user' | 'moderator';
  joinedAt: string;
  postsCount: number;
  commentsCount: number;
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
}

interface AuditLogEntry {
  id: string;
  action: ActionType;
  targetType: 'user' | 'post' | 'comment' | 'file' | 'report';
  targetId: string;
  targetName: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

const initialUsers: AdminUser[] = [
  { id: '1', email: 'ahmed@utas.edu.om', name: 'أحمد الحارثي', status: 'active', role: 'user', joinedAt: '2024-01-15', postsCount: 12, commentsCount: 45 },
  { id: '2', email: 'fatima@utas.edu.om', name: 'فاطمة البلوشي', status: 'active', role: 'user', joinedAt: '2024-02-20', postsCount: 8, commentsCount: 23 },
  { id: '3', email: 'mohammed@utas.edu.om', name: 'محمد الكندي', status: 'suspended', role: 'user', joinedAt: '2024-03-10', postsCount: 3, commentsCount: 15 },
  { id: '4', email: 'sara@utas.edu.om', name: 'سارة المعمري', status: 'active', role: 'user', joinedAt: '2024-01-25', postsCount: 20, commentsCount: 67 },
  { id: '5', email: 'omar@utas.edu.om', name: 'عمر الراشدي', status: 'banned', role: 'user', joinedAt: '2024-04-05', postsCount: 1, commentsCount: 2 },
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
  { id: 'r1', targetType: 'post', targetId: 'p4', targetTitle: 'محتوى غير لائق', reason: 'محتوى مسيء', reporter: 'سارة المعمري', reporterEmail: 'sara@utas.edu.om', status: 'open', createdAt: '2024-12-08' },
  { id: 'r2', targetType: 'comment', targetId: 'c3', targetTitle: 'تعليق مخالف للقواعد', reason: 'لغة غير لائقة', reporter: 'فاطمة البلوشي', reporterEmail: 'fatima@utas.edu.om', status: 'resolved', createdAt: '2024-12-04' },
  { id: 'r3', targetType: 'user', targetId: '5', targetTitle: 'عمر الراشدي', reason: 'سلوك مزعج متكرر', reporter: 'أحمد الحارثي', reporterEmail: 'ahmed@utas.edu.om', status: 'resolved', createdAt: '2024-12-07' },
];

export default function Admin() {
  const { lang, user, reports: storeReports, updateReportStatus } = useDaamStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [contentSubTab, setContentSubTab] = useState('posts');
  
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [posts, setPosts] = useState<AdminPost[]>(initialPosts);
  const [comments, setComments] = useState<AdminComment[]>(initialComments);
  const [files, setFiles] = useState<AdminFile[]>(initialFiles);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  
  // Merge store reports with initial demo reports for display
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
      createdAt: r.createdAt
    }));
    // Combine store reports (new) with initial demo reports
    return [...storeReportsMapped, ...initialReports.filter(r => !storeReportsMapped.some(sr => sr.id === r.id))];
  }, [storeReports]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailType, setDetailType] = useState<string>('');

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
      post_hidden: lang === 'ar' ? 'إخفاء منشور' : 'Post Hidden',
      post_deleted: lang === 'ar' ? 'حذف منشور' : 'Post Deleted',
      post_restored: lang === 'ar' ? 'استعادة منشور' : 'Post Restored',
      comment_hidden: lang === 'ar' ? 'إخفاء تعليق' : 'Comment Hidden',
      comment_deleted: lang === 'ar' ? 'حذف تعليق' : 'Comment Deleted',
      file_deleted: lang === 'ar' ? 'حذف ملف' : 'File Deleted',
      report_resolved: lang === 'ar' ? 'حل بلاغ' : 'Report Resolved',
      report_dismissed: lang === 'ar' ? 'رفض بلاغ' : 'Report Dismissed',
    }
  };

  const navItems = [
    { id: 'overview', label: tr.overview, icon: LayoutDashboard },
    { id: 'users', label: tr.users, icon: Users },
    { id: 'content', label: tr.content, icon: FileText },
    { id: 'reports', label: tr.reports, icon: Flag },
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

  const handleReportAction = (reportId: string, action: 'resolve' | 'dismiss') => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const newStatus: StoreReportStatus = action === 'resolve' ? 'resolved' : 'dismissed';
      const actionType: ActionType = action === 'resolve' ? 'report_resolved' : 'report_dismissed';
      addAuditLog(actionType, 'report', report.id, report.targetTitle);
      // Update in store (persists to localStorage)
      if (reportId.startsWith('report-')) {
        // This is a store report, update via store
        updateReportStatus(reportId, newStatus);
      }
      // Note: Demo reports (r1, r2, r3) are read-only placeholders
    }
  };

  const openDetailModal = (item: any, type: string) => {
    setSelectedItem(item);
    setDetailType(type);
    setDetailModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => sortOrder === 'desc' ? 
        new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime() :
        new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
      );
  }, [users, searchQuery, statusFilter, sortOrder]);

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
    return reports
      .filter(r => {
        const matchesSearch = r.targetTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.reason.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => sortOrder === 'desc' ? 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() :
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [reports, searchQuery, statusFilter, sortOrder]);

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {tr.users}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SearchAndFilters showStatusFilter statusOptions={['active', 'suspended', 'banned']} />
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
                        <Button size="sm" variant="ghost" onClick={() => openDetailModal(u, 'user')} data-testid={`button-view-user-${u.id}`}>
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

  const renderReports = () => (
    <Card className="border-white/10 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5" />
          {tr.reports}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SearchAndFilters showStatusFilter statusOptions={['open', 'in_review', 'resolved', 'dismissed']} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.target}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.type}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.reason}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.reporter}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.status}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.date}</th>
                <th className={`p-3 font-medium text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{tr.noData}</td></tr>
              ) : (
                filteredReports.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium max-w-xs truncate">{r.targetTitle}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {r.targetType === 'post' ? tr.posts : r.targetType === 'comment' ? tr.comments : tr.users}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{r.reason}</td>
                    <td className="p-3 text-muted-foreground">{r.reporter}</td>
                    <td className="p-3">{getStatusBadge(r.status, 'report')}</td>
                    <td className="p-3 text-muted-foreground">{r.createdAt}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDetailModal(r, 'report')} data-testid={`button-view-report-${r.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {r.status === 'open' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleReportAction(r.id, 'resolve')} className="text-green-400" data-testid={`button-resolve-report-${r.id}`}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleReportAction(r.id, 'dismiss')} className="text-gray-400" data-testid={`button-dismiss-report-${r.id}`}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
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
                        {selectedItem.targetType === 'post' ? tr.posts : selectedItem.targetType === 'comment' ? tr.comments : tr.users}
                      </Badge>
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
                </div>
                {selectedItem.status === 'open' && (
                  <div className="flex gap-2 pt-4 border-t border-white/10">
                    <Button size="sm" variant="outline" onClick={() => { handleReportAction(selectedItem.id, 'resolve'); setDetailModalOpen(false); }} className="text-green-400 border-green-500/30">
                      <CheckCircle className="w-4 h-4 me-2" /> {tr.resolve}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { handleReportAction(selectedItem.id, 'dismiss'); setDetailModalOpen(false); }} className="text-gray-400 border-gray-500/30">
                      <XCircle className="w-4 h-4 me-2" /> {tr.dismiss}
                    </Button>
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
                {activeTab === 'auditLog' && renderAuditLog()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      {renderDetailModal()}
    </div>
  );
}
