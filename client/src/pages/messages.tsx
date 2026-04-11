import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useLocation, useSearch } from "wouter";
import { useDaamStore, type Conversation, type DirectMessage } from "@/hooks/use-daam-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MessageSquare, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// ── ChatArea: isolated with React.memo — only re-renders when messages/conv change ──
interface ChatAreaProps {
  messages: DirectMessage[];
  conversationId: string;
  otherName: string;
  otherEmail: string;
  otherAvatarColor: string;
  dmAllowed: boolean;
  isSending: boolean;
  lang: string;
  isRTL: boolean;
  onSendMessage: (text: string) => void;
  onBackToList: () => void;
  typeMessageLabel: string;
  dmClosedLabel: string;
  noMessagesLabel: string;
  yesterdayLabel: string;
}

const ChatArea = memo(function ChatArea({
  messages,
  conversationId,
  otherName,
  otherEmail,
  otherAvatarColor,
  dmAllowed,
  isSending,
  lang,
  isRTL,
  onSendMessage,
  onBackToList,
  typeMessageLabel,
  dmClosedLabel,
  noMessagesLabel,
  yesterdayLabel,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const locale = lang === 'ar' ? ar : enUS;

  // Scroll only on new message
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm', { locale });
    if (isYesterday(date)) return `${yesterdayLabel} ${format(date, 'HH:mm', { locale })}`;
    return format(date, 'dd/MM HH:mm', { locale });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={onBackToList} className="md:hidden" data-testid="button-back-to-list">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarFallback style={{ backgroundColor: otherAvatarColor }}>
            {otherName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{otherName}</p>
          <p className="text-xs text-muted-foreground">{otherEmail}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>{noMessagesLabel}</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.senderEmail === otherEmail ? false : true;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] p-3 rounded-2xl ${isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}
                  data-testid={`message-${msg.id}`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatTime(msg.sentAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        {!dmAllowed ? (
          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{dmClosedLabel}</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={typeMessageLabel}
              className="flex-1 bg-black/20 border-white/10"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isSending}
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              data-testid="input-message"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isSending} data-testid="button-send-message">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Main Messages page ────────────────────────────────────────────────────────
export default function Messages() {
  const {
    user,
    lang,
    getProfile,
    conversations,
    getConversationsForUser,
    getOrCreateConversation,
    getMessages,
    sendDirectMessage,
    markConversationRead,
    canSendDM,
    setActiveConversationId,
  } = useDaamStore();

  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const isRTL = lang === 'ar';

  const tr = {
    title: lang === 'ar' ? 'الرسائل' : 'Messages',
    noConversations: lang === 'ar' ? 'لا توجد محادثات بعد' : 'No conversations yet',
    noConversationsDesc: lang === 'ar' ? 'ابدأ محادثة من صفحة الملف الشخصي لأي مستخدم' : "Start a conversation from any user's profile",
    typeMessage: lang === 'ar' ? 'اكتب رسالة...' : 'Type a message...',
    selectConversation: lang === 'ar' ? 'اختر محادثة للبدء' : 'Select a conversation to start',
    yesterday: lang === 'ar' ? 'أمس' : 'Yesterday',
    dmClosed: lang === 'ar' ? 'هذا المستخدم أغلق الرسائل الخاصة' : 'This user has closed direct messages',
    rateLimit: lang === 'ar' ? 'تم الإرسال بسرعة كبيرة، حاول بعد قليل' : 'Sending too fast, please try again later',
    error: lang === 'ar' ? 'حدث خطأ' : 'Error occurred',
    noMessages: lang === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet',
  };

  // Handle ?to= query param
  useEffect(() => {
    if (searchParams && user?.email) {
      const params = new URLSearchParams(searchParams);
      const toEmail = params.get('to');
      if (toEmail && toEmail !== user.email) {
        const conv = getOrCreateConversation(toEmail);
        if (conv) {
          setSelectedConversation(conv);
          setMobileView('chat');
          navigate('/messages', { replace: true });
        }
      }
    }
  }, [searchParams, user, getOrCreateConversation, navigate]);

  // Clear active conversation on unmount
  useEffect(() => {
    return () => { setActiveConversationId(null); };
  }, [setActiveConversationId]);

  const userConversations = user?.email ? getConversationsForUser(user.email) : [];
  const currentConv = conversations.find(c => c.id === selectedConversation?.id) || selectedConversation;
  const messages = currentConv ? getMessages(currentConv.id) : [];

  // Mark as read when conversation open or new message arrives
  useEffect(() => {
    if (currentConv && user?.email) {
      markConversationRead(currentConv.id, user.email);
    }
  }, [currentConv?.id, messages.length, user?.email, markConversationRead]);

  const getOtherParticipant = (conv: Conversation) => {
    const otherEmail = conv.participants.find(p => p !== user?.email?.toLowerCase());
    if (!otherEmail) return null;
    const profile = getProfile(otherEmail);
    return { email: otherEmail, name: profile?.name || otherEmail.split('@')[0], avatarColor: profile?.avatarColor || '#6366f1' };
  };

  const formatConvTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const locale = lang === 'ar' ? ar : enUS;
    if (isToday(date)) return format(date, 'HH:mm', { locale });
    if (isYesterday(date)) return `${tr.yesterday} ${format(date, 'HH:mm', { locale })}`;
    return format(date, 'dd/MM HH:mm', { locale });
  };

  const handleSendMessage = useCallback((text: string) => {
    if (!currentConv || !user?.email) return;
    setIsSending(true);
    const result = sendDirectMessage(currentConv.id, user.email, text);
    setIsSending(false);
    if (!result.success) {
      if (result.error === 'dm_closed') toast({ title: tr.error, description: tr.dmClosed, variant: 'destructive' });
      else if (result.error === 'rate_limit') toast({ title: tr.error, description: tr.rateLimit, variant: 'destructive' });
      else toast({ title: tr.error, variant: 'destructive' });
    }
  }, [currentConv, user?.email, sendDirectMessage, toast, tr.error, tr.dmClosed, tr.rateLimit]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setMobileView('chat');
    setActiveConversationId(conv.id);
    if (user?.email) markConversationRead(conv.id, user.email);
  };

  const handleBackToList = useCallback(() => {
    setMobileView('list');
    setSelectedConversation(null);
    setActiveConversationId(null);
  }, [setActiveConversationId]);

  if (!user) { navigate('/login'); return null; }

  const ConversationList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {tr.title}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {userConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
            <p className="font-medium">{tr.noConversations}</p>
            <p className="text-sm mt-2">{tr.noConversationsDesc}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {userConversations.map(conv => {
              const other = getOtherParticipant(conv);
              const unread = conv.unreadCount[user?.email?.toLowerCase() || ''] || 0;
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-colors hover-elevate ${isSelected ? 'bg-primary/10' : ''}`}
                  data-testid={`conversation-${conv.id}`}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback style={{ backgroundColor: other?.avatarColor }}>
                      {other?.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{other?.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatConvTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessagePreview || '...'}</p>
                  </div>
                  {unread > 0 && <Badge variant="default" className="shrink-0">{unread}</Badge>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const other = currentConv ? getOtherParticipant(currentConv) : null;
  const dmCheck = other ? canSendDM(other.email) : { allowed: true };

  return (
    <div className="h-full flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Fixed back button on mobile when chat is open */}
      {mobileView === 'chat' && (
        <Button
          size="icon" variant="secondary" onClick={handleBackToList}
          className="md:hidden fixed bottom-20 left-4 z-50 rounded-full shadow-lg w-10 h-10"
          data-testid="button-back-fixed"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}

      {/* Desktop */}
      <div className="hidden md:flex w-full">
        <div className="w-80 border-r border-white/10 bg-card/50"><ConversationList /></div>
        <div className="flex-1 bg-background">
          {currentConv && other ? (
            <ChatArea
              messages={messages}
              conversationId={currentConv.id}
              otherName={other.name}
              otherEmail={other.email}
              otherAvatarColor={other.avatarColor}
              dmAllowed={dmCheck.allowed}
              isSending={isSending}
              lang={lang}
              isRTL={isRTL}
              onSendMessage={handleSendMessage}
              onBackToList={handleBackToList}
              typeMessageLabel={tr.typeMessage}
              dmClosedLabel={tr.dmClosed}
              noMessagesLabel={tr.noMessages}
              yesterdayLabel={tr.yesterday}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
              <p>{tr.selectConversation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden w-full h-[calc(100%-4rem)]">
        {mobileView === 'list' ? (
          <ConversationList />
        ) : currentConv && other ? (
          <ChatArea
            messages={messages}
            conversationId={currentConv.id}
            otherName={other.name}
            otherEmail={other.email}
            otherAvatarColor={other.avatarColor}
            dmAllowed={dmCheck.allowed}
            isSending={isSending}
            lang={lang}
            isRTL={isRTL}
            onSendMessage={handleSendMessage}
            onBackToList={handleBackToList}
            typeMessageLabel={tr.typeMessage}
            dmClosedLabel={tr.dmClosed}
            noMessagesLabel={tr.noMessages}
            yesterdayLabel={tr.yesterday}
          />
        ) : null}
      </div>
    </div>
  );
}
