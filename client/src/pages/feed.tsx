import { useState } from "react";
import { useDaamStore, ADMIN_EMAILS } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, MessageSquare, Heart, Share2, Trash2, Shield, ChevronDown, ChevronUp, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Feed() {
  const { posts, createPost, deletePost, toggleLike, addReply, t, lang, user } = useDaamStore();
  const [content, setContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const { toast } = useToast();
  const isRTL = lang === 'ar';

  const handlePost = () => {
    if (!content.trim()) return;
    createPost(content);
    setContent("");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const handleLike = (postId: string) => {
    toggleLike(postId);
  };

  const handleReplySubmit = (postId: string) => {
    const replyContent = replyInputs[postId];
    if (!replyContent?.trim()) return;
    addReply(postId, replyContent);
    setReplyInputs(prev => ({ ...prev, [postId]: "" }));
    setActiveReplyId(null);
    if (!expandedReplies.includes(postId)) {
      setExpandedReplies(prev => [...prev, postId]);
    }
  };

  const toggleReplies = (postId: string) => {
    setExpandedReplies(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleShare = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const shareText = `${post.authorEmail.split('@')[0]}: ${post.content}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: lang === 'ar' ? 'منشور من DAAM' : 'Post from DAAM',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: lang === 'ar' ? 'تم النسخ' : 'Copied',
      description: lang === 'ar' ? 'تم نسخ المنشور للحافظة' : 'Post copied to clipboard',
    });
  };

  const isLiked = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    return post?.likedBy?.includes(user?.email || '') || false;
  };

  const getLikeCount = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    return post?.likedBy?.length || 0;
  };

  const getReplyCount = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    return post?.replies?.length || 0;
  };

  const translations = {
    like: lang === 'ar' ? 'إعجاب' : 'Like',
    reply: lang === 'ar' ? 'رد' : 'Reply',
    share: lang === 'ar' ? 'مشاركة' : 'Share',
    replies: lang === 'ar' ? 'الردود' : 'Replies',
    writeReply: lang === 'ar' ? 'اكتب رداً...' : 'Write a reply...',
    send: lang === 'ar' ? 'إرسال' : 'Send',
    showReplies: lang === 'ar' ? 'عرض الردود' : 'Show replies',
    hideReplies: lang === 'ar' ? 'إخفاء الردود' : 'Hide replies',
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight gradient-text w-fit">
          {t.feedTitle}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t.welcome}, <span className="text-foreground font-medium">{user?.email.split('@')[0]}</span>
        </p>
      </section>

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
            data-testid="textarea-create-post"
          />
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handlePost} 
            disabled={!content.trim()}
            className="px-6 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
            data-testid="button-create-post"
          >
            {t.postBtn}
            {isRTL ? <Send className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </Card>

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

                      <div className="flex gap-2 pt-3 mt-2 border-t border-white/5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleLike(post.id)}
                          className={`h-9 text-sm gap-2 px-3 transition-all ${
                            isLiked(post.id) 
                              ? 'text-violet-400 bg-violet-500/10' 
                              : 'text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10'
                          }`}
                          data-testid={`button-like-${post.id}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked(post.id) ? 'fill-current' : ''}`} />
                          <span>{getLikeCount(post.id) > 0 ? getLikeCount(post.id) : ''} {translations.like}</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}
                          className={`h-9 text-sm gap-2 px-3 ${
                            activeReplyId === post.id 
                              ? 'text-primary bg-primary/10' 
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                          }`}
                          data-testid={`button-reply-${post.id}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{getReplyCount(post.id) > 0 ? getReplyCount(post.id) : ''} {translations.reply}</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleShare(post.id)}
                          className="h-9 text-sm gap-2 px-3 text-muted-foreground hover:text-gray-400 hover:bg-gray-500/10 ml-auto rtl:mr-auto rtl:ml-0"
                          data-testid={`button-share-${post.id}`}
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">{translations.share}</span>
                        </Button>
                      </div>

                      <AnimatePresence>
                        {activeReplyId === post.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-3"
                          >
                            <div className="flex gap-2 items-start">
                              <Avatar className="w-8 h-8 border border-white/10">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {user ? getInitials(user.email) : 'ME'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  value={replyInputs[post.id] || ''}
                                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  placeholder={translations.writeReply}
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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setActiveReplyId(null)}
                                  className="h-9"
                                >
                                  <X className="w-4 h-4" />
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
                                {translations.hideReplies} ({getReplyCount(post.id)})
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                {translations.showReplies} ({getReplyCount(post.id)})
                              </>
                            )}
                          </Button>

                          <AnimatePresence>
                            {expandedReplies.includes(post.id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 pt-3 border-r-2 rtl:border-r-0 rtl:border-l-2 border-white/10 pr-4 rtl:pr-0 rtl:pl-4 mr-2 rtl:mr-0 rtl:ml-2"
                              >
                                {post.replies?.map((reply) => (
                                  <div key={reply.id} className="flex gap-3" data-testid={`reply-${reply.id}`}>
                                    <Avatar className="w-7 h-7 border border-white/10">
                                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                        {getInitials(reply.authorEmail)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{reply.authorEmail.split('@')[0]}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(reply.createdAt), { 
                                            addSuffix: true,
                                            locale: lang === 'ar' ? ar : enUS 
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-sm text-foreground/80 mt-1">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
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
