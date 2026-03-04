import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Issue, IssueId } from "../backend";
import CreateIssueModal from "../components/CreateIssueModal";
import {
  useDeleteIssue,
  useGetEngagements,
  useGetIssues,
} from "../hooks/useQueries";
import { getIssueTracking, isOverdue } from "../utils/issueTracking";

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

export default function IssuesPage() {
  const { data: issues = [], isLoading } = useGetIssues();
  const { data: engagements = [] } = useGetEngagements();
  const deleteIssue = useDeleteIssue();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [followUpFilter, setFollowUpFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<IssueId | null>(null);

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issue.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || issue.status === statusFilter;

    if (followUpFilter === "all") return matchesSearch && matchesStatus;

    const tracking = getIssueTracking(issue.id.toString());
    if (followUpFilter === "overdue") {
      return (
        matchesSearch &&
        matchesStatus &&
        isOverdue(tracking.targetCompletionDate) &&
        tracking.followUpStatus !== "resolved"
      );
    }
    return (
      matchesSearch &&
      matchesStatus &&
      tracking.followUpStatus === followUpFilter
    );
  });

  const handleDelete = async () => {
    if (!issueToDelete) return;

    try {
      await deleteIssue.mutateAsync(issueToDelete);
      toast.success("Issue deleted successfully");
      setDeleteDialogOpen(false);
      setIssueToDelete(null);
    } catch (error) {
      toast.error("Failed to delete issue");
      console.error(error);
    }
  };

  const getRiskBadgeClass = (risk: string) => {
    if (risk === "high")
      return "bg-destructive/15 text-destructive border-destructive/30";
    if (risk === "medium")
      return "bg-warning/15 text-warning border-warning/30";
    return "bg-secondary text-muted-foreground border-border/50";
  };

  const getStatusBadgeClass = (status: string) => {
    return status === "open"
      ? "bg-primary/15 text-primary border-primary/30"
      : "bg-secondary text-muted-foreground border-border/50";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-wide">
            Issue Log
          </h1>
          <p className="text-muted-foreground text-sm">
            Track and manage audit issues with follow-up actions
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingIssue(null);
            setCreateModalOpen(true);
          }}
          className="gap-2 shadow-accent-sm hover:shadow-accent-md transition-shadow"
          data-ocid="issues.primary_button"
        >
          <Plus className="h-4 w-4" />
          New Issue
        </Button>
      </div>

      <Card className="border-border/60 bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary/40 border-border/50 focus:border-primary/50"
                data-ocid="issues.search_input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-36 bg-secondary/40 border-border/50 focus:border-primary/50"
                data-ocid="issues.status.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/60">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
              <SelectTrigger
                className="w-40 bg-secondary/40 border-border/50 focus:border-primary/50"
                data-ocid="issues.followup.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/60">
                <SelectItem value="all">All Follow-ups</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6" data-ocid="issues.loading_state">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : filteredIssues.length === 0 ? (
            <div
              className="text-center py-16 space-y-4 px-6"
              data-ocid="issues.empty_state"
            >
              <div
                className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.62 0.13 30 / 0.12), transparent 70%)",
                }}
              >
                <AlertCircle className="h-7 w-7 text-primary/50" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  followUpFilter !== "all"
                    ? "No issues found"
                    : "No issues yet"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  followUpFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Log your first audit issue"}
                </p>
              </div>
              {!searchTerm &&
                statusFilter === "all" &&
                followUpFilter === "all" && (
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="shadow-accent-sm hover:shadow-accent-md transition-shadow"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Issue
                  </Button>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="issues.table">
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Description
                    </TableHead>
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold hidden md:table-cell">
                      Engagement
                    </TableHead>
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold hidden md:table-cell">
                      Account Head
                    </TableHead>
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Risk
                    </TableHead>
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold hidden lg:table-cell">
                      Responsible
                    </TableHead>
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold hidden lg:table-cell">
                      Due Date
                    </TableHead>
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Follow-up
                    </TableHead>
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue, idx) => {
                    const engagement = engagements.find(
                      (e) => e.id === issue.engagementId,
                    );
                    const tracking = getIssueTracking(issue.id.toString());
                    const overdue =
                      isOverdue(tracking.targetCompletionDate) &&
                      tracking.followUpStatus !== "resolved";
                    return (
                      <TableRow
                        key={issue.id.toString()}
                        className={`border-border/30 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 group ${
                          overdue ? "border-l-2 border-l-destructive/60" : ""
                        }`}
                        data-ocid={`issues.item.${idx + 1}`}
                      >
                        <TableCell className="max-w-[200px]">
                          <p className="font-medium text-foreground truncate group-hover:text-primary/90 transition-colors">
                            {issue.description}
                          </p>
                          {issue.recommendations && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {issue.recommendations}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                          {engagement?.clientName ?? "Unknown"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden md:table-cell max-w-[140px] truncate">
                          {tracking.accountHead ? (
                            <span className="font-medium text-foreground/80">
                              {tracking.accountHead}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 italic text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskBadgeClass(issue.riskLevel)}>
                            {issue.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden lg:table-cell max-w-[120px] truncate">
                          {tracking.responsibleOfficer || (
                            <span className="text-muted-foreground/40 italic text-xs">
                              Not assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {tracking.targetCompletionDate ? (
                            <span
                              className={`font-mono text-xs tabular-nums ${
                                overdue
                                  ? "text-destructive font-semibold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {new Date(
                                tracking.targetCompletionDate,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              {overdue && (
                                <span className="ml-1 text-[10px]">⚠</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 italic text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getFollowUpBadgeClass(
                              tracking.followUpStatus,
                            )}
                          >
                            {getFollowUpLabel(tracking.followUpStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(issue.status)}>
                            {issue.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingIssue(issue);
                                setCreateModalOpen(true);
                              }}
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                              data-ocid={`issues.edit_button.${idx + 1}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIssueToDelete(issue.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              data-ocid={`issues.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateIssueModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        editingIssue={editingIssue}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          className="bg-card border-border/60 shadow-dark-lg"
          data-ocid="issues.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-foreground">
              Delete Issue
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this issue? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border/50 hover:border-border hover:bg-secondary"
              data-ocid="issues.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="issues.delete.confirm_button"
            >
              {deleteIssue.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
