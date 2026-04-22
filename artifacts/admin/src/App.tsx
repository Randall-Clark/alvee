import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { Users } from "@/pages/Users";
import { Events } from "@/pages/Events";
import { Revenue } from "@/pages/Revenue";
import { Stats } from "@/pages/Stats";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Settings() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-foreground">Paramètres</h1>
      <p className="text-muted-foreground">Paramètres de la plateforme — bientôt disponible.</p>
    </div>
  );
}

function Router() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/users" component={Users} />
            <Route path="/events" component={Events} />
            <Route path="/revenue" component={Revenue} />
            <Route path="/stats" component={Stats} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
