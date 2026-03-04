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
  const { identity } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

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
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
