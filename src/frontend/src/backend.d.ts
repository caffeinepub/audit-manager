import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type OpeningBalanceTestId = bigint;
export type Time = bigint;
export interface Issue {
    id: IssueId;
    status: IssueStatus;
    engagementId: EngagementId;
    owner: Principal;
    recommendations: string;
    createdAt: Time;
    description: string;
    updatedAt: Time;
    monetaryImpact: number;
    managementResponse: string;
    riskLevel: RiskLevel;
}
export type EngagementId = bigint;
export interface Document {
    id: string;
    engagementId: EngagementId;
    name: string;
    createdAt: Time;
    size: bigint;
    storageLocation: ExternalBlob;
    docType: DocumentType;
}
export interface OpeningBalanceTest {
    id: OpeningBalanceTestId;
    engagementId: EngagementId;
    owner: Principal;
    createdAt: Time;
    updatedAt: Time;
    accountName: string;
    notes: string;
    priorYearClosingBalance: number;
    currentYearOpeningBalance: number;
}
export interface Engagement {
    id: EngagementId;
    financialYear: bigint;
    clientName: string;
    owner: Principal;
    createdAt: Time;
    auditEndDate: Time;
    engagementType: EngagementType;
    updatedAt: Time;
    finalized: boolean;
    materialityAmount: number;
    auditStartDate: Time;
}
export interface Workpaper {
    id: WorkpaperId;
    documentIds: Array<string>;
    riskRating: RiskLevel;
    auditObjective: string;
    sampleDetails: string;
    createdAt: Time;
    conclusion: string;
    proceduresPerformed: string;
    generalLedgerTotal: number;
    updatedAt: Time;
    sectionId: SectionId;
    evidenceDescription: string;
    findings: string;
    trialBalanceTotal: number;
}
export type WorkpaperId = bigint;
export interface AuthenticationInput {
    password: string;
    email: string;
}
export interface Section {
    id: SectionId;
    engagementId: EngagementId;
    name: string;
    createdAt: Time;
    updatedAt: Time;
    isCustom: boolean;
    formula: string;
}
export type IssueId = bigint;
export type SectionId = bigint;
export interface UserProfile {
    name: string;
    email: string;
}
export enum DocumentType {
    pdf = "pdf",
    image = "image"
}
export enum EngagementType {
    internal = "internal",
    external = "external"
}
export enum IssueStatus {
    closed = "closed",
    open = "open"
}
export enum RiskLevel {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSection(section: Section): Promise<void>;
    deleteEngagement(engagementId: EngagementId): Promise<void>;
    deleteIssue(issueId: IssueId): Promise<void>;
    deleteOpeningBalanceTest(testId: OpeningBalanceTestId): Promise<void>;
    deleteSection(sectionId: SectionId): Promise<void>;
    generateReport(engagementId: EngagementId): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardData(): Promise<{
        totalEngagements: bigint;
        highRiskIssues: bigint;
        openIssues: bigint;
    }>;
    getDocument(documentId: string): Promise<Document>;
    getEngagementDetails(engagementId: EngagementId): Promise<Engagement>;
    getEngagements(): Promise<Array<Engagement>>;
    getIssues(engagementId: EngagementId | null): Promise<Array<Issue>>;
    getOpeningBalanceTests(engagementId: EngagementId): Promise<Array<OpeningBalanceTest>>;
    getSections(engagementId: EngagementId): Promise<Array<Section>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkpapers(sectionId: SectionId): Promise<Array<Workpaper>>;
    isCallerAdmin(): Promise<boolean>;
    registerUser(authData: AuthenticationInput): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDocument(document: Document): Promise<void>;
    saveEngagement(engagement: Engagement, inputSections: Array<Section>, _workpapers: Array<Workpaper>, _issues: Array<Issue>): Promise<void>;
    saveIssue(issue: Issue): Promise<void>;
    saveOpeningBalanceTest(test: OpeningBalanceTest): Promise<void>;
    saveWorkpaper(workpaper: Workpaper): Promise<void>;
    updateEngagement(engagementId: EngagementId, engagement: Engagement): Promise<void>;
    updateIssue(issueId: IssueId, issue: Issue): Promise<void>;
    updateOpeningBalanceTest(testId: OpeningBalanceTestId, test: OpeningBalanceTest): Promise<void>;
    updateSection(sectionId: SectionId, updatedFields: {
        formula: string;
    }): Promise<void>;
    updateWorkpaper(workpaperId: WorkpaperId, workpaper: Workpaper): Promise<void>;
}
