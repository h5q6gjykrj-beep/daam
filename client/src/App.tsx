import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDaamStore } from "@/hooks/use-daam-store";
import { LayoutShell } from "@/components/layout-shell";
import { Loader2 } from "lucide-react";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Feed from "@/pages/feed";
import Tutor from "@/pages/tutor";
import NotFound from "@/pages/not-found";

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
          <Route path="/login" component={Login} />
          <Route>
            <Redirect to="/login" />
          </Route>
        </Switch>
      )}
    </>
  );
}

function AppContent() {
  const { isLoading } = useDaamStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }
  
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
