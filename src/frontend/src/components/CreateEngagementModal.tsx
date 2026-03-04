import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Engagement, EngagementType, type Section } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveEngagement } from "../hooks/useQueries";

interface CreateEngagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PREDEFINED_SECTIONS = [
  "Cash and Bank",
  "Trade and Other Payables",
  "Trade and Other Receivables",
  "Revenue",
  "Expenses",
  "Inventory",
  "Property Plant and Equipment",
];

export default function CreateEngagementModal({
  open,
  onOpenChange,
}: CreateEngagementModalProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const saveEngagement = useSaveEngagement();

  const [clientName, setClientName] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [engagementType, setEngagementType] = useState<EngagementType>(
    EngagementType.external,
  );
  const [materialityAmount, setMaterialityAmount] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const resetForm = () => {
    setClientName("");
    setFinancialYear("");
    setEngagementType(EngagementType.external);
    setMaterialityAmount("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !clientName.trim() ||
      !financialYear ||
      !materialityAmount ||
      !startDate ||
      !endDate
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!identity) {
      toast.error("Not authenticated");
      return;
    }

    try {
      const engagement: Engagement = {
        id: 0n, // Backend will assign
        clientName: clientName.trim(),
        financialYear: BigInt(financialYear),
        engagementType,
        materialityAmount: Number.parseFloat(materialityAmount),
        auditStartDate: BigInt(startDate.getTime() * 1_000_000),
        auditEndDate: BigInt(endDate.getTime() * 1_000_000),
        finalized: false,
        owner: identity.getPrincipal(),
        createdAt: BigInt(Date.now() * 1_000_000),
        updatedAt: BigInt(Date.now() * 1_000_000),
      };

      const sections: Section[] = PREDEFINED_SECTIONS.map((name, index) => ({
        id: BigInt(index),
        name,
        engagementId: 0n,
        isCustom: false,
        formula: "",
        createdAt: BigInt(Date.now() * 1_000_000),
        updatedAt: BigInt(Date.now() * 1_000_000),
      }));

      await saveEngagement.mutateAsync({
        engagement,
        sections,
        workpapers: [],
        issues: [],
      });

      toast.success("Engagement created successfully");
      resetForm();
      onOpenChange(false);
      navigate({ to: "/engagements" });
    } catch (error) {
      toast.error("Failed to create engagement");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/60 shadow-dark-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-foreground">
            Create New Engagement
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new audit engagement
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="ABC Corporation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financialYear">Financial Year *</Label>
              <Input
                id="financialYear"
                type="number"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                placeholder="2024"
                min="2000"
                max="2100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engagementType">Engagement Type *</Label>
              <Select
                value={engagementType}
                onValueChange={(value) =>
                  setEngagementType(value as EngagementType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EngagementType.external}>
                    External
                  </SelectItem>
                  <SelectItem value={EngagementType.internal}>
                    Internal
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialityAmount">
                Materiality Amount ($) *
              </Label>
              <Input
                id="materialityAmount"
                type="number"
                value={materialityAmount}
                onChange={(e) => setMaterialityAmount(e.target.value)}
                placeholder="50000"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Audit Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Audit End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">Predefined Sections</p>
            <p className="text-sm text-muted-foreground mb-3">
              The following sections will be created automatically:
            </p>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_SECTIONS.map((section) => (
                <span
                  key={section}
                  className="text-xs px-2 py-1 bg-background rounded border"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveEngagement.isPending}>
              {saveEngagement.isPending ? "Creating..." : "Create Engagement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
