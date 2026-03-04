import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Issue, IssueStatus, RiskLevel } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetEngagements,
  useSaveIssue,
  useUpdateIssue,
} from "../hooks/useQueries";
import {
  type IssueTracking,
  getIssueTracking,
  saveIssueTracking,
} from "../utils/issueTracking";

interface CreateIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIssue?: Issue | null;
}

export default function CreateIssueModal({
  open,
  onOpenChange,
  editingIssue,
}: CreateIssueModalProps) {
  const { identity } = useInternetIdentity();
  const { data: engagements = [] } = useGetEngagements();
  const saveIssue = useSaveIssue();
  const updateIssue = useUpdateIssue();

  // Core issue fields
  const [description, setDescription] = useState("");
  const [accountHead, setAccountHead] = useState("");
  const [engagementId, setEngagementId] = useState<string>("");
  const [monetaryImpact, setMonetaryImpact] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.low);
  const [managementResponse, setManagementResponse] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.open);

  // Tracking fields (localStorage)
  const [responsibleOfficer, setResponsibleOfficer] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState("");
  const [clientResponse, setClientResponse] = useState("");
  const [followUpStatus, setFollowUpStatus] =
    useState<IssueTracking["followUpStatus"]>("pending");
  const [followUpNotes, setFollowUpNotes] = useState("");

  useEffect(() => {
    if (editingIssue) {
      setDescription(editingIssue.description);
      setEngagementId(editingIssue.engagementId.toString());
      setMonetaryImpact(editingIssue.monetaryImpact.toString());
      setRiskLevel(editingIssue.riskLevel);
      setManagementResponse(editingIssue.managementResponse);
      setRecommendations(editingIssue.recommendations);
      setStatus(editingIssue.status);

      // Load tracking from localStorage
      const tracking = getIssueTracking(editingIssue.id.toString());
      setAccountHead(tracking.accountHead ?? "");
      setResponsibleOfficer(tracking.responsibleOfficer);
      setTargetCompletionDate(tracking.targetCompletionDate);
      setClientResponse(tracking.clientResponse);
      setFollowUpStatus(tracking.followUpStatus);
      setFollowUpNotes(tracking.followUpNotes);
    } else {
      resetForm();
    }
  }, [editingIssue]);

  const resetForm = () => {
    setDescription("");
    setAccountHead("");
    setEngagementId("");
    setMonetaryImpact("");
    setRiskLevel(RiskLevel.low);
    setManagementResponse("");
    setRecommendations("");
    setStatus(IssueStatus.open);
    setResponsibleOfficer("");
    setTargetCompletionDate("");
    setClientResponse("");
    setFollowUpStatus("pending");
    setFollowUpNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !engagementId || !monetaryImpact) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!identity) {
      toast.error("Not authenticated");
      return;
    }

    try {
      const issueData: Issue = {
        id: editingIssue?.id ?? 0n,
        description: description.trim(),
        engagementId: BigInt(engagementId),
        monetaryImpact: Number.parseFloat(monetaryImpact),
        riskLevel,
        managementResponse: managementResponse.trim(),
        recommendations: recommendations.trim(),
        status,
        owner: identity.getPrincipal(),
        createdAt: editingIssue?.createdAt ?? BigInt(Date.now() * 1_000_000),
        updatedAt: BigInt(Date.now() * 1_000_000),
      };

      let savedIssueId: string;

      if (editingIssue) {
        await updateIssue.mutateAsync({
          issueId: editingIssue.id,
          issue: issueData,
        });
        savedIssueId = editingIssue.id.toString();
        toast.success("Issue updated successfully");
      } else {
        await saveIssue.mutateAsync(issueData);
        // For new issues the id is assigned by backend; use a placeholder key
        // We'll use a timestamp-based key since we can't know the assigned ID immediately
        // The tracking will be re-associated when the issue loads with its real ID
        savedIssueId = `temp-${Date.now()}`;
        toast.success("Issue created successfully");
      }

      // Save tracking data to localStorage
      saveIssueTracking(savedIssueId, {
        accountHead: accountHead.trim(),
        responsibleOfficer: responsibleOfficer.trim(),
        targetCompletionDate,
        clientResponse: clientResponse.trim(),
        followUpStatus,
        followUpNotes: followUpNotes.trim(),
      });

      onOpenChange(false);
    } catch (error) {
      toast.error(
        editingIssue ? "Failed to update issue" : "Failed to create issue",
      );
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {editingIssue ? "Edit Issue" : "Create New Issue"}
          </DialogTitle>
          <DialogDescription>
            {editingIssue
              ? "Update the issue details and tracking information"
              : "Add a new audit issue to the log"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core Issue Fields */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the audit issue..."
              rows={3}
              required
              data-ocid="issue.description.textarea"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHead">Account Head</Label>
            <Input
              id="accountHead"
              value={accountHead}
              onChange={(e) => setAccountHead(e.target.value)}
              placeholder="e.g. Trade and Other Payables, Cash & Bank..."
              data-ocid="issue.account_head.input"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="engagement">Engagement *</Label>
              <Select
                value={engagementId}
                onValueChange={setEngagementId}
                required
              >
                <SelectTrigger data-ocid="issue.engagement.select">
                  <SelectValue placeholder="Select engagement" />
                </SelectTrigger>
                <SelectContent>
                  {engagements.map((eng) => (
                    <SelectItem
                      key={eng.id.toString()}
                      value={eng.id.toString()}
                    >
                      {eng.clientName} (FY {Number(eng.financialYear)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monetaryImpact">Monetary Impact ($) *</Label>
              <Input
                id="monetaryImpact"
                type="number"
                value={monetaryImpact}
                onChange={(e) => setMonetaryImpact(e.target.value)}
                placeholder="10000"
                min="0"
                step="0.01"
                required
                data-ocid="issue.monetary_impact.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskLevel">Risk Level *</Label>
              <Select
                value={riskLevel}
                onValueChange={(value) => setRiskLevel(value as RiskLevel)}
              >
                <SelectTrigger data-ocid="issue.risk_level.select">
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
              <Label htmlFor="status">Status *</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as IssueStatus)}
              >
                <SelectTrigger data-ocid="issue.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IssueStatus.open}>Open</SelectItem>
                  <SelectItem value={IssueStatus.closed}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Provide recommendations to address this issue..."
              rows={3}
              data-ocid="issue.recommendations.textarea"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="managementResponse">Management Response</Label>
            <Textarea
              id="managementResponse"
              value={managementResponse}
              onChange={(e) => setManagementResponse(e.target.value)}
              placeholder="Document management's response to this issue..."
              rows={3}
              data-ocid="issue.management_response.textarea"
            />
          </div>

          {/* Tracking Fields */}
          <Separator className="my-4" />
          <div className="space-y-1 pb-1">
            <h3 className="font-semibold text-foreground text-sm">
              Follow-up & Tracking
            </h3>
            <p className="text-xs text-muted-foreground">
              Track recommendations, responsible officers, and action items
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsibleOfficer">Responsible Officer</Label>
              <Input
                id="responsibleOfficer"
                value={responsibleOfficer}
                onChange={(e) => setResponsibleOfficer(e.target.value)}
                placeholder="e.g., Jane Smith"
                data-ocid="issue.responsible_officer.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCompletionDate">
                Target Completion Date
              </Label>
              <Input
                id="targetCompletionDate"
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                data-ocid="issue.target_date.input"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="followUpStatus">Follow-up Status</Label>
              <Select
                value={followUpStatus}
                onValueChange={(value) =>
                  setFollowUpStatus(value as IssueTracking["followUpStatus"])
                }
              >
                <SelectTrigger data-ocid="issue.followup_status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inProgress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientResponse">Client Response</Label>
            <Textarea
              id="clientResponse"
              value={clientResponse}
              onChange={(e) => setClientResponse(e.target.value)}
              placeholder="Document the client's response to this issue..."
              rows={3}
              data-ocid="issue.client_response.textarea"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="followUpNotes">Follow-up Notes</Label>
            <Textarea
              id="followUpNotes"
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="Additional notes for follow-up actions..."
              rows={3}
              data-ocid="issue.followup_notes.textarea"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="issue.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveIssue.isPending || updateIssue.isPending}
              data-ocid="issue.submit_button"
            >
              {saveIssue.isPending || updateIssue.isPending
                ? editingIssue
                  ? "Updating..."
                  : "Creating..."
                : editingIssue
                  ? "Update Issue"
                  : "Create Issue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
