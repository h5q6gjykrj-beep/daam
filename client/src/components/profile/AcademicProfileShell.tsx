import { type ReactNode } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, UserPlus, UserCheck, MessageCircle } from "lucide-react";

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
  isFollowing?: boolean;
  onFollowClick?: () => void;
  onMessageClick?: () => void;
  onPostsClick?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onAvatarClick?: () => void;
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
  isFollowing = false,
  onFollowClick,
  onMessageClick,
  onPostsClick,
  onFollowersClick,
  onFollowingClick,
  onAvatarClick,
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
      className="min-h-full" 
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background inherited from parent (LayoutShell bg-background) - no custom colors */}

      {/* A) HEADER - Full-bleed cover, clean image without overlays */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="relative h-[220px] md:h-[280px] overflow-hidden">
          {/* Cover image or gradient fallback - NO overlays */}
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover object-center"
              data-testid="img-profile-cover"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/40 via-primary/30 to-primary/20" />
          )}

          {/* Owner edit button - styled with its own background only */}
          {isOwner && onEditClick && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 end-4 z-50 bg-black/30 border-none text-white hover:bg-black/50 shadow-lg"
              onClick={onEditClick}
              data-testid="button-edit-profile"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* B) IDENTITY DOCK - Right-aligned in RTL, Left-aligned in LTR, with overlapping avatar */}
      <div className="relative z-10 mx-auto max-w-[1100px] px-4 md:px-6">
        <div className="flex gap-4 md:gap-6">
          {/* Avatar - Overlapping the cover (half in, half out) */}
          {/* Position mirrors based on isRTL: right in RTL, left in LTR */}
          <div 
            className={`relative -mt-12 md:-mt-14 shrink-0 ${isRTL ? 'order-first' : 'order-first'}`}
          >
            <button
              type="button"
              onClick={() => onAvatarClick?.()}
              className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:opacity-90 transition-opacity"
              data-testid="button-avatar-preview"
            >
              <Avatar 
                className="w-24 h-24 md:w-28 md:h-28 ring-4 ring-background shadow-xl" 
                data-testid="avatar-profile"
              >
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="text-xl md:text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>

          {/* Identity content - Right-aligned in RTL, Left-aligned in LTR */}
          <div className={`flex-1 pt-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Name */}
            <h1 
              className="text-2xl md:text-3xl font-semibold text-foreground" 
              data-testid="text-profile-name"
            >
              {displayName}
            </h1>

            {/* Subtitle lines */}
            {subtitleLine1 && (
              <p 
                className="mt-1 text-xs md:text-sm text-muted-foreground" 
                data-testid="text-profile-subtitle1"
              >
                {subtitleLine1}
              </p>
            )}
            {subtitleLine2 && (
              <p 
                className="text-xs text-muted-foreground/70" 
                data-testid="text-profile-subtitle2"
              >
                {subtitleLine2}
              </p>
            )}

            {/* Bio */}
            {bio && (
              <p className="mt-2 text-sm text-muted-foreground max-w-md" data-testid="text-profile-bio">
                {bio}
              </p>
            )}

            {/* Stats row - Right-aligned in RTL */}
            <div className={`flex items-center gap-4 md:gap-6 mt-4 text-sm ${isRTL ? 'justify-start' : 'justify-start'}`} data-testid="stats-row">
              <button
                type="button"
                onClick={onPostsClick}
                className="group flex flex-col items-center cursor-pointer focus:outline-none"
                aria-label={isRTL ? "عرض المنشورات" : "View posts"}
                data-testid="stats-posts"
              >
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{stats.posts}</span>
                <span className="text-xs text-muted-foreground group-hover:underline underline-offset-4">{isRTL ? "منشور" : "Posts"}</span>
              </button>
              <div className="w-px h-6 bg-border/50" />
              <button
                type="button"
                onClick={onFollowersClick}
                className="group flex flex-col items-center cursor-pointer focus:outline-none"
                aria-label={isRTL ? "عرض المتابعين" : "View followers"}
                data-testid="stats-followers"
              >
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{stats.followers}</span>
                <span className="text-xs text-muted-foreground group-hover:underline underline-offset-4">{isRTL ? "متابع" : "Followers"}</span>
              </button>
              <div className="w-px h-6 bg-border/50" />
              <button
                type="button"
                onClick={onFollowingClick}
                className="group flex flex-col items-center cursor-pointer focus:outline-none"
                aria-label={isRTL ? "عرض من يتابع" : "View following"}
                data-testid="stats-following"
              >
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{stats.following}</span>
                <span className="text-xs text-muted-foreground group-hover:underline underline-offset-4">{isRTL ? "يتابع" : "Following"}</span>
              </button>
            </div>

            {/* Action buttons for visitors - Right-aligned in RTL */}
            {!isOwner && (
              <div className={`flex gap-3 mt-4 ${isRTL ? 'justify-start' : 'justify-start'}`} data-testid="action-buttons">
                {onFollowClick && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={onFollowClick}
                    className="gap-1.5"
                    data-testid="button-follow"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>{isRTL ? "إلغاء المتابعة" : "Unfollow"}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>{isRTL ? "متابعة" : "Follow"}</span>
                      </>
                    )}
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

      {/* C) TAB BAR - Starts from right in RTL */}
      <div className="mt-6 border-b border-border/50">
        <div className="mx-auto max-w-[1100px] px-4 md:px-6">
          <div 
            className={`flex items-center gap-1 overflow-x-auto pb-px scrollbar-hide ${isRTL ? 'justify-start' : 'justify-start'}`}
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

      {/* D) TAB CONTENT */}
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-6" data-testid="profile-content">
        {children}
      </div>
    </div>
  );
}

export default AcademicProfileShell;
