export interface IssueTracking {
  responsibleOfficer: string;
  targetCompletionDate: string; // ISO date string
  clientResponse: string;
  followUpStatus: "pending" | "inProgress" | "resolved";
  followUpNotes: string;
}

export function getIssueTracking(issueId: string): IssueTracking {
  try {
    const stored = localStorage.getItem(`issue-tracking-${issueId}`);
    if (stored) return JSON.parse(stored) as IssueTracking;
  } catch {
    // ignore parse errors
  }
  return {
    responsibleOfficer: "",
    targetCompletionDate: "",
    clientResponse: "",
    followUpStatus: "pending",
    followUpNotes: "",
  };
}

export function saveIssueTracking(issueId: string, data: IssueTracking): void {
  localStorage.setItem(`issue-tracking-${issueId}`, JSON.stringify(data));
}

export function isOverdue(targetDate: string): boolean {
  if (!targetDate) return false;
  return new Date(targetDate) < new Date();
}

export function getAllIssueTrackings(): Record<string, IssueTracking> {
  const result: Record<string, IssueTracking> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("issue-tracking-")) {
      const id = key.replace("issue-tracking-", "");
      result[id] = getIssueTracking(id);
    }
  }
  return result;
}
