export interface ReportData {
  clientName: string;
  financialYear: number;
  engagementType: string;
  materialityAmount: number;
  auditStartDate?: string;
  auditEndDate?: string;
  auditStatus?: string;
  materiality?: {
    clientDescription: string;
    riskAccounts: string;
    salesRevenue: string;
    tbUnbalancedAccounts: Array<{ accountName: string; variance: string }>;
  };
  openingBalanceTests?: Array<{
    accountName: string;
    priorYearClosingBalance: number;
    currentYearOpeningBalance: number;
    difference: number;
    notes: string;
  }>;
  issues: Array<{
    description: string;
    riskLevel: string;
    monetaryImpact: number;
    status: string;
    recommendations: string;
    managementResponse: string;
    responsibleOfficer?: string;
    targetCompletionDate?: string;
    clientResponse?: string;
    followUpStatus?: string;
    followUpNotes?: string;
    accountHead?: string;
  }>;
  sections: Array<{
    name: string;
    formula?: string;
    auditNotes?: string;
    assertions?: Array<{ label: string; checked: boolean; notes: string }>;
    workpaper: {
      auditObjective?: string;
      proceduresPerformed?: string;
      sampleDetails?: string;
      evidenceDescription?: string;
      generalLedgerTotal: number;
      trialBalanceTotal: number;
      riskRating: string;
      findings: string;
      conclusion: string;
    } | null;
  }>;
}

