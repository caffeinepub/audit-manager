import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import AppLayout from "./components/AppLayout";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import DashboardPage from "./pages/DashboardPage";
import EngagementDetailPage from "./pages/EngagementDetailPage";
import EngagementsPage from "./pages/EngagementsPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import IssuesPage from "./pages/IssuesPage";
import LoginPage from "./pages/LoginPage";
import OpeningBalancePage from "./pages/OpeningBalancePage";
import WorkpaperPage from "./pages/WorkpaperPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Wait for the auth client to finish loading the stored session before deciding
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, oklch(0.75 0.14 30), oklch(0.55 0.15 25))",
            }}
          >
            <span className="text-white font-serif font-bold text-3xl leading-none">
              A
            </span>
          </div>
          <div className="h-1 w-32 rounded-full overflow-hidden bg-border/40">
            <div
              className="h-full rounded-full animate-pulse"
              style={{ background: "oklch(0.62 0.13 30)", width: "60%" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      {showProfileSetup && <ProfileSetupModal />}
      <AppLayout>
        <Outlet />
      </AppLayout>
    </>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const engagementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engagements",
  component: EngagementsPage,
});

const engagementDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engagements/$engagementId",
  component: EngagementDetailPage,
});

const workpaperRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engagements/$engagementId/sections/$sectionId",
  component: WorkpaperPage,
});

const issuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/issues",
  component: IssuesPage,
});

const openingBalanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engagements/$engagementId/opening-balance",
  component: OpeningBalancePage,
});

const followUpsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/follow-ups",
  component: FollowUpsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  engagementsRoute,
  engagementDetailRoute,
  workpaperRoute,
  issuesRoute,
  openingBalanceRoute,
  followUpsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="auditflow-theme"
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
