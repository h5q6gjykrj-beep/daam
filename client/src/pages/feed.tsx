import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useDaamStore, ADMIN_EMAILS, type ReportReason, type ModeratorAccount, type DaamPermission } from "@/hooks/use-daam-store";
import { isAdminEmail } from "@/config/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Send, MessageSquare, Heart, Plus, ChevronDown, ChevronUp, X, Reply,
  Bookmark, FileText, Hash, TrendingUp, Clock, Shield, Paperclip, Download, ExternalLink,
  MoreVertical, Pencil, Trash2, Flag, EyeOff, Eye, VolumeX, Volume2, Ban, UserCheck,
  PenLine, ImagePlus, Search
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type LocalReply, type PostType, type Attachment, type PostStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { COLLEGES, getCollegeLabel, getCollegeColor } from "@/lib/colleges";
import { InFeedCampaignCard } from "@/components/campaigns/CampaignBanner";

const POST_TYPES: { value: PostType; labelAr: string; labelEn: string }[] = [
  { value: 'question', labelAr: 'سؤال', labelEn: 'Question' },
  { value: 'explanation', labelAr: 'شرح', labelEn: 'Explanation' },
  { value: 'summary', labelAr: 'ملخص', labelEn: 'Summary' },
  { value: 'discussion', labelAr: 'نقاش', labelEn: 'Discussion' },
];

type SortType = 'newest' | 'trending';

