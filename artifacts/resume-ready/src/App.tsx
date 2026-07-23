import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import PricingPage from "@/pages/PricingPage";
import DashboardPage from "@/pages/DashboardPage";
import ResumesPage from "@/pages/ResumesPage";
import ResumeEditorPage from "@/pages/ResumeEditorPage";
import CoverLettersPage from "@/pages/CoverLettersPage";
import CoverLetterEditorPage from "@/pages/CoverLetterEditorPage";
import JobSearchPage from "@/pages/JobSearchPage";
import PipelinePage from "@/pages/PipelinePage";
import FeedbackPage from "@/pages/FeedbackPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import ContactPage from "@/pages/ContactPage";
import AccessibilityPage from "@/pages/AccessibilityPage";
import TrustPage from "@/pages/TrustPage";
import BlogIndexPage from "@/pages/BlogIndexPage";
import BlogPostPage from "@/pages/BlogPostPage";
import InterviewPage from "@/pages/InterviewPage";
import SharedResumePage from "@/pages/SharedResumePage";
import ReferralsPage from "@/pages/ReferralsPage";
import ContactsPage from "@/pages/ContactsPage";
import TodayPage from "@/pages/TodayPage";
import { CookieConsent } from "@/components/CookieConsent";
import AskKIPage from "@/pages/AskKIPage";
import SettingsPage from "@/pages/SettingsPage";
import AiTailorPage from "@/pages/AiTailorPage";
import TemplateGalleryPage from "@/pages/TemplateGalleryPage";
import CustomSignUpPage from "@/pages/CustomSignUpPage";
import ResumesFeaturePage from "@/pages/ResumesFeaturePage";
import AiTailorFeaturePage from "@/pages/AiTailorFeaturePage";
import PipelineFeaturePage from "@/pages/PipelineFeaturePage";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
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
    colorPrimary: "hsl(226 58% 39%)",
    colorForeground: "hsl(222 47% 11%)",
    colorMutedForeground: "hsl(215 16% 47%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(214 32% 91%)",
    colorInputForeground: "hsl(222 47% 11%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButtonText: "text-sm font-medium text-foreground",
    formFieldLabel: "text-sm font-medium text-foreground",
    footerActionLink: "text-sm font-medium text-primary underline underline-offset-2",
    footerActionText: "text-sm text-muted-foreground",
    dividerText: "text-xs text-muted-foreground uppercase",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-sm text-green-600",
    alertText: "text-sm text-danger",
    logoBox: "h-8 w-auto flex justify-center mb-6",
    logoImage: "h-8",
    socialButtonsBlockButton: "border border-input hover:bg-accent hover:text-accent-foreground",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md h-10",
    formFieldInput: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    footerAction: "bg-muted/50 p-4 border-t border-border",
    dividerLine: "bg-border",
    alert: "bg-red-50 border border-red-200 p-3 rounded-md",
    otpCodeFieldInput: "border-input border rounded-md text-lg text-foreground",
    formFieldRow: "mb-4",
    main: "px-8 py-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4">
      <NoIndex />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <>
      <NoIndex />
      <CustomSignUpPage />
    </>
  );
}

const REFERRAL_STORAGE_KEY = "kr_referral_code";

// Captures a ?ref=CODE param from the URL (e.g. shared invite links) into localStorage
// so it survives the sign-up flow, then applies it once the user is authenticated.
function ReferralCapture() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
      params.delete("ref");
      const rest = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : ""));
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    const code = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!code) return;

    (async () => {
      try {
        const token = await getToken();
        await fetch(`${basePath}/api/resume-ready/referrals/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ code }),
        });
      } catch {
        // best-effort; ignore failures
      } finally {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
      }
    })();
  }, [isSignedIn, getToken]);

  return null;
}

// Helps user's webview stay up-to-date when the signed-in user changes by invalidating the QueryClient cache.
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

function HomeRedirect() {
  return <LandingPage />;
}

function NoIndex() {
  useEffect(() => {
    let tag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const prev = tag?.content ?? "";
    if (tag) {
      tag.content = "noindex,nofollow";
    } else {
      tag = document.createElement("meta");
      tag.name = "robots";
      tag.content = "noindex,nofollow";
      document.head.appendChild(tag);
    }
    return () => {
      const el = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (el) el.content = prev || "index,follow";
    };
  }, []);
  return null;
}

function ProtectedRoute({ component: Component, fallback: Fallback }: { component: React.ComponentType; fallback?: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <NoIndex />
        <Component />
      </Show>
      <Show when="signed-out">
        {Fallback ? <Fallback /> : <Redirect to="/" />}
      </Show>
    </>
  );
}

function Router() {
  const [, setLocation] = useLocation();

  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/templates" component={TemplateGalleryPage} />
      <Route path="/upgrade"><Redirect to="/pricing" /></Route>
      
      {/* REQUIRED — copy "/sign-in/*?" and "/sign-up/*?" verbatim. */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/resumes">
        <ProtectedRoute component={ResumesPage} fallback={ResumesFeaturePage} />
      </Route>
      <Route path="/ai-tailor">
        <ProtectedRoute component={AiTailorPage} fallback={AiTailorFeaturePage} />
      </Route>
      <Route path="/resumes/:id">
        <ProtectedRoute component={ResumeEditorPage} />
      </Route>
      <Route path="/cover-letters">
        <ProtectedRoute component={CoverLettersPage} />
      </Route>
      <Route path="/cover-letters/:id">
        <ProtectedRoute component={CoverLetterEditorPage} />
      </Route>
      <Route path="/jobs">
        <ProtectedRoute component={JobSearchPage} />
      </Route>
      <Route path="/pipeline">
        <ProtectedRoute component={PipelinePage} fallback={PipelineFeaturePage} />
      </Route>
      <Route path="/feedback">
        <ProtectedRoute component={FeedbackPage} />
      </Route>
      <Route path="/interview">
        <ProtectedRoute component={InterviewPage} />
      </Route>
      <Route path="/referrals">
        <ProtectedRoute component={ReferralsPage} />
      </Route>
      <Route path="/contacts">
        <ProtectedRoute component={ContactsPage} />
      </Route>
      <Route path="/today">
        <ProtectedRoute component={TodayPage} />
      </Route>
      <Route path="/ask-ki">
        <ProtectedRoute component={AskKIPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>

      <Route path="/r/:token" component={SharedResumePage} />

      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/accessibility" component={AccessibilityPage} />
      <Route path="/trust" component={TrustPage} />
      <Route path="/blog" component={BlogIndexPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
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
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ReferralCapture />
        <Router />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <ClerkProviderWithRoutes />
        <Toaster />
        <CookieConsent />
      </TooltipProvider>
    </WouterRouter>
  );
}

export default App;
