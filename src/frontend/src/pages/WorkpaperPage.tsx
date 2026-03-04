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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookMarked,
  FileText,
  Info,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DocumentType, ExternalBlob, RiskLevel } from "../backend";
import type { Document, Workpaper } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetEngagementDetails,
  useGetSections,
  useGetWorkpapers,
  useSaveDocument,
  useSaveWorkpaper,
  useUpdateWorkpaper,
} from "../hooks/useQueries";

// ── Audit Assertions types ──────────────────────────────────

export type AssertionKey =
  | "completeness"
  | "existence"
  | "valuation"
  | "rights"
  | "presentation";

export interface AssertionState {
  checked: boolean;
  notes: string;
}

export type AuditAssertions = Record<AssertionKey, AssertionState>;

const DEFAULT_ASSERTIONS: AuditAssertions = {
  completeness: { checked: false, notes: "" },
  existence: { checked: false, notes: "" },
  valuation: { checked: false, notes: "" },
  rights: { checked: false, notes: "" },
  presentation: { checked: false, notes: "" },
};

const ASSERTION_LABELS: Record<AssertionKey, string> = {
  completeness: "Completeness",
  existence: "Existence / Occurrence",
  valuation: "Valuation & Allocation",
  rights: "Rights & Obligations",
  presentation: "Presentation & Disclosure",
};

const ASSERTION_DESCRIPTIONS: Record<AssertionKey, string> = {
  completeness:
    "All transactions and balances that should be recorded are included.",
  existence:
    "Assets, liabilities, and equity interests actually exist at the date.",
  valuation:
    "Assets, liabilities, and equity are included at appropriate amounts.",
  rights:
    "Entity holds or controls the rights to assets; liabilities are obligations.",
  presentation:
    "Transactions are classified, described and disclosed appropriately.",
};

