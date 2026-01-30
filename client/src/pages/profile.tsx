import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useDaamStore, type ReportReason, ADMIN_EMAILS } from "@/hooks/use-daam-store";

const GOVERNORATES = {
  ar: [
    { value: 'muscat', label: 'محافظة مسقط' },
    { value: 'dhofar', label: 'محافظة ظفار' },
    { value: 'musandam', label: 'محافظة مسندم' },
    { value: 'buraimi', label: 'محافظة البريمي' },
    { value: 'dakhiliyah', label: 'محافظة الداخلية' },
    { value: 'north_batinah', label: 'محافظة شمال الباطنة' },
    { value: 'south_batinah', label: 'محافظة جنوب الباطنة' },
    { value: 'north_sharqiyah', label: 'محافظة شمال الشرقية' },
    { value: 'south_sharqiyah', label: 'محافظة جنوب الشرقية' },
    { value: 'dhahirah', label: 'محافظة الظاهرة' },
    { value: 'wusta', label: 'محافظة الوسطى' },
  ],
  en: [
    { value: 'muscat', label: 'Muscat Governorate' },
    { value: 'dhofar', label: 'Dhofar Governorate' },
    { value: 'musandam', label: 'Musandam Governorate' },
    { value: 'buraimi', label: 'Al Buraimi Governorate' },
    { value: 'dakhiliyah', label: 'Ad Dakhiliyah Governorate' },
    { value: 'north_batinah', label: 'North Al Batinah Governorate' },
    { value: 'south_batinah', label: 'South Al Batinah Governorate' },
    { value: 'north_sharqiyah', label: 'North Ash Sharqiyah Governorate' },
    { value: 'south_sharqiyah', label: 'South Ash Sharqiyah Governorate' },
    { value: 'dhahirah', label: 'Ad Dhahirah Governorate' },
    { value: 'wusta', label: 'Al Wusta Governorate' },
  ]
};

const WILAYAT: Record<string, { ar: string; en: string }[]> = {
  muscat: [
    { ar: 'مسقط', en: 'Muscat' },
    { ar: 'مطرح', en: 'Muttrah' },
    { ar: 'بوشر', en: 'Bawshar' },
    { ar: 'السيب', en: 'As Seeb' },
    { ar: 'العامرات', en: 'Al Amrat' },
    { ar: 'قريات', en: 'Qurayyat' },
  ],
  dhofar: [
    { ar: 'صلالة', en: 'Salalah' },
    { ar: 'طاقة', en: 'Taqah' },
    { ar: 'مرباط', en: 'Mirbat' },
    { ar: 'ثمريت', en: 'Thumrait' },
    { ar: 'رخيوت', en: 'Rakhyut' },
  ],
  dakhiliyah: [
    { ar: 'نزوى', en: 'Nizwa' },
    { ar: 'بهلاء', en: 'Bahla' },
    { ar: 'منح', en: 'Manah' },
    { ar: 'أدم', en: 'Adam' },
    { ar: 'الحمراء', en: 'Al Hamra' },
    { ar: 'إزكي', en: 'Izki' },
    { ar: 'سمائل', en: 'Samail' },
    { ar: 'بدبد', en: 'Bidbid' },
  ],
  north_batinah: [
    { ar: 'صحار', en: 'Sohar' },
    { ar: 'شناص', en: 'Shinas' },
    { ar: 'لوى', en: 'Liwa' },
    { ar: 'صحم', en: 'Saham' },
    { ar: 'الخابورة', en: 'Al Khaburah' },
    { ar: 'السويق', en: 'As Suwaiq' },
  ],
  south_batinah: [
    { ar: 'الرستاق', en: 'Rustaq' },
    { ar: 'العوابي', en: 'Al Awabi' },
    { ar: 'نخل', en: 'Nakhal' },
    { ar: 'وادي المعاول', en: 'Wadi Al Maawil' },
    { ar: 'بركاء', en: 'Barka' },
    { ar: 'المصنعة', en: 'Al Musannah' },
  ],
  north_sharqiyah: [
    { ar: 'إبراء', en: 'Ibra' },
    { ar: 'المضيبي', en: 'Al Mudhaibi' },
    { ar: 'بدية', en: 'Bidiyah' },
    { ar: 'القابل', en: 'Al Qabil' },
    { ar: 'وادي بني خالد', en: 'Wadi Bani Khalid' },
    { ar: 'دماء والطائيين', en: 'Dama Wa At Taiyyin' },
  ],
  south_sharqiyah: [
    { ar: 'صور', en: 'Sur' },
    { ar: 'جعلان بني بو علي', en: 'Jaalan Bani Bu Ali' },
    { ar: 'جعلان بني بو حسن', en: 'Jaalan Bani Bu Hassan' },
    { ar: 'الكامل والوافي', en: 'Al Kamil Wal Wafi' },
    { ar: 'مصيرة', en: 'Masirah' },
  ],
  dhahirah: [
    { ar: 'عبري', en: 'Ibri' },
    { ar: 'ينقل', en: 'Yanqul' },
    { ar: 'ضنك', en: 'Dhank' },
  ],
  buraimi: [
    { ar: 'البريمي', en: 'Al Buraimi' },
    { ar: 'محضة', en: 'Mahdah' },
    { ar: 'السنينة', en: 'As Sunaynah' },
  ],
  musandam: [
    { ar: 'خصب', en: 'Khasab' },
    { ar: 'بخا', en: 'Bukha' },
    { ar: 'دبا', en: 'Dibba' },
    { ar: 'مدحاء', en: 'Madha' },
  ],
  wusta: [
    { ar: 'هيماء', en: 'Haima' },
    { ar: 'محوت', en: 'Mahout' },
    { ar: 'الدقم', en: 'Ad Duqm' },
    { ar: 'الجازر', en: 'Al Jazir' },
  ],
};
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Edit, 
  FileText, 
  Heart, 
  MessageSquare, 
  Reply, 
  Bookmark,
  Download,
  Hash,
  Camera,
  ImageIcon,
  GraduationCap,
  Building,
  Calendar,
  X,
  Plus,
  Check,
  Shield,
  Lock,
  Mail,
  Phone,
  MapPin,
  Flag
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { LocalPost, LocalReply, UserProfile, Attachment } from "@shared/schema";

