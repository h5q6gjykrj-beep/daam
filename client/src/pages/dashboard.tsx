import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  MessageSquare, 
  Bot, 
  TrendingUp, 
  Clock, 
  Shield, 
  Settings,
  ArrowRight,
  ArrowLeft,
  User,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const DASHBOARD_PREFS_KEY = 'daam_dashboard_prefs';

interface DashboardPrefs {
  showStats: boolean;
  showRecentPosts: boolean;
  showQuickActions: boolean;
}

const defaultPrefs: DashboardPrefs = {
  showStats: true,
  showRecentPosts: true,
  showQuickActions: true,
};

export default function Dashboard() {
  const { user, posts, lang, t } = useDaamStore();
  const [_, setLocation] = useLocation();
  const [prefs, setPrefs] = useState<DashboardPrefs>(defaultPrefs);
  const [showSettings, setShowSettings] = useState(false);

  const isRTL = lang === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const stored = localStorage.getItem(DASHBOARD_PREFS_KEY);
    if (stored) {
      try {
        setPrefs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse dashboard prefs", e);
      }
    }
  }, []);

  const updatePref = (key: keyof DashboardPrefs, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    localStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(newPrefs));
  };

  const userPosts = posts.filter(p => p.authorEmail === user?.email);
  const recentPosts = posts.slice(0, 3);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (lang === 'ar') {
      if (hour < 12) return 'صباح الخير';
      if (hour < 18) return 'مساء الخير';
      return 'مساء الخير';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    {
      label: lang === 'ar' ? 'منشوراتك' : 'Your Posts',
      value: userPosts.length,
      icon: MessageSquare,
      color: 'from-violet-600 to-purple-500'
    },
    {
      label: lang === 'ar' ? 'إجمالي المنشورات' : 'Total Posts',
      value: posts.length,
      icon: TrendingUp,
      color: 'from-gray-500 to-gray-400'
    },
    {
      label: lang === 'ar' ? 'المساعد الذكي' : 'AI Tutor',
      value: lang === 'ar' ? 'متاح' : 'Ready',
      icon: Bot,
      color: 'from-purple-600 to-violet-400'
    }
  ];

  const translations = {
    dashboard: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard',
    recentActivity: lang === 'ar' ? 'النشاط الأخير' : 'Recent Activity',
    quickActions: lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions',
    goToFeed: lang === 'ar' ? 'الذهاب للمنتدى' : 'Go to Feed',
    askTutor: lang === 'ar' ? 'اسأل المعلم الذكي' : 'Ask AI Tutor',
    noRecentActivity: lang === 'ar' ? 'لا يوجد نشاط حديث' : 'No recent activity',
    customize: lang === 'ar' ? 'تخصيص' : 'Customize',
    showStats: lang === 'ar' ? 'إظهار الإحصائيات' : 'Show Statistics',
    showRecentPosts: lang === 'ar' ? 'إظهار المنشورات الأخيرة' : 'Show Recent Posts',
    showQuickActions: lang === 'ar' ? 'إظهار الإجراءات السريعة' : 'Show Quick Actions',
    settings: lang === 'ar' ? 'إعدادات اللوحة' : 'Dashboard Settings',
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              {getGreeting()}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              {user?.email}
              {user?.isAdmin && (
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30 ml-2 rtl:mr-2 rtl:ml-0">
                  <Shield className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                  {t.adminBadge}
                </Badge>
              )}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="border-white/10 gap-2"
            data-testid="button-customize-dashboard"
          >
            <Settings className="w-4 h-4" />
            {translations.customize}
          </Button>
        </div>

        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="border-white/10 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5" />
                  {translations.settings}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{translations.showStats}</span>
                  <Switch
                    checked={prefs.showStats}
                    onCheckedChange={(v) => updatePref('showStats', v)}
                    data-testid="switch-show-stats"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{translations.showRecentPosts}</span>
                  <Switch
                    checked={prefs.showRecentPosts}
                    onCheckedChange={(v) => updatePref('showRecentPosts', v)}
                    data-testid="switch-show-recent-posts"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{translations.showQuickActions}</span>
                  <Switch
                    checked={prefs.showQuickActions}
                    onCheckedChange={(v) => updatePref('showQuickActions', v)}
                    data-testid="switch-show-quick-actions"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {prefs.showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="border-white/10 bg-card/50 hover:bg-card/70 transition-colors" data-testid={`stat-card-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {prefs.showQuickActions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card 
                className="border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-purple-500/10 cursor-pointer hover:from-violet-600/30 hover:to-purple-500/20 transition-all"
                onClick={() => setLocation('/feed')}
                data-testid="card-go-to-feed"
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{translations.goToFeed}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'شارك أفكارك مع زملائك' : 'Share ideas with peers'}
                        </p>
                      </div>
                    </div>
                    <ArrowIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card 
                className="border-gray-500/20 bg-gradient-to-br from-gray-500/20 to-gray-600/10 cursor-pointer hover:from-gray-500/30 hover:to-gray-600/20 transition-all"
                onClick={() => setLocation('/tutor')}
                data-testid="card-go-to-tutor"
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold">{translations.askTutor}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'احصل على مساعدة فورية' : 'Get instant help'}
                        </p>
                      </div>
                    </div>
                    <ArrowIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {prefs.showRecentPosts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {translations.recentActivity}
                </CardTitle>
                <CardDescription>
                  {lang === 'ar' ? 'آخر المنشورات في المنصة' : 'Latest posts on the platform'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {translations.noRecentActivity}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentPosts.map((post, index) => (
                      <div 
                        key={post.id} 
                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => setLocation('/feed')}
                        data-testid={`recent-post-${index}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-gray-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {post.authorEmail.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.authorEmail}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                          <p className="text-xs text-muted-foreground/50 mt-1">
                            {format(new Date(post.createdAt), 'PPp', { locale: lang === 'ar' ? ar : enUS })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
