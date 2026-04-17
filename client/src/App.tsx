import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDaamStore, DaamStoreProvider } from "@/hooks/use-daam-store";
import { LayoutShell } from "@/components/layout-shell";
import { Loader2, Ban } from "lucide-react";
import { isAdminEmail } from "@/config/admin";
import { Forbidden } from "@/components/admin/Forbidden";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location]);
  return null;
}

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Verify from "@/pages/verify";
import Dashboard from "@/pages/dashboard";
import Feed from "@/pages/feed";
import Tutor from "@/pages/tutor";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import Terms from "@/pages/terms";
import Messages from "@/pages/messages";
import CampaignPage from "@/pages/campaign";
import PostPage from "@/pages/post";
import NotFound from "@/pages/not-found";
import ResetPassword from "@/pages/reset-password";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useDaamStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function RootRedirect() {
  const { user, isLoading } = useDaamStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }
  
  return user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />;
}

function AdminRoute() {
  const { user } = useDaamStore();
  
  if (!user || !isAdminEmail(user.email)) {
    return <Forbidden />;
  }
  
  return <Admin />;
}

function Router() {
  const { user } = useDaamStore();
  
  return (
    <>
      {user ? (
        <LayoutShell>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/feed" component={Feed} />
            <Route path="/tutor" component={Tutor} />
            <Route path="/profile/:email?" component={Profile} />
            <Route path="/messages" component={Messages} />
            <Route path="/admin" component={AdminRoute} />
            <Route path="/terms" component={Terms} />
            <Route path="/c/:id" component={CampaignPage} />
            <Route path="/post/:id" component={PostPage} />
            <Route path="/login">
              <Redirect to="/dashboard" />
            </Route>
            <Route path="/">
              <Redirect to="/dashboard" />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </LayoutShell>
      ) : (
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/verify" component={Verify} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/terms" component={Terms} />
          <Route path="/c/:id" component={CampaignPage} />
          <Route>
            <Redirect to="/login" />
          </Route>
        </Switch>
      )}
    </>
  );
}

// Banned user screen
function BannedScreen({ reason, expiresAt }: { reason?: string; expiresAt?: number }) {
  const { lang, logout } = useDaamStore();
  const isArabic = lang === 'ar';
  
  const formatExpiry = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(isArabic ? 'ar-OM' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-background p-4"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Ban className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">
            {isArabic ? 'تم تعليق حسابك' : 'Your Account is Suspended'}
          </CardTitle>
          <CardDescription>
            {isArabic 
              ? 'لا يمكنك الوصول إلى المنصة حاليًا'
              : 'You cannot access the platform at this time'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reason && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">
                {isArabic ? 'السبب:' : 'Reason:'}
              </p>
              <p className="text-sm font-medium">{reason}</p>
            </div>
          )}
          
          {expiresAt ? (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">
                {isArabic ? 'ينتهي التعليق في:' : 'Suspension ends:'}
              </p>
              <p className="text-sm font-medium">{formatExpiry(expiresAt)}</p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-destructive/10">
              <p className="text-sm text-destructive font-medium">
                {isArabic ? 'هذا التعليق دائم' : 'This suspension is permanent'}
              </p>
            </div>
          )}
          
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full"
            data-testid="button-logout-banned"
          >
            {isArabic ? 'تسجيل خروج' : 'Logout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AppContent() {
  const { isLoading, user, isUserBanned } = useDaamStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }
  
  // Check if current user is banned
  if (user) {
    const banStatus = isUserBanned(user.email);
    if (banStatus.banned) {
      return <BannedScreen reason={banStatus.reason} expiresAt={banStatus.expiresAt} />;
    }
  }
  
  return (
    <>
      <ScrollToTop />
      <Router />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DaamStoreProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </DaamStoreProvider>
    </QueryClientProvider>
  );
}

export default App;
