import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Home } from "@/pages/Home";
import { Dashboard } from "@/pages/Dashboard";
import { Strategies } from "@/pages/Strategies";
import { StrategyNew } from "@/pages/StrategyNew";
import { StrategyDetail } from "@/pages/StrategyDetail";
import { Coach } from "@/pages/Coach";
import { Conversations } from "@/pages/Conversations";
import { Analytics } from "@/pages/Analytics";
import { Clients } from "@/pages/Clients";
import { Communicate } from "@/pages/Communicate";
import { StartupIdeas } from "@/pages/StartupIdeas";
import { Missions } from "@/pages/Missions";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(180 100% 45%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(220 10% 65%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(220 15% 7%)",
    colorInput: "hsl(220 15% 15%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(220 15% 18%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0c0d12] rounded-2xl w-[440px] max-w-full overflow-hidden border border-primary/20 shadow-[0_0_40px_-10px_rgba(0,255,255,0.15)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-display font-bold tracking-tight text-2xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium drop-shadow-[0_0_5px_rgba(0,255,255,0.3)]",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-500",
    alertText: "text-foreground",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-10",
    socialButtonsBlockButton: "border-white/10 hover:bg-white/5 bg-transparent",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all",
    formFieldInput: "bg-black/40 border-white/10 focus-visible:ring-primary/50 text-foreground",
    footerAction: "bg-transparent",
    dividerLine: "bg-white/10",
    alert: "bg-destructive/10 border-destructive/20",
    otpCodeFieldInput: "border-white/10 bg-black/40 focus-visible:ring-primary/50 text-foreground",
    formFieldRow: "mb-4",
    main: "gap-6",
  },
};

function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-[20%] left-[20%] w-[30%] h-[40%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[25%] h-[30%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Home /></Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={() => <AuthPage><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></AuthPage>} />
            <Route path="/sign-up/*?" component={() => <AuthPage><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></AuthPage>} />

            <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
            <Route path="/analytics">{() => <ProtectedRoute component={Analytics} />}</Route>

            <Route path="/coach">{() => <ProtectedRoute component={Coach} />}</Route>
            <Route path="/conversations">{() => <ProtectedRoute component={Conversations} />}</Route>
            <Route path="/missions">{() => <ProtectedRoute component={Missions} />}</Route>

            <Route path="/strategies">{() => <ProtectedRoute component={Strategies} />}</Route>
            <Route path="/strategies/new">{() => <ProtectedRoute component={StrategyNew} />}</Route>
            <Route path="/strategies/:id">{() => <ProtectedRoute component={StrategyDetail} />}</Route>

            <Route path="/clients">{() => <ProtectedRoute component={Clients} />}</Route>
            <Route path="/communicate">{() => <ProtectedRoute component={Communicate} />}</Route>
            <Route path="/startup-ideas">{() => <ProtectedRoute component={StartupIdeas} />}</Route>

            <Route>{() => (
              <Show when="signed-in">
                <AppLayout><NotFound /></AppLayout>
              </Show>
            )}</Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
