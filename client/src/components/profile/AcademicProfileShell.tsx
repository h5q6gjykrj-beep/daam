import { type ReactNode } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, UserPlus, MessageCircle } from "lucide-react";

export type ProfileTab = "posts" | "materials" | "research" | "activity" | "saved";

interface AcademicProfileShellProps {
  coverUrl?: string;
  avatarUrl?: string;
  displayName: string;
  subtitleLine1?: string;
  subtitleLine2?: string;
  bio?: string;
  stats: { posts: number; followers: number; following: number };
  isOwner: boolean;
  isRTL?: boolean;
  onEditClick?: () => void;
  onFollowClick?: () => void;
  onMessageClick?: () => void;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  children: ReactNode;
}

const TABS: { id: ProfileTab; labelAr: string; labelEn: string }[] = [
  { id: "posts", labelAr: "المنشورات", labelEn: "Posts" },
  { id: "materials", labelAr: "المواد", labelEn: "Materials" },
  { id: "research", labelAr: "البحوث", labelEn: "Research" },
  { id: "activity", labelAr: "النشاط", labelEn: "Activity" },
  { id: "saved", labelAr: "المحفوظات", labelEn: "Saved" },
];

export function AcademicProfileShell({
  coverUrl,
  avatarUrl,
  displayName,
  subtitleLine1,
  subtitleLine2,
  bio,
  stats,
  isOwner,
  isRTL = false,
  onEditClick,
  onFollowClick,
  onMessageClick,
  activeTab,
  onTabChange,
  children,
}: AcademicProfileShellProps) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div 
      className="min-h-screen" 
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        background: 'var(--daam-page-bg, hsl(var(--background)))'
      }}
    >
      {/* Custom CSS for page background */}
      <style>{`
        :root {
          --daam-page-bg: #F8F9FC;
        }
        .dark {
          --daam-page-bg: #0B1020;
        }
      `}</style>

      {/* A) HEADER - Full-bleed cover using w-screen technique */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="relative h-[280px] md:h-[340px] overflow-hidden">
          {/* Cover image or gradient fallback */}
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="img-profile-cover"
            />
          ) : (
            <div 
              className="absolute inset-0 w-full h-full"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.2) 50%, var(--daam-page-bg) 100%)'
              }}
            />
          )}

          {/* Multi-layer overlay for seamless Design C blend */}
          
          {/* Layer 1: Vignette - subtle darkening at edges */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)'
            }}
          />
          
          {/* Layer 2: Bottom gradient blend - matches page background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, var(--daam-page-bg) 0%, var(--daam-page-bg) 5%, transparent 50%)'
            }}
          />
          
          {/* Layer 3: Soft haze for readability */}
          <div className="absolute inset-0 pointer-events-none bg-black/5 dark:bg-black/15" />
          
          {/* Layer 4: Subtle warm texture overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20"
            style={{
              background: 'linear-gradient(180deg, transparent 60%, rgba(139, 92, 246, 0.1) 100%)'
            }}
          />
          
          {/* Layer 5: Bottom blur zone for seamless transition */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none backdrop-blur-[2px]"
            style={{
              background: 'linear-gradient(to top, var(--daam-page-bg), transparent)'
            }}
          />

          {/* Owner edit button - top corner */}
          {isOwner && onEditClick && (
            <Button
              size="icon"
              variant="outline"
              className="absolute top-4 start-4 z-50 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 shadow-lg"
              onClick={onEditClick}
              data-testid="button-edit-profile"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}

          {/* Identity section positioned inside cover (Design C style) */}
          <div className="absolute bottom-6 left-0 right-0 z-20">
            <div className="mx-auto max-w-[1100px] px-4 md:px-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar with soft ring */}
                <Avatar 
                  className="w-20 h-20 md:w-24 md:h-24 ring-2 ring-white/30 shadow-2xl" 
                  data-testid="avatar-profile"
                >
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="text-xl md:text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Name - sized per Design C spec */}
                <h1 
                  className="mt-3 text-2xl md:text-3xl font-semibold text-white drop-shadow-lg" 
                  data-testid="text-profile-name"
                >
                  {displayName}
                </h1>

                {/* Subtitle lines */}
                {subtitleLine1 && (
                  <p 
                    className="mt-1 text-xs md:text-sm text-white/80 drop-shadow" 
                    data-testid="text-profile-subtitle1"
                  >
                    {subtitleLine1}
                  </p>
                )}
                {subtitleLine2 && (
                  <p 
                    className="text-xs text-white/60" 
                    data-testid="text-profile-subtitle2"
                  >
                    {subtitleLine2}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* B) IDENTITY CONTINUATION - bio, separator, stats, actions */}
      <div className="relative z-10 -mt-2">
        <div className="mx-auto max-w-[1100px] px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            {/* Bio */}
            {bio && (
              <p className="mt-2 text-sm text-muted-foreground max-w-md" data-testid="text-profile-bio">
                {bio}
              </p>
            )}

            {/* Thin separator line before stats (Design C) */}
            <div className="my-4 w-full max-w-xs h-px bg-border/50" />

            {/* C) STATS ROW */}
            <div className="flex items-center gap-6 text-sm" data-testid="stats-row">
              <div className="flex flex-col items-center">
                <span className="font-semibold text-foreground">{stats.posts}</span>
                <span className="text-xs text-muted-foreground">{isRTL ? "منشور" : "Posts"}</span>
              </div>
              <div className="w-px h-6 bg-border/50" />
              <div className="flex flex-col items-center">
                <span className="font-semibold text-foreground">{stats.followers}</span>
                <span className="text-xs text-muted-foreground">{isRTL ? "متابع" : "Followers"}</span>
              </div>
              <div className="w-px h-6 bg-border/50" />
              <div className="flex flex-col items-center">
                <span className="font-semibold text-foreground">{stats.following}</span>
                <span className="text-xs text-muted-foreground">{isRTL ? "يتابع" : "Following"}</span>
              </div>
            </div>

            {/* D) ACTION BUTTONS */}
            {!isOwner && (
              <div className="flex gap-3 mt-4" data-testid="action-buttons">
                {onFollowClick && (
                  <Button onClick={onFollowClick} className="gap-1.5" data-testid="button-follow">
                    <UserPlus className="w-4 h-4" />
                    <span>{isRTL ? "متابعة" : "Follow"}</span>
                  </Button>
                )}
                {onMessageClick && (
                  <Button variant="outline" onClick={onMessageClick} className="gap-1.5" data-testid="button-message">
                    <MessageCircle className="w-4 h-4" />
                    <span>{isRTL ? "رسالة" : "Message"}</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* E) TAB BAR */}
      <div className="mt-6 border-b border-border/50">
        <div className="mx-auto max-w-[1100px] px-4 md:px-6">
          <div 
            className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-hide"
            role="tablist"
            data-testid="profile-tabs"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? "bg-muted/80 text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }
                `}
                data-testid={`tab-${tab.id}`}
              >
                {isRTL ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* F) TAB CONTENT */}
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-6" data-testid="profile-content">
        {children}
      </div>
    </div>
  );
}

export default AcademicProfileShell;
