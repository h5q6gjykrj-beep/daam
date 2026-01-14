import { useState, useRef } from "react";
import { useDaamStore, ADMIN_EMAILS } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, MessageSquare, Heart, Plus, ChevronDown, ChevronUp, X, Reply,
  Bookmark, FileText, Hash, TrendingUp, Clock, Shield, Paperclip, Download, ExternalLink,
  MoreVertical, Pencil, Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type LocalReply, type PostType, type Attachment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const POST_TYPES: { value: PostType; labelAr: string; labelEn: string }[] = [
  { value: 'question', labelAr: 'سؤال', labelEn: 'Question' },
  { value: 'explanation', labelAr: 'شرح', labelEn: 'Explanation' },
  { value: 'summary', labelAr: 'ملخص', labelEn: 'Summary' },
  { value: 'discussion', labelAr: 'نقاش', labelEn: 'Discussion' },
];

const SUBJECTS = [
  { value: 'programming', labelAr: 'البرمجة', labelEn: 'Programming' },
  { value: 'math', labelAr: 'الرياضيات', labelEn: 'Mathematics' },
  { value: 'physics', labelAr: 'الفيزياء', labelEn: 'Physics' },
  { value: 'english', labelAr: 'اللغة الإنجليزية', labelEn: 'English' },
  { value: 'business', labelAr: 'إدارة الأعمال', labelEn: 'Business' },
  { value: 'engineering', labelAr: 'الهندسة', labelEn: 'Engineering' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other' }
];

type SortType = 'newest' | 'trending';

export default function Feed() {
  const { posts, createPost, toggleLike, toggleSave, addReply, deletePost, updatePost, lang, user, getProfile } = useDaamStore();
  const [content, setContent] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyingToReplyId, setReplyingToReplyId] = useState<Record<string, string | null>>({});
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [newPostType, setNewPostType] = useState<PostType>('discussion');
  const [newPostSubject, setNewPostSubject] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editPostType, setEditPostType] = useState<PostType>('discussion');
  const [editSubject, setEditSubject] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isRTL = lang === 'ar';

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per file
  const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB total

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    let totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check individual file size
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
      
      // Check total size
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

      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: base64,
        name: file.name,
        size: file.size
      });
      
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
    const isPdf = attachment.name.toLowerCase().endsWith('.pdf');
    const isImage = attachment.type === 'image';
    
    if (isPdf || isImage) {
      const blob = base64ToBlob(attachment.url, isPdf ? 'application/pdf' : undefined);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        toast({
          title: lang === 'ar' ? 'خطأ' : 'Error',
          description: lang === 'ar' ? 'تعذر فتح الملف' : 'Could not open file',
          variant: 'destructive'
        });
      }
    } else {
      downloadAttachment(attachment);
    }
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

  const handleDeletePost = (postId: string) => {
    deletePost(postId);
    toast({
      title: lang === 'ar' ? 'تم الحذف' : 'Deleted',
      description: lang === 'ar' ? 'تم حذف المنشور' : 'Post deleted'
    });
  };

  const canEditPost = (post: typeof posts[0]) => {
    return user?.email === post.authorEmail;
  };

  const canDeletePost = (post: typeof posts[0]) => {
    return user?.email === post.authorEmail || user?.isAdmin;
  };

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

  const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);

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
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage src={getProfile(reply.authorEmail)?.avatarUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                {getInitials(reply.authorEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-muted/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-medium">{getDisplayName(reply.authorEmail)}</span>
                  {isAdmin(reply.authorEmail) && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">
                      <Shield className="w-2 h-2 mr-0.5" />
                      {lang === 'ar' ? 'مشرف' : 'Admin'}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: false, locale: lang === 'ar' ? ar : enUS })}
                  </span>
                </div>
                <p className="text-sm">{reply.content}</p>
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

  const filteredPosts = posts.filter(post => {
    if (selectedType === 'all') return true;
    return post.postType === selectedType;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'trending') {
      const scoreA = (a.likedBy?.length || 0) + (a.replies?.length || 0) * 2;
      const scoreB = (b.likedBy?.length || 0) + (b.replies?.length || 0) * 2;
      return scoreB - scoreA;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tr = {
    pageTitle: lang === 'ar' ? 'ساحة المناقشة' : 'Discussion Arena',
    pageSubtitle: lang === 'ar' ? 'تعلّم، ناقش، وشارك مع زملائك' : 'Learn, discuss, and share with your peers',
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
    noPostsYet: lang === 'ar' ? 'لا توجد مشاركات بعد' : 'No posts yet',
    beFirst: lang === 'ar' ? 'كن أول من يشارك!' : 'Be the first to share!',
    newest: lang === 'ar' ? 'الأحدث' : 'Newest',
    trending: lang === 'ar' ? 'الأكثر تفاعلاً' : 'Trending',
    all: lang === 'ar' ? 'الكل' : 'All',
    postType: lang === 'ar' ? 'نوع المنشور' : 'Post Type',
    subject: lang === 'ar' ? 'المادة' : 'Subject',
    selectSubject: lang === 'ar' ? 'اختر المادة' : 'Select Subject',
    admin: lang === 'ar' ? 'مشرف' : 'Admin',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    saveChanges: lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
    confirmDelete: lang === 'ar' ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?'
  };

  const getPostTypeLabel = (type: PostType) => {
    const typeInfo = POST_TYPES.find(t => t.value === type);
    return typeInfo ? (lang === 'ar' ? typeInfo.labelAr : typeInfo.labelEn) : type;
  };

  const getSubjectLabel = (subject: string) => {
    const subjectInfo = SUBJECTS.find(s => s.value === subject);
    return subjectInfo ? (lang === 'ar' ? subjectInfo.labelAr : subjectInfo.labelEn) : subject;
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">{tr.pageTitle}</h1>
        <p className="text-muted-foreground text-sm mt-2">{tr.pageSubtitle}</p>
      </div>

      <Button 
        onClick={() => setShowCreateForm(true)}
        className="w-full h-12 text-base font-semibold mb-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        data-testid="button-new-post"
      >
        <Plus className="w-5 h-5 me-2" />
        {tr.newPost}
      </Button>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Card className="border-white/10 bg-card/80 backdrop-blur">
              <CardContent className="p-4">
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
                      data-testid="textarea-create-post"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-muted-foreground mb-1 block">{tr.postType}</label>
                    <div className="flex flex-wrap gap-1">
                      {POST_TYPES.map((type) => (
                        <Button
                          key={type.value}
                          size="sm"
                          variant={newPostType === type.value ? "default" : "outline"}
                          onClick={() => setNewPostType(type.value)}
                          className="text-xs h-7"
                          data-testid={`button-type-${type.value}`}
                        >
                          {lang === 'ar' ? type.labelAr : type.labelEn}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">{tr.subject}</label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant={!newPostSubject ? "default" : "outline"}
                      onClick={() => setNewPostSubject('')}
                      className="text-xs h-7"
                    >
                      -
                    </Button>
                    {SUBJECTS.map((subject) => (
                      <Button
                        key={subject.value}
                        size="sm"
                        variant={newPostSubject === subject.value ? "default" : "outline"}
                        onClick={() => setNewPostSubject(subject.value)}
                        className="text-xs h-7"
                        data-testid={`button-subject-${subject.value}`}
                      >
                        {lang === 'ar' ? subject.labelAr : subject.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                    data-testid="button-attach-files"
                  >
                    <Paperclip className="w-4 h-4" />
                    {lang === 'ar' ? 'إرفاق ملفات' : 'Attach Files'}
                  </Button>
                  
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((att, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm flex-1 truncate">{att.name}</span>
                          <span className="text-xs text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeAttachment(index)}
                            data-testid={`button-remove-attachment-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                  <Button 
                    variant="ghost" 
                    onClick={() => { setShowCreateForm(false); setContent(""); }}
                    data-testid="button-cancel-post"
                  >
                    {tr.cancel}
                  </Button>
                  <Button 
                    onClick={handlePost} 
                    disabled={!content.trim()}
                    className="gap-2"
                    data-testid="button-publish-post"
                  >
                    <Send className="w-4 h-4" />
                    {tr.publish}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 mb-4">
        <Button
          size="sm"
          variant={sortBy === 'newest' ? "default" : "outline"}
          onClick={() => setSortBy('newest')}
          className="gap-1"
          data-testid="button-sort-newest"
        >
          <Clock className="w-3.5 h-3.5" />
          {tr.newest}
        </Button>
        <Button
          size="sm"
          variant={sortBy === 'trending' ? "default" : "outline"}
          onClick={() => setSortBy('trending')}
          className="gap-1"
          data-testid="button-sort-trending"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {tr.trending}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          size="sm"
          variant={selectedType === 'all' ? "secondary" : "ghost"}
          onClick={() => setSelectedType('all')}
          className="text-xs"
          data-testid="button-filter-all"
        >
          {tr.all}
        </Button>
        {POST_TYPES.map((type) => (
          <Button
            key={type.value}
            size="sm"
            variant={selectedType === type.value ? "secondary" : "ghost"}
            onClick={() => setSelectedType(type.value)}
            className="text-xs"
            data-testid={`button-filter-${type.value}`}
          >
            {lang === 'ar' ? type.labelAr : type.labelEn}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
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
              <Card className="border-white/5 bg-card/50 hover:bg-card/70 transition-colors" data-testid={`post-${post.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="w-11 h-11 flex-shrink-0 border border-primary/20">
                      <AvatarImage src={getProfile(post.authorEmail)?.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-gray-500 text-white text-sm">
                        {getInitials(post.authorEmail)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {getDisplayName(post.authorEmail)}
                          </span>
                          {isAdmin(post.authorEmail) && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                              <Shield className="w-2.5 h-2.5 me-0.5" />
                              {tr.admin}
                            </Badge>
                          )}
                        </div>
                        
                        {(canEditPost(post) || canDeletePost(post)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                data-testid={`button-post-menu-${post.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? "start" : "end"}>
                              {canEditPost(post) && (
                                <DropdownMenuItem 
                                  onClick={() => startEditPost(post)}
                                  data-testid={`button-edit-${post.id}`}
                                >
                                  <Pencil className="w-4 h-4 me-2" />
                                  {tr.edit}
                                </DropdownMenuItem>
                              )}
                              {canDeletePost(post) && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-destructive focus:text-destructive"
                                  data-testid={`button-delete-${post.id}`}
                                >
                                  <Trash2 className="w-4 h-4 me-2" />
                                  {tr.delete}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
                        <div className="mt-3 space-y-3">
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
                            {SUBJECTS.map((subject) => (
                              <Button
                                key={subject.value}
                                size="sm"
                                variant={editSubject === subject.value ? "default" : "outline"}
                                onClick={() => setEditSubject(subject.value)}
                                className="text-xs h-7"
                              >
                                {lang === 'ar' ? subject.labelAr : subject.labelEn}
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
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-violet-500/30 text-violet-400">
                                <Hash className="w-2.5 h-2.5 me-0.5" />
                                {getSubjectLabel(post.subject)}
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

                      {post.imageUrl && (
                        <img 
                          src={post.imageUrl} 
                          alt="" 
                          className="mt-3 rounded-lg max-h-80 object-cover"
                        />
                      )}

                      {post.attachments && post.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {post.attachments.map((attachment, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors group"
                            >
                              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.name}</p>
                                <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => openAttachment(attachment)}
                                  data-testid={`button-open-${idx}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => downloadAttachment(attachment)}
                                  data-testid={`button-download-${idx}`}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
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

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                        <button 
                          onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}
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
                          onClick={() => handleLike(post.id)}
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
                          onClick={() => handleSave(post.id)}
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
                                  data-testid={`input-reply-${post.id}`}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleReplySubmit(post.id)}
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
                        <div className="mt-3">
                          <button
                            onClick={() => toggleReplies(post.id)}
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
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
