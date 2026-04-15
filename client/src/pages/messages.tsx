import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useDaamStore, type Conversation } from "@/hooks/use-daam-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Send, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";

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
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const justSentMessageRef = useRef(false);
const messageInputRef = useRef<HTMLInputElement | null>(null);
  
  const tr = {
    title: lang === 'ar' ? 'الرسائل' : 'Messages',
    noConversations: lang === 'ar' ? 'لا توجد محادثات بعد' : 'No conversations yet',
    noConversationsDesc: lang === 'ar' ? 'ابدأ محادثة من صفحة الملف الشخصي لأي مستخدم' : 'Start a conversation from any user\'s profile',
    typeMessage: lang === 'ar' ? 'اكتب رسالة...' : 'Type a message...',
    send: lang === 'ar' ? 'إرسال' : 'Send',
    back: lang === 'ar' ? 'رجوع' : 'Back',
    selectConversation: lang === 'ar' ? 'اختر محادثة للبدء' : 'Select a conversation to start',
    today: lang === 'ar' ? 'اليوم' : 'Today',
    yesterday: lang === 'ar' ? 'أمس' : 'Yesterday',
    dmClosed: lang === 'ar' ? 'هذا المستخدم أغلق الرسائل الخاصة' : 'This user has closed direct messages',
    rateLimit: lang === 'ar' ? 'تم الإرسال بسرعة كبيرة، حاول بعد قليل' : 'Sending too fast, please try again later',
    messageSent: lang === 'ar' ? 'تم الإرسال' : 'Message sent',
    error: lang === 'ar' ? 'حدث خطأ' : 'Error occurred'
  };
  
  // Handle ?to= query param to open/create conversation
  useEffect(() => {
    if (searchParams && user?.email) {
      const params = new URLSearchParams(searchParams);
      const toEmail = params.get('to');
      if (toEmail && toEmail !== user.email) {
        const conv = getOrCreateConversation(toEmail);
        if (conv) {
          setSelectedConversation(conv);
          setMobileView('chat');
          // Clear the query param
          navigate('/messages', { replace: true });
        }
      }
    }
  }, [searchParams, user, getOrCreateConversation, navigate]);
  
  // Get user's conversations
  const userConversations = user?.email ? getConversationsForUser(user.email) : [];

  // Always derive current conversation from store (stays fresh on every poll)
  const currentConv = conversations.find(c => c.id === selectedConversation?.id) || selectedConversation;

  // Get messages for selected conversation
  const messages = currentConv ? getMessages(currentConv.id) : [];
  
  // Mark as read whenever the open conversation receives new messages
  useEffect(() => {
    if (selectedConversation && user?.email) {
      markConversationRead(selectedConversation.id, user.email);
    }
  }, [selectedConversation?.id, messages.length, user?.email, markConversationRead]);
  
  // Scroll to bottom instantly when opening a new conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
  }, [selectedConversation?.id]);

  // Scroll to bottom smoothly when new messages arrive (send or receive)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // When keyboard opens: scroll to bottom if user just sent a message, otherwise do nothing
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let scrollTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (justSentMessageRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    };
    vv.addEventListener('resize', handleResize);
    return () => { vv.removeEventListener('resize', handleResize); clearTimeout(scrollTimer); };
  }, [selectedConversation?.id]);

  // Get other participant's info
  const getOtherParticipant = (conv: Conversation) => {
    const otherEmail = conv.participants.find(p => p !== user?.email?.toLowerCase());
    if (!otherEmail) return null;
    const profile = getProfile(otherEmail);
    return {
      email: otherEmail,
      name: profile?.name || otherEmail.split('@')[0],
      avatarColor: profile?.avatarColor || '#6366f1',
      avatarUrl: profile?.avatarUrl || undefined,
    };
  };
  
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const locale = lang === 'ar' ? ar : enUS;
    
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale });
    } else if (isYesterday(date)) {
      return `${tr.yesterday} ${format(date, 'HH:mm', { locale })}`;
    }
    return format(date, 'dd/MM HH:mm', { locale });
  };
  
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !user?.email) return;

    justSentMessageRef.current = true;
    setTimeout(() => { justSentMessageRef.current = false; }, 500);

    setIsSending(true);
    const result = sendDirectMessage(selectedConversation.id, user.email, messageInput.trim());
    setIsSending(false);
    
    if (result.success) {
      setMessageInput("");
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 150);
      requestAnimationFrame(() => messageInputRef.current?.focus({ preventScroll: true }));
    } else {
      if (result.error === 'dm_closed') {
        toast({ title: tr.error, description: tr.dmClosed, variant: 'destructive' });
      } else if (result.error === 'rate_limit') {
        toast({ title: tr.error, description: tr.rateLimit, variant: 'destructive' });
      } else {
        toast({ title: tr.error, variant: 'destructive' });
      }
    }
  };
  
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setMobileView('chat');
    setActiveConversationId(conv.id);
    if (user?.email) markConversationRead(conv.id, user.email);
  };
  
  const handleBackToList = () => {
    setMobileView('list');
    setSelectedConversation(null);
    setActiveConversationId(null);
  };
  
  // Clear active conversation on page unmount
  useEffect(() => {
    return () => { setActiveConversationId(null); };
  }, [setActiveConversationId]);

  // Add/remove chat-open class on body for bottom nav visibility
  useEffect(() => {
    if (mobileView === 'chat') {
      document.body.classList.add('chat-open');
    } else {
      document.body.classList.remove('chat-open');
    }
    return () => { document.body.classList.remove('chat-open'); };
  }, [mobileView]);

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }
  
  // Conversation list component
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
                  className={`w-full p-4 flex items-center gap-3 text-left transition-colors hover-elevate ${
                    isSelected ? 'bg-primary/10' : ''
                  }`}
                  data-testid={`conversation-${conv.id}`}
                >
                  <Avatar className="w-12 h-12">
                    {other?.avatarUrl && <AvatarImage src={other.avatarUrl} alt={other.name} />}
                    <AvatarFallback style={{ backgroundColor: other?.avatarColor }}>
                      {other?.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{other?.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatMessageTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessagePreview || '...'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <Badge variant="default" className="shrink-0">
                      {unread}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
  
  // Chat view component
  const ChatView = () => {
    if (!currentConv) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
          <p>{tr.selectConversation}</p>
        </div>
      );
    }

    const other = getOtherParticipant(currentConv);
    const dmAllowed = other ? canSendDM(other.email) : { allowed: true };
    
    return (
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="sticky top-[56px] z-10 bg-background p-4 border-b border-white/10 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleBackToList}
            className="md:hidden"
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <button onClick={() => other && navigate(`/profile/${encodeURIComponent(other.email)}`)} className="shrink-0">
            <Avatar className="w-10 h-10 hover:opacity-80 transition-opacity">
              {other?.avatarUrl && <AvatarImage src={other.avatarUrl} alt={other.name} />}
              <AvatarFallback style={{ backgroundColor: other?.avatarColor }}>
                {other?.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex-1">
            <p className="font-medium">{other?.name}</p>
            <p className="text-xs text-muted-foreground">{other?.email}</p>
          </div>
        </div>
        
        {/* Messages area */}
        <div ref={messagesAreaRef} className="flex-1 overflow-y-auto p-4 pt-16 pb-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>{lang === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
            </div>
          ) : (
            messages.map(msg => {
              const isOwn = msg.senderEmail === user?.email?.toLowerCase();
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl ${
                      isOwn 
                        ? 'bg-primary text-primary-foreground rounded-br-md' 
                        : 'bg-muted rounded-bl-md'
                    }`}
                    data-testid={`message-${msg.id}`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatMessageTime(msg.sentAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="p-4 border-t border-white/10 bg-background">
          {!dmAllowed.allowed ? (
            <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{tr.dmClosed}</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                ref={messageInputRef}
                autoFocus
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={tr.typeMessage}
                className="flex-1 bg-black/20 border-white/10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-[calc(100vh-4rem)] flex" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Desktop layout: two columns */}
      <div className="hidden md:flex w-full h-[calc(100vh-4rem)]">
        {/* Left column: conversation list */}
        <div className="w-80 border-r border-white/10 bg-card/50 h-[calc(100vh-4rem)] overflow-y-auto">
          {ConversationList()}
        </div>
        {/* Right column: chat */}
        <div className="flex-1 bg-background h-[calc(100vh-4rem)] overflow-y-hidden">
          {ChatView()}
        </div>
      </div>

      {/* Mobile layout: switchable views - subtract bottom nav height */}
      <div className="md:hidden w-full h-full">
        {mobileView === 'list' ? (
          ConversationList()
        ) : (
          ChatView()
        )}
      </div>
    </div>
  );
}
