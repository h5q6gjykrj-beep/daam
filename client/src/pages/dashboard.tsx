import { useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  TrendingUp, 
  Heart,
  Flame,
  Hash,
  ArrowRight,
  ArrowLeft,
  Zap,
  Users,
  BookOpen,
  Search,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { COLLEGES, getCollegeLabel, getCollegeColor } from "@/lib/colleges";

export default function Dashboard() {
  const { posts, lang, getProfile, profiles, user } = useDaamStore();
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const isRTL = lang === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return Object.entries(profiles)
      .filter(([email, profile]) => {
        if (email === user?.email) return false;
        const name = profile?.name?.toLowerCase() || '';
        const major = profile?.major?.toLowerCase() || '';
        const emailLower = email.toLowerCase();
        return name.includes(query) || major.includes(query) || emailLower.includes(query);
      })
      .slice(0, 5);
  }, [searchQuery, profiles, user?.email]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayPosts = useMemo(() => {
    return posts.filter(p => new Date(p.createdAt) >= today);
  }, [posts, today]);

  const activeDiscussions = useMemo(() => {
    return posts.filter(p => {
      const hasRecentReplies = p.replies.some(r => new Date(r.createdAt) >= today);
      return hasRecentReplies || new Date(p.createdAt) >= today;
    }).length;
  }, [posts, today]);

  const topSubjectToday = useMemo(() => {
    const subjectCounts: Record<string, number> = {};
    todayPosts.forEach(p => {
      if (p.subject) {
        subjectCounts[p.subject] = (subjectCounts[p.subject] || 0) + 1;
      }
    });
    const sorted = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      return getCollegeLabel(sorted[0][0], lang);
    }
    return lang === 'ar' ? 'لا يوجد' : 'None';
  }, [todayPosts, lang]);

  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const scoreA = (a.likedBy?.length || 0) + (a.replies?.length || 0) * 2;
        const scoreB = (b.likedBy?.length || 0) + (b.replies?.length || 0) * 2;
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [posts]);

  const hotTopics = useMemo(() => {
    const subjectCounts: Record<string, number> = {};
    posts.forEach(p => {
      if (p.subject) {
        subjectCounts[p.subject] = (subjectCounts[p.subject] || 0) + 
          (p.likedBy?.length || 0) + (p.replies?.length || 0) + 1;
      }
    });
    return Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([subject]) => subject);
  }, [posts]);

  const getInitials = (email: string) => {
    const profile = getProfile(email);
    const name = profile?.name || email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    const profile = getProfile(email);
    return profile?.name || email.split('@')[0];
  };

  const tr = {
    whatsNew: lang === 'ar' ? 'وش الجديد اليوم؟' : "What's new today?",
    pulse: lang === 'ar' ? 'نبض الساحة' : 'Quick Activity',
    postsToday: lang === 'ar' ? 'منشورات اليوم' : 'Posts Today',
    activeNow: lang === 'ar' ? 'نقاشات نشطة' : 'Active Now',
    topSubject: lang === 'ar' ? 'الأكثر تفاعلاً' : 'Top Subject',
    trending: lang === 'ar' ? 'الأكثر تفاعلاً' : 'Trending Posts',
    hotTopics: lang === 'ar' ? 'المواضيع الساخنة' : 'Hot Topics',
    viewAll: lang === 'ar' ? 'عرض الكل' : 'View All',
    noTrending: lang === 'ar' ? 'لا توجد منشورات رائجة بعد' : 'No trending posts yet',
    startSharing: lang === 'ar' ? 'ابدأ بمشاركة أفكارك!' : 'Start sharing your ideas!',
    goToFeed: lang === 'ar' ? 'الذهاب للساحة' : 'Go to Feed',
    findPeople: lang === 'ar' ? 'ابحث عن أشخاص' : 'Find People',
    searchPlaceholder: lang === 'ar' ? 'ابحث بالاسم أو التخصص...' : 'Search by name or major...',
    noResults: lang === 'ar' ? 'لا توجد نتائج' : 'No results found',
    viewProfile: lang === 'ar' ? 'عرض الملف' : 'View Profile'
  };

  const quickStats = [
    {
      label: tr.postsToday,
      value: todayPosts.length,
      icon: MessageSquare,
      color: 'from-violet-600 to-purple-500',
      bgColor: 'bg-violet-500/10',
      link: '/feed?filter=today'
    },
    {
      label: tr.activeNow,
      value: activeDiscussions,
      icon: Users,
      color: 'from-green-600 to-emerald-500',
      bgColor: 'bg-green-500/10',
      link: '/feed?filter=active'
    },
    {
      label: tr.topSubject,
      value: topSubjectToday,
      icon: BookOpen,
      color: 'from-orange-600 to-amber-500',
      bgColor: 'bg-orange-500/10',
      link: '/feed?filter=top'
    }
  ];

  return (
    <div className="space-y-6 pb-20" data-testid="dashboard-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3 mb-6">
          <Zap className="w-7 h-7 text-primary" />
          <span className="gradient-text">{tr.whatsNew}</span>
        </h1>

        {/* Search People Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{tr.findPeople}</h2>
          </div>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={tr.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="pl-10 pr-10 bg-card/50 border-white/10"
                data-testid="input-search-people"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-clear-search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {showSearchResults && searchQuery && (
              <Card className="absolute top-full mt-2 w-full z-50 border-white/10 bg-card shadow-xl">
                <CardContent className="p-2">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{tr.noResults}</p>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map(([email, profile]) => (
                        <Link
                          key={email}
                          href={`/profile/${encodeURIComponent(email)}`}
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                        >
                          <div 
                            className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                            data-testid={`search-result-${email}`}
                          >
                            <Avatar className="w-10 h-10 border border-violet-500/30">
                              <AvatarImage src={profile?.avatarUrl} />
                              <AvatarFallback className="bg-gradient-to-br from-violet-600 to-gray-500 text-white text-sm">
                                {(profile?.name || email.split('@')[0]).substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{profile?.name || email.split('@')[0]}</p>
                              {profile?.major && <p className="text-xs text-muted-foreground truncate">{profile.major}</p>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold">{tr.pulse}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  className={`border-white/5 ${stat.bgColor} hover:scale-105 transition-transform cursor-pointer`} 
                  data-testid={`quick-stat-${index}`}
                  onClick={() => setLocation(stat.link)}
                >
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{tr.trending}</h2>
            </div>
            <button
              onClick={() => setLocation('/feed?filter=top')}
              className="text-xs text-primary hover:underline flex items-center gap-1"
              data-testid="link-view-all-trending"
            >
              {tr.viewAll}
              <ArrowIcon className="w-3 h-3" />
            </button>
          </div>

          {trendingPosts.length === 0 ? (
            <Card className="border-white/5 bg-card/30">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground">{tr.noTrending}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">{tr.startSharing}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trendingPosts.map((post, index) => {
                const profile = getProfile(post.authorEmail);
                
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card 
                      className="border-white/5 bg-card/50 hover:bg-card/70 cursor-pointer transition-all hover:border-primary/20"
                      onClick={() => setLocation(`/post/${post.id}`)}
                      data-testid={`trending-post-${post.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Avatar className="w-10 h-10 border border-violet-500/30 flex-shrink-0">
                            <AvatarImage src={profile?.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-gray-500 text-white text-sm font-medium">
                              {getInitials(post.authorEmail)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm truncate">
                                {getDisplayName(post.authorEmail)}
                              </span>
                              {post.subject && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getCollegeColor(post.subject)}`}>
                                  <Hash className="w-2.5 h-2.5 mr-0.5" />
                                  {getCollegeLabel(post.subject, lang)}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
                              {post.content}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {post.likedBy?.length || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {post.replies?.length || 0}
                              </span>
                              <span className="text-muted-foreground/60">
                                {formatDistanceToNow(new Date(post.createdAt), { 
                                  addSuffix: true,
                                  locale: lang === 'ar' ? ar : enUS 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {hotTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold">{tr.hotTopics}</h2>
            </div>
            
            <div className="flex flex-col gap-2">
              {hotTopics.map((topic, index) => {
                return (
                  <motion.button
                    key={topic}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
                    onClick={() => setLocation(`/feed?subject=${topic}`)}
                    className={`w-full flex items-center justify-start px-4 py-2 rounded-full border text-sm font-medium transition-all hover:scale-105 ${getCollegeColor(topic)}`}
                    data-testid={`hot-topic-${topic}`}
                  >
                    <Hash className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                    {getCollegeLabel(topic, lang)}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
