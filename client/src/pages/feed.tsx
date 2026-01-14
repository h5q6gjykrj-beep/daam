import { useState } from "react";
import { useDaamStore, ADMIN_EMAILS } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, MessageSquare, Heart, Share2, Trash2, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function Feed() {
  const { posts, createPost, deletePost, t, lang, user } = useDaamStore();
  const [content, setContent] = useState("");
  const isRTL = lang === 'ar';

  const handlePost = () => {
    if (!content.trim()) return;
    createPost(content);
    setContent("");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight gradient-text w-fit">
          {t.feedTitle}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t.welcome}, <span className="text-foreground font-medium">{user?.email.split('@')[0]}</span>
        </p>
      </section>

      {/* Create Post Card */}
      <Card className="glass-panel border-white/5 p-6 space-y-4">
        <div className="flex gap-4">
          <Avatar className="w-10 h-10 border border-white/10">
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {user ? getInitials(user.email) : 'ME'}
            </AvatarFallback>
          </Avatar>
          <Textarea
            placeholder={t.createPost}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-black/20 border-white/5 resize-none focus:bg-black/30 transition-all text-base"
          />
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handlePost} 
            disabled={!content.trim()}
            className="px-6 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            {t.postBtn}
            {isRTL ? <Send className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </Card>

      {/* Feed List */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t.recentPosts}
          </h2>
        </div>

        <AnimatePresence initial={false}>
          {posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10"
            >
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t.emptyFeed}</p>
            </motion.div>
          ) : (
            posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group"
              >
                <Card className="bg-card border-white/5 p-6 hover:border-white/10 transition-colors duration-300">
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10 border border-white/10 mt-1">
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-medium text-xs">
                        {getInitials(post.authorEmail)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground/90">
                            {post.authorEmail.split('@')[0]}
                          </p>
                          {ADMIN_EMAILS.includes(post.authorEmail.toLowerCase()) && (
                            <Badge variant="secondary" className="text-xs px-2 py-0 bg-primary/20 text-primary border-primary/30">
                              <Shield className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                              {t.adminBadge}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.createdAt), { 
                              addSuffix: true,
                              locale: lang === 'ar' ? ar : enUS 
                            })}
                          </p>
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
                      
                      <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Fake interaction buttons for visuals */}
                      <div className="flex gap-4 pt-3 mt-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 gap-1 px-2">
                          <Heart className="w-3.5 h-3.5" />
                          <span>Like</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1 px-2">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-gray-400 hover:bg-gray-500/10 gap-1 px-2 ml-auto rtl:mr-auto rtl:ml-0">
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
