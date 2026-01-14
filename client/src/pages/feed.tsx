import { useState, useRef } from "react";
import { useDaamStore, ADMIN_EMAILS } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, MessageSquare, Heart, Bookmark, Trash2, Shield, 
  ChevronDown, ChevronUp, X, HelpCircle, BookOpen, FileText, 
  Users, Sparkles, Plus, Filter, Clock, TrendingUp, Image, Paperclip,
  Reply, Download, File
} from "lucide-react";
import { type LocalReply, type Attachment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { type PostType } from "@shared/schema";

const POST_TYPE_CONFIG = {
  question: { icon: HelpCircle, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', labelAr: 'سؤال', labelEn: 'Question' },
  explanation: { icon: BookOpen, color: 'bg-green-500/20 text-green-400 border-green-500/30', labelAr: 'شرح', labelEn: 'Explanation' },
  summary: { icon: FileText, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', labelAr: 'ملخص', labelEn: 'Summary' },
  discussion: { icon: Users, color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', labelAr: 'نقاش', labelEn: 'Discussion' }
};

const SUBJECTS = [
  { value: 'programming', labelAr: 'البرمجة', labelEn: 'Programming' },
  { value: 'math', labelAr: 'الرياضيات', labelEn: 'Mathematics' },
  { value: 'physics', labelAr: 'الفيزياء', labelEn: 'Physics' },
  { value: 'english', labelAr: 'اللغة الإنجليزية', labelEn: 'English' },
  { value: 'business', labelAr: 'إدارة الأعمال', labelEn: 'Business' },
  { value: 'engineering', labelAr: 'الهندسة', labelEn: 'Engineering' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other' }
];

export default function Feed() {
  const { posts, createPost, deletePost, toggleLike, toggleSave, addReply, t, lang, user, getProfile } = useDaamStore();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>('discussion');
  const [subject, setSubject] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [filterType, setFilterType] = useState<PostType | 'all'>('all');
  const [aiExplaining, setAiExplaining] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [replyingToReplyId, setReplyingToReplyId] = useState<Record<string, string | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isRTL = lang === 'ar';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: lang === 'ar' ? 'الملف كبير جداً' : 'File too large',
          description: `${file.name}: ${lang === 'ar' ? 'الحد الأقصى 2 ميجابايت' : 'Maximum size is 2MB'}`,
          variant: 'destructive'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const isImage = file.type.startsWith('image/');
        const newAttachment: Attachment = {
          type: isImage ? 'image' : 'file',
          url: event.target?.result as string,
          name: file.name,
          size: file.size
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handlePost = () => {
    if (!content.trim()) return;
    const imageAttachment = attachments.find(a => a.type === 'image');
    createPost(
      content, 
      postType, 
      subject || undefined, 
      imageAttachment?.url,
      attachments.length > 0 ? attachments : undefined
    );
    setContent("");
    setPostType('discussion');
    setSubject('');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowCreateForm(false);
    toast({
      title: lang === 'ar' ? 'تم النشر' : 'Posted',
      description: lang === 'ar' ? 'تم نشر مشاركتك بنجاح' : 'Your post was published successfully'
    });
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

  const getProfileInfo = (email: string) => {
    const profile = getProfile(email);
    if (profile) {
      return `${profile.major} • ${profile.university}`;
    }
    return email.split('@')[1] || '';
  };

  const handleLike = (postId: string) => {
    toggleLike(postId);
  };

  const handleSave = (postId: string) => {
    toggleSave(postId);
    const post = posts.find(p => p.id === postId);
    const isSaved = post?.savedBy?.includes(user?.email || '');
    toast({
      title: isSaved ? (lang === 'ar' ? 'تم إلغاء الحفظ' : 'Unsaved') : (lang === 'ar' ? 'تم الحفظ' : 'Saved'),
      description: isSaved 
        ? (lang === 'ar' ? 'تمت إزالة المنشور من المحفوظات' : 'Post removed from saved') 
        : (lang === 'ar' ? 'تم حفظ المنشور للرجوع إليه لاحقاً' : 'Post saved for later')
    });
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

  const renderReplyThread = (
    postId: string, 
    replies: LocalReply[], 
    parentId: string | undefined, 
    depth: number = 0
  ): JSX.Element[] => {
    const childReplies = getNestedReplies(replies, parentId);
    const maxIndentDepth = 4;
    const indentLevel = Math.min(depth, maxIndentDepth);
    
    return childReplies.map((reply) => {
      const inputKey = `${postId}-${reply.id}`;
      const hasChildren = getNestedReplies(replies, reply.id).length > 0;
      
      return (
        <div key={reply.id} className="space-y-2" data-testid={`reply-${reply.id}`}>
          <div 
            className="flex gap-2"
            style={{ marginLeft: isRTL ? 0 : indentLevel * 24, marginRight: isRTL ? indentLevel * 24 : 0 }}
          >
            <Avatar className={`${depth === 0 ? 'w-7 h-7' : 'w-6 h-6'} border border-white/10 flex-shrink-0`}>
              <AvatarFallback className={`bg-secondary text-secondary-foreground ${depth === 0 ? 'text-xs' : 'text-[10px]'}`}>
                {getInitials(reply.authorEmail)}
              </AvatarFallback>
            </Avatar>
            <div className={`flex-1 ${depth === 0 ? 'bg-black/20' : 'bg-black/10'} rounded-lg p-2 ${depth === 0 ? 'p-3' : 'p-2'}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`${depth === 0 ? 'text-sm' : 'text-xs'} font-medium`}>
                  {getDisplayName(reply.authorEmail)}
                </span>
                <span className={`${depth === 0 ? 'text-xs' : 'text-[10px]'} text-muted-foreground`}>
                  {formatDistanceToNow(new Date(reply.createdAt), { 
                    addSuffix: true,
                    locale: lang === 'ar' ? ar : enUS 
                  })}
                </span>
              </div>
              <p className={`${depth === 0 ? 'text-sm' : 'text-xs'} text-foreground/80`}>{reply.content}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingToReplyId(prev => ({ 
                  ...prev, 
                  [postId]: prev[postId] === reply.id ? null : reply.id 
                }))}
                className="h-5 text-[10px] gap-1 px-1.5 mt-1 text-muted-foreground hover:text-primary"
                data-testid={`button-reply-to-${reply.id}`}
              >
                <Reply className="w-2.5 h-2.5" />
                {tr.replyTo}
              </Button>
            </div>
          </div>
          
          {/* Reply input for this specific reply */}
          {replyingToReplyId[postId] === reply.id && (
            <div 
              className="flex gap-2 items-start"
              style={{ marginLeft: isRTL ? 0 : (indentLevel + 1) * 24, marginRight: isRTL ? (indentLevel + 1) * 24 : 0 }}
            >
              <Avatar className="w-5 h-5 border border-white/10 flex-shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                  {user ? getInitials(user.email) : 'ME'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  value={replyInputs[inputKey] || ''}
                  onChange={(e) => setReplyInputs(prev => ({ 
                    ...prev, 
                    [inputKey]: e.target.value 
                  }))}
                  placeholder={`${tr.replyTo} ${getDisplayName(reply.authorEmail)}...`}
                  className="flex-1 bg-black/20 border-white/10 h-7 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(postId, reply.id)}
                  data-testid={`input-nested-reply-${reply.id}`}
                />
                <Button
                  size="sm"
                  onClick={() => handleReplySubmit(postId, reply.id)}
                  disabled={!replyInputs[inputKey]?.trim()}
                  className="h-7 px-2 bg-primary hover:bg-primary/90"
                  data-testid={`button-submit-nested-reply-${reply.id}`}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Recursively render child replies */}
          {hasChildren && (
            <div className="space-y-2">
              {renderReplyThread(postId, replies, reply.id, depth + 1)}
            </div>
          )}
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

  const handleAiExplain = (postId: string, content: string) => {
    setAiExplaining(postId);
    setTimeout(() => {
      const response = lang === 'ar' 
        ? `تبسيط الفكرة:\n${content.substring(0, 50)}...\n\nشرح مختصر:\nهذا المحتوى يتناول موضوعاً مهماً في المجال الأكاديمي. النقاط الرئيسية هي:\n• فهم الأساسيات\n• تطبيق المفاهيم\n• الممارسة المستمرة\n\nسيتم تفعيل الذكاء الاصطناعي الكامل قريباً لتقديم شرح أعمق.`
        : `Simplifying the idea:\n${content.substring(0, 50)}...\n\nBrief explanation:\nThis content addresses an important academic topic. Key points:\n• Understanding fundamentals\n• Applying concepts\n• Continuous practice\n\nFull AI will be enabled soon for deeper explanations.`;
      setAiResponse(prev => ({ ...prev, [postId]: response }));
      setAiExplaining(null);
    }, 1500);
  };

  const isLiked = (postId: string) => posts.find(p => p.id === postId)?.likedBy?.includes(user?.email || '') || false;
  const isSaved = (postId: string) => posts.find(p => p.id === postId)?.savedBy?.includes(user?.email || '') || false;
  const getLikeCount = (postId: string) => posts.find(p => p.id === postId)?.likedBy?.length || 0;
  const getReplyCount = (postId: string) => posts.find(p => p.id === postId)?.replies?.length || 0;

  const filteredPosts = posts
    .filter(post => filterType === 'all' || post.postType === filterType)
    .sort((a, b) => {
      if (sortBy === 'popular') {
        const aScore = (a.likedBy?.length || 0) + (a.replies?.length || 0) * 2;
        const bScore = (b.likedBy?.length || 0) + (b.replies?.length || 0) * 2;
        return bScore - aScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const tr = {
    pageTitle: lang === 'ar' ? 'ساحة المناقشة' : 'Discussion Arena',
    newPost: lang === 'ar' ? 'منشور جديد' : 'New Post',
    writePost: lang === 'ar' ? 'شارك فكرة، سؤال، أو ملخص...' : 'Share an idea, question, or summary...',
    postType: lang === 'ar' ? 'نوع المنشور' : 'Post Type',
    subject: lang === 'ar' ? 'المادة' : 'Subject',
    selectSubject: lang === 'ar' ? 'اختر المادة' : 'Select subject',
    publish: lang === 'ar' ? 'نشر' : 'Publish',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    like: lang === 'ar' ? 'إعجاب' : 'Like',
    comment: lang === 'ar' ? 'تعليق' : 'Comment',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    explainAi: lang === 'ar' ? 'اشرح لي' : 'Explain',
    writeReply: lang === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...',
    showComments: lang === 'ar' ? 'عرض التعليقات' : 'Show comments',
    hideComments: lang === 'ar' ? 'إخفاء التعليقات' : 'Hide comments',
    recent: lang === 'ar' ? 'الأحدث' : 'Recent',
    popular: lang === 'ar' ? 'الأكثر تفاعلاً' : 'Popular',
    all: lang === 'ar' ? 'الكل' : 'All',
    aiThinking: lang === 'ar' ? 'جاري التفكير...' : 'Thinking...',
    noPostsYet: lang === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet',
    beFirst: lang === 'ar' ? 'كن أول من يشارك!' : 'Be the first to share!',
    addAttachment: lang === 'ar' ? 'إضافة صورة أو ملف' : 'Add Image/File',
    replyTo: lang === 'ar' ? 'رد على' : 'Reply to'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">
            {tr.pageTitle}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lang === 'ar' ? 'تعلم، ناقش، وشارك مع زملائك' : 'Learn, discuss, and share with peers'}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
          data-testid="button-new-post"
        >
          <Plus className="w-4 h-4" />
          {tr.newPost}
        </Button>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="glass-panel border-violet-500/20 p-5 space-y-4">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 border border-violet-500/30">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {user ? getInitials(user.email) : 'ME'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder={tr.writePost}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] bg-black/20 border-white/10 resize-none focus:bg-black/30 transition-all text-base"
                    data-testid="textarea-create-post"
                  />
                  
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att, index) => (
                        <div key={index} className="relative group">
                          {att.type === 'image' ? (
                            <div className="relative">
                              <img 
                                src={att.url} 
                                alt={att.name} 
                                className="w-24 h-24 object-cover rounded-lg border border-white/10"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAttachment(index)}
                                className="absolute -top-2 -right-2 h-6 w-6 bg-black/70 hover:bg-black/90 rounded-full"
                                data-testid={`button-remove-attachment-${index}`}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="relative flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-white/10">
                              <File className="w-5 h-5 text-muted-foreground" />
                              <div className="text-sm">
                                <p className="truncate max-w-[120px]">{att.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAttachment(index)}
                                className="absolute -top-2 -right-2 h-6 w-6 bg-black/70 hover:bg-black/90 rounded-full"
                                data-testid={`button-remove-attachment-${index}`}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[140px]">
                      <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                        <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-post-type">
                          <SelectValue placeholder={tr.postType} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(POST_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="w-4 h-4" />
                                {lang === 'ar' ? config.labelAr : config.labelEn}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1 min-w-[140px]">
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-subject">
                          <SelectValue placeholder={tr.selectSubject} />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              {lang === 'ar' ? s.labelAr : s.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 text-muted-foreground hover:text-primary"
                    data-testid="button-add-attachment"
                  >
                    <Paperclip className="w-4 h-4" />
                    {tr.addAttachment}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCreateForm(false)}
                    data-testid="button-cancel-post"
                  >
                    {tr.cancel}
                  </Button>
                  <Button 
                    onClick={handlePost} 
                    disabled={!content.trim()}
                    className="bg-primary hover:bg-primary/90 gap-2"
                    data-testid="button-publish-post"
                  >
                    <Send className="w-4 h-4" />
                    {tr.publish}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-card/50 rounded-lg p-1">
          <Button
            variant={sortBy === 'recent' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('recent')}
            className="gap-1.5 h-8"
            data-testid="button-sort-recent"
          >
            <Clock className="w-3.5 h-3.5" />
            {tr.recent}
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('popular')}
            className="gap-1.5 h-8"
            data-testid="button-sort-popular"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {tr.popular}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Button
            variant={filterType === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="h-7 text-xs"
            data-testid="button-filter-all"
          >
            {tr.all}
          </Button>
          {Object.entries(POST_TYPE_CONFIG).map(([key, config]) => (
            <Button
              key={key}
              variant={filterType === key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType(key as PostType)}
              className="h-7 text-xs gap-1"
              data-testid={`button-filter-${key}`}
            >
              <config.icon className="w-3 h-3" />
              {lang === 'ar' ? config.labelAr : config.labelEn}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground bg-card/30 rounded-2xl border border-dashed border-white/10"
            >
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">{tr.noPostsYet}</p>
              <p className="text-sm mt-1">{tr.beFirst}</p>
            </motion.div>
          ) : (
            filteredPosts.map((post) => {
              const typeConfig = POST_TYPE_CONFIG[post.postType || 'discussion'];
              const TypeIcon = typeConfig.icon;
              const subjectInfo = SUBJECTS.find(s => s.value === post.subject);
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Card className="bg-card border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden">
                    <div className="p-5">
                      <div className="flex gap-4">
                        <Avatar className="w-11 h-11 border-2 border-violet-500/30">
                          <AvatarFallback className="bg-gradient-to-br from-violet-600 to-gray-500 text-white font-medium">
                            {getInitials(post.authorEmail)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground truncate">
                                  {getDisplayName(post.authorEmail)}
                                </p>
                                {ADMIN_EMAILS.includes(post.authorEmail.toLowerCase()) && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                                    <Shield className="w-3 h-3 mr-0.5 rtl:ml-0.5 rtl:mr-0" />
                                    {t.adminBadge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {getProfileInfo(post.authorEmail)}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(post.createdAt), { 
                                  addSuffix: true,
                                  locale: lang === 'ar' ? ar : enUS 
                                })}
                              </span>
                              {user?.isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deletePost(post.id)}
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  data-testid={`button-delete-post-${post.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className={`text-xs ${typeConfig.color}`}>
                              <TypeIcon className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                              {lang === 'ar' ? typeConfig.labelAr : typeConfig.labelEn}
                            </Badge>
                            {subjectInfo && (
                              <Badge variant="outline" className="text-xs border-white/20">
                                {lang === 'ar' ? subjectInfo.labelAr : subjectInfo.labelEn}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap mt-3">
                            {post.content}
                          </p>
                          
                          {/* Display attachments */}
                          {(post.attachments?.length || post.imageUrl) && (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {post.attachments ? (
                                post.attachments.map((att, idx) => (
                                  att.type === 'image' ? (
                                    <img 
                                      key={idx}
                                      src={att.url} 
                                      alt={att.name} 
                                      className="max-w-xs max-h-60 rounded-lg border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(att.url, '_blank')}
                                      data-testid={`image-post-${post.id}-${idx}`}
                                    />
                                  ) : (
                                    <a 
                                      key={idx}
                                      href={att.url}
                                      download={att.name}
                                      className="flex items-center gap-3 bg-black/30 hover:bg-black/40 rounded-lg p-3 border border-white/10 transition-colors"
                                      data-testid={`file-post-${post.id}-${idx}`}
                                    >
                                      <File className="w-6 h-6 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium truncate max-w-[150px]">{att.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                                      </div>
                                      <Download className="w-4 h-4 text-primary ml-2" />
                                    </a>
                                  )
                                ))
                              ) : post.imageUrl ? (
                                <img 
                                  src={post.imageUrl} 
                                  alt="Post attachment" 
                                  className="max-w-full max-h-96 rounded-lg border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(post.imageUrl, '_blank')}
                                  data-testid={`image-post-${post.id}`}
                                />
                              ) : null}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-4 mt-3 border-t border-white/5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleLike(post.id)}
                              className={`h-8 text-xs gap-1.5 px-3 ${
                                isLiked(post.id) 
                                  ? 'text-violet-400 bg-violet-500/10' 
                                  : 'text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10'
                              }`}
                              data-testid={`button-like-${post.id}`}
                            >
                              <Heart className={`w-4 h-4 ${isLiked(post.id) ? 'fill-current' : ''}`} />
                              {getLikeCount(post.id) > 0 && getLikeCount(post.id)} {tr.like}
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}
                              className={`h-8 text-xs gap-1.5 px-3 ${
                                activeReplyId === post.id 
                                  ? 'text-primary bg-primary/10' 
                                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                              }`}
                              data-testid={`button-comment-${post.id}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                              {getReplyCount(post.id) > 0 && getReplyCount(post.id)} {tr.comment}
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleSave(post.id)}
                              className={`h-8 text-xs gap-1.5 px-3 ${
                                isSaved(post.id) 
                                  ? 'text-yellow-400 bg-yellow-500/10' 
                                  : 'text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10'
                              }`}
                              data-testid={`button-save-${post.id}`}
                            >
                              <Bookmark className={`w-4 h-4 ${isSaved(post.id) ? 'fill-current' : ''}`} />
                              {tr.save}
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleAiExplain(post.id, post.content)}
                              disabled={aiExplaining === post.id}
                              className="h-8 text-xs gap-1.5 px-3 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 ml-auto rtl:mr-auto rtl:ml-0"
                              data-testid={`button-explain-${post.id}`}
                            >
                              <Sparkles className={`w-4 h-4 ${aiExplaining === post.id ? 'animate-spin' : ''}`} />
                              {aiExplaining === post.id ? tr.aiThinking : tr.explainAi}
                            </Button>
                          </div>

                          <AnimatePresence>
                            {aiResponse[post.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3"
                              >
                                <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2 text-cyan-400">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                      {lang === 'ar' ? 'شرح الذكاء الاصطناعي' : 'AI Explanation'}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setAiResponse(prev => {
                                        const newState = { ...prev };
                                        delete newState[post.id];
                                        return newState;
                                      })}
                                      className="h-6 w-6 ml-auto rtl:mr-auto rtl:ml-0"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                    {aiResponse[post.id]}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {activeReplyId === post.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3"
                              >
                                <div className="flex gap-2 items-start">
                                  <Avatar className="w-7 h-7 border border-white/10">
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                      {user ? getInitials(user.email) : 'ME'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 flex gap-2">
                                    <Input
                                      value={replyInputs[post.id] || ''}
                                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                      placeholder={tr.writeReply}
                                      className="flex-1 bg-black/20 border-white/10 h-9"
                                      onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(post.id)}
                                      data-testid={`input-reply-${post.id}`}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleReplySubmit(post.id)}
                                      disabled={!replyInputs[post.id]?.trim()}
                                      className="h-9 bg-primary hover:bg-primary/90"
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
                            <div className="pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleReplies(post.id)}
                                className="text-xs text-muted-foreground hover:text-foreground gap-1 px-2 h-7"
                                data-testid={`button-toggle-replies-${post.id}`}
                              >
                                {expandedReplies.includes(post.id) ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    {tr.hideComments} ({getReplyCount(post.id)})
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    {tr.showComments} ({getReplyCount(post.id)})
                                  </>
                                )}
                              </Button>

                              <AnimatePresence>
                                {expandedReplies.includes(post.id) && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 pt-3 border-r-2 rtl:border-r-0 rtl:border-l-2 border-violet-500/20 pr-4 rtl:pr-0 rtl:pl-4 mr-2 rtl:mr-0 rtl:ml-2"
                                  >
                                    {/* Recursive rendering of all reply threads */}
                                    {renderReplyThread(post.id, post.replies || [], undefined, 0)}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
