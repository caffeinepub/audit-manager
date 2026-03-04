import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Document,
  Engagement,
  EngagementId,
  Issue,
  IssueId,
  OpeningBalanceTest,
  OpeningBalanceTestId,
  Section,
  SectionId,
  UserProfile,
  Workpaper,
  WorkpaperId,
} from "../backend";
import { useActor } from "./useActor";

// User Profile
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Dashboard Data
export function useGetDashboardData() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      if (!actor)
        return { totalEngagements: 0n, openIssues: 0n, highRiskIssues: 0n };
      return actor.getDashboardData();
    },
    enabled: !!actor && !isFetching,
  });
}

// Engagements
export function useGetEngagements() {
  const { actor, isFetching } = useActor();

  return useQuery<Engagement[]>({
    queryKey: ["engagements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEngagements();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetEngagementDetails(engagementId: EngagementId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Engagement | null>({
    queryKey: ["engagement", engagementId?.toString()],
    queryFn: async () => {
      if (!actor || !engagementId) return null;
      return actor.getEngagementDetails(engagementId);
    },
    enabled: !!actor && !isFetching && !!engagementId,
  });
}

export function useSaveEngagement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      engagement,
      sections,
      workpapers,
      issues,
    }: {
      engagement: Engagement;
      sections: Section[];
      workpapers: Workpaper[];
      issues: Issue[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveEngagement(engagement, sections, workpapers, issues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

export function useUpdateEngagement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      engagementId,
      engagement,
    }: { engagementId: EngagementId; engagement: Engagement }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateEngagement(engagementId, engagement);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      queryClient.invalidateQueries({
        queryKey: ["engagement", variables.engagementId.toString()],
      });
    },
  });
}

export function useDeleteEngagement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (engagementId: EngagementId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteEngagement(engagementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

// Sections
export function useGetSections(engagementId: EngagementId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Section[]>({
    queryKey: ["sections", engagementId?.toString()],
    queryFn: async () => {
      if (!actor || !engagementId) return [];
      return actor.getSections(engagementId);
    },
    enabled: !!actor && !isFetching && !!engagementId,
  });
}

export function useCreateSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (section: Section) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createSection(section);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", variables.engagementId.toString()],
      });
    },
  });
}

export function useDeleteSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      engagementId: _engId,
    }: { sectionId: SectionId; engagementId: EngagementId }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteSection(sectionId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", variables.engagementId.toString()],
      });
    },
  });
}

// Workpapers
export function useGetWorkpapers(sectionId: SectionId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Workpaper[]>({
    queryKey: ["workpapers", sectionId?.toString()],
    queryFn: async () => {
      if (!actor || !sectionId) return [];
      return actor.getWorkpapers(sectionId);
    },
    enabled: !!actor && !isFetching && !!sectionId,
  });
}

export function useSaveWorkpaper() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workpaper: Workpaper) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveWorkpaper(workpaper);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workpapers", variables.sectionId.toString()],
      });
    },
  });
}

export function useUpdateWorkpaper() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workpaperId,
      workpaper,
    }: { workpaperId: WorkpaperId; workpaper: Workpaper }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateWorkpaper(workpaperId, workpaper);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workpapers", variables.workpaper.sectionId.toString()],
      });
    },
  });
}

// Issues
export function useGetIssues(engagementId: EngagementId | null = null) {
  const { actor, isFetching } = useActor();

  return useQuery<Issue[]>({
    queryKey: ["issues", engagementId?.toString() ?? "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIssues(engagementId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveIssue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issue: Issue) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveIssue(issue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

export function useUpdateIssue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      issueId,
      issue,
    }: { issueId: IssueId; issue: Issue }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateIssue(issueId, issue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

export function useDeleteIssue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueId: IssueId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteIssue(issueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

// Documents
export function useSaveDocument() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      document,
    }: { document: Document; engagementId: EngagementId }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveDocument(document);
    },
  });
}

export function useGetDocument(documentId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Document | null>({
    queryKey: ["document", documentId],
    queryFn: async () => {
      if (!actor || !documentId) return null;
      return actor.getDocument(documentId);
    },
    enabled: !!actor && !isFetching && !!documentId,
  });
}

// Opening Balance Tests
export function useGetOpeningBalanceTests(engagementId: EngagementId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<OpeningBalanceTest[]>({
    queryKey: ["openingBalanceTests", engagementId?.toString()],
    queryFn: async () => {
      if (!actor || !engagementId) return [];
      return actor.getOpeningBalanceTests(engagementId);
    },
    enabled: !!actor && !isFetching && !!engagementId,
  });
}

export function useSaveOpeningBalanceTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (test: OpeningBalanceTest) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveOpeningBalanceTest(test);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["openingBalanceTests", variables.engagementId.toString()],
      });
    },
  });
}

export function useUpdateOpeningBalanceTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      test,
    }: { testId: OpeningBalanceTestId; test: OpeningBalanceTest }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOpeningBalanceTest(testId, test);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "openingBalanceTests",
          variables.test.engagementId.toString(),
        ],
      });
    },
  });
}

export function useDeleteOpeningBalanceTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      engagementId: _engagementId,
    }: { testId: OpeningBalanceTestId; engagementId: EngagementId }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteOpeningBalanceTest(testId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["openingBalanceTests", variables.engagementId.toString()],
      });
    },
  });
}

// Section update (for formula)
export function useUpdateSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      formula,
      engagementId: _engagementId,
    }: {
      sectionId: SectionId;
      formula: string;
      engagementId: EngagementId;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSection(sectionId, { formula });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", variables.engagementId.toString()],
      });
    },
  });
}

// Report Generation
export function useGenerateReport() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (engagementId: EngagementId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.generateReport(engagementId);
    },
  });
}
