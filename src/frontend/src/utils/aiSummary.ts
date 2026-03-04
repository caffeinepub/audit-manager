// Deterministic template-based AI summary generator
// No external API - uses the captured data to generate a structured narrative summary

export interface SummaryInput {
  clientName: string;
  financialYear: number;
  engagementType: string;
  sections: Array<{
    name: string;
    findings: string;
    riskRating: string;
    glTotal: number;
    tbTotal: number;
  }>;
  issues: Array<{
    description: string;
    riskLevel: string;
    recommendations: string;
    status: string;
  }>;
  openIssuesCount: number;
  highRiskCount: number;
  materialityAmount: number;
}

export function generateAISummary(input: SummaryInput): string {
  const {
    clientName,
    financialYear,
    engagementType,
    sections,
    issues,
    openIssuesCount,
    highRiskCount,
    materialityAmount,
  } = input;

  const highRiskSections = sections.filter((s) => s.riskRating === "high");
  const sectionsWithFindings = sections.filter((s) => s.findings?.trim());
  const balancedSections = sections.filter(
    (s) => s.glTotal && s.tbTotal && Math.abs(s.glTotal - s.tbTotal) < 0.01,
  );

  let summary = "AUDIT FINDINGS SUMMARY\n";
  summary += `${"─".repeat(50)}\n\n`;
  summary += `Client: ${clientName}\n`;
  summary += `Financial Year: ${financialYear}\n`;
  summary += `Engagement Type: ${engagementType.charAt(0).toUpperCase() + engagementType.slice(1)}\n`;
  summary += `Materiality Threshold: $${materialityAmount.toLocaleString()}\n\n`;

  summary += `EXECUTIVE SUMMARY\n${"─".repeat(30)}\n`;
  if (openIssuesCount === 0) {
    summary += `This audit engagement for ${clientName} (FY${financialYear}) has been completed with no outstanding issues identified. All ${sections.length} account heads reviewed are in good standing.\n\n`;
  } else {
    summary += `This ${engagementType} audit engagement for ${clientName} (FY${financialYear}) identified ${openIssuesCount} open issue(s), of which ${highRiskCount} are classified as high risk. Immediate attention is recommended for high-risk findings.\n\n`;
  }

  if (sectionsWithFindings.length > 0) {
    summary += `KEY FINDINGS BY ACCOUNT HEAD\n${"─".repeat(30)}\n`;
    for (const s of sectionsWithFindings) {
      summary += `• ${s.name} [${s.riskRating.toUpperCase()}]: ${s.findings.substring(0, 200)}${s.findings.length > 200 ? "..." : ""}\n`;
    }
    summary += "\n";
  }

  if (highRiskSections.length > 0) {
    summary += `HIGH-RISK AREAS\n${"─".repeat(30)}\n`;
    for (const s of highRiskSections) {
      summary += `• ${s.name}: Requires priority follow-up\n`;
    }
    summary += "\n";
  }

  if (sections.some((s) => s.glTotal || s.tbTotal)) {
    summary += `RECONCILIATION STATUS\n${"─".repeat(30)}\n`;
    summary += `${balancedSections.length} of ${sections.length} account heads are fully reconciled (GL = TB).\n`;
    const unbalanced = sections.filter(
      (s) => s.glTotal && s.tbTotal && Math.abs(s.glTotal - s.tbTotal) >= 0.01,
    );
    if (unbalanced.length > 0) {
      summary += `${unbalanced.length} account head(s) have GL/TB variances requiring investigation:\n`;
      for (const s of unbalanced) {
        summary += `  • ${s.name}: Variance $${Math.abs(s.glTotal - s.tbTotal).toFixed(2)}\n`;
      }
    }
    summary += "\n";
  }

  if (issues.length > 0) {
    summary += `RECOMMENDATIONS SUMMARY\n${"─".repeat(30)}\n`;
    const openIssues = issues.filter((i) => i.status === "open");
    for (const iss of openIssues.slice(0, 5)) {
      if (iss.recommendations) {
        summary += `• ${iss.recommendations.substring(0, 150)}${iss.recommendations.length > 150 ? "..." : ""}\n`;
      }
    }
    if (openIssues.length > 5) {
      summary += `  ... and ${openIssues.length - 5} more recommendation(s).\n`;
    }
    summary += "\n";
  }

  summary += `CONCLUSION\n${"─".repeat(30)}\n`;
  if (openIssuesCount === 0) {
    summary += `Based on the audit procedures performed, no material misstatements or significant control weaknesses were identified for ${clientName} for FY${financialYear}. The financial statements appear to present a true and fair view in accordance with applicable accounting standards.\n`;
  } else {
    summary += `Based on the audit procedures performed for ${clientName} (FY${financialYear}), ${openIssuesCount} issue(s) require management attention. It is recommended that management address the ${highRiskCount} high-risk finding(s) as a priority before the audit is finalized.\n`;
  }

  summary += `\n[Generated: ${new Date().toLocaleString()}]`;
  return summary;
}
