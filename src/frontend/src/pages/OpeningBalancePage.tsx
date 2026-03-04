import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { OpeningBalanceTest } from "../backend";
import {
  useDeleteOpeningBalanceTest,
  useGetEngagementDetails,
  useGetOpeningBalanceTests,
  useSaveOpeningBalanceTest,
  useUpdateOpeningBalanceTest,
} from "../hooks/useQueries";

interface TestFormState {
  accountName: string;
  priorYearClosingBalance: string;
  currentYearOpeningBalance: string;
  notes: string;
}

const emptyForm: TestFormState = {
  accountName: "",
  priorYearClosingBalance: "",
  currentYearOpeningBalance: "",
  notes: "",
};

export default function OpeningBalancePage() {
  const { engagementId } = useParams({ strict: false });
  const navigate = useNavigate();
  const engId = engagementId ? BigInt(engagementId) : null;

  const { data: engagement, isLoading: engagementLoading } =
    useGetEngagementDetails(engId);
  const { data: tests = [], isLoading: testsLoading } =
    useGetOpeningBalanceTests(engId);
  const saveTest = useSaveOpeningBalanceTest();
  const updateTest = useUpdateOpeningBalanceTest();
  const deleteTest = useDeleteOpeningBalanceTest();

  const [addOpen, setAddOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<OpeningBalanceTest | null>(
    null,
  );
  const [form, setForm] = useState<TestFormState>(emptyForm);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const updateForm = (field: keyof TestFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddDialog = () => {
    setForm(emptyForm);
    setEditingTest(null);
    setAddOpen(true);
  };

  const openEditDialog = (test: OpeningBalanceTest) => {
    setEditingTest(test);
    setForm({
      accountName: test.accountName,
      priorYearClosingBalance: test.priorYearClosingBalance.toString(),
      currentYearOpeningBalance: test.currentYearOpeningBalance.toString(),
      notes: test.notes,
    });
    setAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engId) return;

    const prior = Number.parseFloat(form.priorYearClosingBalance) || 0;
    const current = Number.parseFloat(form.currentYearOpeningBalance) || 0;
    const now = BigInt(Date.now() * 1_000_000);

    try {
      if (editingTest) {
        const updated: OpeningBalanceTest = {
          ...editingTest,
          accountName: form.accountName.trim(),
          priorYearClosingBalance: prior,
          currentYearOpeningBalance: current,
          notes: form.notes.trim(),
          updatedAt: now,
        };
        await updateTest.mutateAsync({ testId: editingTest.id, test: updated });
        toast.success("Test updated successfully");
      } else {
        const newTest: OpeningBalanceTest = {
          id: 0n,
          engagementId: engId,
          owner: Principal.fromText("aaaaa-aa"),
          accountName: form.accountName.trim(),
          priorYearClosingBalance: prior,
          currentYearOpeningBalance: current,
          notes: form.notes.trim(),
          createdAt: now,
          updatedAt: now,
        };
        await saveTest.mutateAsync(newTest);
        toast.success("Test added successfully");
      }
      setAddOpen(false);
      setForm(emptyForm);
      setEditingTest(null);
    } catch (err) {
      toast.error(editingTest ? "Failed to update test" : "Failed to add test");
      console.error(err);
    }
  };

  const handleDelete = async (test: OpeningBalanceTest) => {
    if (!engId) return;
    setDeletingId(test.id);
    try {
      await deleteTest.mutateAsync({ testId: test.id, engagementId: engId });
      toast.success("Test deleted");
    } catch (err) {
      toast.error("Failed to delete test");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // Summary stats
  const totalTested = tests.length;
  const agreed = tests.filter(
    (t) => t.currentYearOpeningBalance - t.priorYearClosingBalance === 0,
  ).length;
  const discrepancies = totalTested - agreed;

  if (!engagementId) {
    return <div>Invalid engagement ID</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/engagements">Engagements</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/engagements/$engagementId",
                    params: { engagementId: engagementId! },
                  })
                }
                className="hover:underline"
              >
                {engagementLoading
                  ? "Loading..."
                  : (engagement?.clientName ?? "Engagement")}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Opening Balance Testing</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page title + actions row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="font-serif text-4xl font-bold text-foreground tracking-wide">
            Opening Balance Testing
          </h1>
          <p className="text-muted-foreground text-sm">
            {engagementLoading ? (
              <Skeleton className="h-4 w-48 inline-block" />
            ) : (
              (engagement?.clientName ?? "—")
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() =>
              navigate({
                to: "/engagements/$engagementId",
                params: { engagementId: engagementId! },
              })
            }
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openAddDialog}
                className="gap-2 shadow-accent-sm hover:shadow-accent-md transition-shadow"
              >
                <Plus className="h-4 w-4" />
                Add Test Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border/60 shadow-dark-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {editingTest ? "Edit Test Item" : "Add Opening Balance Test"}
                </DialogTitle>
                <DialogDescription>
                  Compare prior year closing balance with current year opening
                  balance.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={form.accountName}
                    onChange={(e) => updateForm("accountName", e.target.value)}
                    placeholder="e.g., Trade and Other Receivables"
                    required
                    className="bg-secondary/40 border-border/50 focus:border-primary/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="priorYear">Prior Year Closing</Label>
                    <Input
                      id="priorYear"
                      type="number"
                      step="0.01"
                      value={form.priorYearClosingBalance}
                      onChange={(e) =>
                        updateForm("priorYearClosingBalance", e.target.value)
                      }
                      placeholder="0.00"
                      className="font-mono bg-secondary/40 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentYear">Current Year Opening</Label>
                    <Input
                      id="currentYear"
                      type="number"
                      step="0.01"
                      value={form.currentYearOpeningBalance}
                      onChange={(e) =>
                        updateForm("currentYearOpeningBalance", e.target.value)
                      }
                      placeholder="0.00"
                      className="font-mono bg-secondary/40 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>
                {/* Live difference preview */}
                {(form.priorYearClosingBalance !== "" ||
                  form.currentYearOpeningBalance !== "") && (
                  <div className="flex items-center gap-3 p-3 rounded-md border border-border/40 bg-secondary/30">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Difference Preview
                      </p>
                      <p className="font-mono font-semibold text-sm text-foreground">
                        {(
                          (Number.parseFloat(form.currentYearOpeningBalance) ||
                            0) -
                          (Number.parseFloat(form.priorYearClosingBalance) || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                    {(Number.parseFloat(form.currentYearOpeningBalance) || 0) -
                      (Number.parseFloat(form.priorYearClosingBalance) || 0) ===
                    0 ? (
                      <Badge className="bg-success/15 text-success border-success/25 text-xs">
                        Agreed
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/15 text-destructive border-destructive/25 text-xs">
                        Discrepancy
                      </Badge>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => updateForm("notes", e.target.value)}
                    placeholder="Add any notes, explanations, or follow-up actions..."
                    rows={3}
                    className="bg-secondary/40 border-border/50 focus:border-primary/50"
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                    className="border-border/60 hover:border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveTest.isPending || updateTest.isPending}
                    className="shadow-accent-sm hover:shadow-accent-md transition-shadow"
                  >
                    {saveTest.isPending || updateTest.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingTest ? (
                      "Update Test"
                    ) : (
                      "Add Test"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-6 hover:border-primary/30 hover:shadow-accent-sm transition-all group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
                {totalTested}
              </p>
              <p className="text-sm text-muted-foreground">Accounts Tested</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-6 hover:border-success/30 transition-all group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-success/70 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-success">
                {agreed}
              </p>
              <p className="text-sm text-muted-foreground">Agreed</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-6 hover:border-destructive/30 transition-all group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-destructive/70 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-destructive">
                {discrepancies}
              </p>
              <p className="text-sm text-muted-foreground">Discrepancies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tests table */}
      <Card className="border-border/60 bg-card overflow-hidden">
        <CardHeader className="border-b border-border/40">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary/70" />
            <div>
              <CardTitle className="font-serif text-xl text-foreground">
                Opening Balance Test Schedule
              </CardTitle>
              <CardDescription>
                Verify that current year opening balances agree to prior year
                closing balances
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {testsLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.62 0.13 30 / 0.12), transparent 70%)",
                }}
              >
                <ClipboardCheck className="h-7 w-7 text-primary/50" />
              </div>
              <p className="font-medium text-foreground">
                No opening balance tests yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Test Item" to start testing opening balances.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Account Name
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Prior Year Closing
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Current Year Opening
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Difference
                    </TableHead>
                    <TableHead className="text-center text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Notes
                    </TableHead>
                    <TableHead className="w-20 text-right text-muted-foreground/70 text-[11px] tracking-[0.1em] uppercase font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => {
                    const diff =
                      test.currentYearOpeningBalance -
                      test.priorYearClosingBalance;
                    const isAgreed = diff === 0;
                    return (
                      <TableRow
                        key={test.id.toString()}
                        className="border-border/30 hover:bg-primary/5 transition-colors duration-200"
                      >
                        <TableCell className="font-medium text-foreground">
                          {test.accountName}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                          {test.priorYearClosingBalance.toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 2,
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                          {test.currentYearOpeningBalance.toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 2,
                            },
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono tabular-nums font-semibold ${
                            isAgreed ? "text-success" : "text-destructive"
                          }`}
                        >
                          {diff.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 2,
                            signDisplay: "exceptZero",
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          {isAgreed ? (
                            <Badge className="bg-success/15 text-success border-success/25 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Agreed
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/15 text-destructive border-destructive/25 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Discrepancy
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm text-muted-foreground truncate">
                            {test.notes || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => openEditDialog(test)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(test)}
                              disabled={deletingId === test.id}
                            >
                              {deletingId === test.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              <span className="sr-only">Delete</span>
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
    </div>
  );
}
