import { useEffect } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { ClerkProvider, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/home";
import { JobsIndex } from "@/pages/jobs/index";
import { JobDetail } from "@/pages/jobs/[id]";
import { JobLandingPage } from "@/pages/jobs/landing";
import { CATEGORY_SLUGS, CITY_SLUGS } from "@/data/landing-pages";
import { PostJob } from "@/pages/post-a-job";
import { SavedJobsPage } from "@/pages/saved-jobs";
import { AlertsPage } from "@/pages/alerts";
import { ProfilePage } from "@/pages/profile";
import { MyApplicationsPage } from "@/pages/my-applications";
import { EmployerReviewPage } from "@/pages/employer/review";
import { EmployerDashboard } from "@/pages/employer/dashboard";
import { PromoteSuccessPage } from "@/pages/employer/promote-success";
import { EmployerInboxPage } from "@/pages/employer/inbox";
import { EmployerCompanyPage } from "@/pages/employer/company";
import { CompanyProfilePage } from "@/pages/companies/[slug]";
import { SalaryExplorerPage } from "@/pages/salary";
import { BlogIndexPage } from "@/pages/blog/index";
import { BlogPostPage } from "@/pages/blog/[slug]";
import { RemoteJobsPage } from "@/pages/jobs/remote";
import { RemoteCategoryPage } from "@/pages/jobs/remote-cat";
import { RemoteCityPage } from "@/pages/jobs/remote-city";
import { Footer } from "@/components/layout/Footer";
import { EmployerPricingPage } from "@/pages/pricing";
import { PrivacyPage } from "@/pages/privacy";
import { TermsPage } from "@/pages/terms";
import { ContactPage } from "@/pages/contact";
import { AccessibilityPage } from "@/pages/accessibility";
import { TrustPage } from "@/pages/trust";
import { CookieConsent } from "@/components/CookieConsent";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// Dynamically resolve proxy URL from the current origin so the same build
// works on theknightedjobs.com without a hardcoded env var.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL
  ?? (import.meta.env.PROD ? `${window.location.origin}/api/__clerk` : undefined);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

/**
 * When a user is authenticated on KnightedJobs, ping /api/resume-ready/me.
 * This runs `ensureUser` server-side, inserting a row into the shared `users`
 * table so the account is immediately recognised on Knighted Resume too.
 */
function UserSync() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    const sync = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch("/api/resume-ready/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Non-critical — best effort
      }
    };

    sync();
  }, [isSignedIn, getToken]);

  return null;
}

function Router() {
  return (
    <>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/jobs" component={JobsIndex} />
      <Route path="/jobs/remote" component={RemoteJobsPage} />
      <Route path="/jobs/remote/:cat" component={RemoteCategoryPage} />
      <Route path="/jobs/remote/city/:city" component={RemoteCityPage} />
      <Route path="/jobs/:cat/:city" component={({ params }) => {
        // Canonical order: /jobs/finance/london
        if (CATEGORY_SLUGS[params.cat] && CITY_SLUGS[params.city]) {
          return <JobLandingPage mode="combined" catSlug={params.cat} citySlug={params.city} />;
        }
        // S4 city-first order: /jobs/london/finance → same page, canonical points to cat-first URL
        if (CITY_SLUGS[params.cat] && CATEGORY_SLUGS[params.city]) {
          return <JobLandingPage mode="combined" catSlug={params.city} citySlug={params.cat} />;
        }
        return <NotFound />;
      }} />
      <Route path="/jobs/:id" component={({ params }) => {
        if (CATEGORY_SLUGS[params.id]) return <JobLandingPage mode="category" catSlug={params.id} />;
        if (CITY_SLUGS[params.id]) return <JobLandingPage mode="city" citySlug={params.id} />;
        return <JobDetail />;
      }} />
      <Route path="/post-a-job" component={PostJob} />
      <Route path="/saved-jobs" component={SavedJobsPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/my-applications" component={MyApplicationsPage} />
      <Route path="/employer/dashboard" component={EmployerDashboard} />
      <Route path="/employer/promote-success" component={PromoteSuccessPage} />
      <Route path="/employer/inbox" component={EmployerInboxPage} />
      <Route path="/employer/company" component={EmployerCompanyPage} />
      <Route path="/companies/:slug" component={CompanyProfilePage} />
      <Route path="/employer/:id" component={EmployerReviewPage} />
      <Route path="/salary" component={SalaryExplorerPage} />
      <Route path="/blog" component={BlogIndexPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/pricing" component={EmployerPricingPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/accessibility" component={AccessibilityPage} />
      <Route path="/trust" component={TrustPage} />
      <Route component={NotFound} />
    </Switch>
    <Footer />
  </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey ?? ""}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <UserSync />
        <Router />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <TooltipProvider>
          <ClerkProviderWithRoutes />
          <Toaster />
          <CookieConsent />
        </TooltipProvider>
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