export default function WorkpaperPage() {
  const { engagementId, sectionId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const engId = engagementId ? BigInt(engagementId) : null;
  const secId = sectionId ? BigInt(sectionId) : null;

  const { data: engagement } = useGetEngagementDetails(engId);
  const { data: sections = [] } = useGetSections(engId);
  const { data: workpapers = [], isLoading: workpapersLoading } =
    useGetWorkpapers(secId);
  const saveWorkpaper = useSaveWorkpaper();
  const updateWorkpaper = useUpdateWorkpaper();
  const saveDocument = useSaveDocument();

  const section = sections.find((s) => s.id === secId);
  const existingWorkpaper = workpapers[0];

  const [auditObjective, setAuditObjective] = useState("");
  const [proceduresPerformed, setProceduresPerformed] = useState("");
  const [sampleDetails, setSampleDetails] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [riskRating, setRiskRating] = useState<RiskLevel>(RiskLevel.low);
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [generalLedgerTotal, setGeneralLedgerTotal] = useState<number>(0);
  const [trialBalanceTotal, setTrialBalanceTotal] = useState<number>(0);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Audit Notes — persisted to localStorage per section
  const [auditNotes, setAuditNotes] = useState("");

  // Audit Assertions — persisted to localStorage per section
  const [assertions, setAssertions] = useState<AuditAssertions>({
    ...DEFAULT_ASSERTIONS,
  });

  // Load audit notes from localStorage
  useEffect(() => {
    if (!sectionId) return;
    try {
      const stored = localStorage.getItem(`audit-notes-${sectionId}`);
      if (stored) setAuditNotes(stored);
    } catch {
      // ignore
    }
  }, [sectionId]);

  // Save audit notes to localStorage
  useEffect(() => {
    if (!sectionId) return;
    localStorage.setItem(`audit-notes-${sectionId}`, auditNotes);
  }, [sectionId, auditNotes]);

  // Load audit assertions from localStorage
  useEffect(() => {
    if (!sectionId) return;
    try {
      const stored = localStorage.getItem(`audit-assertions-${sectionId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AuditAssertions>;
        setAssertions({
          ...DEFAULT_ASSERTIONS,
          ...parsed,
        });
      } else {
        setAssertions({ ...DEFAULT_ASSERTIONS });
      }
    } catch {
      setAssertions({ ...DEFAULT_ASSERTIONS });
    }
  }, [sectionId]);

  // Save audit assertions to localStorage on any change
  useEffect(() => {
    if (!sectionId) return;
    localStorage.setItem(
      `audit-assertions-${sectionId}`,
      JSON.stringify(assertions),
    );
  }, [sectionId, assertions]);

  const updateAssertion = (
    key: AssertionKey,
    field: keyof AssertionState,
    value: boolean | string,
  ) => {
    setAssertions((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  useEffect(() => {
    if (existingWorkpaper) {
      setAuditObjective(existingWorkpaper.auditObjective);
      setProceduresPerformed(existingWorkpaper.proceduresPerformed);
      setSampleDetails(existingWorkpaper.sampleDetails);
      setEvidenceDescription(existingWorkpaper.evidenceDescription);
      setRiskRating(existingWorkpaper.riskRating);
      setFindings(existingWorkpaper.findings);
      setConclusion(existingWorkpaper.conclusion);
      setGeneralLedgerTotal(existingWorkpaper.generalLedgerTotal ?? 0);
      setTrialBalanceTotal(existingWorkpaper.trialBalanceTotal ?? 0);
      setUploadedDocs(existingWorkpaper.documentIds);
    }
  }, [existingWorkpaper]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !engId) return;

    setUploading(true);
    const newDocIds: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
          (percentage) => {
            setUploadProgress(percentage);
          },
        );

        const docType: DocumentType = file.type.includes("pdf")
          ? DocumentType.pdf
          : DocumentType.image;
        const documentId = `${Date.now()}-${file.name}`;

        const document: Document = {
          id: documentId,
          name: file.name,
          size: BigInt(file.size),
          storageLocation: blob,
          docType,
          engagementId: engId,
          createdAt: BigInt(Date.now() * 1000000),
        };

        await saveDocument.mutateAsync({ document, engagementId: engId });
        newDocIds.push(documentId);
      }

      setUploadedDocs([...uploadedDocs, ...newDocIds]);
      toast.success(`${files.length} document(s) uploaded successfully`);
    } catch (error) {
      toast.error("Failed to upload documents");
      console.error(error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!secId || !identity) return;

    try {
      const workpaperData: Workpaper = {
        id: existingWorkpaper?.id ?? 0n,
        sectionId: secId,
        auditObjective,
        proceduresPerformed,
        sampleDetails,
        evidenceDescription,
        riskRating,
        findings,
        conclusion,
        generalLedgerTotal,
        trialBalanceTotal,
        documentIds: uploadedDocs,
        createdAt: existingWorkpaper?.createdAt ?? BigInt(Date.now() * 1000000),
        updatedAt: BigInt(Date.now() * 1000000),
      };

      if (existingWorkpaper) {
        await updateWorkpaper.mutateAsync({
          workpaperId: existingWorkpaper.id,
          workpaper: workpaperData,
        });
        toast.success("Workpaper updated successfully");
      } else {
        await saveWorkpaper.mutateAsync(workpaperData);
        toast.success("Workpaper saved successfully");
      }
    } catch (error) {
      toast.error("Failed to save workpaper");
      console.error(error);
    }
  };

  if (!engagementId || !sectionId) {
    return <div>Invalid parameters</div>;
  }

  const checkedCount = Object.values(assertions).filter(
    (a) => a.checked,
  ).length;

  return (
    <div className="space-y-6">
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
                {engagement?.clientName ?? "Engagement"}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{section?.name ?? "Section"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-4 flex-wrap">
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
          Back to Engagement
        </Button>
      </div>

      {/* Account Head Definition callout */}
      {section?.formula && (
        <div className="flex gap-3 p-4 rounded-md border border-primary/30 bg-primary/5">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary mb-1 tracking-wide">
              Account Head Definition
            </p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">
              {section.formula}
            </p>
          </div>
        </div>
      )}

      {/* Audit Notes / Key Reminders Panel */}
      <div className="rounded-md border border-primary/30 bg-primary/5 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20">
          <BookMarked className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-semibold text-primary tracking-wide">
            Audit Notes / Key Reminders
          </p>
          <span className="ml-auto text-[10px] font-mono text-primary/50 uppercase tracking-widest">
            Auto-saved
          </span>
        </div>
        <div className="p-4">
          <Textarea
            value={auditNotes}
            onChange={(e) => setAuditNotes(e.target.value)}
            placeholder="Record key reminders for this account — audit assertions, risk flags, client-specific notes, relevant standards (IFRS/ISA)..."
            rows={5}
            data-ocid="workpaper.audit_notes.textarea"
            className="bg-transparent border-primary/20 focus:border-primary/50 text-foreground/90 placeholder:text-muted-foreground/50 resize-none"
          />
        </div>
      </div>

      {/* Audit Assertions Panel */}
      <div
        className="rounded-md border border-primary/30 bg-primary/5 overflow-hidden"
        data-ocid="workpaper.assertions.panel"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-semibold text-primary tracking-wide">
            Audit Assertions
          </p>
          <span className="ml-2 text-xs text-muted-foreground">
            ISA 315 — {checkedCount} of 5 assertions applicable
          </span>
          <span className="ml-auto text-[10px] font-mono text-primary/50 uppercase tracking-widest">
            Auto-saved
          </span>
        </div>
        <div className="p-4 space-y-4">
          {(Object.keys(ASSERTION_LABELS) as AssertionKey[]).map((key, idx) => (
            <div
              key={key}
              className={`rounded-md border transition-colors ${
                assertions[key].checked
                  ? "border-primary/40 bg-white/60"
                  : "border-border/50 bg-transparent"
              }`}
              data-ocid={`workpaper.assertions.item.${idx + 1}`}
            >
              <div className="flex items-start gap-3 p-3">
                <Checkbox
                  id={`assertion-${key}`}
                  checked={assertions[key].checked}
                  onCheckedChange={(checked) =>
                    updateAssertion(key, "checked", checked === true)
                  }
                  data-ocid={`workpaper.assertions.checkbox.${idx + 1}`}
                  className="mt-0.5 shrink-0 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`assertion-${key}`}
                    className={`text-sm font-semibold cursor-pointer select-none ${
                      assertions[key].checked
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {ASSERTION_LABELS[key]}
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {ASSERTION_DESCRIPTIONS[key]}
                  </p>
                  {assertions[key].checked && (
                    <Textarea
                      value={assertions[key].notes}
                      onChange={(e) =>
                        updateAssertion(key, "notes", e.target.value)
                      }
                      placeholder={`Notes on ${ASSERTION_LABELS[key]} — specific procedures, findings, or evidence...`}
                      rows={2}
                      data-ocid={`workpaper.assertions.textarea.${idx + 1}`}
                      className="mt-2 bg-transparent border-primary/20 focus:border-primary/50 text-foreground/90 placeholder:text-muted-foreground/40 resize-none text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-border/60 bg-card overflow-hidden">
        <div className="h-[2px] bg-gradient-to-r from-primary/60 via-primary/90 to-primary/30" />
        <CardHeader>
          <CardTitle className="font-serif text-3xl text-foreground">
            {section?.name ?? <Skeleton className="h-8 w-64" />}
          </CardTitle>
          <CardDescription>Audit workpaper documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {workpapersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="auditObjective">Audit Objective</Label>
                <Textarea
                  id="auditObjective"
                  value={auditObjective}
                  onChange={(e) => setAuditObjective(e.target.value)}
                  placeholder="Describe the audit objective for this section..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proceduresPerformed">
                  Procedures Performed
                </Label>
                <Textarea
                  id="proceduresPerformed"
                  value={proceduresPerformed}
                  onChange={(e) => setProceduresPerformed(e.target.value)}
                  placeholder="Document the audit procedures performed..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampleDetails">Sample Details</Label>
                <Textarea
                  id="sampleDetails"
                  value={sampleDetails}
                  onChange={(e) => setSampleDetails(e.target.value)}
                  placeholder="Describe the sample size and selection method..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidenceDescription">
                  Evidence Description
                </Label>
                <Textarea
                  id="evidenceDescription"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Describe the audit evidence obtained..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskRating">Risk Rating</Label>
                <Select
                  value={riskRating}
                  onValueChange={(value) => setRiskRating(value as RiskLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RiskLevel.low}>Low</SelectItem>
                    <SelectItem value={RiskLevel.medium}>Medium</SelectItem>
                    <SelectItem value={RiskLevel.high}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="findings">Findings</Label>
                <Textarea
                  id="findings"
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Document any audit findings or exceptions..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conclusion">Conclusion</Label>
                <Textarea
                  id="conclusion"
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="Provide the audit conclusion for this section..."
                  rows={3}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-primary">
                    Reconciliation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Compare General Ledger and Trial Balance totals
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="generalLedgerTotal">
                      General Ledger Total
                    </Label>
                    <Input
                      type="number"
                      id="generalLedgerTotal"
                      step="0.01"
                      value={generalLedgerTotal}
                      onChange={(e) =>
                        setGeneralLedgerTotal(
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trialBalanceTotal">
                      Trial Balance Total
                    </Label>
                    <Input
                      type="number"
                      id="trialBalanceTotal"
                      step="0.01"
                      value={trialBalanceTotal}
                      onChange={(e) =>
                        setTrialBalanceTotal(
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Formula chip */}
                <div className="flex items-center gap-2 px-3 py-2 rounded border border-primary/30 bg-primary/5 w-fit">
                  <code className="font-mono text-xs text-primary tracking-wide select-all">
                    Variance = GL Total − TB Total
                  </code>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-md border border-border/40 bg-secondary/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Difference (GL − TB)
                    </p>
                    <p className="text-lg font-mono font-semibold text-foreground">
                      ${(generalLedgerTotal - trialBalanceTotal).toFixed(2)}
                    </p>
                  </div>
                  {generalLedgerTotal - trialBalanceTotal === 0 ? (
                    <Badge className="bg-success/15 text-success border-success/25">
                      Balanced
                    </Badge>
                  ) : (
                    <Badge className="bg-warning/15 text-warning border-warning/25">
                      Variance: $
                      {Math.abs(generalLedgerTotal - trialBalanceTotal).toFixed(
                        2,
                      )}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label>Supporting Documents</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    id="fileUpload"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("fileUpload")?.click()
                    }
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Documents
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">PDF or images</p>
                </div>

                {uploadedDocs.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-sm font-medium">
                      Uploaded Documents ({uploadedDocs.length})
                    </p>
                    <div className="space-y-2">
                      {uploadedDocs.map((docId) => (
                        <div
                          key={docId}
                          className="flex items-center gap-2 p-2 rounded border bg-muted/30"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm flex-1 truncate font-mono">
                            {docId}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={
                    saveWorkpaper.isPending || updateWorkpaper.isPending
                  }
                  size="lg"
                  className="shadow-accent-sm hover:shadow-accent-md transition-shadow px-8"
                >
                  {saveWorkpaper.isPending || updateWorkpaper.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Workpaper"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
