import { type ReactNode } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* A) HEADER - Full-bleed cover */}
      <div className="relative -mx-4 md:-mx-6 -mt-6">
        <div className="relative h-[260px] md:h-[320px] overflow-hidden">
          {/* Cover image or gradient fallback */}
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="img-profile-cover"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-background dark:from-primary/20 dark:via-primary/10 dark:to-background" />
          )}

          {/* Multi-layer overlay for premium blend */}
          {/* Layer 1: Gradient from transparent to background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          
          {/* Layer 2: Stronger bottom blend */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 15%, hsl(var(--background) / 0.5) 35%, transparent 60%)`
            }}
          />
          
          {/* Layer 3: Subtle vignette */}
          <div className="absolute inset-0 pointer-events-none bg-black/10 dark:bg-black/20" />
          
          {/* Layer 4: Backdrop blur at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 backdrop-blur-sm bg-background/30" />

          {/* Owner edit button - top corner */}
          {isOwner && onEditClick && (
            <Button
              size="icon"
              variant="outline"
              className="absolute top-4 start-4 z-50 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              onClick={onEditClick}
              data-testid="button-edit-profile"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* B) IDENTITY CENTER - overlaps cover bottom */}
      <div className="relative -mt-20 z-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <Avatar className="w-24 h-24 md:w-28 md:h-28 ring-4 ring-background shadow-xl" data-testid="avatar-profile">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <h1 className="mt-4 text-2xl md:text-3xl font-bold text-foreground" data-testid="text-profile-name">
              {displayName}
            </h1>

            {/* Subtitle lines */}
            {subtitleLine1 && (
              <p className="mt-1 text-sm md:text-base text-muted-foreground" data-testid="text-profile-subtitle1">
                {subtitleLine1}
              </p>
            )}
            {subtitleLine2 && (
              <p className="text-xs md:text-sm text-muted-foreground/80" data-testid="text-profile-subtitle2">
                {subtitleLine2}
              </p>
            )}

            {/* Bio */}
            {bio && (
              <p className="mt-3 text-sm text-muted-foreground max-w-md" data-testid="text-profile-bio">
                {bio}
              </p>
            )}

            {/* Divider before stats */}
            <Separator className="my-4 w-full max-w-xs" />

            {/* C) STATS ROW */}
            <div className="flex items-center gap-6 text-sm" data-testid="stats-row">
              <div className="flex flex-col items-center">
                <span className="font-semibold text-foreground">{stats.posts}</span>
                <span className="text-xs text-muted-foreground">{isRTL ? "منشور" : "Posts"}</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="font-semibold text-foreground">{stats.followers}</span>
                <span className="text-xs text-muted-foreground">{isRTL ? "متابع" : "Followers"}</span>
              </div>
              <div className="w-px h-8 bg-border" />
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
      <div className="mt-6 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
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
                    ? "bg-muted text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6" data-testid="profile-content">
        {children}
      </div>
    </div>
  );
}

export default AcademicProfileShell;
