export interface ReportData {
  clientName: string;
  financialYear: number;
  engagementType: string;
  materialityAmount: number;
  issues: Array<{
    description: string;
    riskLevel: string;
    monetaryImpact: number;
    status: string;
    recommendations: string;
    managementResponse: string;
  }>;
  sections: Array<{
    name: string;
    workpaper: {
      generalLedgerTotal: number;
      trialBalanceTotal: number;
      riskRating: string;
      findings: string;
      conclusion: string;
    } | null;
  }>;
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
  rows.push(["AUDIT OBSERVATION REPORT"]);
  rows.push(["Client", data.clientName]);
  rows.push(["Financial Year", String(data.financialYear)]);
  rows.push(["Engagement Type", data.engagementType]);
  rows.push(["Materiality", String(data.materialityAmount)]);
  rows.push(["Generated", new Date().toLocaleString()]);
  rows.push([]);
  rows.push(["ISSUES LOG"]);
  rows.push([
    "Description",
    "Risk Level",
    "Monetary Impact",
    "Status",
    "Recommendations",
    "Management Response",
  ]);
  for (const issue of data.issues) {
    rows.push([
      issue.description,
      issue.riskLevel,
      String(issue.monetaryImpact),
      issue.status,
      issue.recommendations,
      issue.managementResponse,
    ]);
  }
  rows.push([]);
  rows.push(["ACCOUNT HEADS"]);
  rows.push([
    "Section",
    "GL Total",
    "TB Total",
    "Variance",
    "Risk Rating",
    "Findings",
    "Conclusion",
  ]);
  for (const s of data.sections) {
    const wp = s.workpaper;
    rows.push([
      s.name,
      wp ? String(wp.generalLedgerTotal) : "",
      wp ? String(wp.trialBalanceTotal) : "",
      wp ? String(wp.generalLedgerTotal - wp.trialBalanceTotal) : "",
      wp ? wp.riskRating : "",
      wp ? wp.findings : "",
      wp ? wp.conclusion : "",
    ]);
  }
  const csv = rows
    .map((r) =>
      r.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(","),
    )
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

export function downloadRTF(data: ReportData, filename: string) {
  let rtf =
    "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}{\\f1 Arial;}}";
  rtf += "{\\colortbl ;\\red200\\green100\\blue100;}";
  rtf += "\\f1\\fs28\\b AUDIT OBSERVATION REPORT\\b0\\par\\par";
  rtf += `\\fs22\\b Client:\\b0  ${data.clientName}\\par`;
  rtf += `\\b Financial Year:\\b0  ${data.financialYear}\\par`;
  rtf += `\\b Type:\\b0  ${data.engagementType}\\par`;
  rtf += `\\b Materiality:\\b0  $${data.materialityAmount.toLocaleString()}\\par\\par`;
  rtf += "\\fs24\\b ISSUES LOG\\b0\\par\\par";
  for (const iss of data.issues) {
    rtf += `\\fs20\\b ${iss.description
      .replace(/[\\{}]/g, "")
      .substring(0, 80)}\\b0\\par`;
    rtf += `Risk: ${iss.riskLevel} | Status: ${iss.status} | Impact: $${iss.monetaryImpact.toLocaleString()}\\par`;
    if (iss.recommendations)
      rtf += `Recommendation: ${iss.recommendations
        .replace(/[\\{}]/g, "")
        .substring(0, 200)}\\par`;
    rtf += "\\par";
  }
  rtf += "\\fs24\\b ACCOUNT HEADS\\b0\\par\\par";
  for (const s of data.sections) {
    rtf += `\\fs20\\b ${s.name.replace(/[\\{}]/g, "")}\\b0\\par`;
    if (s.workpaper) {
      rtf += `GL: $${s.workpaper.generalLedgerTotal.toLocaleString()} | TB: $${s.workpaper.trialBalanceTotal.toLocaleString()} | Variance: $${(
        s.workpaper.generalLedgerTotal - s.workpaper.trialBalanceTotal
      ).toFixed(2)}\\par`;
      if (s.workpaper.findings)
        rtf += `Findings: ${s.workpaper.findings
          .replace(/[\\{}]/g, "")
          .substring(0, 200)}\\par`;
    }
    rtf += "\\par";
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
