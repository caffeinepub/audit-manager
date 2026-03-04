import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Clock,
  TimerOff,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useGetDashboardData,
  useGetEngagements,
  useGetIssues,
} from "../hooks/useQueries";
import { getAllIssueTrackings, isOverdue } from "../utils/issueTracking";

function MetricCard({
  title,
  icon,
  value,
  isLoading,
  valueClassName = "",
  href,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  isLoading: boolean;
  valueClassName?: string;
  href?: string;
}) {
  const inner = (
    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-accent-sm group">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase text-[11px] tracking-[0.12em]">
          {title}
        </p>
        <div className="text-primary/50 group-hover:text-primary/80 transition-colors">
          {icon}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-24" />
      ) : (
        <p
          className={`text-4xl font-mono font-bold tabular-nums tracking-tight ${valueClassName || "text-foreground"}`}
        >
          {value}
        </p>
      )}

      {/* Subtle inner glow */}
      <div
        className="absolute bottom-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 80% 80%, oklch(0.62 0.13 30 / 0.08), transparent 70%)",
        }}
      />
    </div>
  );

  if (href) {
    return <Link to={href as "/follow-ups"}>{inner}</Link>;
  }
  return inner;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading: dashboardLoading } =
    useGetDashboardData();
  const { data: engagements = [], isLoading: engagementsLoading } =
    useGetEngagements();
  const { data: issues = [], isLoading: issuesLoading } = useGetIssues();

  const [overdueBannerDismissed, setOverdueBannerDismissed] = useState(() => {
    return !!sessionStorage.getItem("overdue-banner-dismissed");
  });

  const recentEngagements = engagements.slice(0, 5);

  // Compute follow-up stats from localStorage
  const followUpStats = useMemo(() => {
    if (issuesLoading || issues.length === 0) return { pending: 0, overdue: 0 };
    const trackings = getAllIssueTrackings();
    let pending = 0;
    let overdue = 0;
    for (const issue of issues) {
      const t = trackings[issue.id.toString()];
      if (!t) continue;
      if (t.followUpStatus === "pending" || t.followUpStatus === "inProgress") {
        pending++;
        if (isOverdue(t.targetCompletionDate)) overdue++;
      }
    }
    return { pending, overdue };
  }, [issues, issuesLoading]);

  const handleDismissBanner = () => {
    sessionStorage.setItem("overdue-banner-dismissed", "1");
    setOverdueBannerDismissed(true);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-serif font-bold text-foreground tracking-wide">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Overview of your audit engagements and follow-up actions
        </p>
      </div>

      {/* Overdue banner */}
      {!overdueBannerDismissed && followUpStats.overdue > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/8"
          data-ocid="dashboard.overdue.panel"
        >
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive">
              {followUpStats.overdue} overdue follow-up item
              {followUpStats.overdue !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-destructive/70 mt-0.5">
              Some action items have passed their target completion dates.
            </p>
          </div>
          <Link to="/follow-ups">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-destructive hover:bg-destructive/10 gap-1.5 text-xs font-semibold"
              data-ocid="dashboard.view_followups.button"
            >
              View Follow-ups
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismissBanner}
            className="shrink-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10 h-7 w-7"
            data-ocid="dashboard.dismiss_banner.button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Engagements"
          icon={<Briefcase className="h-5 w-5" />}
          value={Number(dashboardData?.totalEngagements ?? 0)}
          isLoading={dashboardLoading}
        />
        <MetricCard
          title="Open Issues"
          icon={<AlertCircle className="h-5 w-5" />}
          value={Number(dashboardData?.openIssues ?? 0)}
          isLoading={dashboardLoading}
        />
        <MetricCard
          title="High-Risk Issues"
          icon={<AlertTriangle className="h-5 w-5 text-destructive/70" />}
          value={Number(dashboardData?.highRiskIssues ?? 0)}
          isLoading={dashboardLoading}
          valueClassName="text-destructive"
        />
        <MetricCard
          title="Pending Follow-ups"
          icon={<Clock className="h-5 w-5 text-warning/70" />}
          value={followUpStats.pending}
          isLoading={issuesLoading}
          valueClassName={
            followUpStats.pending > 0 ? "text-warning" : "text-foreground"
          }
          href="/follow-ups"
        />
        <MetricCard
          title="Overdue Items"
          icon={<TimerOff className="h-5 w-5 text-destructive/70" />}
          value={followUpStats.overdue}
          isLoading={issuesLoading}
          valueClassName={
            followUpStats.overdue > 0 ? "text-destructive" : "text-foreground"
          }
          href="/follow-ups"
        />
      </div>

      {/* Recent Engagements */}
      <Card className="border-border/60 bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-serif text-2xl font-bold text-foreground">
                Recent Engagements
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Your most recent audit engagements
              </CardDescription>
            </div>
            <Link to="/engagements">
              <Button
                variant="outline"
                size="sm"
                className="border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all gap-1.5"
                data-ocid="dashboard.view_all.button"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {engagementsLoading ? (
            <div
              className="space-y-3"
              data-ocid="dashboard.engagements.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : recentEngagements.length === 0 ? (
            <div
              className="text-center py-16 space-y-4"
              data-ocid="dashboard.engagements.empty_state"
            >
              <div
                className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.62 0.13 30 / 0.12), transparent 70%)",
                }}
              >
                <Briefcase className="h-7 w-7 text-primary/50" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  No engagements yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Create your first engagement to get started
                </p>
              </div>
              <Link to="/engagements">
                <Button className="shadow-accent-sm hover:shadow-accent-md transition-shadow">
                  Create Your First Engagement
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEngagements.map((engagement, idx) => (
                <button
                  key={engagement.id.toString()}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/engagements/$engagementId",
                      params: { engagementId: engagement.id.toString() },
                    })
                  }
                  className="block w-full cursor-pointer text-left"
                  data-ocid={`dashboard.engagement.item.${idx + 1}`}
                >
                  <div className="flex items-center justify-between p-4 rounded-md border border-border/50 row-hover group">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {engagement.clientName}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono tabular-nums text-xs">
                          FY {Number(engagement.financialYear)}
                        </span>
                        <span className="capitalize text-xs border border-border/50 px-2 py-0.5 rounded-sm bg-secondary/50">
                          {engagement.engagementType}
                        </span>
                        <span className="font-mono tabular-nums text-xs hidden sm:inline">
                          {format(
                            new Date(
                              Number(engagement.auditStartDate) / 1_000_000,
                            ),
                            "MMM dd, yyyy",
                          )}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
