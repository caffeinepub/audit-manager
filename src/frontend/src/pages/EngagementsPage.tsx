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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Briefcase, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { EngagementId } from "../backend";
import CreateEngagementModal from "../components/CreateEngagementModal";
import { useDeleteEngagement, useGetEngagements } from "../hooks/useQueries";

export default function EngagementsPage() {
  const navigate = useNavigate();
  const { data: engagements = [], isLoading } = useGetEngagements();
  const deleteEngagement = useDeleteEngagement();
  const [searchTerm, setSearchTerm] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [engagementToDelete, setEngagementToDelete] =
    useState<EngagementId | null>(null);

  const filteredEngagements = engagements.filter((eng) =>
    eng.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!engagementToDelete) return;

    try {
      await deleteEngagement.mutateAsync(engagementToDelete);
      toast.success("Engagement deleted successfully");
      setDeleteDialogOpen(false);
      setEngagementToDelete(null);
    } catch (error) {
      toast.error("Failed to delete engagement");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-wide">
            Engagements
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your audit engagements
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-2 shadow-accent-sm hover:shadow-accent-md transition-shadow"
        >
          <Plus className="h-4 w-4" />
          New Engagement
        </Button>
      </div>

      <Card className="border-border/60 bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center gap-4">
            <CardTitle className="font-serif text-lg text-foreground sr-only">
              All Engagements
            </CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : filteredEngagements.length === 0 ? (
            <div className="text-center py-16 space-y-4 px-6">
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
                  {searchTerm ? "No engagements found" : "No engagements yet"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {searchTerm
                    ? "Try a different search term"
                    : "Create your first engagement to get started"}
                </p>
              </div>
              {!searchTerm && (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="shadow-accent-sm hover:shadow-accent-md transition-shadow"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Engagement
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                    Client Name
                  </TableHead>
                  <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                    FY
                  </TableHead>
                  <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                    Type
                  </TableHead>
                  <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold hidden md:table-cell">
                    Start Date
                  </TableHead>
                  <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold hidden md:table-cell">
                    End Date
                  </TableHead>
                  <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold hidden lg:table-cell">
                    Materiality
                  </TableHead>
                  <TableHead className="text-right text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEngagements.map((engagement) => (
                  <TableRow
                    key={engagement.id.toString()}
                    className="border-border/30 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                    onClick={() =>
                      navigate({
                        to: "/engagements/$engagementId",
                        params: {
                          engagementId: engagement.id.toString(),
                        },
                      })
                    }
                  >
                    <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {engagement.clientName}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-sm text-muted-foreground">
                      {Number(engagement.financialYear)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          engagement.engagementType === "external"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          engagement.engagementType === "external"
                            ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20"
                            : "bg-secondary text-muted-foreground border-border/50"
                        }
                      >
                        {engagement.engagementType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-sm text-muted-foreground hidden md:table-cell">
                      {format(
                        new Date(Number(engagement.auditStartDate) / 1_000_000),
                        "MMM dd, yyyy",
                      )}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-sm text-muted-foreground hidden md:table-cell">
                      {format(
                        new Date(Number(engagement.auditEndDate) / 1_000_000),
                        "MMM dd, yyyy",
                      )}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-sm text-muted-foreground hidden lg:table-cell">
                      ${engagement.materialityAmount.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate({
                              to: "/engagements/$engagementId",
                              params: {
                                engagementId: engagement.id.toString(),
                              },
                            })
                          }
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEngagementToDelete(engagement.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateEngagementModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/60 shadow-dark-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-foreground">
              Delete Engagement
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this engagement? This action
              cannot be undone and will delete all associated sections,
              workpapers, and issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50 hover:border-border hover:bg-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEngagement.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