const INTEREST_OPTIONS = [
  { id: 'math', labelAr: 'رياضيات', labelEn: 'Mathematics' },
  { id: 'programming', labelAr: 'برمجة', labelEn: 'Programming' },
  { id: 'english', labelAr: 'لغة إنجليزية', labelEn: 'English' },
  { id: 'physics', labelAr: 'فيزياء', labelEn: 'Physics' },
  { id: 'chemistry', labelAr: 'كيمياء', labelEn: 'Chemistry' },
  { id: 'biology', labelAr: 'أحياء', labelEn: 'Biology' },
  { id: 'summaries', labelAr: 'ملخصات', labelEn: 'Summaries' },
  { id: 'engineering', labelAr: 'هندسة', labelEn: 'Engineering' },
  { id: 'business', labelAr: 'إدارة أعمال', labelEn: 'Business' },
  { id: 'it', labelAr: 'تقنية المعلومات', labelEn: 'IT' },
  { id: 'design', labelAr: 'تصميم', labelEn: 'Design' },
  { id: 'media', labelAr: 'إعلام', labelEn: 'Media' }
];

export default function Profile() {
  const { user, posts, lang, getProfile, getAccount, updateAccount, updateProfile, toggleFollow, isFollowing, submitReport, moderators, canSendDM } = useDaamStore();
  const [, navigate] = useLocation();
  
  // Helper functions for staff detection
  const isAdmin = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());
  const isModerator = (email: string) => {
    const emailLower = email.toLowerCase();
    if (emailLower === 'w.qq89@hotmail.com') return true;
    return moderators.some(m => m.email.toLowerCase() === emailLower && m.isActive);
  };
  const isStaff = (email: string) => isAdmin(email) || isModerator(email);
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/profile/:email");
  const { toast } = useToast();
  
  const isRTL = lang === 'ar';
  const profileEmail = params?.email ? decodeURIComponent(params.email) : user?.email;
  const isOwnProfile = user?.email === profileEmail;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | ''>('');
  const [reportNote, setReportNote] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    major: '',
    university: '',
    level: '',
    bio: '',
    interests: [] as string[],
    showFavorites: true,
    showInterests: true
  });
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [tempCover, setTempCover] = useState<string | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [isEditingPrivate, setIsEditingPrivate] = useState(false);
  const [privateEditForm, setPrivateEditForm] = useState({
    phone: '',
    governorate: '',
    wilayat: ''
  });
  const [privateEditErrors, setPrivateEditErrors] = useState<Record<string, string>>({});
  const [isSavingPrivate, setIsSavingPrivate] = useState(false);
  const [draftAllowDM, setDraftAllowDM] = useState<'everyone' | 'none'>('everyone');
  const [isSavingDMSettings, setIsSavingDMSettings] = useState(false);

  useEffect(() => {
    if (profileEmail) {
      const p = getProfile(profileEmail);
      setProfile(p || null);
    }
  }, [profileEmail, getProfile]);

  // Reset edit form when profile changes or when entering edit mode
  useEffect(() => {
    if (profile && isEditing) {
      setEditForm({
        name: profile.name || '',
        major: profile.major || '',
        university: profile.university || '',
        level: profile.level || '',
        bio: profile.bio || '',
        interests: profile.interests || [],
        showFavorites: profile.showFavorites !== false,
        showInterests: profile.showInterests !== false
      });
      setTempCover(null);
      setTempAvatar(null);
    }
  }, [isEditing]);

  useEffect(() => {
    if (user?.email) {
      const acc = getAccount(user.email);
      if (acc) {
        setDraftAllowDM(acc.allowDM ?? 'everyone');
      }
    }
  }, [user, getAccount]);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom;
        setIsSticky(headerBottom <= 64);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: lang === 'ar' ? 'الملف كبير جداً' : 'File too large',
        description: lang === 'ar' ? 'الحد الأقصى 2 ميجابايت' : 'Maximum 2MB allowed',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'cover') {
        setTempCover(base64);
      } else {
        setTempAvatar(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!profileEmail) return;
    updateProfile(profileEmail, {
      name: editForm.name,
      major: editForm.major,
      university: editForm.university,
      level: editForm.level,
      bio: editForm.bio,
      interests: editForm.interests,
      showFavorites: editForm.showFavorites,
      showInterests: editForm.showInterests,
      avatarUrl: tempAvatar || profile?.avatarUrl,
      coverUrl: tempCover || profile?.coverUrl,
      avatarColor: profile?.avatarColor
    });
    setIsEditing(false);
    toast({
      title: lang === 'ar' ? 'تم الحفظ' : 'Saved',
      description: lang === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'
    });
    const updatedProfile = getProfile(profileEmail!);
    setProfile(updatedProfile || null);
  };

  const toggleInterest = (id: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const getInitials = (email: string) => {
    const name = profile?.name || email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    const p = getProfile(email);
    return p?.name || email.split('@')[0];
  };

  const userPosts = posts.filter(p => p.authorEmail === profileEmail);
  
  const userReplies: { reply: LocalReply; post: LocalPost }[] = [];
  posts.forEach(post => {
    (post.replies || []).forEach(reply => {
      if (reply.authorEmail === profileEmail) {
        userReplies.push({ reply, post });
      }
    });
  });

  const likedPosts = posts.filter(p => p.likedBy?.includes(profileEmail || ''));
  const savedPosts = posts.filter(p => p.savedBy?.includes(profileEmail || ''));
  const favoritePosts = Array.from(new Map([...likedPosts, ...savedPosts].map(p => [p.id, p])).values());

  const userFiles: { attachment: Attachment; post: LocalPost }[] = [];
  userPosts.forEach(post => {
    (post.attachments || []).forEach(att => {
      userFiles.push({ attachment: att, post });
    });
  });

  const canViewFavorites = isOwnProfile || (profile?.showFavorites !== false);
  const canViewInterests = isOwnProfile || (profile?.showInterests !== false);

  const tr = {
    profile: lang === 'ar' ? 'الملف الشخصي' : 'Profile',
    posts: lang === 'ar' ? 'المنشورات' : 'Posts',
    replies: lang === 'ar' ? 'الردود' : 'Replies',
    favorites: lang === 'ar' ? 'التفضيلات' : 'Favorites',
    files: lang === 'ar' ? 'الملفات' : 'Files',
    interests: lang === 'ar' ? 'الاهتمامات' : 'Interests',
    editProfile: lang === 'ar' ? 'تعديل الملف' : 'Edit Profile',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    name: lang === 'ar' ? 'الاسم' : 'Name',
    major: lang === 'ar' ? 'التخصص' : 'Major',
    university: lang === 'ar' ? 'الجامعة' : 'University',
    level: lang === 'ar' ? 'المستوى' : 'Level',
    bio: lang === 'ar' ? 'نبذة' : 'Bio',
    changeCover: lang === 'ar' ? 'تغيير الغلاف' : 'Change Cover',
    changePhoto: lang === 'ar' ? 'تغيير الصورة' : 'Change Photo',
    noProfile: lang === 'ar' ? 'لم يتم إعداد الملف الشخصي بعد' : 'Profile not set up yet',
    setupProfile: lang === 'ar' ? 'إعداد الملف' : 'Set Up Profile',
    noPosts: lang === 'ar' ? 'لا توجد منشورات' : 'No posts yet',
    noReplies: lang === 'ar' ? 'لا توجد ردود' : 'No replies yet',
    noFavorites: lang === 'ar' ? 'لا توجد تفضيلات' : 'No favorites yet',
    noFiles: lang === 'ar' ? 'لا توجد ملفات' : 'No files shared',
    noInterests: lang === 'ar' ? 'لم يتم تحديد اهتمامات' : 'No interests set',
    replyTo: lang === 'ar' ? 'رد على' : 'Reply to',
    private: lang === 'ar' ? 'خاص' : 'Private',
    showFavorites: lang === 'ar' ? 'إظهار التفضيلات للزوار' : 'Show favorites to visitors',
    showInterests: lang === 'ar' ? 'إظهار الاهتمامات للزوار' : 'Show interests to visitors',
    download: lang === 'ar' ? 'تحميل' : 'Download',
    reportUser: lang === 'ar' ? 'إبلاغ عن المستخدم' : 'Report User',
    reportTitle: lang === 'ar' ? 'الإبلاغ عن مستخدم' : 'Report User',
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
    sendMessage: lang === 'ar' ? 'مراسلة' : 'Message',
    dmClosed: lang === 'ar' ? 'الرسائل مغلقة' : 'DMs Closed',
    editPrivate: lang === 'ar' ? 'تعديل' : 'Edit',
    savePrivate: lang === 'ar' ? 'حفظ' : 'Save',
    cancelPrivate: lang === 'ar' ? 'إلغاء' : 'Cancel',
    phoneLabel: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    governorateLabel: lang === 'ar' ? 'المحافظة' : 'Governorate',
    wilayatLabel: lang === 'ar' ? 'الولاية' : 'Wilayat',
    selectGovernorate: lang === 'ar' ? 'اختر المحافظة' : 'Select Governorate',
    selectWilayat: lang === 'ar' ? 'اختر الولاية' : 'Select Wilayat',
    requiredField: lang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required',
    savedSuccessfully: lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully',
    saving: lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'
  };

  const governorates = GOVERNORATES[lang];
  const wilayatOptions = privateEditForm.governorate ? WILAYAT[privateEditForm.governorate] || [] : [];

  const handleStartEditPrivate = () => {
    const account = user?.email ? getAccount(user.email) : undefined;
    setPrivateEditForm({
      phone: account?.phone || '',
      governorate: account?.region?.governorate || '',
      wilayat: account?.region?.wilayat || ''
    });
    setPrivateEditErrors({});
    setIsEditingPrivate(true);
  };

  const handleCancelEditPrivate = () => {
    setIsEditingPrivate(false);
    setPrivateEditErrors({});
  };

  const handleSavePrivate = () => {
    const errors: Record<string, string> = {};
    
    if (!privateEditForm.phone.trim()) {
      errors.phone = tr.requiredField;
    }
    if (!privateEditForm.governorate) {
      errors.governorate = tr.requiredField;
    }
    if (!privateEditForm.wilayat) {
      errors.wilayat = tr.requiredField;
    }
    
    setPrivateEditErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsSavingPrivate(true);
    
    if (user?.email) {
      updateAccount(user.email, {
        phone: privateEditForm.phone,
        region: {
          governorate: privateEditForm.governorate,
          wilayat: privateEditForm.wilayat
        }
      });
    }
    
    setIsSavingPrivate(false);
    setIsEditingPrivate(false);
    toast({
      title: tr.savedSuccessfully,
    });
  };

  const handleSubmitUserReport = () => {
    if (!profileEmail || !reportReason) return;
    submitReport('user', profileEmail, profile?.name || profileEmail, reportReason as ReportReason, reportNote || undefined);
    setReportModalOpen(false);
    setReportReason('');
    setReportNote('');
    toast({
      title: tr.reportSuccess,
      description: tr.reportSuccessDesc
    });
  };

  const postTypeLabels: Record<string, string> = {
    question: lang === 'ar' ? 'سؤال' : 'Question',
    explanation: lang === 'ar' ? 'شرح' : 'Explanation',
    summary: lang === 'ar' ? 'ملخص' : 'Summary',
    discussion: lang === 'ar' ? 'نقاش' : 'Discussion'
  };

  const postTypeColors: Record<string, string> = {
    question: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    explanation: 'bg-green-500/20 text-green-300 border-green-500/30',
    summary: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    discussion: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
  };

  const renderPostCard = (post: LocalPost, showAuthor = false) => (
    <Card 
      key={post.id} 
      className="border-white/10 bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
      onClick={() => setLocation('/feed')}
      data-testid={`post-card-${post.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {showAuthor && (
            <Avatar className="w-8 h-8 border border-white/10 flex-shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {getInitials(post.authorEmail)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {showAuthor && (
                <span className="text-sm font-medium">{getDisplayName(post.authorEmail)}</span>
              )}
              <Badge variant="outline" className={`text-[10px] ${postTypeColors[post.postType]}`}>
                {postTypeLabels[post.postType]}
              </Badge>
              {post.subject && (
                <Badge variant="secondary" className="text-[10px]">{post.subject}</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { 
                  addSuffix: true,
                  locale: lang === 'ar' ? ar : enUS 
                })}
              </span>
            </div>
            <p className="text-sm line-clamp-3">{post.content}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {post.likedBy?.length || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {post.replies?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderReplyCard = (item: { reply: LocalReply; post: LocalPost }) => (
    <Card 
      key={item.reply.id} 
      className="border-white/10 bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
      onClick={() => setLocation('/feed')}
      data-testid={`reply-card-${item.reply.id}`}
    >
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Reply className="w-3 h-3" />
          {tr.replyTo} <span className="font-medium text-foreground">{getDisplayName(item.post.authorEmail)}</span>
        </div>
        <div className="bg-black/20 rounded p-2 mb-2 text-xs text-muted-foreground line-clamp-2">
          {item.post.content}
        </div>
        <p className="text-sm">{item.reply.content}</p>
        <span className="text-xs text-muted-foreground mt-2 block">
          {formatDistanceToNow(new Date(item.reply.createdAt), { 
            addSuffix: true,
            locale: lang === 'ar' ? ar : enUS 
          })}
        </span>
      </CardContent>
    </Card>
  );

  const renderFileCard = (item: { attachment: Attachment; post: LocalPost }) => (
    <Card 
      key={`${item.post.id}-${item.attachment.name}`}
      className="border-white/10 bg-card/50"
      data-testid={`file-card-${item.attachment.name}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.attachment.name}</p>
            <p className="text-xs text-muted-foreground">
              {(item.attachment.size / 1024).toFixed(1)} KB
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(item.post.createdAt), 'PP', { locale: lang === 'ar' ? ar : enUS })}
            </p>
          </div>
          <a 
            href={item.attachment.url} 
            download={item.attachment.name}
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="sm" variant="outline" className="gap-1" data-testid={`download-${item.attachment.name}`}>
              <Download className="w-3 h-3" />
              {tr.download}
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );

  if (!profileEmail) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">{tr.noProfile}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0" data-testid="profile-page" key={profileEmail ?? "me"}>
      <div ref={headerRef}>
        <div className="relative h-48 md:h-64 -mx-4 md:-mx-6 -mt-6 overflow-hidden">
          {profile?.coverUrl || tempCover ? (
            <img 
              src={tempCover || profile?.coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600/40 via-purple-500/30 to-gray-600/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {isEditing && (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cover')}
                className="hidden"
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto gap-1 bg-black/50 hover:bg-black/70"
                onClick={() => coverInputRef.current?.click()}
                data-testid="button-change-cover"
              >
                <ImageIcon className="w-4 h-4" />
                {tr.changeCover}
              </Button>
            </>
          )}
        </div>

        <div className="relative px-4 -mt-16 md:-mt-20 pb-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => !isEditing && setShowAvatarPreview(true)}
                className={`focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-full ${!isEditing ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                disabled={isEditing}
                data-testid="button-avatar-preview"
              >
                <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-xl">
                  {(tempAvatar || profile?.avatarUrl) ? (
                    <AvatarImage src={tempAvatar || profile?.avatarUrl} />
                  ) : null}
                  <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-violet-600 to-purple-500 text-white">
                    {getInitials(profileEmail)}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {isEditing && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                    className="hidden"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-1 right-1 rtl:left-1 rtl:right-auto w-8 h-8 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={() => avatarInputRef.current?.click()}
                    data-testid="button-change-avatar"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3 max-w-md">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={tr.name}
                    className="bg-black/20 border-white/10"
                    data-testid="input-profile-name"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={editForm.major}
                      onChange={(e) => setEditForm(prev => ({ ...prev, major: e.target.value }))}
                      placeholder={tr.major}
                      className="flex-1 bg-black/20 border-white/10"
                      data-testid="input-profile-major"
                    />
                    <Input
                      value={editForm.level}
                      onChange={(e) => setEditForm(prev => ({ ...prev, level: e.target.value }))}
                      placeholder={tr.level}
                      className="w-24 bg-black/20 border-white/10"
                      data-testid="input-profile-level"
                    />
                  </div>
                  <Input
                    value={editForm.university}
                    onChange={(e) => setEditForm(prev => ({ ...prev, university: e.target.value }))}
                    placeholder={tr.university}
                    className="bg-black/20 border-white/10"
                    data-testid="input-profile-university"
                  />
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder={tr.bio}
                    className="bg-black/20 border-white/10 min-h-[60px]"
                    data-testid="input-profile-bio"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {profile?.name || profileEmail.split('@')[0]}
                    </h1>
                    {isStaff(profileEmail) && (
                      <Shield 
                        size={18} 
                        className="inline-block text-emerald-400" 
                        aria-label={isAdmin(profileEmail) ? 'Admin' : 'Moderator'}
                        data-testid="staff-badge-profile"
                      />
                    )}
                  </div>
                  {profile?.major && (
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <GraduationCap className="w-4 h-4" />
                      {profile.major}
                      {profile.level && <span className="text-sm">({profile.level})</span>}
                    </p>
                  )}
                  {profile?.university && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {profile.university}
                    </p>
                  )}
                  {profile?.bio && (
                    <p className="text-sm mt-2 max-w-lg">{profile.bio}</p>
                  )}
                  
                  {/* Profile Stats */}
                  <div className="flex items-center gap-6 mt-4">
                    <button 
                      onClick={() => setShowFollowersDialog(true)}
                      className="text-center hover:text-primary transition-colors cursor-pointer"
                      data-testid="button-stats-followers"
                    >
                      <span className="block text-xl font-bold">{profile?.followers?.length || 0}</span>
                      <span className="text-xs text-muted-foreground">
                        {lang === 'ar' ? 'المتابعون' : 'Followers'}
                      </span>
                    </button>
                    <button 
                      onClick={() => setShowFollowingDialog(true)}
                      className="text-center hover:text-primary transition-colors cursor-pointer"
                      data-testid="button-stats-following"
                    >
                      <span className="block text-xl font-bold">{profile?.following?.length || 0}</span>
                      <span className="text-xs text-muted-foreground">
                        {lang === 'ar' ? 'يتابع' : 'Following'}
                      </span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('posts')}
                      className="text-center hover:text-primary transition-colors cursor-pointer"
                      data-testid="button-stats-posts"
                    >
                      <span className="block text-xl font-bold">{userPosts.length}</span>
                      <span className="text-xs text-muted-foreground">
                        {lang === 'ar' ? 'المنشورات' : 'Posts'}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setTempCover(null);
                        setTempAvatar(null);
                      }}
                      className="gap-1"
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-4 h-4" />
                      {tr.cancel}
                    </Button>
                    <Button 
                      onClick={handleSaveProfile}
                      className="gap-1 bg-primary hover:bg-primary/90"
                      data-testid="button-save-profile"
                    >
                      <Check className="w-4 h-4" />
                      {tr.save}
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="gap-1 border-white/10"
                    data-testid="button-edit-profile"
                  >
                    <Edit className="w-4 h-4" />
                    {tr.editProfile}
                  </Button>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant={isFollowing(profileEmail) ? "secondary" : "default"}
                    onClick={() => toggleFollow(profileEmail)}
                    className={`gap-1.5 min-w-[100px] ${isFollowing(profileEmail) ? 'group hover:bg-destructive hover:text-destructive-foreground hover:border-destructive' : ''}`}
                    data-testid="button-follow"
                  >
                    {isFollowing(profileEmail) ? (
                      <>
                        <Check className="w-4 h-4 group-hover:hidden" />
                        <X className="w-4 h-4 hidden group-hover:block" />
                        <span className="group-hover:hidden">{lang === 'ar' ? 'متابَع' : 'Following'}</span>
                        <span className="hidden group-hover:inline">{lang === 'ar' ? 'إلغاء المتابعة' : 'Unfollow'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        {lang === 'ar' ? 'متابعة' : 'Follow'}
                      </>
                    )}
                  </Button>
                  {(() => {
                    const dmCheck = canSendDM(profileEmail);
                    if (dmCheck.allowed) {
                      return (
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/messages?to=${encodeURIComponent(profileEmail)}`)}
                          className="gap-1.5"
                          data-testid="button-send-message"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {tr.sendMessage}
                        </Button>
                      );
                    } else {
                      return (
                        <Button 
                          variant="outline"
                          disabled
                          className="gap-1.5 opacity-50"
                          data-testid="button-send-message-disabled"
                          title={tr.dmClosed}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {tr.dmClosed}
                        </Button>
                      );
                    }
                  })()}
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => setReportModalOpen(true)}
                    className="text-amber-500"
                    data-testid="button-report-user"
                    title={tr.reportUser}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`${isSticky ? 'sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-white/10 -mx-4 md:-mx-6 px-4 md:px-6' : ''}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0 gap-0 overflow-x-auto flex-nowrap">
            <TabsTrigger 
              value="posts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 shrink-0 whitespace-nowrap"
              data-testid="tab-posts"
            >
              <MessageSquare className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.posts} ({userPosts.length})
            </TabsTrigger>
            <TabsTrigger 
              value="replies" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 shrink-0 whitespace-nowrap"
              data-testid="tab-replies"
            >
              <Reply className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.replies} ({userReplies.length})
            </TabsTrigger>
            <TabsTrigger 
              value="favorites" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 shrink-0 whitespace-nowrap"
              data-testid="tab-favorites"
            >
              <Heart className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.favorites}
              {!canViewFavorites && !isOwnProfile && (
                <Badge variant="secondary" className="ml-1 rtl:mr-1 rtl:ml-0 text-[10px]">{tr.private}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 shrink-0 whitespace-nowrap"
              data-testid="tab-files"
            >
              <FileText className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.files} ({userFiles.length})
            </TabsTrigger>
            <TabsTrigger 
              value="interests" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 shrink-0 whitespace-nowrap"
              data-testid="tab-interests"
            >
              <Hash className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.interests}
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="private" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 shrink-0 whitespace-nowrap"
                data-testid="tab-private"
              >
                <Lock className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {lang === 'ar' ? 'معلومات خاصة' : 'Private Info'}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="py-4">
            <TabsContent value="posts" className="mt-0 space-y-3">
              {userPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{tr.noPosts}</p>
                </div>
              ) : (
                userPosts.map(post => renderPostCard(post))
              )}
            </TabsContent>

            <TabsContent value="replies" className="mt-0 space-y-3">
              {userReplies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Reply className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{tr.noReplies}</p>
                </div>
              ) : (
                userReplies.map(item => renderReplyCard(item))
              )}
            </TabsContent>

            <TabsContent value="favorites" className="mt-0 space-y-3">
              {!canViewFavorites && !isOwnProfile ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{tr.private}</p>
                </div>
              ) : favoritePosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{tr.noFavorites}</p>
                </div>
              ) : (
                <>
                  {isEditing && (
                    <Card className="border-white/10 bg-card/30 mb-4">
                      <CardContent className="p-3 flex items-center justify-between">
                        <span className="text-sm">{tr.showFavorites}</span>
                        <Button
                          size="sm"
                          variant={editForm.showFavorites ? 'default' : 'outline'}
                          onClick={() => setEditForm(prev => ({ ...prev, showFavorites: !prev.showFavorites }))}
                          data-testid="toggle-show-favorites"
                        >
                          {editForm.showFavorites ? (lang === 'ar' ? 'عام' : 'Public') : (lang === 'ar' ? 'خاص' : 'Private')}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  {favoritePosts.map(post => renderPostCard(post, true))}
                </>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-0 space-y-3">
              {userFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{tr.noFiles}</p>
                </div>
              ) : (
                userFiles.map(item => renderFileCard(item))
              )}
            </TabsContent>

            <TabsContent value="interests" className="mt-0">
              {!canViewInterests && !isOwnProfile ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{tr.private}</p>
                </div>
              ) : isEditing ? (
                <div className="space-y-4">
                  <Card className="border-white/10 bg-card/30">
                    <CardContent className="p-3 flex items-center justify-between">
                      <span className="text-sm">{tr.showInterests}</span>
                      <Button
                        size="sm"
                        variant={editForm.showInterests ? 'default' : 'outline'}
                        onClick={() => setEditForm(prev => ({ ...prev, showInterests: !prev.showInterests }))}
                        data-testid="toggle-show-interests"
                      >
                        {editForm.showInterests ? (lang === 'ar' ? 'عام' : 'Public') : (lang === 'ar' ? 'خاص' : 'Private')}
                      </Button>
                    </CardContent>
                  </Card>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(opt => (
                      <Badge
                        key={opt.id}
                        variant={editForm.interests.includes(opt.id) ? 'default' : 'outline'}
                        className={`cursor-pointer text-sm py-1.5 px-3 ${editForm.interests.includes(opt.id) ? 'bg-primary' : 'hover:bg-primary/20'}`}
                        onClick={() => toggleInterest(opt.id)}
                        data-testid={`interest-${opt.id}`}
                      >
                        #{lang === 'ar' ? opt.labelAr : opt.labelEn}
                        {editForm.interests.includes(opt.id) && <Check className="w-3 h-3 ml-1 rtl:mr-1 rtl:ml-0" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (profile?.interests?.length || 0) === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{tr.noInterests}</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.interests?.map(id => {
                    const opt = INTEREST_OPTIONS.find(o => o.id === id);
                    return opt ? (
                      <Badge 
                        key={id} 
                        variant="secondary" 
                        className="text-sm py-1.5 px-3"
                        data-testid={`interest-tag-${id}`}
                      >
                        #{lang === 'ar' ? opt.labelAr : opt.labelEn}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="private" className="mt-0">
                <Card className="border-white/10 bg-card/30">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-500" />
                        <h3 className="font-semibold">
                          {lang === 'ar' ? 'معلوماتك الخاصة' : 'Your Private Information'}
                        </h3>
                      </div>
                      {!isEditingPrivate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleStartEditPrivate}
                          className="gap-1"
                          data-testid="button-edit-private"
                        >
                          <Edit className="w-3 h-3" />
                          {tr.editPrivate}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {lang === 'ar' 
                        ? 'هذه المعلومات خاصة بك ولا يمكن لأي شخص آخر رؤيتها.'
                        : 'This information is private to you. No one else can see it.'}
                    </p>
                    
                    {(() => {
                      const account = user?.email ? getAccount(user.email) : undefined;
                      
                      if (isEditingPrivate) {
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                              <Mail className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                </p>
                                <p className="font-medium" data-testid="text-private-email">{user?.email}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-phone">{tr.phoneLabel} <span className="text-destructive">*</span></Label>
                              <Input
                                id="edit-phone"
                                type="tel"
                                value={privateEditForm.phone}
                                onChange={(e) => { setPrivateEditForm(prev => ({ ...prev, phone: e.target.value })); setPrivateEditErrors(prev => ({ ...prev, phone: '' })); }}
                                className={`bg-black/20 border-white/10 ${privateEditErrors.phone ? 'border-destructive' : ''}`}
                                dir="ltr"
                                data-testid="input-edit-phone"
                              />
                              {privateEditErrors.phone && <p className="text-sm text-destructive" data-testid="error-edit-phone">{privateEditErrors.phone}</p>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>{tr.governorateLabel} <span className="text-destructive">*</span></Label>
                                <Select 
                                  value={privateEditForm.governorate} 
                                  onValueChange={(val) => { setPrivateEditForm(prev => ({ ...prev, governorate: val, wilayat: '' })); setPrivateEditErrors(prev => ({ ...prev, governorate: '' })); }}
                                >
                                  <SelectTrigger className={`bg-black/20 border-white/10 ${privateEditErrors.governorate ? 'border-destructive' : ''}`} data-testid="select-edit-governorate">
                                    <SelectValue placeholder={tr.selectGovernorate} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {governorates.map((gov) => (
                                      <SelectItem key={gov.value} value={gov.value}>{gov.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {privateEditErrors.governorate && <p className="text-sm text-destructive" data-testid="error-edit-governorate">{privateEditErrors.governorate}</p>}
                              </div>

                              <div className="space-y-2">
                                <Label>{tr.wilayatLabel} <span className="text-destructive">*</span></Label>
                                <Select 
                                  value={privateEditForm.wilayat} 
                                  onValueChange={(val) => { setPrivateEditForm(prev => ({ ...prev, wilayat: val })); setPrivateEditErrors(prev => ({ ...prev, wilayat: '' })); }}
                                  disabled={!privateEditForm.governorate}
                                >
                                  <SelectTrigger className={`bg-black/20 border-white/10 ${privateEditErrors.wilayat ? 'border-destructive' : ''}`} data-testid="select-edit-wilayat">
                                    <SelectValue placeholder={tr.selectWilayat} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {wilayatOptions.map((wil, idx) => (
                                      <SelectItem key={idx} value={wil.en}>{lang === 'ar' ? wil.ar : wil.en}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {privateEditErrors.wilayat && <p className="text-sm text-destructive" data-testid="error-edit-wilayat">{privateEditErrors.wilayat}</p>}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                              <Button
                                onClick={handleSavePrivate}
                                disabled={isSavingPrivate}
                                className="flex-1"
                                data-testid="button-save-private"
                              >
                                {isSavingPrivate ? tr.saving : tr.savePrivate}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={handleCancelEditPrivate}
                                disabled={isSavingPrivate}
                                data-testid="button-cancel-private"
                              >
                                {tr.cancelPrivate}
                              </Button>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                              </p>
                              <p className="font-medium" data-testid="text-private-email">{user?.email}</p>
                            </div>
                          </div>
                          
                          {account?.phone && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                              <Phone className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                                </p>
                                <p className="font-medium" data-testid="text-private-phone">{account.phone}</p>
                              </div>
                            </div>
                          )}
                          
                          {account?.region && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                              <MapPin className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {lang === 'ar' ? 'المنطقة' : 'Region'}
                                </p>
                                <p className="font-medium" data-testid="text-private-region">
                                  {account.region.governorate} - {account.region.wilayat}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {lang === 'ar' ? 'الرسائل الخاصة' : 'Direct Messages'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {lang === 'ar' ? 'السماح للآخرين بإرسال رسائل لك' : 'Allow others to send you messages'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={draftAllowDM === 'everyone' ? 'default' : 'outline'}
                                  onClick={() => setDraftAllowDM('everyone')}
                                  className="text-xs px-3"
                                  data-testid="button-dm-on"
                                >
                                  {lang === 'ar' ? 'مفتوحة' : 'On'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={draftAllowDM === 'none' ? 'default' : 'outline'}
                                  onClick={() => setDraftAllowDM('none')}
                                  className="text-xs px-3"
                                  data-testid="button-dm-off"
                                >
                                  {lang === 'ar' ? 'مغلقة' : 'Off'}
                                </Button>
                              </div>
                            </div>
                            
                            {draftAllowDM !== (account?.allowDM ?? 'everyone') && (
                              <div className="flex gap-2 mt-4 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDraftAllowDM(account?.allowDM ?? 'everyone')}
                                  disabled={isSavingDMSettings}
                                  data-testid="button-cancel-dm-settings"
                                >
                                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setIsSavingDMSettings(true);
                                    updateAccount(user?.email || '', { allowDM: draftAllowDM });
                                    toast({
                                      title: lang === 'ar' ? 'تم الحفظ' : 'Saved',
                                      description: lang === 'ar' ? 'تم حفظ إعدادات الرسائل الخاصة' : 'DM settings saved successfully'
                                    });
                                    setIsSavingDMSettings(false);
                                  }}
                                  disabled={isSavingDMSettings}
                                  data-testid="button-save-dm-settings"
                                >
                                  {isSavingDMSettings 
                                    ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') 
                                    : (lang === 'ar' ? 'حفظ الإعدادات' : 'Save settings')}
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="pt-4 border-t border-white/10">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {lang === 'ar' 
                                ? 'هذه المعلومات محمية ولن تتم مشاركتها مع أي شخص.'
                                : 'This information is protected and will not be shared with anyone.'}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === 'ar' ? 'المتابعون' : 'Followers'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {(profile?.followers?.length || 0) === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {lang === 'ar' ? 'لا يوجد متابعون بعد' : 'No followers yet'}
              </p>
            ) : (
              profile?.followers?.map((followerEmail) => {
                const followerProfile = getProfile(followerEmail);
                return (
                  <a 
                    key={followerEmail}
                    href={`/profile/${encodeURIComponent(followerEmail)}`}
                    className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors w-full text-left no-underline text-inherit"
                    data-testid={`follower-${followerEmail}`}
                  >
                    <Avatar className="w-10 h-10 border border-white/10">
                      <AvatarImage src={followerProfile?.avatarUrl} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(followerProfile?.name || followerEmail.split('@')[0]).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {followerProfile?.name || followerEmail.split('@')[0]}
                      </p>
                      {followerProfile?.major && (
                        <p className="text-xs text-muted-foreground truncate">{followerProfile.major}</p>
                      )}
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === 'ar' ? 'يتابع' : 'Following'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {(profile?.following?.length || 0) === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {lang === 'ar' ? 'لا يتابع أحداً بعد' : 'Not following anyone yet'}
              </p>
            ) : (
              profile?.following?.map((followingEmail) => {
                const followingProfile = getProfile(followingEmail);
                return (
                  <a 
                    key={followingEmail}
                    href={`/profile/${encodeURIComponent(followingEmail)}`}
                    className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors w-full text-left no-underline text-inherit"
                    data-testid={`following-${followingEmail}`}
                  >
                    <Avatar className="w-10 h-10 border border-white/10">
                      <AvatarImage src={followingProfile?.avatarUrl} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(followingProfile?.name || followingEmail.split('@')[0]).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {followingProfile?.name || followingEmail.split('@')[0]}
                      </p>
                      {followingProfile?.major && (
                        <p className="text-xs text-muted-foreground truncate">{followingProfile.major}</p>
                      )}
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Preview Dialog */}
      <Dialog open={showAvatarPreview} onOpenChange={setShowAvatarPreview}>
        <DialogContent className="max-w-sm md:max-w-md p-0 bg-transparent border-none shadow-none">
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setShowAvatarPreview(false)}
              className="absolute -top-10 right-0 md:-right-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
              aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
              data-testid="button-close-avatar-preview"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="rounded-full overflow-hidden shadow-2xl border-4 border-white/10">
              {(profile?.avatarUrl) ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile?.name || profileEmail?.split('@')[0] || 'Profile'} 
                  className="w-72 h-72 md:w-80 md:h-80 object-cover"
                  data-testid="img-avatar-preview"
                />
              ) : (
                <div 
                  className="w-72 h-72 md:w-80 md:h-80 bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center"
                  data-testid="avatar-fallback-preview"
                >
                  <span className="text-6xl md:text-7xl font-bold text-white">
                    {getInitials(profileEmail || '')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report User Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-report-user">
          <DialogHeader>
            <DialogTitle>{tr.reportTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground" data-testid="text-report-user-target">
              {lang === 'ar' ? 'الإبلاغ عن:' : 'Reporting:'} {profile?.name || profileEmail}
            </p>
            <div className="space-y-2">
              <Label>{tr.reportReason}</Label>
              <Select value={reportReason} onValueChange={(val) => setReportReason(val as ReportReason)}>
                <SelectTrigger data-testid="select-user-report-reason">
                  <SelectValue placeholder={tr.selectReason} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam" data-testid="user-option-spam">{tr.reasonSpam}</SelectItem>
                  <SelectItem value="harassment" data-testid="user-option-harassment">{tr.reasonHarassment}</SelectItem>
                  <SelectItem value="hate" data-testid="user-option-hate">{tr.reasonHate}</SelectItem>
                  <SelectItem value="impersonation" data-testid="user-option-impersonation">{tr.reasonImpersonation}</SelectItem>
                  <SelectItem value="inappropriate" data-testid="user-option-inappropriate">{tr.reasonInappropriate}</SelectItem>
                  <SelectItem value="other" data-testid="user-option-other">{tr.reasonOther}</SelectItem>
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
                data-testid="textarea-user-report-note"
              />
            </div>
            <Button 
              onClick={handleSubmitUserReport} 
              disabled={!reportReason}
              className="w-full"
              data-testid="button-submit-user-report"
            >
              <Flag className="w-4 h-4 me-2" />
              {tr.reportSubmit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
