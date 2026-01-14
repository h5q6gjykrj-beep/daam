import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDaamStore } from "@/hooks/use-daam-store";
import { LayoutShell } from "@/components/layout-shell";
import { Loader2 } from "lucide-react";

import Login from "@/pages/login";
import Feed from "@/pages/feed";
import Tutor from "@/pages/tutor";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
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

function Router() {
  return (
    <LayoutShell>
      <Switch>
        {/* Public Route */}
        <Route path="/login" component={Login} />
        
        {/* Protected Routes */}
        <Route path="/feed">
          {() => <ProtectedRoute component={Feed} />}
        </Route>
        
        <Route path="/tutor">
          {() => <ProtectedRoute component={Tutor} />}
        </Route>

        {/* Root Redirect */}
        <Route path="/">
          {() => {
             const { user } = useDaamStore();
             return user ? <Redirect to="/feed" /> : <Redirect to="/login" />;
          }}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </LayoutShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
