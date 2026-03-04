import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Issue } from "../backend";
import CreateIssueModal from "../components/CreateIssueModal";
import { useGetEngagements, useGetIssues } from "../hooks/useQueries";
import {
  type IssueTracking,
  getAllIssueTrackings,
  getIssueTracking,
  isOverdue,
  saveIssueTracking,
} from "../utils/issueTracking";

type FollowUpFilter = "all" | "pending" | "inProgress" | "resolved" | "overdue";

function getFollowUpBadgeClass(status: string) {
  if (status === "resolved")
    return "bg-success/15 text-success border-success/30";
  if (status === "inProgress")
    return "bg-blue-500/15 text-blue-600 border-blue-500/30";
  return "bg-warning/15 text-warning border-warning/30";
}

function getFollowUpLabel(status: string) {
  if (status === "resolved") return "Resolved";
  if (status === "inProgress") return "In Progress";
  return "Pending";
}

function getRiskBadgeClass(risk: string) {
  if (risk === "high")
    return "bg-destructive/15 text-destructive border-destructive/30";
  if (risk === "medium") return "bg-warning/15 text-warning border-warning/30";
  return "bg-secondary text-muted-foreground border-border/50";
}

export default function FollowUpsPage() {
  const { data: issues = [], isLoading: issuesLoading } = useGetIssues();
  const { data: engagements = [], isLoading: engagementsLoading } =
    useGetEngagements();
  const isLoading = issuesLoading || engagementsLoading;

  const [filter, setFilter] = useState<FollowUpFilter>("all");
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [overdrueBannerDismissed, setOverdueBannerDismissed] = useState(false);

  // Check reminders on load (once per day)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const checkedKey = `reminders-checked-${today}`;
    if (localStorage.getItem(checkedKey)) return;

    // Check all reminders
    let remindersTriggered = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("reminder-")) {
        const reminderDate = localStorage.getItem(key);
        if (reminderDate && reminderDate <= today) {
          remindersTriggered++;
        }
      }
    }

    if (remindersTriggered > 0) {
      toast.warning(
        `You have ${remindersTriggered} reminder(s) due today or overdue. Check your follow-up items.`,
        { duration: 6000 },
      );
    }

    localStorage.setItem(checkedKey, "1");
  }, []);

  const trackings = useMemo(() => getAllIssueTrackings(), []);

  const enrichedIssues = useMemo(() => {
    return issues.map((issue) => {
      const tracking =
        trackings[issue.id.toString()] ?? getIssueTracking(issue.id.toString());
      const engagement = engagements.find((e) => e.id === issue.engagementId);
      const overdue =
        isOverdue(tracking.targetCompletionDate) &&
        tracking.followUpStatus !== "resolved";
      return { issue, tracking, engagement, overdue };
    });
  }, [issues, engagements, trackings]);

  const overdueCount = useMemo(
    () => enrichedIssues.filter((e) => e.overdue).length,
    [enrichedIssues],
  );

  const filteredItems = useMemo(() => {
    return enrichedIssues.filter(({ tracking, overdue }) => {
      if (filter === "all") return true;
      if (filter === "overdue") return overdue;
      return tracking.followUpStatus === filter;
    });
  }, [enrichedIssues, filter]);

  const handleSetReminder = (issueId: string) => {
    // Set reminder for tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    localStorage.setItem(`reminder-${issueId}`, dateStr);
    toast.success("Reminder set for tomorrow");
  };

  const handleMarkResolved = (issueId: string, tracking: IssueTracking) => {
    const updated: IssueTracking = { ...tracking, followUpStatus: "resolved" };
    saveIssueTracking(issueId, updated);
    toast.success("Marked as resolved");
    // Force re-render by updating a state
    setFilter((f) => f);
  };

  const filterOptions: {
    label: string;
    value: FollowUpFilter;
    count?: number;
  }[] = [
    { label: "All", value: "all", count: enrichedIssues.length },
    {
      label: "Pending",
      value: "pending",
      count: enrichedIssues.filter(
        (e) => e.tracking.followUpStatus === "pending",
      ).length,
    },
    {
      label: "In Progress",
      value: "inProgress",
      count: enrichedIssues.filter(
        (e) => e.tracking.followUpStatus === "inProgress",
      ).length,
    },
    {
      label: "Resolved",
      value: "resolved",
      count: enrichedIssues.filter(
        (e) => e.tracking.followUpStatus === "resolved",
      ).length,
    },
    { label: "Overdue", value: "overdue", count: overdueCount },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif font-bold text-foreground tracking-wide">
              Follow-ups
            </h1>
            {overdueCount > 0 && (
              <Badge className="bg-destructive/15 text-destructive border-destructive/30 font-mono text-xs">
                {overdueCount} overdue
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Track pending actions, responsible officers, and completion dates
            across all engagements
          </p>
        </div>
      </div>

      {/* Overdue Banner */}
      {overdueCount > 0 && !overdrueBannerDismissed && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/8"
          data-ocid="followups.overdue.panel"
        >
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-destructive text-sm">
              {overdueCount} overdue follow-up item
              {overdueCount !== 1 ? "s" : ""}
            </p>
            <p className="text-destructive/70 text-xs mt-0.5">
              These items have passed their target completion date and require
              immediate attention.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOverdueBannerDismissed(true)}
            className="shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            data-ocid={`followups.${opt.value}.tab`}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === opt.value
                ? opt.value === "overdue"
                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                  : "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-transparent"
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={`text-xs font-mono px-1.5 py-0.5 rounded-full ${
                  filter === opt.value
                    ? opt.value === "overdue"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="followups.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card
          className="border-border/60 bg-card"
          data-ocid="followups.empty_state"
        >
          <CardContent className="py-16 text-center space-y-4">
            <div
              className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.62 0.13 30 / 0.12), transparent 70%)",
              }}
            >
              <Clock className="h-7 w-7 text-primary/50" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                No follow-up items found
              </p>
              <p className="text-muted-foreground text-sm">
                {filter !== "all"
                  ? "Try selecting a different filter"
                  : "Issues with tracking data will appear here"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(
            ({ issue, tracking, engagement, overdue }, idx) => (
              <Card
                key={issue.id.toString()}
                className={`border-border/60 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-sm overflow-hidden ${
                  overdue ? "border-l-4 border-l-destructive/60" : ""
                }`}
                data-ocid={`followups.item.${idx + 1}`}
              >
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="font-medium text-base text-foreground">
                          {issue.description}
                        </CardTitle>
                        <Badge className={getRiskBadgeClass(issue.riskLevel)}>
                          {issue.riskLevel}
                        </Badge>
                        <Badge
                          className={getFollowUpBadgeClass(
                            tracking.followUpStatus,
                          )}
                        >
                          {getFollowUpLabel(tracking.followUpStatus)}
                        </Badge>
                        {overdue && (
                          <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">
                            ⚠ Overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {engagement?.clientName ?? "Unknown Client"}{" "}
                        {engagement
                          ? `· FY ${Number(engagement.financialYear)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetReminder(issue.id.toString())}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1.5 text-xs"
                        data-ocid={`followups.reminder.button.${idx + 1}`}
                      >
                        <Bell className="h-3.5 w-3.5" />
                        Remind
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingIssue(issue);
                          setEditModalOpen(true);
                        }}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                        data-ocid={`followups.edit_button.${idx + 1}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {tracking.followUpStatus !== "resolved" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleMarkResolved(issue.id.toString(), tracking)
                          }
                          className="text-muted-foreground hover:text-success hover:bg-success/10 gap-1.5 text-xs"
                          data-ocid={`followups.resolve_button.${idx + 1}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Responsible Officer */}
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                          Responsible Officer
                        </p>
                        <p className="text-sm text-foreground truncate">
                          {tracking.responsibleOfficer || (
                            <span className="text-muted-foreground/50 italic">
                              Not assigned
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Target Date */}
                    <div className="flex items-start gap-2">
                      <Calendar
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          overdue
                            ? "text-destructive"
                            : "text-muted-foreground/60"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                          Target Date
                        </p>
                        <p
                          className={`text-sm font-mono tabular-nums ${
                            overdue
                              ? "text-destructive font-semibold"
                              : "text-foreground"
                          }`}
                        >
                          {tracking.targetCompletionDate ? (
                            new Date(
                              tracking.targetCompletionDate,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          ) : (
                            <span className="text-muted-foreground/50 italic font-sans font-normal">
                              No date set
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Client Response */}
                    {tracking.clientResponse && (
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <BellRing className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                            Client Response
                          </p>
                          <p className="text-sm text-foreground line-clamp-2">
                            {tracking.clientResponse}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Follow-up Notes */}
                  {tracking.followUpNotes && (
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-1">
                        Follow-up Notes
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tracking.followUpNotes}
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {issue.recommendations && (
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-1">
                        Recommendation
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {issue.recommendations}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}

      {/* Edit Issue Modal */}
      <CreateIssueModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        editingIssue={editingIssue}
      />
    </div>
  );
}
