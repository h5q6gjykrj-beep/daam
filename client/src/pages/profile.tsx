import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
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
  Check
} from "lucide-react";
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
  const { user, posts, lang, getProfile, updateProfile } = useDaamStore();
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/profile/:email");
  const { toast } = useToast();
  
  const isRTL = lang === 'ar';
  const profileEmail = params?.email ? decodeURIComponent(params.email) : user?.email;
  const isOwnProfile = user?.email === profileEmail;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
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
    updateProfile({
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
    download: lang === 'ar' ? 'تحميل' : 'Download'
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
    <div className="space-y-0" data-testid="profile-page">
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
              <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-xl">
                {(tempAvatar || profile?.avatarUrl) ? (
                  <AvatarImage src={tempAvatar || profile?.avatarUrl} />
                ) : null}
                <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-violet-600 to-purple-500 text-white">
                  {getInitials(profileEmail)}
                </AvatarFallback>
              </Avatar>
              
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
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {profile?.name || profileEmail.split('@')[0]}
                  </h1>
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
                </>
              )}
            </div>

            <div className="flex gap-2">
              {isOwnProfile && (
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
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`${isSticky ? 'sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-white/10 -mx-4 md:-mx-6 px-4 md:px-6' : ''}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0 gap-0">
            <TabsTrigger 
              value="posts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-posts"
            >
              <MessageSquare className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.posts} ({userPosts.length})
            </TabsTrigger>
            <TabsTrigger 
              value="replies" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-replies"
            >
              <Reply className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.replies} ({userReplies.length})
            </TabsTrigger>
            <TabsTrigger 
              value="favorites" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
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
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-files"
            >
              <FileText className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.files} ({userFiles.length})
            </TabsTrigger>
            <TabsTrigger 
              value="interests" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-interests"
            >
              <Hash className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {tr.interests}
            </TabsTrigger>
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
          </div>
        </Tabs>
      </div>
    </div>
  );
}
