import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Users, MessageSquare, MessagesSquare, LayoutDashboard, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function Admin() {
  const { lang } = useDaamStore();
  const [activeTab, setActiveTab] = useState('overview');

  const isRTL = lang === 'ar';

  const tr = {
    title: lang === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard',
    overview: lang === 'ar' ? 'نظرة عامة' : 'Overview',
    users: lang === 'ar' ? 'المستخدمون' : 'Users',
    settings: lang === 'ar' ? 'الإعدادات' : 'Settings',
    totalUsers: lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
    totalPosts: lang === 'ar' ? 'إجمالي المنشورات' : 'Total Posts',
    totalComments: lang === 'ar' ? 'إجمالي التعليقات' : 'Total Comments',
  };

  const stats = [
    { label: tr.totalUsers, value: '1,245', icon: Users, color: 'from-violet-600 to-purple-500' },
    { label: tr.totalPosts, value: '3,892', icon: MessageSquare, color: 'from-blue-600 to-cyan-500' },
    { label: tr.totalComments, value: '12,567', icon: MessagesSquare, color: 'from-green-600 to-emerald-500' },
  ];

  const navItems = [
    { id: 'overview', label: tr.overview, icon: LayoutDashboard },
    { id: 'users', label: tr.users, icon: Users },
    { id: 'settings', label: tr.settings, icon: Settings },
  ];

  return (
    <div className="min-h-screen pb-20" dir={isRTL ? 'rtl' : 'ltr'} data-testid="admin-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 gradient-text">
          {tr.title}
        </h1>

        <div className="flex gap-6">
          <aside className="w-48 flex-shrink-0">
            <Card className="border-white/10 bg-card/50">
              <CardContent className="p-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                      activeTab === item.id
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-white/5 text-muted-foreground'
                    }`}
                    data-testid={`nav-${item.id}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          <main className="flex-1">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="border-white/10 bg-card/50 hover:border-primary/30 transition-all">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold mb-1">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <Card className="border-white/10 bg-card/50">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">{tr.users}</h2>
                  <div className="space-y-3">
                    {['ahmed@utas.edu.om', 'fatima@utas.edu.om', 'mohammed@utas.edu.om'].map((email) => (
                      <div key={email} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span>{email}</span>
                        <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'مستخدم' : 'User'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card className="border-white/10 bg-card/50">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">{tr.settings}</h2>
                  <p className="text-muted-foreground">{lang === 'ar' ? 'الإعدادات قيد التطوير' : 'Settings under development'}</p>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </motion.div>
    </div>
  );
}