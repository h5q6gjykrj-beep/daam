import { useParams, useLocation, Link } from "wouter";
import { useDaamStore, ADMIN_EMAILS, type ReportReason } from "@/hooks/use-daam-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, ArrowRight, Heart, MessageSquare, Bookmark, FileText,
  ExternalLink, Pencil, Shield, Flag, Send, X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { LocalReply, Attachment } from "@shared/schema";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { posts, lang, user, getProfile, toggleLike, toggleSave, addReply, submitReport, moderators, isUserMuted, getMuteRecord } = useDaamStore();
  const { toast } = useToast();
  const isRTL = lang === 'ar';

  const post = posts.find(p => p.id === params.id);

  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerContent, setViewerContent] = useState<{ url: string; blobUrl: string; name: string } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | ''>('');
  const [reportNote, setReportNote] = useState('');

  const currentUserMuted = user ? isUserMuted(user.email) : false;
  const currentUserMuteRecord = user ? getMuteRecord(user.email) : null;

  const tr = {
    back: lang === 'ar' ? 'رجوع' : 'Back',
    notFound: lang === 'ar' ? 'المنشور غير موجود' : 'Post not found',
    goBack: lang === 'ar' ? 'العودة للخلف' : 'Go back',
    like: lang === 'ar' ? 'إعجاب' : 'Like',
    comment: lang === 'ar' ? 'تعليق' : 'Comment',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    reply: lang === 'ar' ? 'رد' : 'Reply',
    replies: lang === 'ar' ? 'الردود' : 'Replies',
    noReplies: lang === 'ar' ? 'لا توجد ردود بعد' : 'No replies yet',
    writeReply: lang === 'ar' ? 'اكتب رداً...' : 'Write a reply...',
    send: lang === 'ar' ? 'إرسال' : 'Send',
    report: lang === 'ar' ? 'إبلاغ' : 'Report',
    reportTitle: lang === 'ar' ? 'إبلاغ عن منشور' : 'Report Post',
    reportReason: lang === 'ar' ? 'سبب الإبلاغ' : 'Reason',
    reportNote: lang === 'ar' ? 'ملاحظات إضافية' : 'Additional notes',
    reportSubmit: lang === 'ar' ? 'إرسال البلاغ' : 'Submit Report',
    edited: lang === 'ar' ? 'تم تعديل' : 'Edited'
  };

  const reportReasons: { value: ReportReason; labelAr: string; labelEn: string }[] = [
    { value: 'spam', labelAr: 'محتوى مزعج', labelEn: 'Spam' },
    { value: 'harassment', labelAr: 'تحرش أو إساءة', labelEn: 'Harassment' },
    { value: 'inappropriate', labelAr: 'محتوى غير لائق', labelEn: 'Inappropriate content' },
    { value: 'hate', labelAr: 'كراهية', labelEn: 'Hate speech' },
    { value: 'other', labelAr: 'سبب آخر', labelEn: 'Other' }
  ];

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

  const isAdmin = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());
  const isModerator = (email: string) => {
    const emailLower = email.toLowerCase();
    if (emailLower === 'w.qq89@hotmail.com') return true;
    return moderators.some(m => m.email.toLowerCase() === emailLower && m.isActive);
  };
  const isStaff = (email: string) => isAdmin(email) || isModerator(email);

  const isLiked = () => post?.likedBy?.includes(user?.email || '') || false;
  const isSaved = () => post?.savedBy?.includes(user?.email || '') || false;

  const postTypeLabels: Record<string, string> = {
    question: lang === 'ar' ? 'سؤال' : 'Question',
    explanation: lang === 'ar' ? 'شرح' : 'Explanation',
    summary: lang === 'ar' ? 'ملخص' : 'Summary',
    discussion: lang === 'ar' ? 'نقاش' : 'Discussion'
  };

  const postTypeColors: Record<string, string> = {
    question: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    explanation: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    summary: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    discussion: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
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

  const openAttachment = (attachment: Attachment) => {
    const isPdf = attachment.name.toLowerCase().endsWith('.pdf') || 
                  attachment.url.toLowerCase().endsWith('.pdf') ||
                  (attachment as any).mimeType === 'application/pdf' ||
                  (attachment as any).type === 'pdf';
    const isImage = attachment.type === 'image';
    const blob = base64ToBlob(attachment.url, isPdf ? 'application/pdf' : undefined);

    if (isPdf) {
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(attachment.url, '_blank', 'noopener,noreferrer');
      }
    } else if (isImage && blob) {
      const blobUrl = URL.createObjectURL(blob);
      setViewerContent({ url: attachment.url, blobUrl, name: attachment.name });
      setViewerOpen(true);
    } else {
      downloadAttachment(attachment);
    }
  };

  const closeViewer = () => {
    if (viewerContent?.blobUrl) {
      URL.revokeObjectURL(viewerContent.blobUrl);
    }
    setViewerContent(null);
    setViewerOpen(false);
  };

  const downloadAttachment = (attachment: Attachment) => {
    const blob = base64ToBlob(attachment.url);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim() || !post) return;

    if (currentUserMuted) {
      const muteExpiry = currentUserMuteRecord?.expiresAt
        ? new Date(currentUserMuteRecord.expiresAt).toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-US')
        : null;
      toast({
        title: lang === 'ar' ? 'تم كتمك مؤقتًا' : 'You are muted',
        description: muteExpiry
          ? `${lang === 'ar' ? 'ينتهي الكتم في' : 'Mute expires at'}: ${muteExpiry}`
          : (lang === 'ar' ? 'تم كتمك مؤقتًا' : 'You are temporarily muted'),
        variant: 'destructive'
      });
      return;
    }

    addReply(post.id, replyContent);
    setReplyContent("");
    toast({
      title: lang === 'ar' ? 'تم الرد' : 'Reply sent',
      description: lang === 'ar' ? 'تم إرسال ردك بنجاح' : 'Your reply was posted'
    });
  };

  const handleReport = () => {
    if (!reportReason || !post) return;
    submitReport('post', post.id, post.content.substring(0, 50), reportReason, reportNote || undefined);
    setReportModalOpen(false);
    setReportReason('');
    setReportNote('');
    toast({
      title: lang === 'ar' ? 'تم الإبلاغ' : 'Reported',
      description: lang === 'ar' ? 'شكراً لمساهمتك في الحفاظ على المجتمع' : 'Thank you for helping keep the community safe'
    });
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/feed');
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <p className="text-muted-foreground mb-4">{tr.notFound}</p>
        <Button onClick={goBack} variant="outline" data-testid="button-go-back">
          {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
          {tr.goBack}
        </Button>
      </div>
    );
  }

  const authorProfile = getProfile(post.authorEmail);

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="mb-4"
          data-testid="button-back"
        >
          {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
          {tr.back}
        </Button>

        <Card className="border-white/10 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <Link href={`/profile/${encodeURIComponent(post.authorEmail)}`}>
                <Avatar className="w-12 h-12 border border-white/10 cursor-pointer hover:opacity-80">
                  <AvatarImage src={authorProfile?.avatarUrl} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(post.authorEmail)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/profile/${encodeURIComponent(post.authorEmail)}`} className="font-medium hover:underline">
                    {getDisplayName(post.authorEmail)}
                  </Link>
                  {isStaff(post.authorEmail) && (
                    <Shield className="w-4 h-4 text-primary" />
                  )}
                  <Badge variant="outline" className={`text-xs ${postTypeColors[post.postType]}`}>
                    {postTypeLabels[post.postType]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: lang === 'ar' ? ar : enUS
                  })}
                </p>
              </div>
            </div>

            <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>

            {post.imageUrl && (
              <div className="mt-3 aspect-square overflow-hidden rounded-xl bg-muted">
                <img
                  src={post.imageUrl}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              </div>
            )}

            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {post.attachments.map((attachment, idx) => (
                  attachment.type === 'image' ? (
                    <button
                      key={idx}
                      onClick={() => openAttachment(attachment)}
                      className="w-full aspect-square overflow-hidden rounded-xl bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                      data-testid={`button-attachment-${idx}`}
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                    </button>
                  ) : (
                    <button
                      key={idx}
                      onClick={() => openAttachment(attachment)}
                      className="w-full flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 hover:bg-primary/20 transition-colors group cursor-pointer text-start border border-transparent hover:border-primary/30"
                      data-testid={`button-attachment-${idx}`}
                    >
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </button>
                  )
                ))}
              </div>
            )}

            {post.updatedAt && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground/70">
                <Pencil className="w-3 h-3" />
                <span>
                  {tr.edited} · {formatDistanceToNow(new Date(post.updatedAt), {
                    addSuffix: true,
                    locale: lang === 'ar' ? ar : enUS
                  })}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked() ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                data-testid="button-like"
              >
                <Heart className={`w-4 h-4 ${isLiked() ? 'fill-current' : ''}`} />
                {(post.likedBy?.length || 0) > 0 && <span>{post.likedBy?.length}</span>}
                <span>{tr.like}</span>
              </button>

              <button
                onClick={() => setExpandedReplies(!expandedReplies)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-toggle-replies"
              >
                <MessageSquare className="w-4 h-4" />
                {(post.replies?.length || 0) > 0 && <span>{post.replies?.length}</span>}
                <span>{tr.comment}</span>
              </button>

              <button
                onClick={() => toggleSave(post.id)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${isSaved() ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                data-testid="button-save"
              >
                <Bookmark className={`w-4 h-4 ${isSaved() ? 'fill-current' : ''}`} />
                <span>{tr.save}</span>
              </button>

              {user?.email !== post.authorEmail && (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  data-testid="button-report"
                >
                  <Flag className="w-4 h-4" />
                  <span>{tr.report}</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4">
          <div className="flex gap-2 mb-4">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={tr.writeReply}
              className="flex-1 min-h-[80px] resize-none"
              data-testid="input-reply"
            />
            <Button
              onClick={handleReplySubmit}
              disabled={!replyContent.trim()}
              size="icon"
              className="self-end"
              data-testid="button-send-reply"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {expandedReplies && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{tr.replies}</h3>
              {(!post.replies || post.replies.length === 0) ? (
                <p className="text-sm text-muted-foreground">{tr.noReplies}</p>
              ) : (
                post.replies.map((reply: LocalReply) => {
                  const replyProfile = getProfile(reply.authorEmail);
                  return (
                    <Card key={reply.id} className="border-white/5 bg-card/50" data-testid={`reply-${reply.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Link href={`/profile/${encodeURIComponent(reply.authorEmail)}`}>
                            <Avatar className="w-8 h-8 border border-white/10 cursor-pointer hover:opacity-80">
                              <AvatarImage src={replyProfile?.avatarUrl} />
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {getInitials(reply.authorEmail)}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${encodeURIComponent(reply.authorEmail)}`} className="text-sm font-medium hover:underline">
                                {getDisplayName(reply.authorEmail)}
                              </Link>
                              {isStaff(reply.authorEmail) && (
                                <Shield className="w-3 h-3 text-primary" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.createdAt), {
                                  addSuffix: true,
                                  locale: lang === 'ar' ? ar : enUS
                                })}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{reply.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={viewerOpen} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeViewer}
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70"
              data-testid="button-close-viewer"
            >
              <X className="w-4 h-4" />
            </Button>
            {viewerContent && (
              <img
                src={viewerContent.blobUrl}
                alt={viewerContent.name}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr.reportTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{tr.reportReason}</Label>
              <Select value={reportReason} onValueChange={(v) => setReportReason(v as ReportReason)}>
                <SelectTrigger data-testid="select-report-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {lang === 'ar' ? r.labelAr : r.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tr.reportNote}</Label>
              <Textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                data-testid="input-report-note"
              />
            </div>
            <Button onClick={handleReport} disabled={!reportReason} className="w-full" data-testid="button-submit-report">
              {tr.reportSubmit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
