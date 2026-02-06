import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useDaamStore, type ReportReason, ADMIN_EMAILS } from "@/hooks/use-daam-store";
import { AcademicProfileShell, type ProfileTab } from "@/components/profile/AcademicProfileShell";

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
  ArrowLeft,
  Link2,
  StickyNote,
  FlaskConical,
  Tag,
  Upload,
  KeyRound,
  Eye,
  EyeOff
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

// Types for Materials and Research tabs
type ProfileMaterial = {
  id: string;
  title: string;
  kind: "pdf" | "link" | "note";
  url?: string;
  note?: string;
  createdAt: number;
};

type ProfileResearch = {
  id: string;
  title: string;
  abstract?: string;
  tags?: string[];
  pdfUrl?: string;
  pdfName?: string;
  createdAt: number;
};

// localStorage helpers for Materials
function loadMaterials(email: string): ProfileMaterial[] {
  try {
    const key = `daam_profile_materials_v1::${email}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveMaterials(email: string, items: ProfileMaterial[]): void {
  try {
    const key = `daam_profile_materials_v1::${email}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage error, ignore
  }
}

// localStorage helpers for Research
function loadResearch(email: string): ProfileResearch[] {
  try {
    const key = `daam_profile_research_v1::${email}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveResearch(email: string, items: ProfileResearch[]): void {
  try {
    const key = `daam_profile_research_v1::${email}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage error, ignore
  }
}

// Feature flag for new Academic Shell UI
const USE_ACADEMIC_SHELL = true;

// Tab mapping between AcademicProfileShell and activeView
const shellTabToActiveView: Record<ProfileTab, 'dashboard' | 'posts' | 'saved' | 'materials' | 'research'> = {
  posts: 'posts',
  materials: 'materials',
  research: 'research',
  activity: 'dashboard',
  saved: 'saved',
};

const activeViewToShellTab = (view: string): ProfileTab => {
  switch (view) {
    case 'posts': return 'posts';
    case 'materials': return 'materials';
    case 'research': return 'research';
    case 'dashboard': return 'activity';
    case 'saved': return 'saved';
    default: return 'activity';
  }
};

