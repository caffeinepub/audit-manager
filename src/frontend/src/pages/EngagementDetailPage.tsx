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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ClipboardCheck,
  Copy,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Pencil,
  Plus,
  Printer,
  ShieldAlert,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Section } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateSection,
  useDeleteSection,
  useGetEngagementDetails,
  useGetSections,
  useUpdateSection,
} from "../hooks/useQueries";
import { type SummaryInput, generateAISummary } from "../utils/aiSummary";
import {
  type ReportData,
  downloadCSV,
  downloadRTF,
  printHTML,
} from "../utils/reportExport";
import type { AuditAssertions } from "./WorkpaperPage";

// ── Assertion label map for report ─────────────────────────
const ASSERTION_LABELS: Record<string, string> = {
  completeness: "Completeness",
  existence: "Existence / Occurrence",
  valuation: "Valuation & Allocation",
  rights: "Rights & Obligations",
  presentation: "Presentation & Disclosure",
};

// ── HTML Report Builder ─────────────────────────────────────
function buildAuditObservationReport(data: {
  engagement: {
    clientName: string;
    financialYear: bigint;
    engagementType: string;
    auditStartDate: bigint;
    auditEndDate: bigint;
    materialityAmount: number;
    finalized: boolean;
  };
  materiality: {
    clientDescription: string;
    riskAccounts: string;
    salesRevenue: string;
    tbUnbalancedAccounts: Array<{ accountName: string; variance: string }>;
  };
  sections: Array<{
    id: string;
    name: string;
    formula: string;
    workpaper: {
      auditObjective: string;
      proceduresPerformed: string;
      evidenceDescription: string;
      findings: string;
      conclusion: string;
      riskRating: string;
      generalLedgerTotal: number;
      trialBalanceTotal: number;
      sampleDetails: string;
    } | null;
    auditNotes: string;
    assertions: AuditAssertions | null;
  }>;
  openingBalanceTests: Array<{
    accountName: string;
    priorYearClosingBalance: number;
    currentYearOpeningBalance: number;
    notes: string;
  }>;
  issues: Array<{
    description: string;
    riskLevel: string;
    monetaryImpact: number;
    status: string;
    managementResponse: string;
    recommendations: string;
  }>;
  generatedAt: string;
  auditorName: string;
}): string {
  const {
    engagement,
    materiality,
    sections,
    openingBalanceTests,
    issues,
    generatedAt,
    auditorName,
  } = data;

  const fmtCurrency = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

  const fmtDate = (ts: bigint) => {
    try {
      return format(new Date(Number(ts) / 1_000_000), "dd MMMM yyyy");
    } catch {
      return "—";
    }
  };

  const statusBadge = (status: string) =>
    status === "open"
      ? `<span style="background:#fde8e0;color:#c0392b;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;">${status}</span>`
      : `<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;">${status}</span>`;

  const riskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      high: "background:#fde8e0;color:#c0392b;",
      medium: "background:#fff3e0;color:#e65100;",
      low: "background:#e8f5e9;color:#2e7d32;",
    };
    return `<span style="${colors[risk] ?? "background:#f5f5f5;color:#666;"}padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;">${risk}</span>`;
  };

  const tdStyle =
    "padding:10px 12px;border-bottom:1px solid #f0e8e4;vertical-align:top;font-size:13px;";
  const thStyle =
    "padding:10px 12px;background:#f7f0ee;color:#8b4558;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;text-align:left;border-bottom:2px solid #e8c4b8;";

  // Section 4: Account heads
  const sectionRows = sections
    .map((s) => {
      const wp = s.workpaper;
      const variance = wp
        ? (wp.generalLedgerTotal - wp.trialBalanceTotal).toFixed(2)
        : "—";

      const assertionRows = s.assertions
        ? Object.entries(s.assertions)
            .filter(([, v]) => v.checked)
            .map(
              ([k, v]) => `
            <tr>
              <td style="${tdStyle}color:#8b4558;font-weight:600;">${ASSERTION_LABELS[k] ?? k}</td>
              <td style="${tdStyle}">${v.notes || "—"}</td>
            </tr>`,
            )
            .join("")
        : "";

      const assertionTable = assertionRows
        ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <thead><tr>
            <th style="${thStyle}width:30%">Assertion</th>
            <th style="${thStyle}">Notes</th>
          </tr></thead>
          <tbody>${assertionRows}</tbody>
         </table>`
        : "<p style='color:#999;font-size:12px;'>No assertions selected.</p>";

      return `
      <div style="margin-bottom:32px;border:1px solid #f0e8e4;border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#f7f0ee,#fdf6f3);padding:14px 18px;border-bottom:2px solid #e8c4b8;">
          <h3 style="margin:0;font-size:16px;color:#3d1f2a;font-family:Georgia,serif;">${s.name}</h3>
          ${s.formula ? `<p style="margin:4px 0 0;font-size:12px;color:#8b4558;font-style:italic;">${s.formula}</p>` : ""}
        </div>
        <div style="padding:18px;">
          ${
            wp
              ? `
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;background:#fdf6f3;padding:12px;border-radius:6px;">
              <div>
                <p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 2px;">GL Total</p>
                <p style="font-size:15px;font-weight:700;color:#3d1f2a;margin:0;font-family:monospace;">${fmtCurrency(wp.generalLedgerTotal)}</p>
              </div>
              <div>
                <p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 2px;">TB Total</p>
                <p style="font-size:15px;font-weight:700;color:#3d1f2a;margin:0;font-family:monospace;">${fmtCurrency(wp.trialBalanceTotal)}</p>
              </div>
              <div>
                <p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 2px;">Variance</p>
                <p style="font-size:15px;font-weight:700;color:${wp.generalLedgerTotal - wp.trialBalanceTotal === 0 ? "#2e7d32" : "#c0392b"};margin:0;font-family:monospace;">${variance === "0.00" ? "Balanced ✓" : `$${variance}`}</p>
              </div>
            </div>
          `
              : ""
          }

          <h4 style="font-size:12px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 8px;">Audit Assertions</h4>
          ${assertionTable}

          ${
            s.auditNotes
              ? `
            <h4 style="font-size:12px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 6px;">Audit Notes / Key Reminders</h4>
            <div style="background:#fdf6f3;border-left:3px solid #d4a0a0;padding:10px 14px;border-radius:0 4px 4px 0;font-size:13px;color:#4a2a30;white-space:pre-wrap;">${s.auditNotes}</div>
          `
              : ""
          }

          ${
            wp
              ? `
            ${wp.auditObjective ? `<h4 style="font-size:12px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 6px;">Audit Objective</h4><p style="font-size:13px;color:#4a2a30;margin:0;">${wp.auditObjective}</p>` : ""}
            ${wp.proceduresPerformed ? `<h4 style="font-size:12px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 6px;">Procedures Performed</h4><p style="font-size:13px;color:#4a2a30;margin:0;white-space:pre-wrap;">${wp.proceduresPerformed}</p>` : ""}
            ${wp.evidenceDescription ? `<h4 style="font-size:12px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 6px;">Evidence Description</h4><p style="font-size:13px;color:#4a2a30;margin:0;">${wp.evidenceDescription}</p>` : ""}
            ${wp.findings ? `<h4 style="font-size:12px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 6px;">Findings</h4><p style="font-size:13px;color:#4a2a30;margin:0;white-space:pre-wrap;">${wp.findings}</p>` : ""}
            ${wp.conclusion ? `<h4 style="font-size:12px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 6px;">Conclusion</h4><p style="font-size:13px;color:#4a2a30;margin:0;">${wp.conclusion}</p>` : ""}
            <div style="margin-top:12px;display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;color:#9b7b82;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Risk Rating:</span>
              ${riskBadge(wp.riskRating)}
            </div>
          `
              : "<p style='color:#999;font-size:12px;font-style:italic;'>No workpaper recorded for this section.</p>"
          }
        </div>
      </div>`;
    })
    .join("");

  // Opening balance test rows
  const obtRows = openingBalanceTests
    .map((t) => {
      const diff = t.currentYearOpeningBalance - t.priorYearClosingBalance;
      return `<tr>
      <td style="${tdStyle}font-weight:600;">${t.accountName}</td>
      <td style="${tdStyle}text-align:right;font-family:monospace;">${fmtCurrency(t.priorYearClosingBalance)}</td>
      <td style="${tdStyle}text-align:right;font-family:monospace;">${fmtCurrency(t.currentYearOpeningBalance)}</td>
      <td style="${tdStyle}text-align:right;font-family:monospace;color:${diff === 0 ? "#2e7d32" : "#c0392b"};font-weight:600;">${diff === 0 ? "—" : fmtCurrency(diff)}</td>
      <td style="${tdStyle}text-align:center;">${diff === 0 ? '<span style="color:#2e7d32;font-weight:600;">✓ Agreed</span>' : '<span style="color:#c0392b;font-weight:600;">⚠ Discrepancy</span>'}</td>
      <td style="${tdStyle}">${t.notes || "—"}</td>
    </tr>`;
    })
    .join("");

  // Issues rows
  const issueRows = issues
    .map(
      (iss) => `
    <tr>
      <td style="${tdStyle}">${iss.description}</td>
      <td style="${tdStyle}text-align:center;">${riskBadge(iss.riskLevel)}</td>
      <td style="${tdStyle}text-align:right;font-family:monospace;">${fmtCurrency(iss.monetaryImpact)}</td>
      <td style="${tdStyle}text-align:center;">${statusBadge(iss.status)}</td>
      <td style="${tdStyle}">${iss.managementResponse || "—"}</td>
      <td style="${tdStyle}">${iss.recommendations || "—"}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Audit Observation Report — ${engagement.clientName}</title>
<style>
  @media print {
    body { font-size: 11px; }
    .page-break { page-break-before: always; }
    .no-print { display: none; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #3d1f2a; background: #fff; font-size: 13px; line-height: 1.5; }
</style>
</head>
<body style="max-width:960px;margin:0 auto;padding:40px 32px;">

  <!-- ═══════════ HEADER ═══════════ -->
  <div style="border-bottom:3px solid #c4737a;padding-bottom:24px;margin-bottom:32px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap;">
      <div>
        <div style="display:inline-block;background:linear-gradient(135deg,#c4737a,#a05060);color:white;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:4px 12px;border-radius:4px;margin-bottom:8px;">CONFIDENTIAL</div>
        <h1 style="font-size:28px;font-weight:800;color:#3d1f2a;font-family:Georgia,serif;margin-bottom:4px;line-height:1.2;">AUDIT OBSERVATION REPORT</h1>
        <p style="font-size:16px;color:#8b4558;font-weight:600;">${engagement.clientName}</p>
        <p style="font-size:13px;color:#9b7b82;margin-top:2px;">Financial Year: ${Number(engagement.financialYear)} &nbsp;·&nbsp; ${engagement.engagementType.charAt(0).toUpperCase() + engagement.engagementType.slice(1)} Audit</p>
      </div>
      <div style="text-align:right;">
        <div style="background:#fdf6f3;border:1px solid #f0e8e4;border-radius:8px;padding:14px 18px;">
          <p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Generated</p>
          <p style="font-size:13px;color:#3d1f2a;font-weight:600;">${generatedAt}</p>
          <p style="font-size:11px;color:#9b7b82;margin-top:6px;">Prepared by</p>
          <p style="font-size:13px;color:#3d1f2a;font-weight:600;">${auditorName}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════ SECTION 1: ENGAGEMENT DETAILS ═══════════ -->
  <div style="margin-bottom:32px;">
    <h2 style="font-size:14px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid #f0e8e4;padding-bottom:8px;margin-bottom:16px;">1. Engagement Details</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;background:#fdf6f3;padding:18px;border-radius:8px;border:1px solid #f0e8e4;">
      <div><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Client</p><p style="font-weight:700;color:#3d1f2a;">${engagement.clientName}</p></div>
      <div><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Financial Year</p><p style="font-weight:700;color:#3d1f2a;">${Number(engagement.financialYear)}</p></div>
      <div><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Engagement Type</p><p style="font-weight:700;color:#3d1f2a;text-transform:capitalize;">${engagement.engagementType}</p></div>
      <div><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Audit Start Date</p><p style="font-weight:600;color:#3d1f2a;">${fmtDate(engagement.auditStartDate)}</p></div>
      <div><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Audit End Date</p><p style="font-weight:600;color:#3d1f2a;">${fmtDate(engagement.auditEndDate)}</p></div>
      <div><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Materiality Amount</p><p style="font-weight:700;color:#c4737a;font-family:monospace;">${fmtCurrency(engagement.materialityAmount)}</p></div>
      <div><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Status</p><p style="font-weight:700;color:${engagement.finalized ? "#2e7d32" : "#c0392b"};">${engagement.finalized ? "✓ Finalized" : "● In Progress"}</p></div>
    </div>
  </div>

  <!-- ═══════════ SECTION 2: CLIENT PROFILE ═══════════ -->
  <div style="margin-bottom:32px;">
    <h2 style="font-size:14px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid #f0e8e4;padding-bottom:8px;margin-bottom:16px;">2. Client Profile &amp; Materiality Context</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      ${materiality.clientDescription ? `<div style="grid-column:1/-1;background:#fdf6f3;border:1px solid #f0e8e4;border-radius:8px;padding:14px;"><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">What the Client Does</p><p style="font-size:13px;color:#4a2a30;">${materiality.clientDescription}</p></div>` : ""}
      ${materiality.riskAccounts ? `<div style="background:#fdf6f3;border:1px solid #f0e8e4;border-radius:8px;padding:14px;"><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Risk / Significant Accounts</p><p style="font-size:13px;color:#4a2a30;white-space:pre-wrap;">${materiality.riskAccounts}</p></div>` : ""}
      ${materiality.salesRevenue ? `<div style="background:#fdf6f3;border:1px solid #f0e8e4;border-radius:8px;padding:14px;"><p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Sales &amp; Total Revenue</p><p style="font-size:18px;font-weight:700;color:#c4737a;font-family:monospace;">${fmtCurrency(Number(materiality.salesRevenue))}</p></div>` : ""}
      ${
        materiality.tbUnbalancedAccounts &&
        materiality.tbUnbalancedAccounts.length > 0
          ? `<div style="grid-column:1/-1;background:#fdf6f3;border:1px solid #f0e8e4;border-radius:8px;padding:14px;">
              <p style="font-size:10px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">TB Accounts That Do Not Balance</p>
              <table style="width:100%;border-collapse:collapse;">
                <thead><tr>
                  <th style="${thStyle}width:35%">Account Name</th>
                  <th style="${thStyle}">Variance Explanation</th>
                </tr></thead>
                <tbody>${materiality.tbUnbalancedAccounts.map((a) => `<tr><td style="${tdStyle}font-weight:600;">${a.accountName || "—"}</td><td style="${tdStyle}">${a.variance || "—"}</td></tr>`).join("")}</tbody>
              </table>
            </div>`
          : ""
      }
    </div>
  </div>

  <!-- ═══════════ SECTION 3: OPENING BALANCE TESTS ═══════════ -->
  <div style="margin-bottom:32px;" class="page-break">
    <h2 style="font-size:14px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid #f0e8e4;padding-bottom:8px;margin-bottom:16px;">3. Opening Balance Tests</h2>
    ${
      openingBalanceTests.length === 0
        ? `<p style="color:#999;font-size:13px;font-style:italic;padding:12px;background:#fdf6f3;border-radius:6px;">No opening balance tests recorded.</p>`
        : `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="${thStyle}">Account Name</th>
          <th style="${thStyle}text-align:right;">Prior Year Closing</th>
          <th style="${thStyle}text-align:right;">Current Year Opening</th>
          <th style="${thStyle}text-align:right;">Difference</th>
          <th style="${thStyle}text-align:center;">Status</th>
          <th style="${thStyle}">Notes</th>
        </tr></thead>
        <tbody>${obtRows}</tbody>
       </table></div>`
    }
  </div>

  <!-- ═══════════ SECTION 4: ACCOUNT HEADS & WORKPAPERS ═══════════ -->
  <div style="margin-bottom:32px;">
    <h2 style="font-size:14px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid #f0e8e4;padding-bottom:8px;margin-bottom:16px;">4. Account Heads &amp; Workpapers</h2>
    ${
      sections.length === 0
        ? `<p style="color:#999;font-size:13px;font-style:italic;padding:12px;background:#fdf6f3;border-radius:6px;">No sections recorded.</p>`
        : sectionRows
    }
  </div>

  <!-- ═══════════ SECTION 5: ISSUES LOG ═══════════ -->
  <div style="margin-bottom:40px;" class="page-break">
    <h2 style="font-size:14px;color:#8b4558;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid #f0e8e4;padding-bottom:8px;margin-bottom:16px;">5. Issues Log</h2>
    ${
      issues.length === 0
        ? `<p style="color:#999;font-size:13px;font-style:italic;padding:12px;background:#fdf6f3;border-radius:6px;">No issues recorded for this engagement.</p>`
        : `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="${thStyle}">Description</th>
            <th style="${thStyle}text-align:center;">Risk</th>
            <th style="${thStyle}text-align:right;">Impact</th>
            <th style="${thStyle}text-align:center;">Status</th>
            <th style="${thStyle}">Mgmt Response</th>
            <th style="${thStyle}">Recommendations</th>
          </tr></thead>
          <tbody>${issueRows}</tbody>
         </table></div>`
    }
  </div>

  <!-- ═══════════ FOOTER ═══════════ -->
  <div style="border-top:2px solid #f0e8e4;padding-top:20px;margin-top:40px;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap;">
    <div>
      <p style="font-size:11px;color:#9b7b82;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Confidential</p>
      <p style="font-size:12px;color:#9b7b82;margin-top:2px;">Prepared by: <strong style="color:#3d1f2a;">${auditorName}</strong></p>
      <p style="font-size:12px;color:#9b7b82;">Generated: ${generatedAt}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:11px;color:#c4a0a0;">This report is intended solely for the use of the audit team and management. Unauthorized distribution is prohibited.</p>
    </div>
  </div>

</body>
</html>`;
}

export default function EngagementDetailPage() {
  const { engagementId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const engId = engagementId ? BigInt(engagementId) : null;

  const { data: engagement, isLoading: engagementLoading } =
    useGetEngagementDetails(engId);
  const { data: sections = [], isLoading: sectionsLoading } =
    useGetSections(engId);
  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const updateSection = useUpdateSection();

  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionFormula, setNewSectionFormula] = useState("");

  // Report state
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportSummary, setReportSummary] = useState<{
    sections: number;
    issues: number;
    obt: number;
  } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // AI Summary state
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(null);
  const [aiSummaryModalOpen, setAiSummaryModalOpen] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Materiality & Client Profile state (persisted to localStorage)
  const [clientDescription, setClientDescription] = useState("");
  const [riskAccounts, setRiskAccounts] = useState("");
  const [salesRevenue, setSalesRevenue] = useState("");
  const [tbUnbalancedAccounts, setTbUnbalancedAccounts] = useState<
    Array<{ id: string; accountName: string; variance: string }>
  >([]);

  // Load materiality data from localStorage on mount / engagementId change
  useEffect(() => {
    if (!engagementId) return;
    try {
      const stored = localStorage.getItem(`materiality-${engagementId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setClientDescription(parsed.clientDescription ?? "");
        setRiskAccounts(parsed.riskAccounts ?? "");
        setSalesRevenue(parsed.salesRevenue ?? "");
        setTbUnbalancedAccounts(
          (parsed.tbUnbalancedAccounts ?? []).map(
            (a: { id?: string; accountName: string; variance: string }) => ({
              id: a.id ?? crypto.randomUUID(),
              accountName: a.accountName,
              variance: a.variance,
            }),
          ),
        );
      }
    } catch {
      // ignore parse errors
    }
  }, [engagementId]);

  // Save materiality data to localStorage on every change
  useEffect(() => {
    if (!engagementId) return;
    localStorage.setItem(
      `materiality-${engagementId}`,
      JSON.stringify({
        clientDescription,
        riskAccounts,
        salesRevenue,
        tbUnbalancedAccounts,
      }),
    );
  }, [
    engagementId,
    clientDescription,
    riskAccounts,
    salesRevenue,
    tbUnbalancedAccounts,
  ]);

  // Formula editor state
  const [formulaEditSection, setFormulaEditSection] = useState<Section | null>(
    null,
  );
  const [formulaEditValue, setFormulaEditValue] = useState("");
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !engId || !identity) return;

    try {
      const section: Section = {
        id: 0n,
        name: newSectionName.trim(),
        engagementId: engId,
        isCustom: true,
        formula: newSectionFormula.trim(),
        createdAt: BigInt(Date.now() * 1_000_000),
        updatedAt: BigInt(Date.now() * 1_000_000),
      };
      await createSection.mutateAsync(section);
      toast.success("Section created successfully");
      setNewSectionName("");
      setNewSectionFormula("");
      setAddSectionOpen(false);
    } catch (error) {
      toast.error("Failed to create section");
      console.error(error);
    }
  };

  const handleDeleteSection = async (sectionId: bigint) => {
    if (!engId) return;
    try {
      await deleteSection.mutateAsync({ sectionId, engagementId: engId });
      toast.success("Section deleted successfully");
    } catch (error) {
      toast.error("Failed to delete section");
      console.error(error);
    }
  };

  const openFormulaDialog = (section: Section) => {
    setFormulaEditSection(section);
    setFormulaEditValue(section.formula ?? "");
    setFormulaDialogOpen(true);
  };

  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaEditSection || !engId) return;
    try {
      await updateSection.mutateAsync({
        sectionId: formulaEditSection.id,
        formula: formulaEditValue.trim(),
        engagementId: engId,
      });
      toast.success("Formula updated");
      setFormulaDialogOpen(false);
      setFormulaEditSection(null);
    } catch (error) {
      toast.error("Failed to update formula");
      console.error(error);
    }
  };

  const handleGenerateReport = async () => {
    if (!engId || !engagement || !actor) {
      toast.error("Actor not ready — please wait a moment and try again");
      return;
    }
    setGeneratingReport(true);
    try {
      // Gather data in parallel where possible
      const [issues, openingBalanceTests, sectionWorkpapers] =
        await Promise.all([
          actor.getIssues(engId),
          actor.getOpeningBalanceTests(engId),
          Promise.all(
            sections.map(async (s) => {
              const wps = await actor.getWorkpapers(s.id);
              return { section: s, workpaper: wps[0] ?? null };
            }),
          ),
        ]);

      // Read localStorage data for each section
      const sectionData = sectionWorkpapers.map(({ section, workpaper }) => {
        let auditNotes = "";
        let assertions: AuditAssertions | null = null;
        try {
          auditNotes =
            localStorage.getItem(`audit-notes-${section.id.toString()}`) ?? "";
        } catch {
          /* ignore */
        }
        try {
          const raw = localStorage.getItem(
            `audit-assertions-${section.id.toString()}`,
          );
          if (raw) assertions = JSON.parse(raw) as AuditAssertions;
        } catch {
          /* ignore */
        }
        return {
          id: section.id.toString(),
          name: section.name,
          formula: section.formula ?? "",
          workpaper: workpaper
            ? {
                auditObjective: workpaper.auditObjective,
                proceduresPerformed: workpaper.proceduresPerformed,
                evidenceDescription: workpaper.evidenceDescription,
                findings: workpaper.findings,
                conclusion: workpaper.conclusion,
                riskRating: workpaper.riskRating,
                generalLedgerTotal: workpaper.generalLedgerTotal,
                trialBalanceTotal: workpaper.trialBalanceTotal,
                sampleDetails: workpaper.sampleDetails,
              }
            : null,
          auditNotes,
          assertions,
        };
      });

      // Read materiality from localStorage
      let materialityData: {
        clientDescription: string;
        riskAccounts: string;
        salesRevenue: string;
        tbUnbalancedAccounts: Array<{ accountName: string; variance: string }>;
      } = {
        clientDescription,
        riskAccounts,
        salesRevenue,
        tbUnbalancedAccounts,
      };
      try {
        const stored = localStorage.getItem(`materiality-${engagementId}`);
        if (stored)
          materialityData = { ...materialityData, ...JSON.parse(stored) };
      } catch {
        /* ignore */
      }

      const auditorName = identity
        ? `${identity.getPrincipal().toString().substring(0, 16)}...`
        : "Auditor";
      const generatedAt = format(new Date(), "dd MMMM yyyy, HH:mm");

      const html = buildAuditObservationReport({
        engagement: {
          clientName: engagement.clientName,
          financialYear: engagement.financialYear,
          engagementType: engagement.engagementType,
          auditStartDate: engagement.auditStartDate,
          auditEndDate: engagement.auditEndDate,
          materialityAmount: engagement.materialityAmount,
          finalized: engagement.finalized,
        },
        materiality: materialityData,
        sections: sectionData,
        openingBalanceTests: openingBalanceTests.map((t) => ({
          accountName: t.accountName,
          priorYearClosingBalance: t.priorYearClosingBalance,
          currentYearOpeningBalance: t.currentYearOpeningBalance,
          notes: t.notes,
        })),
        issues: issues.map((iss) => ({
          description: iss.description,
          riskLevel: iss.riskLevel,
          monetaryImpact: iss.monetaryImpact,
          status: iss.status,
          managementResponse: iss.managementResponse,
          recommendations: iss.recommendations,
        })),
        generatedAt,
        auditorName,
      });

      // Build ReportData for CSV/RTF export
      const exportData: ReportData = {
        clientName: engagement.clientName,
        financialYear: Number(engagement.financialYear),
        engagementType: engagement.engagementType,
        materialityAmount: engagement.materialityAmount,
        issues: issues.map((iss) => ({
          description: iss.description,
          riskLevel: iss.riskLevel,
          monetaryImpact: iss.monetaryImpact,
          status: iss.status,
          recommendations: iss.recommendations,
          managementResponse: iss.managementResponse,
        })),
        sections: sectionData.map((s) => ({
          name: s.name,
          workpaper: s.workpaper
            ? {
                generalLedgerTotal: s.workpaper.generalLedgerTotal,
                trialBalanceTotal: s.workpaper.trialBalanceTotal,
                riskRating: s.workpaper.riskRating,
                findings: s.workpaper.findings,
                conclusion: s.workpaper.conclusion,
              }
            : null,
        })),
      };

      setReportHtml(html);
      setReportData(exportData);
      setReportSummary({
        sections: sectionData.length,
        issues: issues.length,
        obt: openingBalanceTests.length,
      });
      setReportModalOpen(true);
      toast.success("Comprehensive audit report generated");
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportHtml || !engagement) return;
    const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${engagement.clientName.replace(/\s+/g, "-")}-Audit-Observation-Report-${format(new Date(), "yyyy-MM-dd")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully");
  };

  const handlePrintReport = () => {
    if (!reportHtml) return;
    printHTML(reportHtml);
    toast.success("Print dialog opened");
  };

  const handleExportCSV = () => {
    if (!reportData || !engagement) return;
    downloadCSV(
      reportData,
      `${engagement.clientName.replace(/\s+/g, "-")}-Audit-Report-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    toast.success("CSV export downloaded");
  };

  const handleExportRTF = () => {
    if (!reportData || !engagement) return;
    downloadRTF(
      reportData,
      `${engagement.clientName.replace(/\s+/g, "-")}-Audit-Report-${format(new Date(), "yyyy-MM-dd")}.rtf`,
    );
    toast.success("Word/RTF export downloaded");
  };

  const handleGenerateAISummary = async () => {
    if (!engId || !engagement || !actor) {
      toast.error("Actor not ready — please wait a moment and try again");
      return;
    }
    setGeneratingSummary(true);
    try {
      const [issuesData, sectionWorkpapers] = await Promise.all([
        actor.getIssues(engId),
        Promise.all(
          sections.map(async (s) => {
            const wps = await actor.getWorkpapers(s.id);
            return { section: s, workpaper: wps[0] ?? null };
          }),
        ),
      ]);

      const summaryInput: SummaryInput = {
        clientName: engagement.clientName,
        financialYear: Number(engagement.financialYear),
        engagementType: engagement.engagementType,
        materialityAmount: engagement.materialityAmount,
        sections: sectionWorkpapers.map(({ section, workpaper }) => ({
          name: section.name,
          findings: workpaper?.findings ?? "",
          riskRating: workpaper?.riskRating ?? "low",
          glTotal: workpaper?.generalLedgerTotal ?? 0,
          tbTotal: workpaper?.trialBalanceTotal ?? 0,
        })),
        issues: issuesData.map((iss) => ({
          description: iss.description,
          riskLevel: iss.riskLevel,
          recommendations: iss.recommendations,
          status: iss.status,
        })),
        openIssuesCount: issuesData.filter((i) => i.status === "open").length,
        highRiskCount: issuesData.filter((i) => i.riskLevel === "high").length,
      };

      const summary = generateAISummary(summaryInput);
      setAiSummaryText(summary);
      setAiSummaryModalOpen(true);
    } catch (error) {
      toast.error("Failed to generate AI summary");
      console.error(error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!aiSummaryText) return;
    navigator.clipboard
      .writeText(aiSummaryText)
      .then(() => toast.success("Summary copied to clipboard"))
      .catch(() => toast.error("Failed to copy to clipboard"));
  };

  const handleDownloadSummary = () => {
    if (!aiSummaryText || !engagement) return;
    const blob = new Blob([aiSummaryText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${engagement.clientName.replace(/\s+/g, "-")}-AI-Summary-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded");
  };

  if (!engagementId) {
    return <div>Invalid engagement ID</div>;
  }

  return (
    <TooltipProvider>
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
              <BreadcrumbPage>
                {engagement?.clientName ?? "Loading..."}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-wide">
            {engagement?.clientName ?? "Engagement Detail"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Audit engagement details and workpapers
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/engagements" })}
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
            data-ocid="engagement.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Engagements
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Summary Button */}
            <Button
              variant="outline"
              onClick={handleGenerateAISummary}
              disabled={generatingSummary || !actor}
              data-ocid="engagement.ai_summary.button"
              className="gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4" />
                  AI Summary
                </>
              )}
            </Button>

            {/* Generate Report + Export Dropdown */}
            <div className="flex items-center">
              <Button
                onClick={handleGenerateReport}
                disabled={generatingReport || !actor}
                data-ocid="engagement.generate_report.primary_button"
                className="gap-2 shadow-accent-sm hover:shadow-accent-md transition-shadow rounded-r-none border-r border-primary-foreground/20"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={!reportHtml}
                    className="gap-1 shadow-accent-sm hover:shadow-accent-md transition-shadow rounded-l-none px-2"
                    data-ocid="engagement.export.dropdown_menu"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card border-border/60"
                >
                  <DropdownMenuItem
                    onClick={handlePrintReport}
                    className="gap-2 cursor-pointer"
                    data-ocid="engagement.print.button"
                  >
                    <Printer className="h-4 w-4" />
                    Print / Save as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportCSV}
                    className="gap-2 cursor-pointer"
                    data-ocid="engagement.export_csv.button"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportRTF}
                    className="gap-2 cursor-pointer"
                    data-ocid="engagement.export_rtf.button"
                  >
                    <Download className="h-4 w-4" />
                    Export to Word (.rtf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Engagement Details Card */}
        <Card className="border-border/60 bg-card overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-primary/60 via-primary/90 to-primary/30" />
          <CardHeader>
            <CardTitle className="font-serif text-3xl text-foreground">
              {engagement?.clientName ?? <Skeleton className="h-8 w-64" />}
            </CardTitle>
            <CardDescription>Audit engagement details</CardDescription>
          </CardHeader>
          <CardContent>
            {engagementLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : engagement ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    Financial Year
                  </p>
                  <p className="font-mono tabular-nums font-semibold text-foreground text-lg">
                    {Number(engagement.financialYear)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    Type
                  </p>
                  <Badge
                    className={
                      engagement.engagementType === "external"
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-secondary text-muted-foreground border-border/50"
                    }
                  >
                    {engagement.engagementType}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    Materiality Amount
                  </p>
                  <p className="font-mono tabular-nums font-semibold text-foreground text-lg">
                    ${engagement.materialityAmount.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    Start Date
                  </p>
                  <p className="font-mono tabular-nums text-sm text-foreground">
                    {format(
                      new Date(Number(engagement.auditStartDate) / 1_000_000),
                      "MMM dd, yyyy",
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    End Date
                  </p>
                  <p className="font-mono tabular-nums text-sm text-foreground">
                    {format(
                      new Date(Number(engagement.auditEndDate) / 1_000_000),
                      "MMM dd, yyyy",
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    Status
                  </p>
                  <Badge
                    className={
                      engagement.finalized
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-primary/10 text-primary border-primary/20"
                    }
                  >
                    {engagement.finalized ? "Finalized" : "In Progress"}
                  </Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Materiality & Client Profile Card */}
        <Card className="border-border/60 bg-card overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-primary/60 via-primary/90 to-primary/30" />
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-serif text-2xl text-foreground">
                  Materiality &amp; Client Profile
                </CardTitle>
                <CardDescription>
                  Key engagement context, risk profile, and audit assertions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Materiality Amount (read-only summary) */}
            {engagement && (
              <div className="flex items-center gap-3 p-3 rounded-md border border-primary/20 bg-primary/5">
                <DollarSign className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    Materiality Amount
                  </p>
                  <p className="font-mono tabular-nums font-semibold text-primary text-lg">
                    ${engagement.materialityAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* 2-column grid for the four new fields */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* 1. What does the client actually do? */}
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="clientDescription"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <BookOpen className="h-4 w-4 text-primary" />
                  What does the client actually do?
                </Label>
                <Textarea
                  id="clientDescription"
                  value={clientDescription}
                  onChange={(e) => setClientDescription(e.target.value)}
                  placeholder="Describe the client's business, industry, and main activities..."
                  rows={3}
                  data-ocid="materiality.client_description.textarea"
                  className="bg-secondary/40 border-border/50 focus:border-primary/50 resize-none"
                />
              </div>

              {/* 2. Risk / Significant Account Heads */}
              <div className="space-y-2">
                <Label
                  htmlFor="riskAccounts"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Risk / Significant Account Heads
                </Label>
                <Textarea
                  id="riskAccounts"
                  value={riskAccounts}
                  onChange={(e) => setRiskAccounts(e.target.value)}
                  placeholder="List the significant or high-risk accounts (e.g. Revenue, Trade Receivables, Inventory)..."
                  rows={3}
                  data-ocid="materiality.risk_accounts.textarea"
                  className="bg-secondary/40 border-border/50 focus:border-primary/50 resize-none"
                />
              </div>

              {/* 3. Sales and Total Revenue */}
              <div className="space-y-2">
                <Label
                  htmlFor="salesRevenue"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Sales &amp; Total Revenue
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm pointer-events-none">
                    $
                  </span>
                  <Input
                    id="salesRevenue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={salesRevenue}
                    onChange={(e) => setSalesRevenue(e.target.value)}
                    placeholder="0.00"
                    data-ocid="materiality.sales_revenue.input"
                    className="pl-7 font-mono bg-secondary/40 border-border/50 focus:border-primary/50"
                  />
                </div>
                {salesRevenue && Number(salesRevenue) > 0 && (
                  <p className="text-xs text-primary/70 font-mono">
                    = $
                    {Number(salesRevenue).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>

              {/* 4. TB Accounts that do not balance */}
              <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    TB Accounts That Do Not Balance
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTbUnbalancedAccounts((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          accountName: "",
                          variance: "",
                        },
                      ])
                    }
                    className="gap-1.5 border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-xs"
                    data-ocid="materiality.tb_accounts.add_button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Account
                  </Button>
                </div>

                {tbUnbalancedAccounts.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/50 bg-secondary/20 py-6 text-center"
                    data-ocid="materiality.tb_accounts.empty_state"
                  >
                    <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No unbalanced TB accounts recorded yet.
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Click "Add Account" to record accounts where GL and TB do
                      not agree.
                    </p>
                  </div>
                ) : (
                  <div
                    className="space-y-3"
                    data-ocid="materiality.tb_accounts.list"
                  >
                    {/* Header row */}
                    <div className="hidden sm:grid sm:grid-cols-[2fr_3fr_auto] gap-3 px-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                        Account Name
                      </p>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                        Variance / Explanation of Difference Found
                      </p>
                    </div>
                    {tbUnbalancedAccounts.map((row, idx) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-1 sm:grid-cols-[2fr_3fr_auto] gap-2 items-start p-3 rounded-md border border-border/40 bg-secondary/30"
                        data-ocid={`materiality.tb_accounts.item.${idx + 1}`}
                      >
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground sm:hidden">
                            Account Name
                          </Label>
                          <Input
                            value={row.accountName}
                            onChange={(e) => {
                              const updated = [...tbUnbalancedAccounts];
                              updated[idx] = {
                                ...updated[idx],
                                accountName: e.target.value,
                              };
                              setTbUnbalancedAccounts(updated);
                            }}
                            placeholder="e.g. Trade Payables"
                            className="bg-card border-border/50 focus:border-primary/50 text-sm"
                            data-ocid={`materiality.tb_accounts.input.${idx + 1}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground sm:hidden">
                            Variance / Explanation
                          </Label>
                          <Textarea
                            value={row.variance}
                            onChange={(e) => {
                              const updated = [...tbUnbalancedAccounts];
                              updated[idx] = {
                                ...updated[idx],
                                variance: e.target.value,
                              };
                              setTbUnbalancedAccounts(updated);
                            }}
                            placeholder="Describe what causes the variance (e.g. timing difference, unposted journal, misallocation)..."
                            rows={2}
                            className="bg-card border-border/50 focus:border-primary/50 text-sm resize-none"
                            data-ocid={`materiality.tb_accounts.textarea.${idx + 1}`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setTbUnbalancedAccounts((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="mt-1 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          data-ocid={`materiality.tb_accounts.delete_button.${idx + 1}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Record each TB account where the GL and Trial Balance totals
                  do not agree, and explain the variance found.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opening Balance Testing Quick Link */}
        <Card className="border-border/60 border-dashed bg-card/60">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Opening Balance Testing
                </p>
                <p className="text-sm text-muted-foreground">
                  Verify current year opening balances agree to prior year
                  closing balances
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                navigate({
                  to: "/engagements/$engagementId/opening-balance",
                  params: { engagementId: engagementId! },
                })
              }
              className="shrink-0 gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
            >
              <ClipboardCheck className="h-4 w-4" />
              Open
            </Button>
          </CardContent>
        </Card>

        {/* Sections Card */}
        <Card className="border-border/60 bg-card overflow-hidden">
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-2xl text-foreground">
                  Sections
                </CardTitle>
                <CardDescription>Audit sections and workpapers</CardDescription>
              </div>
              <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom Section
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border/60 shadow-dark-lg">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">
                      Add Custom Section
                    </DialogTitle>
                    <DialogDescription>
                      Create a new section for this engagement
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddSection} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sectionName">Section Name</Label>
                      <Input
                        id="sectionName"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        placeholder="e.g., Intangible Assets"
                        required
                        className="bg-secondary/40 border-border/50 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sectionFormula">
                        Formula / Description{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        id="sectionFormula"
                        value={newSectionFormula}
                        onChange={(e) => setNewSectionFormula(e.target.value)}
                        placeholder="e.g., Intangible Assets = identifiable non-monetary assets without physical substance (patents, trademarks, software licenses)..."
                        rows={3}
                        className="bg-secondary/40 border-border/50 focus:border-primary/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        A reminder of what this account head entails — shown
                        when editing workpapers.
                      </p>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddSectionOpen(false)}
                        className="border-border/60 hover:border-border"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createSection.isPending}
                        className="shadow-accent-sm hover:shadow-accent-md transition-shadow"
                      >
                        {createSection.isPending
                          ? "Creating..."
                          : "Create Section"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {sectionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sections found
              </p>
            ) : (
              <div className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id.toString()}
                    className="flex items-center justify-between p-4 rounded-md border border-border/50 row-hover cursor-pointer group"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      navigate({
                        to: "/engagements/$engagementId/sections/$sectionId",
                        params: {
                          engagementId: engagementId,
                          sectionId: section.id.toString(),
                        },
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate({
                          to: "/engagements/$engagementId/sections/$sectionId",
                          params: {
                            engagementId: engagementId,
                            sectionId: section.id.toString(),
                          },
                        });
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground/70 shrink-0 group-hover:text-primary/70 transition-colors" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {section.name}
                          </p>
                          {section.formula ? (
                            <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              {section.formula}
                            </p>
                          ) : section.isCustom ? (
                            <p className="text-xs text-muted-foreground/60">
                              Custom Section
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {/* Formula indicator */}
                      {section.formula && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center h-8 w-8">
                              <Info className="h-4 w-4 text-primary/50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="max-w-xs bg-card border-border/60"
                          >
                            <p className="text-xs">{section.formula}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {/* Edit formula button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openFormulaDialog(section)}
                        title="Edit formula / description"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* Delete (custom only) */}
                      {section.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSection(section.id)}
                          disabled={deleteSection.isPending}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formula Edit Dialog */}
        <Dialog open={formulaDialogOpen} onOpenChange={setFormulaDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border/60 shadow-dark-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {formulaEditSection?.name} — Formula / Description
              </DialogTitle>
              <DialogDescription>
                Enter a formula or description to remind you what this account
                head entails. This will appear as a reference card when editing
                workpapers.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveFormula} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formulaText">Formula / Description</Label>
                <Textarea
                  id="formulaText"
                  value={formulaEditValue}
                  onChange={(e) => setFormulaEditValue(e.target.value)}
                  placeholder="e.g., Trade Payables = amounts owed to suppliers for goods/services received but not yet paid. Includes creditors and accrued expenses."
                  rows={5}
                  className="resize-none bg-secondary/40 border-border/50 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground">
                  Examples: definitions, accounting treatments, typical line
                  items, relevant standards (IFRS/GAAP).
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormulaDialogOpen(false)}
                  className="border-border/60 hover:border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateSection.isPending}
                  className="shadow-accent-sm hover:shadow-accent-md transition-shadow"
                >
                  {updateSection.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Formula"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Report Preview Modal */}
        <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
          <DialogContent
            className="max-w-2xl bg-card border-border/60 shadow-dark-lg"
            data-ocid="engagement.report.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-foreground">
                Audit Observation Report Ready
              </DialogTitle>
              <DialogDescription>
                Comprehensive report for{" "}
                <strong>{engagement?.clientName}</strong> — download or export.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {reportSummary && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-2xl font-bold font-mono text-primary">
                      {reportSummary.sections}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">
                      Account Heads
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-2xl font-bold font-mono text-primary">
                      {reportSummary.obt}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">
                      OB Tests
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-2xl font-bold font-mono text-primary">
                      {reportSummary.issues}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">
                      Issues
                    </p>
                  </div>
                </div>
              )}
              <div className="p-4 rounded-md border border-border/40 bg-secondary/30 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Report includes:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Engagement details and client profile</li>
                  <li>Materiality context and risk accounts</li>
                  <li>Opening balance test schedule</li>
                  <li>
                    All account heads with workpapers, audit assertions, and
                    notes
                  </li>
                  <li>Complete issues log with management responses</li>
                </ul>
              </div>

              {/* Export options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrintReport}
                  className="gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-sm"
                  data-ocid="engagement.report.print_button"
                >
                  <Printer className="h-4 w-4" />
                  Print / PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-sm"
                  data-ocid="engagement.report.csv_button"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.csv)
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportRTF}
                  className="gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-sm"
                  data-ocid="engagement.report.rtf_button"
                >
                  <Download className="h-4 w-4" />
                  Word (.rtf)
                </Button>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReportModalOpen(false)}
                  data-ocid="engagement.report.cancel_button"
                  className="border-border/60 hover:border-border"
                >
                  Close
                </Button>
                <Button
                  onClick={handleDownloadReport}
                  data-ocid="engagement.report.download_button"
                  className="shadow-accent-sm hover:shadow-accent-md transition-shadow gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download HTML
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Summary Modal */}
        <Dialog open={aiSummaryModalOpen} onOpenChange={setAiSummaryModalOpen}>
          <DialogContent
            className="max-w-2xl max-h-[85vh] bg-card border-border/60 shadow-dark-lg flex flex-col"
            data-ocid="engagement.ai_summary.dialog"
          >
            <DialogHeader className="shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-2xl text-foreground">
                    AI Findings Summary
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Auto-generated from captured audit data
                  </p>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
              <div className="flex-1 overflow-y-auto rounded-lg border border-border/40 bg-secondary/20 p-4">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                  {aiSummaryText}
                </pre>
              </div>
              <div className="flex items-center justify-end gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setAiSummaryModalOpen(false)}
                  className="border-border/60 hover:border-border"
                  data-ocid="engagement.ai_summary.close_button"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopySummary}
                  className="gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                  data-ocid="engagement.ai_summary.copy_button"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  onClick={handleDownloadSummary}
                  className="gap-2 shadow-accent-sm hover:shadow-accent-md transition-shadow"
                  data-ocid="engagement.ai_summary.download_button"
                >
                  <Download className="h-4 w-4" />
                  Download .txt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