function csvEscape(val: string | number | undefined | null): string {
  const s = String(val ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

// Strip HTML tags for plain text in CSV/RTF
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .trim();
}

export function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printHTML(html: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

export function downloadCSV(data: ReportData, filename: string) {
  const rows: string[][] = [];

  // ── 1. ENGAGEMENT DETAILS ────────────────────────────────────────
  rows.push(["AUDIT OBSERVATION REPORT"]);
  rows.push(["Generated", new Date().toLocaleString()]);
  rows.push([]);
  rows.push(["SECTION 1: ENGAGEMENT DETAILS"]);
  rows.push(["Field", "Value"]);
  rows.push(["Client Name", data.clientName]);
  rows.push(["Financial Year", String(data.financialYear)]);
  rows.push(["Engagement Type", data.engagementType]);
  rows.push([
    "Materiality Amount",
    `$${data.materialityAmount.toLocaleString()}`,
  ]);
  if (data.auditStartDate) rows.push(["Audit Start Date", data.auditStartDate]);
  if (data.auditEndDate) rows.push(["Audit End Date", data.auditEndDate]);
  if (data.auditStatus) rows.push(["Status", data.auditStatus]);

  // ── 2. CLIENT PROFILE & MATERIALITY ────────────────────────────
  rows.push([]);
  rows.push(["SECTION 2: CLIENT PROFILE & MATERIALITY"]);
  if (data.materiality) {
    rows.push([
      "What the Client Does",
      stripHtml(data.materiality.clientDescription),
    ]);
    rows.push([
      "Risk / Significant Accounts",
      stripHtml(data.materiality.riskAccounts),
    ]);
    rows.push([
      "Sales & Total Revenue",
      data.materiality.salesRevenue
        ? `$${Number(data.materiality.salesRevenue).toLocaleString()}`
        : "",
    ]);
    if (data.materiality.tbUnbalancedAccounts.length > 0) {
      rows.push([]);
      rows.push(["TB ACCOUNTS THAT DO NOT BALANCE"]);
      rows.push(["Account Name", "Variance / Explanation"]);
      for (const acct of data.materiality.tbUnbalancedAccounts) {
        rows.push([acct.accountName, acct.variance]);
      }
    }
  }

  // ── 3. OPENING BALANCE TESTS ────────────────────────────────────
  rows.push([]);
  rows.push(["SECTION 3: OPENING BALANCE TESTS"]);
  if (data.openingBalanceTests && data.openingBalanceTests.length > 0) {
    rows.push([
      "Account Name",
      "Prior Year Closing Balance",
      "Current Year Opening Balance",
      "Difference",
      "Status",
      "Notes",
    ]);
    for (const t of data.openingBalanceTests) {
      rows.push([
        t.accountName,
        String(t.priorYearClosingBalance),
        String(t.currentYearOpeningBalance),
        String(t.difference),
        t.difference === 0 ? "Agreed" : "Discrepancy",
        t.notes,
      ]);
    }
  } else {
    rows.push(["No opening balance tests recorded."]);
  }

  // ── 4. ACCOUNT HEADS & WORKPAPERS ──────────────────────────────
  rows.push([]);
  rows.push(["SECTION 4: ACCOUNT HEADS & WORKPAPERS"]);
  for (const s of data.sections) {
    rows.push([]);
    rows.push([`Account Head: ${s.name}`]);
    if (s.formula) rows.push(["Formula / Definition", s.formula]);
    const wp = s.workpaper;
    if (wp) {
      rows.push(["GL Total", String(wp.generalLedgerTotal)]);
      rows.push(["TB Total", String(wp.trialBalanceTotal)]);
      rows.push([
        "Variance (GL − TB)",
        String(wp.generalLedgerTotal - wp.trialBalanceTotal),
      ]);
      rows.push(["Risk Rating", wp.riskRating]);
      if (wp.auditObjective)
        rows.push(["Audit Objective", stripHtml(wp.auditObjective)]);
      if (wp.proceduresPerformed)
        rows.push(["Procedures Performed", stripHtml(wp.proceduresPerformed)]);
      if (wp.sampleDetails)
        rows.push(["Sample Details", stripHtml(wp.sampleDetails)]);
      if (wp.evidenceDescription)
        rows.push(["Evidence Description", stripHtml(wp.evidenceDescription)]);
      if (wp.findings) rows.push(["Findings", stripHtml(wp.findings)]);
      if (wp.conclusion) rows.push(["Conclusion", stripHtml(wp.conclusion)]);
    } else {
      rows.push(["Workpaper", "No workpaper recorded for this section."]);
    }
    if (s.auditNotes)
      rows.push(["Audit Notes / Reminders", stripHtml(s.auditNotes)]);
    if (s.assertions && s.assertions.length > 0) {
      const checkedAssertions = s.assertions.filter((a) => a.checked);
      if (checkedAssertions.length > 0) {
        rows.push(["ASSERTIONS", "", ""]);
        rows.push(["Assertion", "Applicable", "Notes"]);
        for (const a of s.assertions) {
          rows.push([
            a.label,
            a.checked ? "Yes" : "No",
            a.checked ? a.notes : "",
          ]);
        }
      }
    }
  }

  // ── 5. ISSUES LOG ────────────────────────────────────────────────
  rows.push([]);
  rows.push(["SECTION 5: ISSUES LOG"]);
  if (data.issues.length > 0) {
    rows.push([
      "Description",
      "Account Head",
      "Risk Level",
      "Monetary Impact",
      "Status",
      "Recommendations",
      "Management Response",
      "Responsible Officer",
      "Target Completion Date",
      "Client Response",
      "Follow-Up Status",
      "Follow-Up Notes",
    ]);
    for (const issue of data.issues) {
      rows.push([
        issue.description,
        issue.accountHead ?? "",
        issue.riskLevel,
        String(issue.monetaryImpact),
        issue.status,
        issue.recommendations,
        issue.managementResponse,
        issue.responsibleOfficer ?? "",
        issue.targetCompletionDate ?? "",
        issue.clientResponse ?? "",
        issue.followUpStatus ?? "",
        issue.followUpNotes ?? "",
      ]);
    }
  } else {
    rows.push(["No issues recorded for this engagement."]);
  }

  const csv = rows
    .map((r) => r.map((cell) => csvEscape(cell)).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function rtfEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\par ");
}

export function downloadRTF(data: ReportData, filename: string) {
  let rtf = "{\\rtf1\\ansi\\ansicpg1252\\deff0";
  rtf += "{\\fonttbl{\\f0\\froman Times New Roman;}{\\f1\\fswiss Arial;}}";
  rtf +=
    "{\\colortbl ;\\red180\\green100\\blue90;\\red50\\green50\\blue50;\\red200\\green80\\blue80;}";
  rtf +=
    "\\paperw12240\\paperh15840\\margl1440\\margr1440\\margt1440\\margb1440";
  rtf += "\\f1\\fs28\\b\\cf1 AUDIT OBSERVATION REPORT\\b0\\cf0\\par";
  rtf += `\\fs20\\cf2 Generated: ${new Date().toLocaleString()}\\cf0\\par\\par`;

  // ── 1. ENGAGEMENT DETAILS ────────────────────────────────────────
  rtf += "\\fs24\\b\\cf1 1. ENGAGEMENT DETAILS\\b0\\cf0\\par\\par";
  rtf += `\\fs20\\b Client:\\b0  ${rtfEscape(data.clientName)}\\par`;
  rtf += `\\b Financial Year:\\b0  ${data.financialYear}\\par`;
  rtf += `\\b Engagement Type:\\b0  ${rtfEscape(data.engagementType)}\\par`;
  rtf += `\\b Materiality Amount:\\b0  $${data.materialityAmount.toLocaleString()}\\par`;
  if (data.auditStartDate)
    rtf += `\\b Audit Start Date:\\b0  ${rtfEscape(data.auditStartDate)}\\par`;
  if (data.auditEndDate)
    rtf += `\\b Audit End Date:\\b0  ${rtfEscape(data.auditEndDate)}\\par`;
  if (data.auditStatus)
    rtf += `\\b Status:\\b0  ${rtfEscape(data.auditStatus)}\\par`;
  rtf += "\\par";

  // ── 2. CLIENT PROFILE & MATERIALITY ────────────────────────────
  rtf += "\\fs24\\b\\cf1 2. CLIENT PROFILE & MATERIALITY\\b0\\cf0\\par\\par";
  if (data.materiality) {
    if (data.materiality.clientDescription) {
      rtf += `\\fs20\\b What the Client Does:\\b0\\par ${rtfEscape(stripHtml(data.materiality.clientDescription))}\\par\\par`;
    }
    if (data.materiality.riskAccounts) {
      rtf += `\\b Risk / Significant Accounts:\\b0\\par ${rtfEscape(stripHtml(data.materiality.riskAccounts))}\\par\\par`;
    }
    if (data.materiality.salesRevenue) {
      rtf += `\\b Sales & Total Revenue:\\b0  $${Number(data.materiality.salesRevenue).toLocaleString()}\\par\\par`;
    }
    if (data.materiality.tbUnbalancedAccounts.length > 0) {
      rtf += "\\b TB Accounts That Do Not Balance:\\b0\\par";
      for (const acct of data.materiality.tbUnbalancedAccounts) {
        rtf += `\\bullet  \\b ${rtfEscape(acct.accountName)}:\\b0  ${rtfEscape(acct.variance)}\\par`;
      }
      rtf += "\\par";
    }
  }

  // ── 3. OPENING BALANCE TESTS ────────────────────────────────────
  rtf += "\\fs24\\b\\cf1 3. OPENING BALANCE TESTS\\b0\\cf0\\par\\par";
  if (data.openingBalanceTests && data.openingBalanceTests.length > 0) {
    for (const t of data.openingBalanceTests) {
      const status = t.difference === 0 ? "Agreed \\u10003?" : "Discrepancy";
      rtf += `\\fs20\\b ${rtfEscape(t.accountName)}\\b0\\par`;
      rtf += `  Prior Year Closing: $${t.priorYearClosingBalance.toLocaleString()} | Current Year Opening: $${t.currentYearOpeningBalance.toLocaleString()} | Difference: $${t.difference.toLocaleString()} | ${status}\\par`;
      if (t.notes) rtf += `  Notes: ${rtfEscape(t.notes)}\\par`;
      rtf += "\\par";
    }
  } else {
    rtf += "\\fs20 No opening balance tests recorded.\\par\\par";
  }

  // ── 4. ACCOUNT HEADS & WORKPAPERS ──────────────────────────────
  rtf += "\\fs24\\b\\cf1 4. ACCOUNT HEADS & WORKPAPERS\\b0\\cf0\\par\\par";
  for (const s of data.sections) {
    rtf += `\\fs22\\b\\cf3 ${rtfEscape(s.name)}\\b0\\cf0\\par`;
    if (s.formula)
      rtf += `\\fs18\\i Definition: ${rtfEscape(s.formula)}\\i0\\par`;
    const wp = s.workpaper;
    if (wp) {
      rtf += `\\fs20 GL Total: $${wp.generalLedgerTotal.toLocaleString()} | TB Total: $${wp.trialBalanceTotal.toLocaleString()} | Variance: $${(wp.generalLedgerTotal - wp.trialBalanceTotal).toFixed(2)} | Risk: ${rtfEscape(wp.riskRating)}\\par`;
      if (wp.auditObjective)
        rtf += `\\b Audit Objective:\\b0  ${rtfEscape(stripHtml(wp.auditObjective))}\\par`;
      if (wp.proceduresPerformed)
        rtf += `\\b Procedures Performed:\\b0  ${rtfEscape(stripHtml(wp.proceduresPerformed))}\\par`;
      if (wp.sampleDetails)
        rtf += `\\b Sample Details:\\b0  ${rtfEscape(stripHtml(wp.sampleDetails))}\\par`;
      if (wp.evidenceDescription)
        rtf += `\\b Evidence Description:\\b0  ${rtfEscape(stripHtml(wp.evidenceDescription))}\\par`;
      if (wp.findings)
        rtf += `\\b Findings:\\b0  ${rtfEscape(stripHtml(wp.findings))}\\par`;
      if (wp.conclusion)
        rtf += `\\b Conclusion:\\b0  ${rtfEscape(stripHtml(wp.conclusion))}\\par`;
    } else {
      rtf += "\\fs20\\i No workpaper recorded for this section.\\i0\\par";
    }
    if (s.auditNotes) {
      rtf += `\\b Audit Notes / Reminders:\\b0  ${rtfEscape(stripHtml(s.auditNotes))}\\par`;
    }
    if (s.assertions && s.assertions.length > 0) {
      const checked = s.assertions.filter((a) => a.checked);
      if (checked.length > 0) {
        rtf += "\\b Audit Assertions:\\b0\\par";
        for (const a of checked) {
          rtf += `  \\bullet  \\b ${rtfEscape(a.label)}\\b0`;
          if (a.notes) rtf += `: ${rtfEscape(a.notes)}`;
          rtf += "\\par";
        }
      }
    }
    rtf += "\\par";
  }

  // ── 5. ISSUES LOG ────────────────────────────────────────────────
  rtf += "\\fs24\\b\\cf1 5. ISSUES LOG\\b0\\cf0\\par\\par";
  if (data.issues.length > 0) {
    for (const iss of data.issues) {
      rtf += `\\fs20\\b ${rtfEscape(iss.description.substring(0, 120))}\\b0\\par`;
      if (iss.accountHead)
        rtf += `  Account Head: ${rtfEscape(iss.accountHead)}\\par`;
      rtf += `  Risk: ${rtfEscape(iss.riskLevel)} | Status: ${rtfEscape(iss.status)} | Impact: $${iss.monetaryImpact.toLocaleString()}\\par`;
      if (iss.recommendations)
        rtf += `  Recommendation: ${rtfEscape(iss.recommendations.substring(0, 300))}\\par`;
      if (iss.managementResponse)
        rtf += `  Management Response: ${rtfEscape(iss.managementResponse.substring(0, 300))}\\par`;
      if (iss.responsibleOfficer)
        rtf += `  Responsible Officer: ${rtfEscape(iss.responsibleOfficer)}\\par`;
      if (iss.targetCompletionDate)
        rtf += `  Target Completion Date: ${rtfEscape(iss.targetCompletionDate)}\\par`;
      if (iss.clientResponse)
        rtf += `  Client Response: ${rtfEscape(iss.clientResponse.substring(0, 300))}\\par`;
      if (iss.followUpStatus)
        rtf += `  Follow-Up Status: ${rtfEscape(iss.followUpStatus)}\\par`;
      if (iss.followUpNotes)
        rtf += `  Follow-Up Notes: ${rtfEscape(iss.followUpNotes.substring(0, 300))}\\par`;
      rtf += "\\par";
    }
  } else {
    rtf += "\\fs20 No issues recorded for this engagement.\\par\\par";
  }

  rtf += "}";

  const blob = new Blob([rtf], { type: "application/rtf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