export default function Profile() {
  const { user, posts, lang, theme, getProfile, getAccount, updateAccount, updateProfile, toggleFollow, isFollowing, submitReport, moderators, canSendDM } = useDaamStore();
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
  const [activeView, setActiveView] = useState<'dashboard' | 'posts' | 'replies' | 'saved' | 'library' | 'interests' | 'private' | 'materials' | 'research'>('dashboard');
  const [libraryFilter, setLibraryFilter] = useState<'saved' | 'files' | 'summaries'>('saved');
  const [isEditing, setIsEditing] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | ''>('');
  const [reportNote, setReportNote] = useState('');
  
  // Materials & Research state
  const [materials, setMaterials] = useState<ProfileMaterial[]>([]);
  const [research, setResearch] = useState<ProfileResearch[]>([]);
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false);
  const [showAddResearchDialog, setShowAddResearchDialog] = useState(false);
  const [newMaterial, setNewMaterial] = useState<{title: string; kind: "pdf"|"link"|"note"; url: string; note: string}>({title: '', kind: 'pdf', url: '', note: ''});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string>('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [showEditMaterialDialog, setShowEditMaterialDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ProfileMaterial | null>(null);
  const [editMaterialForm, setEditMaterialForm] = useState<{title: string; url: string; note: string}>({title: '', url: '', note: ''});
  const [showDeleteMaterialConfirm, setShowDeleteMaterialConfirm] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [viewingNote, setViewingNote] = useState<ProfileMaterial | null>(null);
  const [newResearch, setNewResearch] = useState<{title: string; abstract: string; tags: string}>({title: '', abstract: '', tags: ''});
  const [researchPdfFile, setResearchPdfFile] = useState<File | null>(null);
  const [isUploadingResearchPdf, setIsUploadingResearchPdf] = useState(false);
  const [showEditResearchDialog, setShowEditResearchDialog] = useState(false);
  const [editingResearch, setEditingResearch] = useState<ProfileResearch | null>(null);
  const [editResearchForm, setEditResearchForm] = useState<{title: string; abstract: string; tags: string}>({title: '', abstract: '', tags: ''});
  const [editResearchPdfFile, setEditResearchPdfFile] = useState<File | null>(null);
  const [showDeleteResearchConfirm, setShowDeleteResearchConfirm] = useState(false);
  const [deletingResearchId, setDeletingResearchId] = useState<string | null>(null);
  const [isDeletingResearch, setIsDeletingResearch] = useState(false);
  const researchPdfInputRef = useRef<HTMLInputElement>(null);
  const editResearchPdfInputRef = useRef<HTMLInputElement>(null);
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
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [cpForm, setCpForm] = useState({ current: '', newPw: '', confirm: '' });
  const [cpErrors, setCpErrors] = useState<Record<string, string>>({});
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpSubmitted, setCpSubmitted] = useState(false);
  
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

  // Load materials and research from localStorage
  useEffect(() => {
    if (profileEmail) {
      setMaterials(loadMaterials(profileEmail));
      setResearch(loadResearch(profileEmail));
    }
  }, [profileEmail]);

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

  // Theme-aware profile background colors
  const isDarkMode = theme === 'dark';
  const DARK_BG = '#0B1020';
  const LIGHT_BG = '#F4F5FB';
  const profileBg = isDarkMode ? DARK_BG : LIGHT_BG;

  // Prepare data for AcademicProfileShell
  const shellDisplayName = profile?.name || profileEmail.split('@')[0];
  const shellSubtitleLine1 = profile?.major 
    ? `${profile.major}${profile.level ? ` (${profile.level})` : ''}${profile.university ? ` – ${profile.university}` : ''}`
    : undefined;
  const shellStats = {
    posts: userPosts.length,
    followers: profile?.followers?.length || 0,
    following: profile?.following?.length || 0,
  };

  // Handler for opening the unified edit dialog from Shell
  const handleShellEditClick = () => {
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
  };

  // USE_ACADEMIC_SHELL: New Shell Layout
  if (USE_ACADEMIC_SHELL) {
    return (
      <div data-testid="profile-page" key={profileEmail ?? "me"}>
        {/* Hidden file inputs for edit dialog */}
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

        <AcademicProfileShell
          coverUrl={coverImage}
          avatarUrl={profile?.avatarUrl}
          displayName={shellDisplayName}
          subtitleLine1={shellSubtitleLine1}
          bio={profile?.bio}
          stats={shellStats}
          isOwner={isOwnProfile}
          isRTL={isRTL}
          onEditClick={handleShellEditClick}
          onFollowClick={() => toggleFollow(profileEmail)}
          onMessageClick={() => {
            const dmCheck = canSendDM(profileEmail);
            if (dmCheck.allowed) {
              navigate(`/messages?to=${encodeURIComponent(profileEmail)}`);
            }
          }}
          onPostsClick={() => setActiveView('posts')}
          onFollowersClick={() => setShowFollowersDialog(true)}
          onFollowingClick={() => setShowFollowingDialog(true)}
          activeTab={activeViewToShellTab(activeView)}
          onTabChange={(tab) => setActiveView(shellTabToActiveView[tab])}
        >
          {/* Render content based on activeView */}
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
            </div>
          )}

          {/* Posts View */}
          {activeView === 'posts' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{tr.posts}</h2>
              {userPosts.length === 0 ? (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{tr.noPosts}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {userPosts.map(post => renderPostCard(post))}
                </div>
              )}
            </div>
          )}

          {/* Saved View */}
          {activeView === 'saved' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{tr.saved}</h2>
              {!canViewFavorites && !isOwnProfile ? (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{tr.private}</p>
                  </CardContent>
                </Card>
              ) : savedPosts.length === 0 ? (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{tr.noSavedPosts}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {savedPosts.map(post => renderPostCard(post))}
                </div>
              )}
            </div>
          )}

          {/* Materials View */}
          {activeView === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold">{lang === 'ar' ? 'المواد الدراسية' : 'Study Materials'}</h2>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddMaterialDialog(true)}
                    className="gap-1.5"
                    data-testid="button-add-material"
                  >
                    <Plus className="w-4 h-4" />
                    {lang === 'ar' ? 'إضافة مادة' : 'Add Material'}
                  </Button>
                )}
              </div>
              
              {materials.length === 0 ? (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {lang === 'ar' ? 'لا توجد مواد بعد' : 'No materials yet'}
                    </p>
                    {isOwnProfile && (
                      <p className="text-sm text-muted-foreground/70 mt-2">
                        {lang === 'ar' ? 'أضف موادك الدراسية لتنظيمها' : 'Add your study materials to organize them'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {materials.map(item => (
                    <Card 
                      key={item.id} 
                      className={`bg-card/50 hover-elevate ${item.url || item.kind === 'note' ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (item.kind === 'note') {
                          setViewingNote(item);
                        } else if (item.url) {
                          window.open(item.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      data-testid={`material-${item.id}`}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/50">
                          {item.kind === 'pdf' && <FileText className="w-5 h-5 text-red-500" />}
                          {item.kind === 'link' && <Link2 className="w-5 h-5 text-blue-500" />}
                          {item.kind === 'note' && <StickyNote className="w-5 h-5 text-yellow-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.title}</h3>
                          {item.kind === 'note' && item.note && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.note}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.kind === 'pdf' ? 'PDF' : item.kind === 'link' ? (lang === 'ar' ? 'رابط' : 'Link') : (lang === 'ar' ? 'ملاحظة' : 'Note')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: lang === 'ar' ? ar : enUS })}
                            </span>
                          </div>
                        </div>
                        {item.url && (
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        )}
                        {item.kind === 'note' && (
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                        )}
                        {isOwnProfile && (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingMaterial(item);
                                setEditMaterialForm({ title: item.title, url: item.url || '', note: item.note || '' });
                                setShowEditMaterialDialog(true);
                              }}
                              data-testid={`button-edit-material-${item.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => {
                                setDeletingMaterialId(item.id);
                                setShowDeleteMaterialConfirm(true);
                              }}
                              data-testid={`button-delete-material-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Research View */}
          {activeView === 'research' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold">{lang === 'ar' ? 'البحوث الأكاديمية' : 'Academic Research'}</h2>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddResearchDialog(true)}
                    className="gap-1.5"
                    data-testid="button-add-research"
                  >
                    <Plus className="w-4 h-4" />
                    {lang === 'ar' ? 'إضافة بحث' : 'Add Research'}
                  </Button>
                )}
              </div>
              
              {research.length === 0 ? (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <FlaskConical className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {lang === 'ar' ? 'لا توجد بحوث بعد' : 'No research yet'}
                    </p>
                    {isOwnProfile && (
                      <p className="text-sm text-muted-foreground/70 mt-2">
                        {lang === 'ar' ? 'أضف بحوثك الأكاديمية لعرضها' : 'Add your academic research to showcase them'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {research.map(item => (
                    <Card key={item.id} className="bg-card/50 hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted/50 mt-0.5">
                            <FlaskConical className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium">{item.title}</h3>
                              {isOwnProfile && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingResearch(item);
                                      setEditResearchForm({
                                        title: item.title,
                                        abstract: item.abstract || '',
                                        tags: item.tags?.join(', ') || ''
                                      });
                                      setEditResearchPdfFile(null);
                                      setShowEditResearchDialog(true);
                                    }}
                                    data-testid={`button-edit-research-${item.id}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setDeletingResearchId(item.id);
                                      setShowDeleteResearchConfirm(true);
                                    }}
                                    data-testid={`button-delete-research-${item.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {item.abstract && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.abstract}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {item.pdfUrl && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer gap-1"
                                  onClick={() => window.open(item.pdfUrl, '_blank', 'noopener,noreferrer')}
                                  data-testid={`badge-pdf-research-${item.id}`}
                                >
                                  <FileText className="w-3 h-3" />
                                  PDF
                                </Badge>
                              )}
                              {item.tags && item.tags.length > 0 && item.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: lang === 'ar' ? ar : enUS })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Library View (old - kept for backward compatibility) */}
          {activeView === 'library' && isOwnProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant={libraryFilter === 'saved' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setLibraryFilter('saved')}
                >
                  {lang === 'ar' ? 'المحفوظات' : 'Saved'}
                </Badge>
                <Badge 
                  variant={libraryFilter === 'files' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setLibraryFilter('files')}
                >
                  {lang === 'ar' ? 'الملفات' : 'Files'}
                </Badge>
                <Badge 
                  variant={libraryFilter === 'summaries' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setLibraryFilter('summaries')}
                >
                  {lang === 'ar' ? 'الملخصات' : 'Summaries'}
                </Badge>
              </div>
              
              {libraryFilter === 'saved' && (
                savedPosts.length === 0 ? (
                  <Card className="bg-card/50">
                    <CardContent className="text-center py-12">
                      <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">{tr.noSavedPosts}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {savedPosts.map(post => renderPostCard(post))}
                  </div>
                )
              )}
              
              {libraryFilter === 'files' && (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد ملفات بعد' : 'No files yet'}</p>
                  </CardContent>
                </Card>
              )}
              
              {libraryFilter === 'summaries' && (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد ملخصات بعد' : 'No summaries yet'}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Interests View (Research tab) */}
          {activeView === 'interests' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{lang === 'ar' ? 'الاهتمامات' : 'Interests'}</h2>
              {!canViewInterests && !isOwnProfile ? (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{tr.private}</p>
                  </CardContent>
                </Card>
              ) : (profile?.interests?.length || 0) === 0 ? (
                <Card className="bg-card/50">
                  <CardContent className="text-center py-12">
                    <Hash className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد اهتمامات بعد' : 'No interests yet'}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.interests?.map((interest, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </AcademicProfileShell>

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
                        const targetPath = `/profile/${encodeURIComponent(followerEmail)}`;
                        navigate(targetPath);
                        queueMicrotask(() => setShowFollowersDialog(false));
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
                  {lang === 'ar' ? 'لا يتابع أحد بعد' : 'Not following anyone yet'}
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
                        const targetPath = `/profile/${encodeURIComponent(followingEmail)}`;
                        navigate(targetPath);
                        queueMicrotask(() => setShowFollowingDialog(false));
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
          <DialogContent 
            className="max-w-md p-0 border-0 bg-transparent shadow-none"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className="relative flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Avatar className="w-64 h-64 md:w-80 md:h-80 ring-4 ring-white/20">
                {profile?.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} />
                ) : null}
                <AvatarFallback className="text-6xl md:text-7xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  {getInitials(profileEmail)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-2 -right-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background"
                onClick={() => setShowAvatarPreview(false)}
                data-testid="button-close-avatar-preview"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report User Dialog */}
        <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-500" />
                {tr.reportUser}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{tr.reportReason}</Label>
                <Select value={reportReason} onValueChange={(val) => setReportReason(val as ReportReason)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tr.selectReason} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">{lang === 'ar' ? 'سبام / إزعاج' : 'Spam'}</SelectItem>
                    <SelectItem value="harassment">{lang === 'ar' ? 'تحرش / مضايقة' : 'Harassment'}</SelectItem>
                    <SelectItem value="inappropriate">{lang === 'ar' ? 'محتوى غير لائق' : 'Inappropriate'}</SelectItem>
                    <SelectItem value="misinformation">{lang === 'ar' ? 'معلومات مضللة' : 'Misinformation'}</SelectItem>
                    <SelectItem value="other">{lang === 'ar' ? 'سبب آخر' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tr.reportNote}</Label>
                <Textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'صف المشكلة...' : 'Describe the problem...'}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReportModalOpen(false)} className="flex-1">
                  {tr.cancel}
                </Button>
                <Button 
                  onClick={() => {
                    if (reportReason && user?.email) {
                      submitReport('user', profileEmail, profile?.name || profileEmail, reportReason as ReportReason, reportNote || undefined);
                      toast({ title: tr.reportSuccess, description: tr.reportSuccessDesc });
                      setReportModalOpen(false);
                      setReportReason('');
                      setReportNote('');
                    }
                  }}
                  disabled={!reportReason}
                  className="flex-1"
                >
                  {tr.reportSubmit}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Material Dialog */}
        <Dialog open={showAddMaterialDialog} onOpenChange={setShowAddMaterialDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{lang === 'ar' ? 'إضافة مادة جديدة' : 'Add New Material'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'عنوان المادة' : 'Material Title'}</Label>
                <Input
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={lang === 'ar' ? 'أدخل عنوان المادة...' : 'Enter material title...'}
                  data-testid="input-material-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'نوع المادة' : 'Material Type'}</Label>
                <Select value={newMaterial.kind} onValueChange={(v) => setNewMaterial(prev => ({ ...prev, kind: v as "pdf"|"link"|"note" }))}>
                  <SelectTrigger data-testid="select-material-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="link">{lang === 'ar' ? 'رابط' : 'Link'}</SelectItem>
                    <SelectItem value="note">{lang === 'ar' ? 'ملاحظة' : 'Note'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newMaterial.kind === 'pdf' && (
                <div className="space-y-2">
                  <Label>{lang === 'ar' ? 'ملف PDF' : 'PDF File'}</Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPdfFile(file);
                      setPdfUploadError('');
                    }}
                    data-testid="input-material-pdf"
                  />
                  {pdfFile && (
                    <p className="text-xs text-muted-foreground">{pdfFile.name}</p>
                  )}
                  {pdfUploadError && (
                    <p className="text-xs text-destructive">{pdfUploadError}</p>
                  )}
                </div>
              )}
              {newMaterial.kind === 'link' && (
                <div className="space-y-2">
                  <Label>{lang === 'ar' ? 'الرابط' : 'URL'}</Label>
                  <Input
                    value={newMaterial.url}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-material-url"
                  />
                </div>
              )}
              {newMaterial.kind === 'note' && (
                <div className="space-y-2">
                  <Label>{lang === 'ar' ? 'نص الملاحظة' : 'Note content'}</Label>
                  <Textarea
                    value={newMaterial.note}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, note: e.target.value }))}
                    placeholder={lang === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                    className="min-h-[100px] resize-none"
                    data-testid="input-material-note"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddMaterialDialog(false);
                    setNewMaterial({ title: '', kind: 'pdf', url: '', note: '' });
                    setPdfFile(null);
                    setPdfUploadError('');
                  }} 
                  className="flex-1"
                >
                  {tr.cancel}
                </Button>
                <Button
                  onClick={async () => {
                    if (!newMaterial.title.trim() || !profileEmail) return;
                    
                    if (newMaterial.kind === 'pdf') {
                      if (!pdfFile) {
                        setPdfUploadError(lang === 'ar' ? 'اختر ملف PDF' : 'Select a PDF file');
                        return;
                      }
                      
                      setIsUploadingPdf(true);
                      setPdfUploadError('');
                      
                      try {
                        const fd = new FormData();
                        fd.append('file', pdfFile);
                        const res = await fetch('/api/materials/upload', {
                          method: 'POST',
                          body: fd
                        });
                        
                        if (!res.ok) {
                          try {
                            const errData = await res.json();
                            setPdfUploadError(errData.error || (lang === 'ar' ? 'فشل الرفع' : 'Upload failed'));
                          } catch {
                            setPdfUploadError(lang === 'ar' ? 'فشل الرفع' : 'Upload failed');
                          }
                          setIsUploadingPdf(false);
                          return;
                        }
                        
                        const data = await res.json();
                        
                        if (!data.ok) {
                          setPdfUploadError(data.error || (lang === 'ar' ? 'فشل الرفع' : 'Upload failed'));
                          setIsUploadingPdf(false);
                          return;
                        }
                        
                        const item: ProfileMaterial = {
                          id: crypto.randomUUID(),
                          title: newMaterial.title.trim(),
                          kind: 'pdf',
                          url: data.url,
                          createdAt: Date.now()
                        };
                        const updated = [...materials, item];
                        setMaterials(updated);
                        saveMaterials(profileEmail, updated);
                        setShowAddMaterialDialog(false);
                        setNewMaterial({ title: '', kind: 'pdf', url: '', note: '' });
                        setPdfFile(null);
                        setPdfUploadError('');
                        toast({
                          title: lang === 'ar' ? 'تمت الإضافة' : 'Added',
                          description: lang === 'ar' ? 'تم رفع المادة بنجاح' : 'Material uploaded successfully'
                        });
                      } catch (err) {
                        setPdfUploadError(lang === 'ar' ? 'فشل الرفع' : 'Upload failed');
                      } finally {
                        setIsUploadingPdf(false);
                      }
                    } else if (newMaterial.kind === 'note') {
                      if (!newMaterial.note.trim()) {
                        toast({
                          title: lang === 'ar' ? 'خطأ' : 'Error',
                          description: lang === 'ar' ? 'الرجاء كتابة نص الملاحظة' : 'Please write note content',
                          variant: 'destructive'
                        });
                        return;
                      }
                      const item: ProfileMaterial = {
                        id: crypto.randomUUID(),
                        title: newMaterial.title.trim(),
                        kind: 'note',
                        note: newMaterial.note.trim(),
                        createdAt: Date.now()
                      };
                      const updated = [...materials, item];
                      setMaterials(updated);
                      saveMaterials(profileEmail, updated);
                      setShowAddMaterialDialog(false);
                      setNewMaterial({ title: '', kind: 'pdf', url: '', note: '' });
                      toast({
                        title: lang === 'ar' ? 'تمت الإضافة' : 'Added',
                        description: lang === 'ar' ? 'تم إضافة الملاحظة بنجاح' : 'Note added successfully'
                      });
                    } else {
                      const item: ProfileMaterial = {
                        id: crypto.randomUUID(),
                        title: newMaterial.title.trim(),
                        kind: newMaterial.kind,
                        url: newMaterial.url.trim() || undefined,
                        createdAt: Date.now()
                      };
                      const updated = [...materials, item];
                      setMaterials(updated);
                      saveMaterials(profileEmail, updated);
                      setShowAddMaterialDialog(false);
                      setNewMaterial({ title: '', kind: 'pdf', url: '', note: '' });
                      toast({
                        title: lang === 'ar' ? 'تمت الإضافة' : 'Added',
                        description: lang === 'ar' ? 'تم إضافة المادة بنجاح' : 'Material added successfully'
                      });
                    }
                  }}
                  disabled={!newMaterial.title.trim() || isUploadingPdf}
                  className="flex-1"
                  data-testid="button-save-material"
                >
                  {isUploadingPdf ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : tr.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Material Dialog */}
        <Dialog open={showEditMaterialDialog} onOpenChange={(open) => {
          setShowEditMaterialDialog(open);
          if (!open) {
            setEditingMaterial(null);
            setEditMaterialForm({ title: '', url: '', note: '' });
          }
        }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{lang === 'ar' ? 'تعديل المادة' : 'Edit Material'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'العنوان' : 'Title'}</Label>
                <Input
                  value={editMaterialForm.title}
                  onChange={(e) => setEditMaterialForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={lang === 'ar' ? 'عنوان المادة...' : 'Material title...'}
                  data-testid="input-edit-material-title"
                />
              </div>
              {editingMaterial?.kind === 'link' && (
                <div className="space-y-2">
                  <Label>{lang === 'ar' ? 'الرابط' : 'URL'}</Label>
                  <Input
                    value={editMaterialForm.url}
                    onChange={(e) => setEditMaterialForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-edit-material-url"
                  />
                </div>
              )}
              {editingMaterial?.kind === 'pdf' && (
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? 'ملف PDF لا يمكن تغييره، يمكنك تعديل العنوان فقط.' : 'PDF file cannot be changed, you can only edit the title.'}
                </p>
              )}
              {editingMaterial?.kind === 'note' && (
                <div className="space-y-2">
                  <Label>{lang === 'ar' ? 'نص الملاحظة' : 'Note content'}</Label>
                  <Textarea
                    value={editMaterialForm.note}
                    onChange={(e) => setEditMaterialForm(prev => ({ ...prev, note: e.target.value }))}
                    placeholder={lang === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                    className="min-h-[100px] resize-none"
                    data-testid="input-edit-material-note"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditMaterialDialog(false)}
                  className="flex-1"
                  data-testid="button-cancel-edit-material"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => {
                    if (!editingMaterial || !user?.email) return;
                    const updated = materials.map(m => 
                      m.id === editingMaterial.id
                        ? { 
                            ...m, 
                            title: editMaterialForm.title.trim(), 
                            url: editingMaterial.kind === 'link' ? editMaterialForm.url.trim() : m.url,
                            note: editingMaterial.kind === 'note' ? editMaterialForm.note.trim() : m.note
                          }
                        : m
                    );
                    setMaterials(updated);
                    saveMaterials(user.email, updated);
                    setShowEditMaterialDialog(false);
                    setEditingMaterial(null);
                    setEditMaterialForm({ title: '', url: '', note: '' });
                    toast({
                      title: lang === 'ar' ? 'تم التحديث' : 'Updated',
                      description: lang === 'ar' ? 'تم تعديل المادة بنجاح' : 'Material updated successfully'
                    });
                  }}
                  disabled={!editMaterialForm.title.trim()}
                  className="flex-1"
                  data-testid="button-save-edit-material"
                >
                  {tr.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Material Confirmation Dialog */}
        <Dialog open={showDeleteMaterialConfirm} onOpenChange={(open) => {
          setShowDeleteMaterialConfirm(open);
          if (!open) {
            setDeletingMaterialId(null);
            setIsDeletingMaterial(false);
          }
        }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>{lang === 'ar' ? 'حذف المادة' : 'Delete Material'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">
              {lang === 'ar' ? 'هل أنت متأكد من حذف هذه المادة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this material? This action cannot be undone.'}
            </p>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteMaterialConfirm(false)}
                className="flex-1"
                disabled={isDeletingMaterial}
                data-testid="button-cancel-delete-material"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deletingMaterialId || !user?.email) return;
                  const material = materials.find(m => m.id === deletingMaterialId);
                  if (!material) return;
                  
                  setIsDeletingMaterial(true);
                  
                  if (material.kind === 'pdf' && material.url) {
                    try {
                      const res = await fetch('/api/materials', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: material.url })
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        toast({
                          title: lang === 'ar' ? 'خطأ' : 'Error',
                          description: data.error || (lang === 'ar' ? 'فشل حذف الملف' : 'Failed to delete file'),
                          variant: 'destructive'
                        });
                        setIsDeletingMaterial(false);
                        return;
                      }
                    } catch {
                      toast({
                        title: lang === 'ar' ? 'خطأ' : 'Error',
                        description: lang === 'ar' ? 'فشل حذف الملف' : 'Failed to delete file',
                        variant: 'destructive'
                      });
                      setIsDeletingMaterial(false);
                      return;
                    }
                  }
                  
                  const updated = materials.filter(m => m.id !== deletingMaterialId);
                  setMaterials(updated);
                  saveMaterials(user.email, updated);
                  setShowDeleteMaterialConfirm(false);
                  setDeletingMaterialId(null);
                  setIsDeletingMaterial(false);
                  toast({
                    title: lang === 'ar' ? 'تم الحذف' : 'Deleted',
                    description: lang === 'ar' ? 'تم حذف المادة بنجاح' : 'Material deleted successfully'
                  });
                }}
                className="flex-1"
                disabled={isDeletingMaterial}
                data-testid="button-confirm-delete-material"
              >
                {isDeletingMaterial ? (lang === 'ar' ? 'جاري الحذف...' : 'Deleting...') : (lang === 'ar' ? 'حذف' : 'Delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Note Dialog */}
        <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{viewingNote?.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{viewingNote?.note}</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setViewingNote(null)}
                data-testid="button-close-view-note"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Research Dialog */}
        <Dialog open={showAddResearchDialog} onOpenChange={setShowAddResearchDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{lang === 'ar' ? 'إضافة بحث جديد' : 'Add New Research'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'عنوان البحث' : 'Research Title'}</Label>
                <Input
                  value={newResearch.title}
                  onChange={(e) => setNewResearch(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={lang === 'ar' ? 'أدخل عنوان البحث...' : 'Enter research title...'}
                  data-testid="input-research-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'ملخص (اختياري)' : 'Abstract (optional)'}</Label>
                <Textarea
                  value={newResearch.abstract}
                  onChange={(e) => setNewResearch(prev => ({ ...prev, abstract: e.target.value }))}
                  placeholder={lang === 'ar' ? 'ملخص مختصر للبحث...' : 'Brief summary of research...'}
                  className="min-h-[80px] resize-none"
                  data-testid="input-research-abstract"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'الوسوم (مفصولة بفاصلة)' : 'Tags (comma-separated)'}</Label>
                <Input
                  value={newResearch.tags}
                  onChange={(e) => setNewResearch(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder={lang === 'ar' ? 'ذكاء اصطناعي, تعلم آلي...' : 'AI, Machine Learning...'}
                  data-testid="input-research-tags"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'ملف PDF (اختياري)' : 'PDF file (optional)'}</Label>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={researchPdfInputRef}
                  onChange={(e) => setResearchPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                  data-testid="input-research-pdf"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => researchPdfInputRef.current?.click()}
                    data-testid="button-select-research-pdf"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {lang === 'ar' ? 'اختيار ملف' : 'Select file'}
                  </Button>
                  {researchPdfFile && (
                    <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                      {researchPdfFile.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddResearchDialog(false);
                    setNewResearch({ title: '', abstract: '', tags: '' });
                    setResearchPdfFile(null);
                  }} 
                  className="flex-1"
                >
                  {tr.cancel}
                </Button>
                <Button
                  onClick={async () => {
                    if (!newResearch.title.trim() || !profileEmail) return;
                    
                    setIsUploadingResearchPdf(true);
                    let pdfUrl: string | undefined;
                    let pdfName: string | undefined;
                    
                    if (researchPdfFile) {
                      try {
                        const fd = new FormData();
                        fd.append('file', researchPdfFile);
                        const res = await fetch('/api/materials/upload', { method: 'POST', body: fd });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          toast({
                            title: lang === 'ar' ? 'خطأ' : 'Error',
                            description: data.error || (lang === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file'),
                            variant: 'destructive'
                          });
                          setIsUploadingResearchPdf(false);
                          return;
                        }
                        const data = await res.json();
                        pdfUrl = data.url;
                        pdfName = researchPdfFile.name;
                      } catch {
                        toast({
                          title: lang === 'ar' ? 'خطأ' : 'Error',
                          description: lang === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file',
                          variant: 'destructive'
                        });
                        setIsUploadingResearchPdf(false);
                        return;
                      }
                    }
                    
                    const tags = newResearch.tags.split(',').map(t => t.trim()).filter(Boolean);
                    const item: ProfileResearch = {
                      id: crypto.randomUUID(),
                      title: newResearch.title.trim(),
                      abstract: newResearch.abstract.trim() || undefined,
                      tags: tags.length > 0 ? tags : undefined,
                      pdfUrl,
                      pdfName,
                      createdAt: Date.now()
                    };
                    const updated = [...research, item];
                    setResearch(updated);
                    saveResearch(profileEmail, updated);
                    setShowAddResearchDialog(false);
                    setNewResearch({ title: '', abstract: '', tags: '' });
                    setResearchPdfFile(null);
                    setIsUploadingResearchPdf(false);
                    toast({
                      title: lang === 'ar' ? 'تمت الإضافة' : 'Added',
                      description: lang === 'ar' ? 'تم إضافة البحث بنجاح' : 'Research added successfully'
                    });
                  }}
                  disabled={!newResearch.title.trim() || isUploadingResearchPdf}
                  className="flex-1"
                  data-testid="button-save-research"
                >
                  {isUploadingResearchPdf ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : tr.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Research Dialog */}
        <Dialog open={showEditResearchDialog} onOpenChange={(open) => {
          setShowEditResearchDialog(open);
          if (!open) {
            setEditingResearch(null);
            setEditResearchForm({ title: '', abstract: '', tags: '' });
            setEditResearchPdfFile(null);
          }
        }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{lang === 'ar' ? 'تعديل البحث' : 'Edit Research'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'عنوان البحث' : 'Research Title'}</Label>
                <Input
                  value={editResearchForm.title}
                  onChange={(e) => setEditResearchForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={lang === 'ar' ? 'أدخل عنوان البحث...' : 'Enter research title...'}
                  data-testid="input-edit-research-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'ملخص (اختياري)' : 'Abstract (optional)'}</Label>
                <Textarea
                  value={editResearchForm.abstract}
                  onChange={(e) => setEditResearchForm(prev => ({ ...prev, abstract: e.target.value }))}
                  placeholder={lang === 'ar' ? 'ملخص مختصر للبحث...' : 'Brief summary of research...'}
                  className="min-h-[80px] resize-none"
                  data-testid="input-edit-research-abstract"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'الوسوم (مفصولة بفاصلة)' : 'Tags (comma-separated)'}</Label>
                <Input
                  value={editResearchForm.tags}
                  onChange={(e) => setEditResearchForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder={lang === 'ar' ? 'ذكاء اصطناعي, تعلم آلي...' : 'AI, Machine Learning...'}
                  data-testid="input-edit-research-tags"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'ملف PDF' : 'PDF file'}</Label>
                {editingResearch?.pdfUrl && !editResearchPdfFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{editingResearch.pdfName || 'PDF'}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!editingResearch?.pdfUrl || !user?.email) return;
                        try {
                          const res = await fetch('/api/materials', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: editingResearch.pdfUrl })
                          });
                          if (res.ok) {
                            const updated = research.map(r => 
                              r.id === editingResearch.id 
                                ? { ...r, pdfUrl: undefined, pdfName: undefined } 
                                : r
                            );
                            setResearch(updated);
                            saveResearch(user.email, updated);
                            setEditingResearch({ ...editingResearch, pdfUrl: undefined, pdfName: undefined });
                            toast({
                              title: lang === 'ar' ? 'تم الحذف' : 'Removed',
                              description: lang === 'ar' ? 'تم إزالة ملف PDF' : 'PDF file removed'
                            });
                          }
                        } catch {
                          toast({
                            title: lang === 'ar' ? 'خطأ' : 'Error',
                            description: lang === 'ar' ? 'فشل إزالة الملف' : 'Failed to remove file',
                            variant: 'destructive'
                          });
                        }
                      }}
                      className="text-destructive"
                      data-testid="button-remove-research-pdf"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  ref={editResearchPdfInputRef}
                  onChange={(e) => setEditResearchPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                  data-testid="input-edit-research-pdf"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editResearchPdfInputRef.current?.click()}
                    data-testid="button-select-edit-research-pdf"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {editingResearch?.pdfUrl ? (lang === 'ar' ? 'استبدال ملف' : 'Replace file') : (lang === 'ar' ? 'اختيار ملف' : 'Select file')}
                  </Button>
                  {editResearchPdfFile && (
                    <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                      {editResearchPdfFile.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditResearchDialog(false)} 
                  className="flex-1"
                  data-testid="button-cancel-edit-research"
                >
                  {tr.cancel}
                </Button>
                <Button
                  onClick={async () => {
                    if (!editingResearch || !editResearchForm.title.trim() || !user?.email) return;
                    
                    setIsUploadingResearchPdf(true);
                    let pdfUrl = editingResearch.pdfUrl;
                    let pdfName = editingResearch.pdfName;
                    
                    if (editResearchPdfFile) {
                      try {
                        if (editingResearch.pdfUrl) {
                          await fetch('/api/materials', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: editingResearch.pdfUrl })
                          });
                        }
                        
                        const fd = new FormData();
                        fd.append('file', editResearchPdfFile);
                        const res = await fetch('/api/materials/upload', { method: 'POST', body: fd });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          toast({
                            title: lang === 'ar' ? 'خطأ' : 'Error',
                            description: data.error || (lang === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file'),
                            variant: 'destructive'
                          });
                          setIsUploadingResearchPdf(false);
                          return;
                        }
                        const data = await res.json();
                        pdfUrl = data.url;
                        pdfName = editResearchPdfFile.name;
                      } catch {
                        toast({
                          title: lang === 'ar' ? 'خطأ' : 'Error',
                          description: lang === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file',
                          variant: 'destructive'
                        });
                        setIsUploadingResearchPdf(false);
                        return;
                      }
                    }
                    
                    const tags = editResearchForm.tags.split(',').map(t => t.trim()).filter(Boolean);
                    const updated = research.map(r => 
                      r.id === editingResearch.id
                        ? {
                            ...r,
                            title: editResearchForm.title.trim(),
                            abstract: editResearchForm.abstract.trim() || undefined,
                            tags: tags.length > 0 ? tags : undefined,
                            pdfUrl,
                            pdfName
                          }
                        : r
                    );
                    setResearch(updated);
                    saveResearch(user.email, updated);
                    setShowEditResearchDialog(false);
                    setEditingResearch(null);
                    setEditResearchForm({ title: '', abstract: '', tags: '' });
                    setEditResearchPdfFile(null);
                    setIsUploadingResearchPdf(false);
                    toast({
                      title: lang === 'ar' ? 'تم التحديث' : 'Updated',
                      description: lang === 'ar' ? 'تم تعديل البحث بنجاح' : 'Research updated successfully'
                    });
                  }}
                  disabled={!editResearchForm.title.trim() || isUploadingResearchPdf}
                  className="flex-1"
                  data-testid="button-save-edit-research"
                >
                  {isUploadingResearchPdf ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : tr.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Research Confirmation Dialog */}
        <Dialog open={showDeleteResearchConfirm} onOpenChange={(open) => {
          setShowDeleteResearchConfirm(open);
          if (!open) {
            setDeletingResearchId(null);
          }
        }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">
              {lang === 'ar' ? 'هل أنت متأكد من حذف هذا البحث؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this research? This action cannot be undone.'}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteResearchConfirm(false)}
                className="flex-1"
                data-testid="button-cancel-delete-research"
              >
                {tr.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deletingResearchId || !user?.email) return;
                  
                  setIsDeletingResearch(true);
                  const researchItem = research.find(r => r.id === deletingResearchId);
                  
                  if (researchItem?.pdfUrl) {
                    try {
                      const res = await fetch('/api/materials', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: researchItem.pdfUrl })
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        toast({
                          title: lang === 'ar' ? 'خطأ' : 'Error',
                          description: data.error || (lang === 'ar' ? 'فشل حذف الملف' : 'Failed to delete file'),
                          variant: 'destructive'
                        });
                        setIsDeletingResearch(false);
                        return;
                      }
                    } catch {
                      toast({
                        title: lang === 'ar' ? 'خطأ' : 'Error',
                        description: lang === 'ar' ? 'فشل حذف الملف' : 'Failed to delete file',
                        variant: 'destructive'
                      });
                      setIsDeletingResearch(false);
                      return;
                    }
                  }
                  
                  const updated = research.filter(r => r.id !== deletingResearchId);
                  setResearch(updated);
                  saveResearch(user.email, updated);
                  setShowDeleteResearchConfirm(false);
                  setDeletingResearchId(null);
                  setIsDeletingResearch(false);
                  toast({
                    title: lang === 'ar' ? 'تم الحذف' : 'Deleted',
                    description: lang === 'ar' ? 'تم حذف البحث بنجاح' : 'Research deleted successfully'
                  });
                }}
                className="flex-1"
                disabled={isDeletingResearch}
                data-testid="button-confirm-delete-research"
              >
                {isDeletingResearch ? (lang === 'ar' ? 'جاري الحذف...' : 'Deleting...') : (lang === 'ar' ? 'حذف' : 'Delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unified Edit Profile Dialog */}
        <Dialog open={showUnifiedEditDialog} onOpenChange={setShowUnifiedEditDialog}>
          <DialogContent 
            className="max-w-md max-h-[85vh] overflow-y-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{tr.editProfile}</DialogTitle>
            </DialogHeader>

            {/* Tab Navigation */}
            <div className="flex gap-1 mt-4 p-1 bg-muted rounded-lg">
              {(['cover', 'avatar', 'info', 'account'] as const).map((tab) => (
                <Button
                  key={tab}
                  variant={editTab === tab ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setEditTab(tab)}
                  data-testid={`tab-edit-${tab}`}
                >
                  {tab === 'cover' && (lang === 'ar' ? 'الغلاف' : 'Cover')}
                  {tab === 'avatar' && (lang === 'ar' ? 'الصورة' : 'Photo')}
                  {tab === 'info' && (lang === 'ar' ? 'المعلومات' : 'Info')}
                  {tab === 'account' && (lang === 'ar' ? 'الحساب' : 'Account')}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mt-4">
              {/* Cover Tab */}
              {editTab === 'cover' && (
                <div className="space-y-4">
                  <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted">
                    {(tempCover || storedCover || profile?.coverUrl) ? (
                      <img 
                        src={tempCover || storedCover || profile?.coverUrl} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-zinc-500" />
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

  // OLD LAYOUT (when USE_ACADEMIC_SHELL = false)
  return (
    <div 
      className="min-h-screen pb-8" 
      style={{ backgroundColor: profileBg }}
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
          
          {/* Premium bottom blend overlay (theme-aware) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isDarkMode
                ? `linear-gradient(
                    to top,
                    rgba(11,16,32,1) 0%,
                    rgba(11,16,32,0.92) 18%,
                    rgba(11,16,32,0.78) 34%,
                    rgba(11,16,32,0.55) 52%,
                    rgba(11,16,32,0.25) 70%,
                    transparent 88%
                  )`
                : `linear-gradient(
                    to top,
                    rgba(244,245,251,1) 0%,
                    rgba(244,245,251,0.92) 18%,
                    rgba(244,245,251,0.78) 34%,
                    rgba(244,245,251,0.55) 52%,
                    rgba(244,245,251,0.25) 70%,
                    transparent 88%
                  )`
            }}
          />
          
          {/* Vignette overlay (premium look) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isDarkMode
                ? `radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.38) 100%)`
                : `radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 55%, rgba(0,0,0,0.14) 100%)`
            }}
          />
          
          {/* Top readability haze */}
          <div className={`absolute inset-0 pointer-events-none bg-gradient-to-b ${isDarkMode ? 'from-black/30 via-black/15' : 'from-black/20 via-black/10'} to-transparent`} />
          
          {/* Subtle warm texture */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
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
                      const targetPath = `/profile/${encodeURIComponent(followerEmail)}`;
                      navigate(targetPath);
                      queueMicrotask(() => setShowFollowersDialog(false));
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
                      const targetPath = `/profile/${encodeURIComponent(followingEmail)}`;
                      navigate(targetPath);
                      queueMicrotask(() => setShowFollowingDialog(false));
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

                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCpForm({ current: '', newPw: '', confirm: '' });
                      setCpErrors({});
                      setCpShowCurrent(false);
                      setCpShowNew(false);
                      setCpShowConfirm(false);
                      setCpSubmitted(false);
                      setShowChangePasswordDialog(true);
                    }}
                    className="w-full gap-2"
                    data-testid="button-change-password"
                  >
                    <KeyRound className="w-4 h-4" />
                    {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                  </Button>
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

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={(open) => {
        if (!open) {
          setShowChangePasswordDialog(false);
          setCpSubmitted(false);
        }
      }}>
        <DialogContent
          className="sm:max-w-md"
          data-testid="dialog-change-password"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
            </DialogTitle>
          </DialogHeader>

          {cpSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <Check className="w-10 h-10 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                {lang === 'ar'
                  ? 'سيتم تفعيل تغيير كلمة المرور عند ربط نظام المصادقة النهائي.'
                  : 'Password change will be enabled once authentication is fully wired.'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangePasswordDialog(false);
                  setCpSubmitted(false);
                }}
                data-testid="button-close-change-password"
              >
                {lang === 'ar' ? 'حسناً' : 'OK'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
                <div className="relative">
                  <Input
                    type={cpShowCurrent ? 'text' : 'password'}
                    value={cpForm.current}
                    onChange={(e) => {
                      setCpForm(prev => ({ ...prev, current: e.target.value }));
                      setCpErrors(prev => ({ ...prev, current: '' }));
                    }}
                    dir="ltr"
                    data-testid="input-current-password"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute top-0 right-0 rtl:right-auto rtl:left-0"
                    onClick={() => setCpShowCurrent(!cpShowCurrent)}
                    tabIndex={-1}
                  >
                    {cpShowCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {cpErrors.current && <p className="text-sm text-destructive">{cpErrors.current}</p>}
              </div>

              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                <div className="relative">
                  <Input
                    type={cpShowNew ? 'text' : 'password'}
                    value={cpForm.newPw}
                    onChange={(e) => {
                      setCpForm(prev => ({ ...prev, newPw: e.target.value }));
                      setCpErrors(prev => ({ ...prev, newPw: '', confirm: '' }));
                    }}
                    dir="ltr"
                    data-testid="input-new-password"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute top-0 right-0 rtl:right-auto rtl:left-0"
                    onClick={() => setCpShowNew(!cpShowNew)}
                    tabIndex={-1}
                  >
                    {cpShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {cpErrors.newPw && <p className="text-sm text-destructive">{cpErrors.newPw}</p>}
              </div>

              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</Label>
                <div className="relative">
                  <Input
                    type={cpShowConfirm ? 'text' : 'password'}
                    value={cpForm.confirm}
                    onChange={(e) => {
                      setCpForm(prev => ({ ...prev, confirm: e.target.value }));
                      setCpErrors(prev => ({ ...prev, confirm: '' }));
                    }}
                    dir="ltr"
                    data-testid="input-confirm-password"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute top-0 right-0 rtl:right-auto rtl:left-0"
                    onClick={() => setCpShowConfirm(!cpShowConfirm)}
                    tabIndex={-1}
                  >
                    {cpShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {cpErrors.confirm && <p className="text-sm text-destructive">{cpErrors.confirm}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowChangePasswordDialog(false)}
                  className="flex-1"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => {
                    const errors: Record<string, string> = {};
                    if (!cpForm.current.trim()) {
                      errors.current = lang === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password';
                    }
                    if (cpForm.newPw.length < 8) {
                      errors.newPw = lang === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters';
                    }
                    if (cpForm.newPw !== cpForm.confirm) {
                      errors.confirm = lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
                    }
                    if (Object.keys(errors).length > 0) {
                      setCpErrors(errors);
                      return;
                    }
                    setCpSubmitted(true);
                  }}
                  className="flex-1"
                  data-testid="button-submit-change-password"
                >
                  {lang === 'ar' ? 'تغيير' : 'Change'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
