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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  X,
  Plus,
  Check,
  Shield,
  Lock,
  Mail,
  Phone,
  MapPin,
  Flag,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Pencil,
  Trash2,
  ChevronRight,
  Library,
  FolderOpen,
  BookOpen,
  ArrowLeft
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const COVER_STORAGE_KEY = 'daam_profile_cover_v1';

function getCoverFromStorage(userId: string): string | null {
  try {
    const data = localStorage.getItem(COVER_STORAGE_KEY);
    if (!data) return null;
    const covers = JSON.parse(data);
    return covers[userId] || null;
  } catch {
    return null;
  }
}

function saveCoverToStorage(userId: string, coverUrl: string | null): void {
  try {
    const data = localStorage.getItem(COVER_STORAGE_KEY);
    const covers = data ? JSON.parse(data) : {};
    if (coverUrl) {
      covers[userId] = coverUrl;
    } else {
      delete covers[userId];
    }
    localStorage.setItem(COVER_STORAGE_KEY, JSON.stringify(covers));
  } catch {
    // Storage error, ignore
  }
}

export default function Profile() {
  const { user, posts, lang, getProfile, getAccount, updateAccount, updateProfile, toggleFollow, isFollowing, submitReport, moderators, canSendDM } = useDaamStore();
  const [, navigate] = useLocation();
  
  const isAdmin = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());
  const isModerator = (email: string) => {
    const emailLower = email.toLowerCase();
    if (emailLower === 'w.qq89@hotmail.com') return true;
    return moderators.some(m => m.email.toLowerCase() === emailLower && m.isActive);
  };
  const isStaff = (email: string) => isAdmin(email) || isModerator(email);
  const [match, params] = useRoute("/profile/:email");
  const { toast } = useToast();
  
  const isRTL = lang === 'ar';
  const profileEmail = params?.email ? decodeURIComponent(params.email) : user?.email;
  const isOwnProfile = user?.email === profileEmail;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'posts' | 'replies' | 'saved' | 'library' | 'interests' | 'private'>('dashboard');
  const [libraryFilter, setLibraryFilter] = useState<'saved' | 'files' | 'summaries'>('saved');
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
  
  const [storedCover, setStoredCover] = useState<string | null>(null);
  
  const [showUnifiedEditDialog, setShowUnifiedEditDialog] = useState(false);
  const [editTab, setEditTab] = useState<'cover' | 'avatar' | 'info' | 'account'>('info');
  
  useEffect(() => {
    if (profileEmail) {
      const p = getProfile(profileEmail);
      setProfile(p || null);
      const cover = getCoverFromStorage(profileEmail);
      setStoredCover(cover);
    }
  }, [profileEmail, getProfile]);

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

  const handleSaveCover = () => {
    if (!profileEmail || !tempCover) return;
    saveCoverToStorage(profileEmail, tempCover);
    setStoredCover(tempCover);
    setTempCover(null);
    toast({
      title: lang === 'ar' ? 'تم الحفظ' : 'Saved',
      description: lang === 'ar' ? 'تم تحديث الغلاف بنجاح' : 'Cover updated successfully'
    });
  };

  const handleRemoveCover = () => {
    if (!profileEmail) return;
    saveCoverToStorage(profileEmail, null);
    setStoredCover(null);
    setTempCover(null);
    toast({
      title: lang === 'ar' ? 'تمت الإزالة' : 'Removed',
      description: lang === 'ar' ? 'تمت إزالة الغلاف' : 'Cover removed'
    });
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
    saving: lang === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    noSavedPosts: lang === 'ar' ? 'لم تحفظ أي منشور بعد' : 'No saved posts yet',
    activity: lang === 'ar' ? 'النشاط' : 'Activity',
    viewAll: lang === 'ar' ? 'عرض الكل' : 'View All',
    editCover: lang === 'ar' ? 'تعديل الغلاف' : 'Edit Cover',
    removeCover: lang === 'ar' ? 'إزالة الغلاف' : 'Remove Cover',
    saveCover: lang === 'ar' ? 'حفظ الغلاف' : 'Save Cover',
    cancelCover: lang === 'ar' ? 'إلغاء' : 'Cancel',
    dashboard: lang === 'ar' ? 'لوحة المعلومات' : 'Dashboard',
    saved: lang === 'ar' ? 'المحفوظات' : 'Saved',
    privateInfo: lang === 'ar' ? 'معلومات خاصة' : 'Private Info'
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
    question: 'bg-orange-500/20 text-orange-400 dark:text-orange-300 border-orange-500/30',
    explanation: 'bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/30',
    summary: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
    discussion: 'bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/30'
  };

  const isPdfFile = (attachment: Attachment) => {
    return attachment.name.toLowerCase().endsWith('.pdf') || 
           attachment.url.toLowerCase().endsWith('.pdf') ||
           (attachment as any).mimeType === 'application/pdf' ||
           (attachment as any).type === 'pdf';
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
      const extractedMime = mimeType || base64Url.split(';')[0].split(':')[1] || 'application/octet-stream';
      return new Blob([byteArray], { type: extractedMime });
    } catch {
      return null;
    }
  };

  const openPdfFile = (attachment: Attachment) => {
    if (!attachment.url) return;
    const blob = base64ToBlob(attachment.url, 'application/pdf');
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(attachment.url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderPostCard = (post: LocalPost, compact = false) => (
    <Card 
      key={post.id} 
      className="border-border/50 hover-elevate cursor-pointer"
      onClick={() => navigate(`/post/${post.id}`)}
      data-testid={`post-card-${post.id}`}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
            <p className={`text-sm ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>{post.content}</p>
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

  const coverImage = tempCover || storedCover || profile?.coverUrl;

  if (!profileEmail) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">{tr.noProfile}</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-8" 
      data-testid="profile-page" 
      key={profileEmail ?? "me"}
    >
      {/* A) COVER HEADER with IDENTITY OVERLAY */}
      <div className="relative -mx-4 md:-mx-6 -mt-6">
        <div className="relative h-[320px] sm:h-[380px] md:h-[440px] overflow-hidden">
          {/* Background layer - full bleed */}
          {coverImage ? (
            <img 
              src={coverImage} 
              alt="Cover" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
          )}
          
          {/* Premium dark overlay with texture */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 20% 30%, rgba(120,100,80,0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 70%, rgba(60,50,40,0.1) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(100,90,70,0.08) 0%, transparent 70%)
              `
            }}
          />
          
          {/* Hidden file inputs */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'cover')}
            className="hidden"
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'avatar')}
            className="hidden"
          />
          
          {/* Single Pen Icon - Owner only, top-left */}
          {isOwnProfile && (
            <Button
              size="icon"
              variant="outline"
              className="absolute top-4 left-4 rtl:right-4 rtl:left-auto z-50 pointer-events-auto bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              onClick={() => {
                setEditTab('info');
                setShowUnifiedEditDialog(true);
                setEditForm({
                  name: profile?.name || '',
                  major: profile?.major || '',
                  university: profile?.university || '',
                  level: profile?.level || '',
                  bio: profile?.bio || '',
                  interests: profile?.interests || [],
                  showFavorites: profile?.showFavorites !== false,
                  showInterests: profile?.showInterests !== false
                });
                const account = user?.email ? getAccount(user.email) : undefined;
                setPrivateEditForm({
                  phone: account?.phone || '',
                  governorate: account?.region?.governorate || '',
                  wilayat: account?.region?.wilayat || ''
                });
                setPrivateEditErrors({});
                setTempCover(null);
                setTempAvatar(null);
              }}
              data-testid="button-edit-profile-pen"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          
          {/* B) CONTENT CONTAINER - Max-width with side gutters */}
          <div className="relative h-full">
            <div className="mx-auto max-w-[1100px] px-6 h-full flex flex-col items-center text-center pt-12 md:pt-14 pointer-events-none">
              {/* Avatar - near top */}
              <button
                type="button"
                onClick={() => setShowAvatarPreview(true)}
                className="pointer-events-auto focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent rounded-full cursor-pointer hover:opacity-90 transition-opacity"
                data-testid="button-avatar-preview"
              >
                <Avatar className="w-24 h-24 md:w-28 md:h-28 ring-2 ring-white/25 shadow-2xl">
                  {profile?.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} />
                  ) : null}
                  <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {getInitials(profileEmail)}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {/* Name */}
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-4 text-white drop-shadow-lg">
                {profile?.name || profileEmail.split('@')[0]}
              </h1>
              
              {/* Major + University (Subtitle) */}
              {(profile?.major || profile?.university) && (
                <p className="text-sm md:text-base text-white/80 mt-2">
                  {profile?.major}{profile?.level && ` (${profile.level})`}
                  {profile?.major && profile?.university && ' • '}
                  {profile?.university}
                </p>
              )}
              
              {/* Stats line */}
              <p className="text-xs md:text-sm text-white/70 mt-3 tracking-wide pointer-events-auto">
                <button 
                  onClick={() => setActiveView('posts')}
                  className="hover:text-white transition-colors"
                  data-testid="stats-posts"
                >
                  {userPosts.length} {lang === 'ar' ? 'منشور' : 'posts'}
                </button>
                {' | '}
                <button 
                  onClick={() => setShowFollowingDialog(true)}
                  className="hover:text-white transition-colors"
                  data-testid="stats-following"
                >
                  {profile?.following?.length || 0} {lang === 'ar' ? 'يتابع' : 'following'}
                </button>
                {' | '}
                <button 
                  onClick={() => setShowFollowersDialog(true)}
                  className="hover:text-white transition-colors"
                  data-testid="stats-followers"
                >
                  {profile?.followers?.length || 0} {lang === 'ar' ? 'متابع' : 'followers'}
                </button>
              </p>
              
              {/* Thin divider line */}
              <div className="mt-5 h-px w-full max-w-[520px] bg-white/15" />
              
              {/* Action Buttons - below divider */}
              <div className="flex gap-3 justify-center mt-4 pointer-events-auto">
                {isOwnProfile ? (
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/messages`)}
                    className="gap-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white"
                    data-testid="button-my-messages"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {tr.sendMessage}
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant={isFollowing(profileEmail) ? "outline" : "default"}
                      onClick={() => toggleFollow(profileEmail)}
                      className={`gap-1.5 min-w-[100px] ${isFollowing(profileEmail) 
                        ? 'bg-white/10 hover:bg-white/15 border border-white/20 text-white hover:bg-destructive hover:text-destructive-foreground hover:border-destructive group' 
                        : ''}`}
                      data-testid="button-follow"
                    >
                      {isFollowing(profileEmail) ? (
                        <>
                          <Check className="w-4 h-4 group-hover:hidden" />
                          <X className="w-4 h-4 hidden group-hover:block" />
                          <span className="group-hover:hidden">{lang === 'ar' ? 'متابَع' : 'Following'}</span>
                          <span className="hidden group-hover:inline">{lang === 'ar' ? 'إلغاء' : 'Unfollow'}</span>
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
                            className="gap-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white"
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
                          className="gap-1.5 opacity-50 bg-white/10 backdrop-blur-sm border-white/20 text-white"
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
                    className="text-amber-400 hover:text-amber-300"
                    data-testid="button-report-user"
                    title={tr.reportUser}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* D) DASHBOARD GRID or OTHER VIEWS */}
      <div className="max-w-7xl mx-auto px-6 mt-10 md:mt-14">
        {/* Back button when not on dashboard */}
        {activeView !== 'dashboard' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView('dashboard')}
            className="gap-1.5 mb-4"
            data-testid="button-back-to-profile"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'ar' ? 'رجوع للملف' : 'Back to Profile'}
          </Button>
        )}
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Activity Card */}
            <Card className="bg-gradient-to-b from-white/5 to-white/[0.02] dark:from-white/5 dark:to-white/[0.02] border border-white/10 dark:border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 rounded-2xl">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  {tr.activity}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/50 dark:bg-white/5">
                    <p className="text-2xl font-semibold">{userPosts.length}</p>
                    <p className="text-xs text-muted-foreground">{tr.posts}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 dark:bg-white/5">
                    <p className="text-2xl font-semibold">{likedPosts.length}</p>
                    <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'إعجاب' : 'Likes'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 dark:bg-white/5">
                    <p className="text-2xl font-semibold">{userReplies.length}</p>
                    <p className="text-xs text-muted-foreground">{tr.replies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Preview Card */}
            <Card className="bg-gradient-to-b from-white/5 to-white/[0.02] dark:from-white/5 dark:to-white/[0.02] border border-white/10 dark:border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 rounded-2xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    {tr.posts}
                  </CardTitle>
                  {userPosts.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveView('posts')}
                      className="gap-1 text-xs"
                    >
                      {tr.viewAll}
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {userPosts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{tr.noPosts}</p>
                  </div>
                ) : (
                  userPosts.slice(0, 2).map(post => renderPostCard(post, true))
                )}
              </CardContent>
            </Card>

            {/* Saved Preview Card */}
            <Card className="bg-gradient-to-b from-white/5 to-white/[0.02] dark:from-white/5 dark:to-white/[0.02] border border-white/10 dark:border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 rounded-2xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-muted-foreground" />
                    {tr.saved}
                  </CardTitle>
                  {savedPosts.length > 0 && canViewFavorites && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveView('saved')}
                      className="gap-1 text-xs"
                    >
                      {tr.viewAll}
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {!canViewFavorites && !isOwnProfile ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{tr.private}</p>
                  </div>
                ) : savedPosts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{tr.noSavedPosts}</p>
                  </div>
                ) : (
                  savedPosts.slice(0, 2).map(post => renderPostCard(post, true))
                )}
              </CardContent>
            </Card>

            {/* Quick Access Cards - Second Row */}
            {/* Replies Card */}
            <Card 
              className="bg-gradient-to-b from-white/5 to-white/[0.02] dark:from-white/5 dark:to-white/[0.02] border border-white/10 dark:border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 rounded-2xl cursor-pointer"
              onClick={() => setActiveView('replies')}
              data-testid="card-replies"
            >
              <CardContent className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Reply className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{tr.replies}</p>
                  <p className="text-xs text-muted-foreground">{userReplies.length} {lang === 'ar' ? 'رد' : 'replies'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Interests Card */}
            <Card 
              className="bg-gradient-to-b from-white/5 to-white/[0.02] dark:from-white/5 dark:to-white/[0.02] border border-white/10 dark:border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 rounded-2xl cursor-pointer"
              onClick={() => setActiveView('interests')}
              data-testid="card-interests"
            >
              <CardContent className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{tr.interests}</p>
                  <p className="text-xs text-muted-foreground">{profile?.interests?.length || 0} {lang === 'ar' ? 'اهتمام' : 'interests'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Library Card - Owner only */}
            {isOwnProfile && (
              <Card 
                className="bg-gradient-to-b from-white/5 to-white/[0.02] dark:from-white/5 dark:to-white/[0.02] border border-white/10 dark:border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 rounded-2xl cursor-pointer"
                onClick={() => setActiveView('library')}
                data-testid="card-library"
              >
                <CardContent className="p-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Library className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{lang === 'ar' ? 'المكتبة' : 'Library'}</p>
                    <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الملفات والمحفوظات' : 'Files & Saved'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            )}

            {/* Private Info Card - Owner only */}
            {isOwnProfile && (
              <Card 
                className="bg-gradient-to-b from-white/5 to-white/[0.02] dark:from-white/5 dark:to-white/[0.02] border border-white/10 dark:border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 rounded-2xl cursor-pointer"
                onClick={() => setActiveView('private')}
                data-testid="card-private"
              >
                <CardContent className="p-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tr.privateInfo}</p>
                    <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'معلومات خاصة بك' : 'Your private data'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Posts View */}
        {activeView === 'posts' && (
          <div className="space-y-3">
            {userPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tr.noPosts}</p>
              </div>
            ) : (
              userPosts.map(post => renderPostCard(post))
            )}
          </div>
        )}

        {/* Replies View */}
        {activeView === 'replies' && (
          <div className="space-y-3">
            {userReplies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Reply className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tr.noReplies}</p>
              </div>
            ) : (
              userReplies.map(item => (
                <Card 
                  key={item.reply.id} 
                  className="border-border/50 hover-elevate cursor-pointer"
                  onClick={() => navigate(`/post/${item.post.id}`)}
                  data-testid={`reply-card-${item.reply.id}`}
                >
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Reply className="w-3 h-3" />
                      {tr.replyTo} <span className="font-medium text-foreground">{getDisplayName(item.post.authorEmail)}</span>
                    </div>
                    <div className="bg-muted/50 rounded p-2 mb-2 text-xs text-muted-foreground line-clamp-2">
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
              ))
            )}
          </div>
        )}

        {/* Saved View */}
        {activeView === 'saved' && (
          <div className="space-y-3">
            {!canViewFavorites && !isOwnProfile ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tr.private}</p>
              </div>
            ) : savedPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tr.noSavedPosts}</p>
              </div>
            ) : (
              <>
                {isEditing && (
                  <Card className="border-border/50 mb-4">
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
                {savedPosts.map(post => renderPostCard(post))}
              </>
            )}
          </div>
        )}

        {/* Library View */}
        {activeView === 'library' && isOwnProfile && (
          <div className="space-y-4">
            {/* Library Filter Chips */}
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={libraryFilter === 'saved' ? 'default' : 'outline'}
                className="cursor-pointer py-1.5 px-3"
                onClick={() => setLibraryFilter('saved')}
                data-testid="library-filter-saved"
              >
                <Bookmark className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                {tr.saved}
              </Badge>
              <Badge
                variant={libraryFilter === 'files' ? 'default' : 'outline'}
                className="cursor-pointer py-1.5 px-3"
                onClick={() => setLibraryFilter('files')}
                data-testid="library-filter-files"
              >
                <FolderOpen className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                {lang === 'ar' ? 'الملفات' : 'Files'}
              </Badge>
              <Badge
                variant={libraryFilter === 'summaries' ? 'default' : 'outline'}
                className="cursor-pointer py-1.5 px-3"
                onClick={() => setLibraryFilter('summaries')}
                data-testid="library-filter-summaries"
              >
                <BookOpen className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                {lang === 'ar' ? 'الملخصات' : 'Summaries'}
              </Badge>
            </div>

            {/* Library Content */}
            {libraryFilter === 'saved' && (
              savedPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{tr.noSavedPosts}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPosts.map(post => renderPostCard(post))}
                </div>
              )
            )}

            {libraryFilter === 'files' && (
              <div className="space-y-3">
                {(() => {
                  const userFiles = posts
                    .filter(p => p.authorEmail === profileEmail && p.attachments?.length)
                    .flatMap(p => (p.attachments || []).map(att => ({ ...att, postId: p.id, postContent: p.content })));
                  
                  if (userFiles.length === 0) {
                    return (
                      <div className="text-center py-12 text-muted-foreground">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>{lang === 'ar' ? 'لا توجد ملفات' : 'No files uploaded'}</p>
                      </div>
                    );
                  }
                  
                  return userFiles.map((file, idx) => (
                    <Card key={`${file.postId}-${idx}`} className="border-border/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{file.postContent?.slice(0, 50)}...</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            const isPdf = file.name?.toLowerCase().endsWith('.pdf') ||
                                          file.url?.toLowerCase().endsWith('.pdf') ||
                                          (file as any).mimeType?.includes('pdf') ||
                                          file.type?.includes('pdf');
                            if (isPdf && file.url) {
                              try {
                                const base64Data = file.url.split(',')[1];
                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: 'application/pdf' });
                                const blobUrl = URL.createObjectURL(blob);
                                window.open(blobUrl, '_blank');
                              } catch {
                                window.open(file.url, '_blank');
                              }
                            } else if (file.url) {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.name || 'download';
                              link.click();
                            }
                          }}
                          data-testid={`download-file-${idx}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            )}

            {libraryFilter === 'summaries' && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{lang === 'ar' ? 'لا توجد ملخصات بعد' : 'No summaries yet'}</p>
                <p className="text-xs mt-1">{lang === 'ar' ? 'قريباً...' : 'Coming soon...'}</p>
              </div>
            )}
          </div>
        )}

        {/* Interests View */}
        {activeView === 'interests' && (
          <div className="space-y-4">
            {!canViewInterests && !isOwnProfile ? (
              <div className="text-center py-12 text-muted-foreground">
                <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tr.private}</p>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <Card className="border-border/50">
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
                      className="cursor-pointer text-sm py-1.5 px-3"
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
          </div>
        )}

        {/* Private Info View */}
        {activeView === 'private' && isOwnProfile && (
          <Card className="border-border/50">
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
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
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
                          className={`${privateEditErrors.phone ? 'border-destructive' : ''}`}
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
                            <SelectTrigger className={`${privateEditErrors.governorate ? 'border-destructive' : ''}`} data-testid="select-edit-governorate">
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
                            <SelectTrigger className={`${privateEditErrors.wilayat ? 'border-destructive' : ''}`} data-testid="select-edit-wilayat">
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
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </p>
                        <p className="font-medium" data-testid="text-private-email">{user?.email}</p>
                      </div>
                    </div>
                    
                    {account?.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
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
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
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
                    
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
                    
                    <div className="pt-4 border-t border-border">
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
        )}
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
                  <button
                    type="button"
                    key={followerEmail}
                    className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate transition-colors w-full text-left"
                    data-testid={`follower-${followerEmail}`}
                    onClick={() => {
                      setShowFollowersDialog(false);
                      requestAnimationFrame(() => navigate(`/profile/${encodeURIComponent(followerEmail)}`));
                    }}
                  >
                    <Avatar className="w-10 h-10 border border-border">
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
                  </button>
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
                  <button
                    type="button"
                    key={followingEmail}
                    className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate transition-colors w-full text-left"
                    data-testid={`following-${followingEmail}`}
                    onClick={() => {
                      setShowFollowingDialog(false);
                      requestAnimationFrame(() => navigate(`/profile/${encodeURIComponent(followingEmail)}`));
                    }}
                  >
                    <Avatar className="w-10 h-10 border border-border">
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
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Preview Dialog */}
      <Dialog open={showAvatarPreview} onOpenChange={setShowAvatarPreview}>
        <DialogContent className="max-w-sm md:max-w-md p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setShowAvatarPreview(false)}
              className="absolute -top-10 right-0 md:-right-10 p-2 rounded-full bg-background/80 hover-elevate text-foreground transition-colors z-10"
              aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
              data-testid="button-close-avatar-preview"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="rounded-full overflow-hidden shadow-2xl border-4 border-background">
              {(profile?.avatarUrl) ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile?.name || profileEmail?.split('@')[0] || 'Profile'} 
                  className="w-72 h-72 md:w-80 md:h-80 object-cover"
                  data-testid="img-avatar-preview"
                />
              ) : (
                <div 
                  className="w-72 h-72 md:w-80 md:h-80 bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
                  data-testid="avatar-fallback-preview"
                >
                  <span className="text-6xl md:text-7xl font-bold text-primary-foreground">
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

      {/* Unified Edit Profile Dialog */}
      <Dialog open={showUnifiedEditDialog} onOpenChange={setShowUnifiedEditDialog}>
        <DialogContent 
          className="sm:max-w-lg max-h-[85vh] overflow-y-auto" 
          data-testid="dialog-edit-profile"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              {lang === 'ar' ? 'تحرير الملف الشخصي' : 'Edit Profile'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b pb-2 mb-4 flex-wrap">
            <Button
              size="sm"
              variant={editTab === 'cover' ? 'default' : 'ghost'}
              onClick={() => setEditTab('cover')}
              className="gap-1.5"
              data-testid="tab-cover"
            >
              <ImageIcon className="w-4 h-4" />
              {lang === 'ar' ? 'الغلاف' : 'Cover'}
            </Button>
            <Button
              size="sm"
              variant={editTab === 'avatar' ? 'default' : 'ghost'}
              onClick={() => setEditTab('avatar')}
              className="gap-1.5"
              data-testid="tab-avatar"
            >
              <Camera className="w-4 h-4" />
              {lang === 'ar' ? 'الصورة' : 'Photo'}
            </Button>
            <Button
              size="sm"
              variant={editTab === 'info' ? 'default' : 'ghost'}
              onClick={() => setEditTab('info')}
              className="gap-1.5"
              data-testid="tab-info"
            >
              <User className="w-4 h-4" />
              {lang === 'ar' ? 'المعلومات' : 'Info'}
            </Button>
            <Button
              size="sm"
              variant={editTab === 'account' ? 'default' : 'ghost'}
              onClick={() => setEditTab('account')}
              className="gap-1.5"
              data-testid="tab-account"
            >
              <Lock className="w-4 h-4" />
              {lang === 'ar' ? 'الحساب' : 'Account'}
            </Button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {/* Cover Tab */}
            {editTab === 'cover' && (
              <div className="space-y-4">
                <div className="relative h-32 rounded-lg overflow-hidden bg-muted">
                  {(tempCover || storedCover || profile?.coverUrl) ? (
                    <img 
                      src={tempCover || storedCover || profile?.coverUrl} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    className="flex-1 gap-1.5"
                    data-testid="button-upload-cover"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {lang === 'ar' ? 'رفع غلاف' : 'Upload Cover'}
                  </Button>
                  {(tempCover || storedCover || profile?.coverUrl) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleRemoveCover();
                        setTempCover(null);
                      }}
                      className="gap-1.5 text-destructive hover:text-destructive"
                      data-testid="button-remove-cover-dialog"
                    >
                      <Trash2 className="w-4 h-4" />
                      {lang === 'ar' ? 'إزالة' : 'Remove'}
                    </Button>
                  )}
                </div>
                {tempCover && (
                  <Button
                    onClick={() => {
                      handleSaveCover();
                    }}
                    className="w-full gap-1.5"
                    data-testid="button-save-cover-dialog"
                  >
                    <Check className="w-4 h-4" />
                    {lang === 'ar' ? 'حفظ الغلاف' : 'Save Cover'}
                  </Button>
                )}
              </div>
            )}

            {/* Avatar Tab */}
            {editTab === 'avatar' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="w-28 h-28 ring-2 ring-border">
                      {(tempAvatar || profile?.avatarUrl) ? (
                        <AvatarImage src={tempAvatar || profile?.avatarUrl} />
                      ) : null}
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                        {getInitials(profileEmail)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full gap-1.5"
                  data-testid="button-upload-avatar"
                >
                  <Camera className="w-4 h-4" />
                  {lang === 'ar' ? 'رفع صورة' : 'Upload Photo'}
                </Button>
              </div>
            )}

            {/* Info Tab */}
            {editTab === 'info' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{tr.name}</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={tr.name}
                    data-testid="input-edit-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>{tr.major}</Label>
                    <Input
                      value={editForm.major}
                      onChange={(e) => setEditForm(prev => ({ ...prev, major: e.target.value }))}
                      placeholder={tr.major}
                      data-testid="input-edit-major"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{tr.level}</Label>
                    <Input
                      value={editForm.level}
                      onChange={(e) => setEditForm(prev => ({ ...prev, level: e.target.value }))}
                      placeholder={tr.level}
                      data-testid="input-edit-level"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{tr.university}</Label>
                  <Input
                    value={editForm.university}
                    onChange={(e) => setEditForm(prev => ({ ...prev, university: e.target.value }))}
                    placeholder={tr.university}
                    data-testid="input-edit-university"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tr.bio}</Label>
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder={tr.bio}
                    className="min-h-[80px] resize-none"
                    data-testid="input-edit-bio"
                  />
                </div>
                
                {/* Privacy toggles */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{tr.showFavorites}</span>
                    <Button
                      size="sm"
                      variant={editForm.showFavorites ? 'default' : 'outline'}
                      onClick={() => setEditForm(prev => ({ ...prev, showFavorites: !prev.showFavorites }))}
                      data-testid="toggle-favorites-dialog"
                    >
                      {editForm.showFavorites ? (lang === 'ar' ? 'عام' : 'Public') : (lang === 'ar' ? 'خاص' : 'Private')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{tr.showInterests}</span>
                    <Button
                      size="sm"
                      variant={editForm.showInterests ? 'default' : 'outline'}
                      onClick={() => setEditForm(prev => ({ ...prev, showInterests: !prev.showInterests }))}
                      data-testid="toggle-interests-dialog"
                    >
                      {editForm.showInterests ? (lang === 'ar' ? 'عام' : 'Public') : (lang === 'ar' ? 'خاص' : 'Private')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {editTab === 'account' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </p>
                    <p className="font-medium text-sm">{user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{tr.phoneLabel}</Label>
                  <Input
                    type="tel"
                    value={privateEditForm.phone}
                    onChange={(e) => { 
                      setPrivateEditForm(prev => ({ ...prev, phone: e.target.value })); 
                      setPrivateEditErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder={lang === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                    className={privateEditErrors.phone ? 'border-destructive' : ''}
                    dir="ltr"
                    data-testid="input-account-phone"
                  />
                  {privateEditErrors.phone && <p className="text-sm text-destructive">{privateEditErrors.phone}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{tr.governorateLabel}</Label>
                    <Select 
                      value={privateEditForm.governorate} 
                      onValueChange={(val) => { 
                        setPrivateEditForm(prev => ({ ...prev, governorate: val, wilayat: '' }));
                        setPrivateEditErrors(prev => ({ ...prev, governorate: '' }));
                      }}
                    >
                      <SelectTrigger className={privateEditErrors.governorate ? 'border-destructive' : ''} data-testid="select-account-governorate">
                        <SelectValue placeholder={tr.selectGovernorate} />
                      </SelectTrigger>
                      <SelectContent>
                        {governorates.map((gov) => (
                          <SelectItem key={gov.value} value={gov.value}>{gov.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {privateEditErrors.governorate && <p className="text-sm text-destructive">{privateEditErrors.governorate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>{tr.wilayatLabel}</Label>
                    <Select 
                      value={privateEditForm.wilayat} 
                      onValueChange={(val) => { 
                        setPrivateEditForm(prev => ({ ...prev, wilayat: val }));
                        setPrivateEditErrors(prev => ({ ...prev, wilayat: '' }));
                      }}
                      disabled={!privateEditForm.governorate}
                    >
                      <SelectTrigger className={privateEditErrors.wilayat ? 'border-destructive' : ''} data-testid="select-account-wilayat">
                        <SelectValue placeholder={tr.selectWilayat} />
                      </SelectTrigger>
                      <SelectContent>
                        {wilayatOptions.map((wil, idx) => (
                          <SelectItem key={idx} value={wil.en}>{lang === 'ar' ? wil.ar : wil.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {privateEditErrors.wilayat && <p className="text-sm text-destructive">{privateEditErrors.wilayat}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Actions */}
          <div className="flex gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnifiedEditDialog(false);
                setTempCover(null);
                setTempAvatar(null);
                setPrivateEditErrors({});
              }}
              className="flex-1"
              data-testid="button-cancel-edit-dialog"
            >
              {tr.cancel}
            </Button>
            <Button
              onClick={() => {
                handleSaveProfile();
                if (user?.email) {
                  const existingAccount = getAccount(user.email);
                  const updates: { phone?: string; region?: { governorate: string; wilayat: string } } = {};
                  if (privateEditForm.phone && privateEditForm.phone.trim()) {
                    updates.phone = privateEditForm.phone;
                  } else if (existingAccount?.phone) {
                    updates.phone = existingAccount.phone;
                  }
                  if (privateEditForm.governorate && privateEditForm.wilayat) {
                    updates.region = {
                      governorate: privateEditForm.governorate,
                      wilayat: privateEditForm.wilayat
                    };
                  } else if (existingAccount?.region) {
                    updates.region = existingAccount.region;
                  }
                  if (Object.keys(updates).length > 0) {
                    updateAccount(user.email, updates);
                  }
                }
                setShowUnifiedEditDialog(false);
                setPrivateEditErrors({});
              }}
              className="flex-1"
              data-testid="button-save-edit-dialog"
            >
              <Check className="w-4 h-4 me-1.5" />
              {tr.save}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