function normalizeText(s: string): string {
  if (!s) return '';
  let text = s.toLowerCase();
  text = text.replace(/[\u064B-\u0652\u0670]/g, '');
  text = text.replace(/[إأآ]/g, 'ا');
  text = text.replace(/ة/g, 'ه');
  text = text.replace(/ى/g, 'ي');
  text = text.replace(/ؤ/g, 'و');
  text = text.replace(/ئ/g, 'ي');
  text = text.replace(/(^|\s)ال/g, '$1');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export default function Feed() {
  const { posts, createPost, toggleLike, toggleSave, addReply, deletePost, updatePost, deleteReply, editReply, lang, user, getProfile, submitReport, getAccount, moderators, canCurrentUser, addAuditEvent, isUserMuted, getMuteRecord, muteUser, unmuteUser, isUserBanned, getBanRecord, banUserWithDuration, unbanUserRecord } = useDaamStore();
  
  // Hidden posts state (localStorage-based)
  const LS_HIDDEN_POSTS = 'daam_hidden_posts_v1';
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LS_HIDDEN_POSTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const filterParam = searchParams.get('filter');
  const subjectParam = searchParams.get('subject');
  
  const [content, setContent] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const swipeTouchStartY = useRef<number>(0);
  useEffect(() => {
    if (showCreateForm) {
      document.body.classList.add('form-open');
    } else {
      document.body.classList.remove('form-open');
    }
    return () => { document.body.classList.remove('form-open'); };
  }, [showCreateForm]);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyingToReplyId, setReplyingToReplyId] = useState<Record<string, string | null>>({});
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>(filterParam === 'top' ? 'trending' : 'newest');
  const [newPostType, setNewPostType] = useState<PostType>('discussion');
  const [newPostSubject, setNewPostSubject] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editPostType, setEditPostType] = useState<PostType>('discussion');
  const [editSubject, setEditSubject] = useState<string>('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerContent, setViewerContent] = useState<{ url: string; blobUrl: string; name: string; type: 'pdf' | 'image' } | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: string; title: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason | ''>('');
  const [reportNote, setReportNote] = useState('');
  
  // Mute dialog state
  const [muteModalOpen, setMuteModalOpen] = useState(false);
  const [muteTarget, setMuteTarget] = useState<{ email: string; name: string } | null>(null);
  const [muteDuration, setMuteDuration] = useState<'10' | '60' | '1440' | 'permanent'>('60');
  const [muteReason, setMuteReason] = useState('');
  
  // Ban dialog state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<{ email: string; name: string } | null>(null);
  const [banDuration, setBanDuration] = useState<'1' | '7' | '30' | 'permanent'>('7');
  const [banReason, setBanReason] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isRTL = lang === 'ar';

  // Date helpers for filtering
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const sixtyMinutesAgo = useMemo(() => {
    return new Date(Date.now() - 60 * 60 * 1000);
  }, []);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per file
  const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB total
  const COMPRESS_THRESHOLD = 3 * 1024 * 1024; // compress if > 3MB
  const COMPRESS_MAX_WIDTH = 1920;
  const COMPRESS_QUALITY = 0.85;

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = img.width > COMPRESS_MAX_WIDTH ? COMPRESS_MAX_WIDTH / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          COMPRESS_QUALITY
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      img.src = objectUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    let totalSize = attachments.reduce((sum, att) => sum + att.size, 0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: lang === 'ar' ? 'الملف كبير جداً' : 'File too large',
          description: lang === 'ar'
            ? `${file.name} أكبر من 2 ميجابايت`
            : `${file.name} is larger than 2MB`,
          variant: 'destructive'
        });
        continue;
      }

      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        toast({
          title: lang === 'ar' ? 'تم تجاوز الحد' : 'Limit exceeded',
          description: lang === 'ar'
            ? 'الحد الأقصى للملفات 5 ميجابايت'
            : 'Maximum total file size is 5MB',
          variant: 'destructive'
        });
        break;
      }

      try {
        const uploadFile = file.type.startsWith('image/') && file.size > COMPRESS_THRESHOLD
          ? await compressImage(file)
          : file;
        const formData = new FormData();
        formData.append('file', uploadFile);
        const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Upload failed');
        }
        const { url } = await res.json();
        newAttachments.push({
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url,
          name: file.name,
          size: file.size
        });
      } catch (e: any) {
        console.error('Image upload error:', e);
        toast({
          title: lang === 'ar' ? 'فشل الرفع' : 'Upload failed',
          description: e.message || (lang === 'ar' ? `فشل رفع ${file.name}` : `Failed to upload ${file.name}`),
          variant: 'destructive'
        });
        continue;
      }

      totalSize += file.size;
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!content.trim()) return;
    
    // Check if user is muted
    if (currentUserMuted) {
      const muteExpiry = currentUserMuteRecord?.expiresAt 
        ? new Date(currentUserMuteRecord.expiresAt).toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-US')
        : null;
      toast({
        title: lang === 'ar' ? 'تم كتمك مؤقتًا' : 'You are muted',
        description: muteExpiry 
          ? `${lang === 'ar' ? 'ينتهي الكتم في' : 'Mute expires at'}: ${muteExpiry}`
          : (lang === 'ar' ? 'تم كتمك مؤقتًا ولا يمكنك التفاعل حاليًا' : 'You are temporarily muted and cannot interact'),
        variant: 'destructive'
      });
      return;
    }
    
    createPost(content, newPostType, newPostSubject || undefined, undefined, attachments.length > 0 ? attachments : undefined);
    setContent("");
    setShowCreateForm(false);
    setNewPostType('discussion');
    setNewPostSubject('');
    setAttachments([]);
    toast({
      title: lang === 'ar' ? 'تم النشر' : 'Posted',
      description: lang === 'ar' ? 'تم نشر مشاركتك بنجاح' : 'Your post was published successfully'
    });
  };

  const base64ToBlob = (base64Url: string, mimeType?: string): Blob | null => {
    try {
      const base64Data = base64Url.split(',')[1];
      if (!base64Data) return null;
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Extract mime type from data URL if not provided
      const extractedMime = mimeType || base64Url.split(';')[0].split(':')[1] || 'application/octet-stream';
      return new Blob([byteArray], { type: extractedMime });
    } catch (e) {
      console.error('Error converting base64 to blob:', e);
      return null;
    }
  };

  const openAttachment = (attachment: Attachment) => {
    const isPdf = attachment.name.toLowerCase().endsWith('.pdf') || 
                  attachment.url.toLowerCase().endsWith('.pdf') ||
                  (attachment as any).mimeType === 'application/pdf' ||
                  (attachment as any).type === 'pdf';
    const isImage = attachment.type === 'image';
    
    // Convert base64 to blob URL for better browser compatibility
    const blob = base64ToBlob(attachment.url, isPdf ? 'application/pdf' : undefined);
    
    if (isPdf) {
      if (blob) {
        // Legacy base64 attachment
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else if (attachment.url.startsWith('http')) {
        // Cloudinary URL — open via proxy for inline display
        window.open(`/api/file-proxy?url=${encodeURIComponent(attachment.url)}`, '_blank');
      } else {
        toast({
          title: lang === 'ar' ? 'خطأ' : 'Error',
          description: lang === 'ar' ? 'تعذر فتح الملف' : 'Could not open file',
          variant: 'destructive'
        });
      }
    } else if (isImage) {
      if (attachment.url.startsWith('https://') || attachment.url.startsWith('http://')) {
        // Cloudinary URL — use directly
        setViewerContent({ url: attachment.url, blobUrl: attachment.url, name: attachment.name, type: 'image' });
        setViewerOpen(true);
      } else if (blob) {
        // Legacy base64
        const blobUrl = URL.createObjectURL(blob);
        setViewerContent({ url: attachment.url, blobUrl, name: attachment.name, type: 'image' });
        setViewerOpen(true);
      } else {
        toast({
          title: lang === 'ar' ? 'خطأ' : 'Error',
          description: lang === 'ar' ? 'تعذر فتح الصورة' : 'Could not open image',
          variant: 'destructive'
        });
      }
    } else {
      downloadAttachment(attachment);
    }
  };
  
  // Clean up blob URL when viewer closes
  const closeViewer = () => {
    if (viewerContent?.blobUrl) {
      URL.revokeObjectURL(viewerContent.blobUrl);
    }
    setViewerContent(null);
    setViewerOpen(false);
  };

  const downloadAttachment = (attachment: Attachment) => {
    const blob = base64ToBlob(attachment.url);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } else {
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const startEditPost = (post: typeof posts[0]) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditPostType(post.postType);
    setEditSubject(post.subject || '');
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditContent("");
    setEditPostType('discussion');
    setEditSubject('');
  };

  const saveEditPost = () => {
    if (!editingPostId || !editContent.trim()) return;
    updatePost(editingPostId, editContent, editPostType, editSubject || undefined);
    setEditingPostId(null);
    setEditContent("");
    toast({
      title: lang === 'ar' ? 'تم التعديل' : 'Updated',
      description: lang === 'ar' ? 'تم تعديل المنشور بنجاح' : 'Post updated successfully'
    });
  };

  const handleDeletePost = (postId: string, post: typeof posts[0]) => {
    // Double-check permission before execution
    if (!canDeletePost(post)) {
      toast({
        title: lang === 'ar' ? 'غير مصرح' : 'Unauthorized',
        description: lang === 'ar' ? 'غير مصرح لك بهذا الإجراء' : 'You are not authorized for this action',
        variant: 'destructive'
      });
      return;
    }
    
    // Only log audit for staff deleting other users' posts (moderation action)
    const isModeratingOthersPost = user?.email !== post.authorEmail;
    if (isModeratingOthersPost && user?.email) {
      addAuditEvent({
        action: 'post.delete',
        targetType: 'post',
        targetId: postId,
        byEmail: user.email,
        meta: { authorEmail: post.authorEmail }
      });
    }
    
    deletePost(postId);
    toast({
      title: lang === 'ar' ? 'تم الحذف' : 'Deleted',
      description: lang === 'ar' ? 'تم حذف المنشور' : 'Post deleted'
    });
  };

  // RBAC-based permission checks
  const isCurrentUserAdmin = user ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
  
  const canEditPost = (post: typeof posts[0]) => {
    return user?.email === post.authorEmail || user?.isModerator;
  };

  // Check if user can delete post (owner OR has mod.posts.delete OR is admin)
  const canDeletePost = (post: typeof posts[0]) => {
    if (user?.email === post.authorEmail) return true;
    if (isCurrentUserAdmin) return true;
    return canCurrentUser('mod.posts.delete');
  };
  
  // Check if user can hide/unhide post (has mod.posts.hide OR is admin)
  const canHidePost = () => {
    if (isCurrentUserAdmin) return true;
    return canCurrentUser('mod.posts.hide');
  };
  
  // Hide post action
  const handleHidePost = (postId: string) => {
    // Double-check permission before execution
    if (!canHidePost()) {
      toast({
        title: lang === 'ar' ? 'غير مصرح' : 'Unauthorized',
        description: lang === 'ar' ? 'غير مصرح لك بهذا الإجراء' : 'You are not authorized for this action',
        variant: 'destructive'
      });
      return;
    }
    const updated = [...hiddenPostIds, postId];
    setHiddenPostIds(updated);
    localStorage.setItem(LS_HIDDEN_POSTS, JSON.stringify(updated));
    
    // Log audit event
    if (user?.email) {
      addAuditEvent({
        action: 'post.hide',
        targetType: 'post',
        targetId: postId,
        byEmail: user.email
      });
    }
    
    toast({
      title: lang === 'ar' ? 'تم الإخفاء' : 'Hidden',
      description: lang === 'ar' ? 'تم إخفاء المنشور' : 'Post hidden'
    });
  };
  
  // Unhide post action
  const handleUnhidePost = (postId: string) => {
    // Double-check permission before execution
    if (!canHidePost()) {
      toast({
        title: lang === 'ar' ? 'غير مصرح' : 'Unauthorized',
        description: lang === 'ar' ? 'غير مصرح لك بهذا الإجراء' : 'You are not authorized for this action',
        variant: 'destructive'
      });
      return;
    }
    const updated = hiddenPostIds.filter(id => id !== postId);
    setHiddenPostIds(updated);
    localStorage.setItem(LS_HIDDEN_POSTS, JSON.stringify(updated));
    
    // Log audit event
    if (user?.email) {
      addAuditEvent({
        action: 'post.show',
        targetType: 'post',
        targetId: postId,
        byEmail: user.email
      });
    }
    
    toast({
      title: lang === 'ar' ? 'تم الإظهار' : 'Visible',
      description: lang === 'ar' ? 'تم إظهار المنشور' : 'Post is now visible'
    });
  };
  
  // Check if a post is hidden
  const isPostHidden = (postId: string) => hiddenPostIds.includes(postId);

  const getInitials = (email: string) => {
    const profile = getProfile(email);
    if (profile?.name) {
      return profile.name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    const profile = getProfile(email);
    return profile?.name || email.split('@')[0];
  };

  const getMajor = (email: string) => {
    const profile = getProfile(email);
    return profile?.major || '';
  };

  const getUniversity = (email: string) => {
    const profile = getProfile(email);
    return profile?.university || '';
  };

  const isAdmin = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());
  const isModerator = (email: string) => {
    const emailLower = email.toLowerCase();
    // Check legacy moderator
    if (emailLower === 'w.qq89@hotmail.com') return true;
    // Check in RBAC moderators list
    return moderators.some(m => m.email.toLowerCase() === emailLower && m.isActive);
  };
  // Check if email belongs to admin or moderator (for showing Shield icon)
  const isStaff = (email: string) => isAdmin(email) || isModerator(email);

  const canEditReply = (reply: LocalReply) => {
    return user?.email === reply.authorEmail || user?.isModerator;
  };

  // Check if user can delete reply (owner OR has mod.comments.delete OR is admin)
  const canDeleteReply = (reply: LocalReply) => {
    if (user?.email === reply.authorEmail) return true;
    if (isCurrentUserAdmin) return true;
    return canCurrentUser('mod.comments.delete');
  };

  const startEditReply = (reply: LocalReply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyContent("");
  };

  const saveEditReply = (postId: string) => {
    if (!editingReplyId || !editReplyContent.trim()) return;
    editReply(postId, editingReplyId, editReplyContent);
    setEditingReplyId(null);
    setEditReplyContent("");
    toast({
      title: lang === 'ar' ? 'تم التعديل' : 'Updated',
      description: lang === 'ar' ? 'تم تعديل الرد بنجاح' : 'Reply updated successfully'
    });
  };

  const handleDeleteReply = (postId: string, replyId: string, reply: LocalReply) => {
    // Double-check permission before execution
    if (!canDeleteReply(reply)) {
      toast({
        title: lang === 'ar' ? 'غير مصرح' : 'Unauthorized',
        description: lang === 'ar' ? 'غير مصرح لك بهذا الإجراء' : 'You are not authorized for this action',
        variant: 'destructive'
      });
      return;
    }
    
    // Only log audit for staff deleting other users' replies (moderation action)
    const isModeratingOthersReply = user?.email !== reply.authorEmail;
    if (isModeratingOthersReply && user?.email) {
      addAuditEvent({
        action: 'reply.delete',
        targetType: 'reply',
        targetId: replyId,
        byEmail: user.email,
        meta: { postId, authorEmail: reply.authorEmail }
      });
    }
    
    deleteReply(postId, replyId);
    toast({
      title: lang === 'ar' ? 'تم الحذف' : 'Deleted',
      description: lang === 'ar' ? 'تم حذف الرد' : 'Reply deleted'
    });
  };

  const handleLike = (postId: string) => {
    toggleLike(postId);
  };

  const handleSave = (postId: string) => {
    toggleSave(postId);
  };

  const handleReplySubmit = (postId: string, parentReplyId?: string) => {
    const inputKey = parentReplyId ? `${postId}-${parentReplyId}` : postId;
    const replyContent = replyInputs[inputKey];
    if (!replyContent?.trim()) return;
    
    // Check if user is muted
    if (currentUserMuted) {
      const muteExpiry = currentUserMuteRecord?.expiresAt 
        ? new Date(currentUserMuteRecord.expiresAt).toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-US')
        : null;
      toast({
        title: lang === 'ar' ? 'تم كتمك مؤقتًا' : 'You are muted',
        description: muteExpiry 
          ? `${lang === 'ar' ? 'ينتهي الكتم في' : 'Mute expires at'}: ${muteExpiry}`
          : (lang === 'ar' ? 'تم كتمك مؤقتًا ولا يمكنك التفاعل حاليًا' : 'You are temporarily muted and cannot interact'),
        variant: 'destructive'
      });
      return;
    }
    
    addReply(postId, replyContent, parentReplyId);
    setReplyInputs(prev => ({ ...prev, [inputKey]: "" }));
    setActiveReplyId(null);
    setReplyingToReplyId(prev => ({ ...prev, [postId]: null }));
    if (!expandedReplies.includes(postId)) {
      setExpandedReplies(prev => [...prev, postId]);
    }
  };

  const getNestedReplies = (replies: LocalReply[], parentId?: string): LocalReply[] => {
    return replies.filter(r => r.parentId === parentId);
  };

  const renderReplyThread = (postId: string, replies: LocalReply[], parentId: string | undefined, depth: number = 0): JSX.Element[] => {
    const childReplies = getNestedReplies(replies, parentId);
    const maxDepth = 3;
    const indent = Math.min(depth, maxDepth);
    
    return childReplies.map((reply) => {
      const inputKey = `${postId}-${reply.id}`;
      const hasChildren = getNestedReplies(replies, reply.id).length > 0;
      
      return (
        <div key={reply.id} className="space-y-2" data-testid={`reply-${reply.id}`}>
          <div 
            className="flex gap-2"
            style={{ 
              marginLeft: isRTL ? 0 : indent * 20, 
              marginRight: isRTL ? indent * 20 : 0 
            }}
          >
            <Link 
              href={`/profile/${encodeURIComponent(reply.authorEmail)}`}
              className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              data-testid={`link-reply-avatar-${reply.id}`}
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={getProfile(reply.authorEmail)?.avatarUrl} />
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                  {getInitials(reply.authorEmail)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="bg-muted/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <Link 
                    href={`/profile/${encodeURIComponent(reply.authorEmail)}`}
                    className="text-xs font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
                    data-testid={`link-reply-author-${reply.id}`}
                  >
                    {getDisplayName(reply.authorEmail)}
                  </Link>
                  {isStaff(reply.authorEmail) && (
                    <Shield 
                      size={13} 
                      className="inline-block text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.7)]" 
                      aria-label={isAdmin(reply.authorEmail) ? 'Admin' : 'Moderator'}
                      data-testid={`staff-badge-reply-${reply.id}`}
                    />
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: false, locale: lang === 'ar' ? ar : enUS })}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="ms-auto text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`button-reply-menu-${reply.id}`}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEditReply(reply) && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); startEditReply(reply); }}
                          data-testid={`button-edit-reply-${reply.id}`}
                        >
                          <Pencil className="w-3 h-3 me-2" />
                          {lang === 'ar' ? 'تعديل' : 'Edit'}
                        </DropdownMenuItem>
                      )}
                      {canDeleteReply(reply) && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDeleteReply(postId, reply.id, reply); }}
                          className="text-destructive focus:text-destructive"
                          data-testid={`button-delete-reply-${reply.id}`}
                        >
                          <Trash2 className="w-3 h-3 me-2" />
                          {tr.deleteReply}
                        </DropdownMenuItem>
                      )}
                      {user?.email !== reply.authorEmail && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); openReportModal('comment', reply.id, reply.content.substring(0, 50)); }}
                          className="text-amber-500 focus:text-amber-500"
                          data-testid={`button-report-comment-${reply.id}`}
                        >
                          <Flag className="w-3 h-3 me-2" />
                          {tr.report}
                        </DropdownMenuItem>
                      )}
                      {/* Mute/Unmute user option for staff with mod.users.mute permission */}
                      {user?.email !== reply.authorEmail && canCurrentUser('mod.users.mute') && (
                        isUserMuted(reply.authorEmail) ? (
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); handleUnmuteUser(reply.authorEmail); }}
                            className="text-green-500 focus:text-green-500"
                            data-testid={`button-unmute-reply-user-${reply.id}`}
                          >
                            <Volume2 className="w-3 h-3 me-2" />
                            {tr.unmuteUser}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); openMuteModal(reply.authorEmail, getDisplayName(reply.authorEmail)); }}
                            className="text-orange-500 focus:text-orange-500"
                            data-testid={`button-mute-reply-user-${reply.id}`}
                          >
                            <VolumeX className="w-3 h-3 me-2" />
                            {tr.muteUser}
                          </DropdownMenuItem>
                        )
                      )}
                      {/* Ban/Unban user option for staff with mod.users.ban permission */}
                      {user?.email !== reply.authorEmail && canCurrentUser('mod.users.ban') && (
                        isUserBanned(reply.authorEmail).banned ? (
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); handleUnbanUser(reply.authorEmail); }}
                            className="text-green-500 focus:text-green-500"
                            data-testid={`button-unban-reply-user-${reply.id}`}
                          >
                            <UserCheck className="w-3 h-3 me-2" />
                            {tr.unbanUser}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); openBanModal(reply.authorEmail, getDisplayName(reply.authorEmail)); }}
                            className="text-destructive focus:text-destructive"
                            data-testid={`button-ban-reply-user-${reply.id}`}
                          >
                            <Ban className="w-3 h-3 me-2" />
                            {tr.banUser}
                          </DropdownMenuItem>
                        )
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {editingReplyId === reply.id ? (
                  <div className="space-y-2 mt-1">
                    <Input
                      value={editReplyContent}
                      onChange={(e) => setEditReplyContent(e.target.value)}
                      className="text-sm h-8 bg-background"
                      onKeyDown={(e) => e.key === 'Enter' && saveEditReply(postId)}
                      data-testid={`input-edit-reply-${reply.id}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveEditReply(postId)}
                        disabled={!editReplyContent.trim()}
                        className="h-6 text-xs px-2"
                        data-testid={`button-save-reply-${reply.id}`}
                      >
                        {lang === 'ar' ? 'حفظ' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditReply}
                        className="h-6 text-xs px-2"
                        data-testid={`button-cancel-edit-reply-${reply.id}`}
                      >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{reply.content}</p>
                )}
              </div>
              <button
                onClick={() => setReplyingToReplyId(prev => ({ ...prev, [postId]: prev[postId] === reply.id ? null : reply.id }))}
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 ms-2"
                data-testid={`button-reply-to-${reply.id}`}
              >
                <Reply className="w-3 h-3" />
                {lang === 'ar' ? 'رد' : 'Reply'}
              </button>
            </div>
          </div>
          
          {replyingToReplyId[postId] === reply.id && (
            <div 
              className="flex gap-2" 
              style={{ 
                marginLeft: isRTL ? 0 : (indent + 1) * 20, 
                marginRight: isRTL ? (indent + 1) * 20 : 0 
              }}
            >
              <Avatar className="w-5 h-5 flex-shrink-0">
                <AvatarImage src={user ? getProfile(user.email)?.avatarUrl : undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                  {user ? getInitials(user.email) : 'ME'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  value={replyInputs[inputKey] || ''}
                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                  placeholder={`${lang === 'ar' ? 'رد على' : 'Reply to'} ${getDisplayName(reply.authorEmail)}...`}
                  className="flex-1 h-8 text-xs bg-card/50 border-white/5"
                  onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(postId, reply.id)}
                  data-testid={`input-nested-reply-${reply.id}`}
                />
                <Button
                  size="sm"
                  onClick={() => handleReplySubmit(postId, reply.id)}
                  disabled={!replyInputs[inputKey]?.trim()}
                  className="h-8 px-2"
                  data-testid={`button-submit-nested-reply-${reply.id}`}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          {hasChildren && renderReplyThread(postId, replies, reply.id, depth + 1)}
        </div>
      );
    });
  };

  const toggleReplies = (postId: string) => {
    setExpandedReplies(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const isLiked = (postId: string) => posts.find(p => p.id === postId)?.likedBy?.includes(user?.email || '') || false;
  const isSaved = (postId: string) => posts.find(p => p.id === postId)?.savedBy?.includes(user?.email || '') || false;
  const getLikeCount = (postId: string) => posts.find(p => p.id === postId)?.likedBy?.length || 0;
  const getReplyCount = (postId: string) => posts.find(p => p.id === postId)?.replies?.length || 0;

  // Apply URL-based and type filters
  // Check if current user is staff (admin or moderator)
  const isCurrentUserStaff = isCurrentUserAdmin || (user ? isModerator(user.email) : false);

  const filteredPosts = useMemo(() => {
    let result = posts;

    // Admin/staff override: show ALL posts including hidden/flagged, from banned users, and demo accounts
    // Non-staff users: filter out hidden/flagged posts, hidden posts (localStorage), posts from banned users, and demo accounts
    if (!isCurrentUserStaff) {
      result = result.filter(post => {
        // Filter out hidden/flagged posts (status field)
        if (post.status === 'hidden' || post.status === 'flagged') {
          return false;
        }
        // Filter out posts hidden via moderation (localStorage)
        if (hiddenPostIds.includes(post.id)) {
          return false;
        }
        const banStatus = isUserBanned(post.authorEmail);
        if (banStatus.banned) {
          return false;
        }
        return true;
      });
    }

    // Filter by subject param from URL
    if (subjectParam) {
      result = result.filter(post => post.subject === subjectParam);
    }

    // Filter by post type selector
    if (selectedType !== 'all') {
      result = result.filter(post => post.postType === selectedType);
    }

    // Apply URL filter param
    if (filterParam === 'today') {
      // Posts created today
      result = result.filter(post => new Date(post.createdAt) >= today);
    } else if (filterParam === 'active') {
      // Active discussions: posts with replies in last 60 minutes OR created in last 60 minutes
      result = result.filter(post => {
        const postCreatedRecently = new Date(post.createdAt) >= sixtyMinutesAgo;
        const hasRecentReplies = post.replies?.some(r => new Date(r.createdAt) >= sixtyMinutesAgo);
        return postCreatedRecently || hasRecentReplies;
      });
    }
    // 'top' filter is handled by sorting, not filtering

    return result;
  }, [posts, selectedType, filterParam, subjectParam, today, sixtyMinutesAgo, isCurrentUserStaff, hiddenPostIds, isUserBanned]);

  const sortedPosts = useMemo(() => {
    let result = [...filteredPosts];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeText(searchQuery);
      result = result.filter((post) => {
        const profile = getProfile(post.authorEmail);
        const searchableText = [
          post.content || '',
          profile?.name || '',
          profile?.university || '',
          profile?.major || '',
          post.subject || '',
          post.postType || ''
        ].join(' ');
        const normalizedSearchable = normalizeText(searchableText);
        return normalizedSearchable.includes(normalizedQuery);
      });
    }
    
    if (sortBy === 'trending' || filterParam === 'top') {
      // Sort by engagement score (likes + replies*2)
      result.sort((a, b) => {
        const scoreA = (a.likedBy?.length || 0) + (a.replies?.length || 0) * 2;
        const scoreB = (b.likedBy?.length || 0) + (b.replies?.length || 0) * 2;
        return scoreB - scoreA;
      });
    } else {
      // Sort by newest
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return result;
  }, [filteredPosts, sortBy, filterParam, searchQuery, getProfile]);

  // Get filter-specific title and empty state messages
  const getFilterTitle = () => {
    if (filterParam === 'today') return lang === 'ar' ? 'منشورات اليوم' : "Today's Posts";
    if (filterParam === 'active') return lang === 'ar' ? 'نقاشات نشطة' : 'Active Discussions';
    if (filterParam === 'top') return lang === 'ar' ? 'الأكثر تفاعلاً' : 'Most Engaged';
    return lang === 'ar' ? 'ساحة المناقشة' : 'Discussion Arena';
  };

  const getFilterSubtitle = () => {
    if (filterParam === 'today') return lang === 'ar' ? 'المنشورات التي تمت مشاركتها اليوم' : 'Posts shared today';
    if (filterParam === 'active') return lang === 'ar' ? 'النقاشات النشطة خلال الساعة الأخيرة' : 'Discussions active in the last hour';
    if (filterParam === 'top') return lang === 'ar' ? 'المنشورات الأكثر تفاعلاً' : 'Posts with the most engagement';
    return lang === 'ar' ? 'تعلّم، ناقش، وشارك مع زملائك' : 'Learn, discuss, and share with your peers';
  };

  const getEmptyMessage = () => {
    if (filterParam === 'today') return lang === 'ar' ? 'لا يوجد منشورات اليوم' : 'No posts today';
    if (filterParam === 'active') return lang === 'ar' ? 'لا يوجد نقاشات نشطة حالياً' : 'No active discussions right now';
    if (filterParam === 'top') return lang === 'ar' ? 'لا يوجد منشورات للتفاعل' : 'No posts with engagement yet';
    return lang === 'ar' ? 'لا توجد مشاركات بعد' : 'No posts yet';
  };

  const getEmptySubMessage = () => {
    if (filterParam === 'today') return lang === 'ar' ? 'شارك أول منشور اليوم!' : 'Share the first post today!';
    if (filterParam === 'active') return lang === 'ar' ? 'ابدأ نقاشاً جديداً!' : 'Start a new discussion!';
    if (filterParam === 'top') return lang === 'ar' ? 'كن أول من يشارك ويتفاعل!' : 'Be the first to share and engage!';
    return lang === 'ar' ? 'كن أول من يشارك!' : 'Be the first to share!';
  };

  const tr = {
    pageTitle: getFilterTitle(),
    pageSubtitle: getFilterSubtitle(),
    newPost: lang === 'ar' ? '+ منشور جديد' : '+ New Post',
    writePost: lang === 'ar' ? 'شارك ما يدور في بالك...' : 'Share what\'s on your mind...',
    publish: lang === 'ar' ? 'نشر' : 'Publish',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    like: lang === 'ar' ? 'إعجاب' : 'Like',
    comment: lang === 'ar' ? 'تعليق' : 'Comment',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    writeComment: lang === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...',
    showComments: lang === 'ar' ? 'التعليقات' : 'Comments',
    hideComments: lang === 'ar' ? 'إخفاء' : 'Hide',
    noPostsYet: getEmptyMessage(),
    beFirst: getEmptySubMessage(),
    newest: lang === 'ar' ? 'الأحدث' : 'Newest',
    trending: lang === 'ar' ? 'الأكثر تفاعلاً' : 'Trending',
    all: lang === 'ar' ? 'الكل' : 'All',
    postType: lang === 'ar' ? 'نوع المنشور' : 'Post Type',
    college: lang === 'ar' ? 'الكلية' : 'College',
    selectCollege: lang === 'ar' ? 'اختر الكلية' : 'Select College',
    admin: lang === 'ar' ? 'مشرف' : 'Admin',
    moderator: lang === 'ar' ? 'مشرف' : 'Moderator',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    saveChanges: lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
    confirmDelete: lang === 'ar' ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?',
    report: lang === 'ar' ? 'إبلاغ' : 'Report',
    reportTitle: lang === 'ar' ? 'الإبلاغ عن محتوى' : 'Report Content',
    reportReason: lang === 'ar' ? 'سبب الإبلاغ' : 'Reason for Report',
    reportNote: lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional notes (optional)',
    reportSubmit: lang === 'ar' ? 'إرسال البلاغ' : 'Submit Report',
    reportSuccess: lang === 'ar' ? 'تم إرسال البلاغ' : 'Report Submitted',
    reportSuccessDesc: lang === 'ar' ? 'شكراً لك، سيتم مراجعة البلاغ قريباً' : 'Thank you, your report will be reviewed soon',
    selectReason: lang === 'ar' ? 'اختر السبب' : 'Select reason',
    reasonSpam: lang === 'ar' ? 'محتوى مزعج / سبام' : 'Spam',
    reasonHarassment: lang === 'ar' ? 'تحرش أو تنمر' : 'Harassment',
    reasonHate: lang === 'ar' ? 'خطاب كراهية' : 'Hate Speech',
    reasonImpersonation: lang === 'ar' ? 'انتحال شخصية' : 'Impersonation',
    reasonInappropriate: lang === 'ar' ? 'محتوى غير لائق' : 'Inappropriate Content',
    reasonOther: lang === 'ar' ? 'سبب آخر' : 'Other',
    statusVisible: lang === 'ar' ? 'مرئي' : 'Visible',
    statusHidden: lang === 'ar' ? 'مخفي' : 'Hidden',
    statusFlagged: lang === 'ar' ? 'مُبلغ عنه' : 'Flagged',
    bannedUser: lang === 'ar' ? 'مستخدم محظور' : 'Banned User',
    // RBAC moderation actions
    hidePost: lang === 'ar' ? 'إخفاء المنشور' : 'Hide Post',
    showPost: lang === 'ar' ? 'إظهار المنشور' : 'Show Post',
    deletePost: lang === 'ar' ? 'حذف المنشور' : 'Delete Post',
    deleteReply: lang === 'ar' ? 'حذف الرد' : 'Delete Reply',
    postHiddenByMod: lang === 'ar' ? 'هذا المنشور مخفي' : 'This post is hidden',
    // Mute system
    muteUser: lang === 'ar' ? 'كتم المستخدم' : 'Mute User',
    unmuteUser: lang === 'ar' ? 'فك كتم المستخدم' : 'Unmute User',
    muteTitle: lang === 'ar' ? 'كتم المستخدم' : 'Mute User',
    muteDuration: lang === 'ar' ? 'مدة الكتم' : 'Mute Duration',
    muteReason: lang === 'ar' ? 'سبب الكتم (اختياري)' : 'Reason for mute (optional)',
    muteSubmit: lang === 'ar' ? 'تأكيد الكتم' : 'Confirm Mute',
    muteSuccess: lang === 'ar' ? 'تم كتم المستخدم' : 'User Muted',
    muteSuccessDesc: lang === 'ar' ? 'لن يتمكن المستخدم من النشر أو التعليق' : 'User can no longer post or comment',
    unmuteSuccess: lang === 'ar' ? 'تم فك كتم المستخدم' : 'User Unmuted',
    unmuteSuccessDesc: lang === 'ar' ? 'يمكن للمستخدم الآن النشر والتعليق' : 'User can now post and comment',
    mute10Min: lang === 'ar' ? '10 دقائق' : '10 minutes',
    mute1Hour: lang === 'ar' ? 'ساعة واحدة' : '1 hour',
    mute1Day: lang === 'ar' ? 'يوم واحد' : '1 day',
    mutePermanent: lang === 'ar' ? 'دائم' : 'Permanent',
    youAreMuted: lang === 'ar' ? 'تم كتمك مؤقتًا ولا يمكنك التفاعل حاليًا' : 'You are temporarily muted and cannot interact',
    muteExpiresAt: lang === 'ar' ? 'ينتهي الكتم في' : 'Mute expires at',
    // Ban system
    banUser: lang === 'ar' ? 'حظر المستخدم' : 'Ban User',
    unbanUser: lang === 'ar' ? 'فك حظر المستخدم' : 'Unban User',
    banTitle: lang === 'ar' ? 'حظر المستخدم' : 'Ban User',
    banDuration: lang === 'ar' ? 'مدة الحظر' : 'Ban Duration',
    banReason: lang === 'ar' ? 'سبب الحظر (اختياري)' : 'Reason for ban (optional)',
    banSubmit: lang === 'ar' ? 'تأكيد الحظر' : 'Confirm Ban',
    banSuccess: lang === 'ar' ? 'تم حظر المستخدم' : 'User Banned',
    banSuccessDesc: lang === 'ar' ? 'لن يتمكن المستخدم من الوصول للمنصة' : 'User can no longer access the platform',
    unbanSuccess: lang === 'ar' ? 'تم فك حظر المستخدم' : 'User Unbanned',
    unbanSuccessDesc: lang === 'ar' ? 'يمكن للمستخدم الآن الوصول للمنصة' : 'User can now access the platform',
    ban1Day: lang === 'ar' ? 'يوم واحد' : '1 day',
    ban7Days: lang === 'ar' ? '7 أيام' : '7 days',
    ban30Days: lang === 'ar' ? '30 يوم' : '30 days',
    banPermanent: lang === 'ar' ? 'دائم' : 'Permanent'
  };

  const openReportModal = (type: 'post' | 'comment', id: string, title: string) => {
    setReportTarget({ type, id, title });
    setReportReason('');
    setReportNote('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = () => {
    if (!reportTarget || !reportReason) return;
    submitReport(reportTarget.type, reportTarget.id, reportTarget.title, reportReason as ReportReason, reportNote || undefined);
    setReportModalOpen(false);
    setReportTarget(null);
    setReportReason('');
    setReportNote('');
    toast({
      title: tr.reportSuccess,
      description: tr.reportSuccessDesc
    });
  };

  // Mute modal handlers
  const openMuteModal = (email: string, name: string) => {
    setMuteTarget({ email, name });
    setMuteDuration('60');
    setMuteReason('');
    setMuteModalOpen(true);
  };

  const handleSubmitMute = () => {
    if (!muteTarget) return;
    const durationMinutes = muteDuration === 'permanent' ? undefined : parseInt(muteDuration);
    muteUser(muteTarget.email, muteReason || undefined, durationMinutes);
    setMuteModalOpen(false);
    setMuteTarget(null);
    setMuteDuration('60');
    setMuteReason('');
    toast({
      title: tr.muteSuccess,
      description: tr.muteSuccessDesc
    });
  };

  const handleUnmuteUser = (email: string) => {
    unmuteUser(email);
    toast({
      title: tr.unmuteSuccess,
      description: tr.unmuteSuccessDesc
    });
  };

  // Check if current user is muted
  const currentUserMuted = user ? isUserMuted(user.email) : false;
  const currentUserMuteRecord = user ? getMuteRecord(user.email) : undefined;

  // Ban modal handlers
  const openBanModal = (email: string, name: string) => {
    setBanTarget({ email, name });
    setBanDuration('7');
    setBanReason('');
    setBanModalOpen(true);
  };

  const handleSubmitBan = () => {
    if (!banTarget) return;
    const durationDays = banDuration === 'permanent' ? undefined : parseInt(banDuration);
    banUserWithDuration(banTarget.email, banReason || undefined, durationDays);
    setBanModalOpen(false);
    setBanTarget(null);
    setBanDuration('7');
    setBanReason('');
    toast({
      title: tr.banSuccess,
      description: tr.banSuccessDesc
    });
  };

  const handleUnbanUser = (email: string) => {
    unbanUserRecord(email);
    toast({
      title: tr.unbanSuccess,
      description: tr.unbanSuccessDesc
    });
  };

  const getPostTypeLabel = (type: PostType) => {
    const typeInfo = POST_TYPES.find(t => t.value === type);
    return typeInfo ? (lang === 'ar' ? typeInfo.labelAr : typeInfo.labelEn) : type;
  };


  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">{tr.pageTitle}</h1>
        <p className="text-muted-foreground text-sm mt-2">{tr.pageSubtitle}</p>
      </div>

      <InFeedCampaignCard placement="feed" />

      {/* Sticky Control Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 space-y-3 border-b border-white/5">
        {/* Search Row */}
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? 'ابحث عن جامعة، كلية، أو موضوع…' : 'Search university, college, or topic…'}
            className={`${isRTL ? 'pr-9 pl-9' : 'pl-9 pr-9'} bg-muted/50 border-white/10`}
            data-testid="input-search"
          />
          {searchQuery && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-1' : 'right-1'} scale-75`}
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Category Chips Row */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            size="sm"
            variant={selectedType === 'all' ? "default" : "ghost"}
            onClick={() => setSelectedType('all')}
            className={`flex-shrink-0 rounded-full ${selectedType === 'all' ? 'bg-[#865994]' : 'bg-muted/50'}`}
            data-testid="button-filter-all"
          >
            {tr.all}
          </Button>
          {POST_TYPES.map((type) => (
            <Button
              key={type.value}
              size="sm"
              variant={selectedType === type.value ? "default" : "ghost"}
              onClick={() => setSelectedType(type.value)}
              className={`flex-shrink-0 rounded-full ${selectedType === type.value ? 'bg-[#865994]' : 'bg-muted/50'}`}
              data-testid={`button-filter-${type.value}`}
            >
              {lang === 'ar' ? type.labelAr : type.labelEn}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {sortedPosts.length === 0 ? (
          <Card className="border-white/5 bg-card/30">
            <CardContent className="py-16 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-muted-foreground">{tr.noPostsYet}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{tr.beFirst}</p>
            </CardContent>
          </Card>
        ) : (
          sortedPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {isPostHidden(post.id) ? (
                <Card className="border-amber-500/30 bg-amber-500/5 transition-colors" data-testid={`post-hidden-${post.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <EyeOff className="w-5 h-5 text-amber-500" />
                        <span className="text-sm text-muted-foreground">{tr.postHiddenByMod}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnhidePost(post.id)}
                        data-testid={`button-unhide-${post.id}`}
                      >
                        <Eye className="w-4 h-4 me-2" />
                        {tr.showPost}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
              <Card 
                className="border-white/5 bg-card/50 hover:bg-card/70 transition-colors cursor-pointer" 
                data-testid={`post-${post.id}`}
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3 items-start">
                    <Link 
                      href={`/profile/${encodeURIComponent(post.authorEmail)}`}
                      className="flex-shrink-0 self-start cursor-pointer hover:opacity-80 transition-opacity"
                      data-testid={`link-avatar-${post.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar className="w-11 h-11 border border-primary/20">
                        <AvatarImage src={getProfile(post.authorEmail)?.avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-gray-500 text-white text-sm">
                          {getInitials(post.authorEmail)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            href={`/profile/${encodeURIComponent(post.authorEmail)}`}
                            className="font-semibold text-sm hover:text-primary hover:underline cursor-pointer transition-colors"
                            data-testid={`link-author-${post.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getDisplayName(post.authorEmail)}
                          </Link>
                          {isStaff(post.authorEmail) && (
                            <Shield 
                              size={15} 
                              className="inline-block text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.7)]" 
                              aria-label={isAdmin(post.authorEmail) ? 'Admin' : 'Moderator'}
                              data-testid={`staff-badge-post-${post.id}`}
                            />
                          )}
                          {isCurrentUserAdmin && (
                            <>
                              {(post.status === 'hidden' || post.status === 'flagged') && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] px-1.5 py-0 ${
                                    post.status === 'hidden' 
                                      ? 'border-gray-500/30 text-gray-500 bg-gray-500/10' 
                                      : 'border-red-500/30 text-red-500 bg-red-500/10'
                                  }`}
                                  data-testid={`badge-status-${post.id}`}
                                >
                                  {post.status === 'hidden' ? tr.statusHidden : tr.statusFlagged}
                                </Badge>
                              )}
                              {getAccount(post.authorEmail)?.banned && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] px-1.5 py-0 border-red-500/30 text-red-500 bg-red-500/10"
                                  data-testid={`badge-banned-${post.id}`}
                                >
                                  {tr.bannedUser}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              data-testid={`button-post-menu-${post.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? "start" : "end"}>
                            {canEditPost(post) && (
                              <DropdownMenuItem 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditPost(post); }}
                                data-testid={`button-edit-${post.id}`}
                              >
                                <Pencil className="w-4 h-4 me-2" />
                                {tr.edit}
                              </DropdownMenuItem>
                            )}
                            {canHidePost() && !isPostHidden(post.id) && (
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); handleHidePost(post.id); }}
                                data-testid={`button-hide-${post.id}`}
                              >
                                <EyeOff className="w-4 h-4 me-2" />
                                {tr.hidePost}
                              </DropdownMenuItem>
                            )}
                            {canDeletePost(post) && (
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id, post); }}
                                className="text-destructive focus:text-destructive"
                                data-testid={`button-delete-${post.id}`}
                              >
                                <Trash2 className="w-4 h-4 me-2" />
                                {tr.deletePost}
                              </DropdownMenuItem>
                            )}
                            {user?.email !== post.authorEmail && (
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); openReportModal('post', post.id, post.content.substring(0, 50)); }}
                                className="text-amber-500 focus:text-amber-500"
                                data-testid={`button-report-post-${post.id}`}
                              >
                                <Flag className="w-4 h-4 me-2" />
                                {tr.report}
                              </DropdownMenuItem>
                            )}
                            {/* Mute/Unmute user option for staff with mod.users.mute permission */}
                            {user?.email !== post.authorEmail && canCurrentUser('mod.users.mute') && (
                              isUserMuted(post.authorEmail) ? (
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); handleUnmuteUser(post.authorEmail); }}
                                  className="text-green-500 focus:text-green-500"
                                  data-testid={`button-unmute-user-${post.authorEmail}`}
                                >
                                  <Volume2 className="w-4 h-4 me-2" />
                                  {tr.unmuteUser}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); openMuteModal(post.authorEmail, getDisplayName(post.authorEmail)); }}
                                  className="text-orange-500 focus:text-orange-500"
                                  data-testid={`button-mute-user-${post.authorEmail}`}
                                >
                                  <VolumeX className="w-4 h-4 me-2" />
                                  {tr.muteUser}
                                </DropdownMenuItem>
                              )
                            )}
                            {/* Ban/Unban user option for staff with mod.users.ban permission */}
                            {user?.email !== post.authorEmail && canCurrentUser('mod.users.ban') && (
                              isUserBanned(post.authorEmail).banned ? (
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); handleUnbanUser(post.authorEmail); }}
                                  className="text-green-500 focus:text-green-500"
                                  data-testid={`button-unban-user-${post.authorEmail}`}
                                >
                                  <UserCheck className="w-4 h-4 me-2" />
                                  {tr.unbanUser}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); openBanModal(post.authorEmail, getDisplayName(post.authorEmail)); }}
                                  className="text-destructive focus:text-destructive"
                                  data-testid={`button-ban-user-${post.authorEmail}`}
                                >
                                  <Ban className="w-4 h-4 me-2" />
                                  {tr.banUser}
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        {(getMajor(post.authorEmail) || getUniversity(post.authorEmail)) && (
                          <span>
                            {getMajor(post.authorEmail)}
                            {getMajor(post.authorEmail) && getUniversity(post.authorEmail) && ' · '}
                            {getUniversity(post.authorEmail)}
                          </span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(post.createdAt), { 
                            addSuffix: true,
                            locale: lang === 'ar' ? ar : enUS 
                          })}
                        </span>
                      </div>

                      {editingPostId === post.id ? (
                        <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] bg-background/50 border-white/10 resize-none text-base"
                            autoFocus
                            data-testid="textarea-edit-post"
                          />
                          
                          <div className="flex flex-wrap gap-1">
                            {POST_TYPES.map((type) => (
                              <Button
                                key={type.value}
                                size="sm"
                                variant={editPostType === type.value ? "default" : "outline"}
                                onClick={() => setEditPostType(type.value)}
                                className="text-xs h-7"
                              >
                                {lang === 'ar' ? type.labelAr : type.labelEn}
                              </Button>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant={!editSubject ? "default" : "outline"}
                              onClick={() => setEditSubject('')}
                              className="text-xs h-7"
                            >
                              -
                            </Button>
                            {COLLEGES.map((college) => (
                              <Button
                                key={college.value}
                                size="sm"
                                variant={editSubject === college.value ? "default" : "outline"}
                                onClick={() => setEditSubject(college.value)}
                                className="text-xs h-7"
                              >
                                {lang === 'ar' ? college.labelAr : college.labelEn}
                              </Button>
                            ))}
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={cancelEditPost}
                              data-testid="button-cancel-edit"
                            >
                              {tr.cancel}
                            </Button>
                            <Button 
                              size="sm"
                              onClick={saveEditPost}
                              disabled={!editContent.trim()}
                              data-testid="button-save-edit"
                            >
                              {tr.saveChanges}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {post.subject && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${getCollegeColor(post.subject)}`}>
                                <Hash className="w-2.5 h-2.5 me-0.5" />
                                {getCollegeLabel(post.subject, lang)}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-white/10">
                              {getPostTypeLabel(post.postType)}
                            </Badge>
                          </div>
                          
                          <p className="text-base leading-relaxed mt-3 whitespace-pre-wrap">
                            {post.content}
                          </p>
                        </>
                      )}

                      {(() => {
                        const imgs: { url: string; name: string; attachment?: Attachment }[] = [];
                        if (post.imageUrl) imgs.push({ url: post.imageUrl, name: 'post-image.png' });
                        if (post.attachments) post.attachments.filter(a => a.type === 'image').forEach(a => imgs.push({ url: a.url, name: a.name, attachment: a }));
                        if (imgs.length === 0) return null;
                        const openImg = (item: typeof imgs[0]) => item.attachment
                          ? openAttachment(item.attachment)
                          : openAttachment({ url: item.url, name: item.name, type: 'image', size: 0 } as Attachment);
                        if (imgs.length === 1) return (
                          <button onClick={(e) => { e.stopPropagation(); openImg(imgs[0]); }} className="w-full mt-3 overflow-hidden rounded-xl bg-muted cursor-pointer hover:opacity-90 transition-opacity" data-testid={`button-post-image-${post.id}`}>
                            <img src={imgs[0].url} alt="" className="w-full h-64 object-cover object-center" loading="lazy" />
                          </button>
                        );
                        const cols = imgs.length === 2 ? 'grid-cols-2' : imgs.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
                        const h = imgs.length <= 3 ? 'h-48' : 'h-40';
                        const visible = imgs.slice(0, 4);
                        const extra = imgs.length - 4;
                        return (
                          <div className={`mt-3 grid ${cols} gap-1 rounded-xl overflow-hidden`}>
                            {visible.map((img, i) => (
                              <button key={i} onClick={(e) => { e.stopPropagation(); openImg(img); }} className={`relative ${h} overflow-hidden rounded bg-muted cursor-pointer hover:opacity-90 transition-opacity`}>
                                <img src={img.url} alt="" className="w-full h-full object-cover object-center" loading="lazy" />
                                {i === 3 && extra > 0 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white text-xl font-bold">+{extra}</span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      })()}

                      {post.attachments && post.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {post.attachments.map((attachment, idx) => (
                            attachment.type === 'image' ? null : (
                              <button 
                                key={idx} 
                                onClick={(e) => { e.stopPropagation(); openAttachment(attachment); }}
                                className="w-full flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 hover:bg-primary/20 transition-colors group cursor-pointer text-start border border-transparent hover:border-primary/30"
                                data-testid={`button-attachment-${idx}`}
                              >
                                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                                  <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <div className="flex gap-1">
                                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    {lang === 'ar' ? 'فتح' : 'Open'}
                                  </span>
                                  <ExternalLink className="w-4 h-4 text-primary" />
                                </div>
                              </button>
                            )
                          ))}
                        </div>
                      )}

                      {post.updatedAt && (
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground/70">
                          <Pencil className="w-3 h-3" />
                          <span>
                            {lang === 'ar' ? 'تم تعديل' : 'Edited'} · {formatDistanceToNow(new Date(post.updatedAt), { 
                              addSuffix: true,
                              locale: lang === 'ar' ? ar : enUS 
                            })}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveReplyId(activeReplyId === post.id ? null : post.id); }}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${
                            activeReplyId === post.id 
                              ? 'text-primary' 
                              : 'text-muted-foreground hover:text-primary'
                          }`}
                          data-testid={`button-comment-${post.id}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {getReplyCount(post.id) > 0 && <span>{getReplyCount(post.id)}</span>}
                          <span className="hidden sm:inline">{tr.comment}</span>
                        </button>

                        <button 
                          onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${
                            isLiked(post.id) 
                              ? 'text-rose-500' 
                              : 'text-muted-foreground hover:text-rose-500'
                          }`}
                          data-testid={`button-like-${post.id}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked(post.id) ? 'fill-current' : ''}`} />
                          {getLikeCount(post.id) > 0 && <span>{getLikeCount(post.id)}</span>}
                          <span className="hidden sm:inline">{tr.like}</span>
                        </button>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSave(post.id); }}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${
                            isSaved(post.id) 
                              ? 'text-amber-500' 
                              : 'text-muted-foreground hover:text-amber-500'
                          }`}
                          data-testid={`button-save-${post.id}`}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved(post.id) ? 'fill-current' : ''}`} />
                          <span className="hidden sm:inline">{tr.save}</span>
                        </button>
                      </div>

                      <AnimatePresence>
                        {activeReplyId === post.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-2">
                              <Avatar className="w-7 h-7 flex-shrink-0">
                                <AvatarImage src={user ? getProfile(user.email)?.avatarUrl : undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {user ? getInitials(user.email) : 'ME'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  value={replyInputs[post.id] || ''}
                                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  placeholder={tr.writeComment}
                                  className="flex-1 h-9 bg-background/50 border-white/10"
                                  onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(post.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`input-reply-${post.id}`}
                                />
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleReplySubmit(post.id); }}
                                  disabled={!replyInputs[post.id]?.trim()}
                                  className="h-9"
                                  data-testid={`button-submit-reply-${post.id}`}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {getReplyCount(post.id) > 0 && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleReplies(post.id); }}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            data-testid={`button-toggle-replies-${post.id}`}
                          >
                            {expandedReplies.includes(post.id) ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                {tr.hideComments}
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                {tr.showComments} ({getReplyCount(post.id)})
                              </>
                            )}
                          </button>

                          <AnimatePresence>
                            {expandedReplies.includes(post.id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 mt-3"
                              >
                                {renderReplyThread(post.id, post.replies || [], undefined, 0)}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={viewerOpen} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 flex flex-col">
          <DialogTitle className="sr-only">صورة</DialogTitle>
          <div className="flex-1 min-h-0 p-4 bg-muted/30 overflow-auto">
            {viewerContent?.type === 'image' && (
              <div className="flex items-center justify-center min-h-[300px]">
                <img
                  src={viewerContent.blobUrl}
                  alt={viewerContent.name}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              </div>
            )}
          </div>
          <div className="p-3 border-t flex-shrink-0 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (viewerContent?.blobUrl) {
                  const link = document.createElement('a');
                  link.href = viewerContent.blobUrl;
                  link.download = viewerContent.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast({
                    title: lang === 'ar' ? 'جاري التحميل' : 'Downloading',
                    description: viewerContent.name
                  });
                }
              }}
              data-testid="button-viewer-download"
            >
              <Download className="w-4 h-4 me-2" />
              {lang === 'ar' ? 'تحميل' : 'Download'}
            </Button>
            <Button onClick={closeViewer} data-testid="button-viewer-close">
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-report">
          <DialogHeader>
            <DialogTitle>{tr.reportTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reportTarget && (
              <p className="text-sm text-muted-foreground" data-testid="text-report-target">
                {lang === 'ar' ? 'الإبلاغ عن:' : 'Reporting:'} "{reportTarget.title}..."
              </p>
            )}
            <div className="space-y-2">
              <Label>{tr.reportReason}</Label>
              <Select value={reportReason} onValueChange={(val) => setReportReason(val as ReportReason)}>
                <SelectTrigger data-testid="select-report-reason">
                  <SelectValue placeholder={tr.selectReason} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam" data-testid="option-spam">{tr.reasonSpam}</SelectItem>
                  <SelectItem value="harassment" data-testid="option-harassment">{tr.reasonHarassment}</SelectItem>
                  <SelectItem value="hate" data-testid="option-hate">{tr.reasonHate}</SelectItem>
                  <SelectItem value="impersonation" data-testid="option-impersonation">{tr.reasonImpersonation}</SelectItem>
                  <SelectItem value="inappropriate" data-testid="option-inappropriate">{tr.reasonInappropriate}</SelectItem>
                  <SelectItem value="other" data-testid="option-other">{tr.reasonOther}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tr.reportNote}</Label>
              <Textarea 
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder={lang === 'ar' ? 'أضف تفاصيل إضافية...' : 'Add additional details...'}
                className="resize-none"
                rows={3}
                data-testid="textarea-report-note"
              />
            </div>
            <Button 
              onClick={handleSubmitReport} 
              disabled={!reportReason}
              className="w-full"
              data-testid="button-submit-report"
            >
              <Flag className="w-4 h-4 me-2" />
              {tr.reportSubmit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mute Modal */}
      <Dialog open={muteModalOpen} onOpenChange={setMuteModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-mute">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <VolumeX className="w-5 h-5" />
              {tr.muteTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {muteTarget && (
              <p className="text-sm text-muted-foreground" data-testid="text-mute-target">
                {lang === 'ar' ? 'كتم المستخدم:' : 'Muting user:'} {muteTarget.name} ({muteTarget.email})
              </p>
            )}
            <div className="space-y-2">
              <Label>{tr.muteDuration}</Label>
              <Select value={muteDuration} onValueChange={(val) => setMuteDuration(val as '10' | '60' | '1440' | 'permanent')}>
                <SelectTrigger data-testid="select-mute-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" data-testid="option-mute-10min">{tr.mute10Min}</SelectItem>
                  <SelectItem value="60" data-testid="option-mute-1hour">{tr.mute1Hour}</SelectItem>
                  <SelectItem value="1440" data-testid="option-mute-1day">{tr.mute1Day}</SelectItem>
                  <SelectItem value="permanent" data-testid="option-mute-permanent">{tr.mutePermanent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tr.muteReason}</Label>
              <Textarea 
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                placeholder={lang === 'ar' ? 'سبب الكتم...' : 'Reason for muting...'}
                className="resize-none"
                rows={3}
                data-testid="textarea-mute-reason"
              />
            </div>
            <Button 
              onClick={handleSubmitMute}
              className="w-full"
              data-testid="button-submit-mute"
            >
              <VolumeX className="w-4 h-4 me-2" />
              {tr.muteSubmit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Modal */}
      <Dialog open={banModalOpen} onOpenChange={setBanModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-ban">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              {tr.banTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {banTarget && (
              <p className="text-sm text-muted-foreground" data-testid="text-ban-target">
                {lang === 'ar' ? 'حظر المستخدم:' : 'Banning user:'} {banTarget.name} ({banTarget.email})
              </p>
            )}
            <div className="space-y-2">
              <Label>{tr.banDuration}</Label>
              <Select value={banDuration} onValueChange={(val) => setBanDuration(val as '1' | '7' | '30' | 'permanent')}>
                <SelectTrigger data-testid="select-ban-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" data-testid="option-ban-1day">{tr.ban1Day}</SelectItem>
                  <SelectItem value="7" data-testid="option-ban-7days">{tr.ban7Days}</SelectItem>
                  <SelectItem value="30" data-testid="option-ban-30days">{tr.ban30Days}</SelectItem>
                  <SelectItem value="permanent" data-testid="option-ban-permanent">{tr.banPermanent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tr.banReason}</Label>
              <Textarea 
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={lang === 'ar' ? 'سبب الحظر...' : 'Reason for ban...'}
                className="resize-none"
                rows={3}
                data-testid="textarea-ban-reason"
              />
            </div>
            <Button 
              onClick={handleSubmitBan}
              variant="destructive"
              className="w-full"
              data-testid="button-submit-ban"
            >
              <Ban className="w-4 h-4 me-2" />
              {tr.banSubmit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAB Button */}
      <div className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] md:bottom-6 z-50 ${isRTL ? 'right-6' : 'left-6'}`}>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="rounded-full bg-[#865994] border-[#865994] text-white shadow-lg shadow-[#865994]/30 p-4"
          aria-label={isRTL ? 'اكتب منشورًا' : 'Write post'}
          data-testid="button-fab-create-post"
        >
          <PenLine className="w-6 h-6" />
        </Button>
      </div>

      {/* Bottom Sheet Composer */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateForm(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              data-testid="backdrop-composer"
            />
            
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl max-h-[85vh] flex flex-col"
              dir={isRTL ? 'rtl' : 'ltr'}
              data-testid="sheet-composer"
              onTouchStart={(e) => { swipeTouchStartY.current = e.touches[0].clientY; }}
              onTouchEnd={(e) => {
                const delta = e.changedTouches[0].clientY - swipeTouchStartY.current;
                if (delta > 100) setShowCreateForm(false);
              }}
            >
              {/* A) Fixed Header */}
              <div className="flex-shrink-0">
                {/* Handle bar — swipe indicator */}
                <div className="flex justify-center py-2 cursor-grab">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
                  <h2 className="text-lg font-semibold">
                    {lang === 'ar' ? 'إنشاء منشور' : 'Create post'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreateForm(false)}
                    data-testid="button-close-composer"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              {/* B) Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex gap-3 mb-4">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={user ? getProfile(user.email)?.avatarUrl : undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user ? getInitials(user.email) : 'ME'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder={tr.writePost}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[100px] bg-background/50 border-white/10 resize-none text-base"
                      autoFocus
                      dir={isRTL ? 'rtl' : 'ltr'}
                      inputMode="text"
                      autoComplete="off"
                      autoCorrect="off"
                      data-testid="textarea-composer"
                    />
                  </div>
                </div>

                {/* Post Type Selection */}
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-2 block">{tr.postType}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {POST_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        size="sm"
                        variant={newPostType === type.value ? "default" : "ghost"}
                        onClick={() => setNewPostType(type.value)}
                        className={`rounded-full text-xs ${newPostType === type.value ? 'bg-[#865994]' : ''}`}
                        data-testid={`button-composer-type-${type.value}`}
                      >
                        {lang === 'ar' ? type.labelAr : type.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* College Selection */}
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-2 block">{tr.college}</label>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant={!newPostSubject ? "default" : "ghost"}
                      onClick={() => setNewPostSubject('')}
                      className={`rounded-full text-xs ${!newPostSubject ? 'bg-[#865994]' : ''}`}
                      data-testid="button-composer-college-none"
                    >
                      -
                    </Button>
                    {COLLEGES.map((college) => (
                      <Button
                        key={college.value}
                        size="sm"
                        variant={newPostSubject === college.value ? "default" : "ghost"}
                        onClick={() => setNewPostSubject(college.value)}
                        className={`rounded-full text-xs ${newPostSubject === college.value ? 'bg-[#865994]' : ''}`}
                        data-testid={`button-composer-college-${college.value}`}
                      >
                        {lang === 'ar' ? college.labelAr : college.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {attachments.map((att, index) => (
                      <div key={index} className="relative group">
                        {att.type === 'image' ? (
                          <img 
                            src={att.url} 
                            alt={att.name}
                            className="w-16 h-16 object-cover rounded-lg border border-white/10"
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center bg-muted/50 rounded-lg border border-white/10">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removeAttachment(index)}
                          className="absolute -top-1.5 -right-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity scale-50"
                          data-testid={`button-remove-attachment-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* C) Fixed Footer with safe-area padding */}
              <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 pt-4 border-t border-white/10 bg-card pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-composer-file"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                  data-testid="button-add-photo"
                >
                  <ImagePlus className="w-4 h-4" />
                  {lang === 'ar' ? 'إضافة صورة' : 'Add photo'}
                </Button>
                <Button
                  onClick={handlePost}
                  disabled={!content.trim()}
                  className="bg-[#865994] gap-2"
                  data-testid="button-publish-post"
                >
                  <Send className="w-4 h-4" />
                  {lang === 'ar' ? 'نشر' : 'Post'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
