import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Dashboard } from "@/pages/dashboard";
import { Matches } from "@/pages/matches";
import { MatchDetail } from "@/pages/match-detail";
import { Leaderboard } from "@/pages/leaderboard";
import { Groups } from "@/pages/groups";
import { Bracket } from "@/pages/bracket";
import { Admin } from "@/pages/admin";
import { Profile } from "@/pages/profile";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#00FF66",
    colorForeground: "#F8FAFC",
    colorMutedForeground: "#94A3B8",
    colorDanger: "#EF4444",
    colorBackground: "#0F172A",
    colorInput: "#1E293B",
    colorInputForeground: "#F8FAFC",
    colorNeutral: "#1E293B",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0F172A] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#1E293B]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold tracking-tight text-white",
    headerSubtitle: "text-[#94A3B8]",
    socialButtonsBlockButtonText: "font-medium text-white",
    formFieldLabel: "text-sm font-medium text-[#F8FAFC]",
    footerActionLink: "text-[#00FF66] hover:text-[#00CC52]",
    footerActionText: "text-[#94A3B8]",
    dividerText: "text-[#94A3B8]",
    identityPreviewEditButton: "text-[#00FF66]",
    formFieldSuccessText: "text-[#00FF66]",
    alertText: "text-[#EF4444]",
    logoBox: "h-12 flex justify-center mb-4",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "bg-[#1E293B] border-[#1E293B] hover:bg-[#334155]",
    formButtonPrimary: "bg-[#00FF66] text-[#020817] hover:bg-[#00CC52] font-semibold",
    formFieldInput: "bg-[#1E293B] border-[#334155] text-white focus:border-[#00FF66] focus:ring-[#00FF66]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#1E293B]",
    alert: "bg-[#EF4444]/10 border border-[#EF4444]",
    otpCodeFieldInput: "bg-[#1E293B] border-[#334155] text-white focus:border-[#00FF66]",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
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
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
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
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/matches">
            <ProtectedRoute component={Matches} />
          </Route>
          <Route path="/matches/:id">
            <ProtectedRoute component={MatchDetail} />
          </Route>
          <Route path="/leaderboard">
            <ProtectedRoute component={Leaderboard} />
          </Route>
          <Route path="/groups">
            <ProtectedRoute component={Groups} />
          </Route>
          <Route path="/bracket">
            <ProtectedRoute component={Bracket} />
          </Route>
          <Route path="/admin">
            <ProtectedRoute component={Admin} />
          </Route>
          <Route path="/profile">
            <ProtectedRoute component={Profile} />
          </Route>
        </Switch>
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
