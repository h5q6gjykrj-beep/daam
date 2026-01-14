import { useState } from "react";
import { useDaamStore } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Heart, Plus, ChevronDown, ChevronUp, X, Reply } from "lucide-react";
import { type LocalReply } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Feed() {
  const { posts, createPost, toggleLike, addReply, lang, user, getProfile } = useDaamStore();
  const [content, setContent] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyingToReplyId, setReplyingToReplyId] = useState<Record<string, string | null>>({});
  const { toast } = useToast();
  const isRTL = lang === 'ar';

  const handlePost = () => {
    if (!content.trim()) return;
    createPost(content, 'discussion');
    setContent("");
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

  const getMajor = (email: string) => {
    const profile = getProfile(email);
    return profile?.major || '';
  };

  const handleLike = (postId: string) => {
    toggleLike(postId);
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

  const renderReplyThread = (postId: string, replies: LocalReply[], parentId: string | undefined, depth: number = 0): JSX.Element[] => {
    const childReplies = getNestedReplies(replies, parentId);
    const maxDepth = 3;
    const indent = Math.min(depth, maxDepth);
    
    return childReplies.map((reply) => {
      const inputKey = `${postId}-${reply.id}`;
      const hasChildren = getNestedReplies(replies, reply.id).length > 0;
      
      return (
        <div key={reply.id} className="space-y-2" data-testid={`reply-${reply.id}`}>
          <div 
            className="flex gap-2"
            style={{ 
              marginLeft: isRTL ? 0 : indent * 20, 
              marginRight: isRTL ? indent * 20 : 0 
            }}
          >
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage src={getProfile(reply.authorEmail)?.avatarUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                {getInitials(reply.authorEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-muted/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium">{getDisplayName(reply.authorEmail)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: false, locale: lang === 'ar' ? ar : enUS })}
                  </span>
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
              <button
                onClick={() => setReplyingToReplyId(prev => ({ ...prev, [postId]: prev[postId] === reply.id ? null : reply.id }))}
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 ms-2"
                data-testid={`button-reply-to-${reply.id}`}
              >
                <Reply className="w-3 h-3" />
                {lang === 'ar' ? 'رد' : 'Reply'}
              </button>
            </div>
          </div>
          
          {replyingToReplyId[postId] === reply.id && (
            <div 
              className="flex gap-2" 
              style={{ 
                marginLeft: isRTL ? 0 : (indent + 1) * 20, 
                marginRight: isRTL ? (indent + 1) * 20 : 0 
              }}
            >
              <Avatar className="w-5 h-5 flex-shrink-0">
                <AvatarImage src={user ? getProfile(user.email)?.avatarUrl : undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                  {user ? getInitials(user.email) : 'ME'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  value={replyInputs[inputKey] || ''}
                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                  placeholder={`${lang === 'ar' ? 'رد على' : 'Reply to'} ${getDisplayName(reply.authorEmail)}...`}
                  className="flex-1 h-8 text-xs bg-card/50 border-white/5"
                  onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(postId, reply.id)}
                  data-testid={`input-nested-reply-${reply.id}`}
                />
                <Button
                  size="sm"
                  onClick={() => handleReplySubmit(postId, reply.id)}
                  disabled={!replyInputs[inputKey]?.trim()}
                  className="h-8 px-2"
                  data-testid={`button-submit-nested-reply-${reply.id}`}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          {hasChildren && renderReplyThread(postId, replies, reply.id, depth + 1)}
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

  const isLiked = (postId: string) => posts.find(p => p.id === postId)?.likedBy?.includes(user?.email || '') || false;
  const getLikeCount = (postId: string) => posts.find(p => p.id === postId)?.likedBy?.length || 0;
  const getReplyCount = (postId: string) => posts.find(p => p.id === postId)?.replies?.length || 0;

  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const tr = {
    pageTitle: lang === 'ar' ? 'المساحة' : 'The Space',
    pageSubtitle: lang === 'ar' ? 'ما يشاركه الطلاب الآن' : 'What students are sharing now',
    newPost: lang === 'ar' ? 'مشاركة جديدة' : 'New Post',
    writePost: lang === 'ar' ? 'شارك ما يدور في بالك...' : 'Share what\'s on your mind...',
    publish: lang === 'ar' ? 'نشر' : 'Publish',
    like: lang === 'ar' ? 'إعجاب' : 'Like',
    comment: lang === 'ar' ? 'تعليق' : 'Comment',
    writeComment: lang === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...',
    showComments: lang === 'ar' ? 'التعليقات' : 'Comments',
    hideComments: lang === 'ar' ? 'إخفاء' : 'Hide',
    noPostsYet: lang === 'ar' ? 'لا توجد مشاركات بعد' : 'No posts yet',
    beFirst: lang === 'ar' ? 'كن أول من يشارك!' : 'Be the first to share!'
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tr.pageTitle}</h1>
        <p className="text-muted-foreground text-sm">{tr.pageSubtitle}</p>
      </div>

      <AnimatePresence mode="wait">
        {!showCreateForm ? (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button 
              onClick={() => setShowCreateForm(true)}
              variant="outline"
              className="w-full h-12 justify-start gap-3 text-muted-foreground border-dashed mb-6"
              data-testid="button-new-post"
            >
              <Plus className="w-5 h-5" />
              {tr.newPost}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <div className="bg-card/50 rounded-xl p-4 border border-white/5">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={user ? getProfile(user.email)?.avatarUrl : undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user ? getInitials(user.email) : 'ME'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder={tr.writePost}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] bg-transparent border-0 resize-none p-0 focus-visible:ring-0 text-base placeholder:text-muted-foreground/50"
                    autoFocus
                    data-testid="textarea-create-post"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setShowCreateForm(false); setContent(""); }}
                  data-testid="button-cancel-post"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm"
                  onClick={handlePost} 
                  disabled={!content.trim()}
                  className="gap-2"
                  data-testid="button-publish-post"
                >
                  <Send className="w-4 h-4" />
                  {tr.publish}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {sortedPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">{tr.noPostsYet}</p>
            <p className="text-sm mt-1">{tr.beFirst}</p>
          </div>
        ) : (
          sortedPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4 border-b border-white/5 last:border-0"
            >
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={getProfile(post.authorEmail)?.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(post.authorEmail)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {getDisplayName(post.authorEmail)}
                    </span>
                    {getMajor(post.authorEmail) && (
                      <span className="text-xs text-muted-foreground">
                        {getMajor(post.authorEmail)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      · {formatDistanceToNow(new Date(post.createdAt), { 
                        addSuffix: false,
                        locale: lang === 'ar' ? ar : enUS 
                      })}
                    </span>
                  </div>
                  
                  <p className="text-base leading-relaxed mt-2 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <img 
                      src={post.imageUrl} 
                      alt="" 
                      className="mt-3 rounded-lg max-h-80 object-cover"
                    />
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        isLiked(post.id) 
                          ? 'text-rose-500' 
                          : 'text-muted-foreground hover:text-rose-500'
                      }`}
                      data-testid={`button-like-${post.id}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked(post.id) ? 'fill-current' : ''}`} />
                      {getLikeCount(post.id) > 0 && <span>{getLikeCount(post.id)}</span>}
                      <span className="hidden sm:inline">{tr.like}</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        activeReplyId === post.id 
                          ? 'text-primary' 
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                      data-testid={`button-comment-${post.id}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {getReplyCount(post.id) > 0 && <span>{getReplyCount(post.id)}</span>}
                      <span className="hidden sm:inline">{tr.comment}</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {activeReplyId === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <div className="flex gap-2">
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            <AvatarImage src={user ? getProfile(user.email)?.avatarUrl : undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {user ? getInitials(user.email) : 'ME'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={replyInputs[post.id] || ''}
                              onChange={(e) => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder={tr.writeComment}
                              className="flex-1 h-9 bg-card/50 border-white/5"
                              onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(post.id)}
                              data-testid={`input-reply-${post.id}`}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleReplySubmit(post.id)}
                              disabled={!replyInputs[post.id]?.trim()}
                              className="h-9"
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
                    <div className="mt-3">
                      <button
                        onClick={() => toggleReplies(post.id)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        data-testid={`button-toggle-replies-${post.id}`}
                      >
                        {expandedReplies.includes(post.id) ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            {tr.hideComments}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            {tr.showComments} ({getReplyCount(post.id)})
                          </>
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedReplies.includes(post.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 mt-3"
                          >
                            {renderReplyThread(post.id, post.replies || [], undefined, 0)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
