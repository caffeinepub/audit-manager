import Time "mo:core/Time";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";




actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type EngagementId = Nat;
  type SectionId = Nat;
  type WorkpaperId = Nat;
  type IssueId = Nat;
  type OpeningBalanceTestId = Nat;

  type EngagementType = {
    #internal;
    #external;
  };

  type RiskLevel = {
    #low;
    #medium;
    #high;
  };

  type DocumentType = {
    #pdf;
    #image;
  };

  type IssueStatus = {
    #open;
    #closed;
  };

  module Engagement {
    public type Engagement = {
      id : EngagementId;
      clientName : Text;
      financialYear : Nat;
      engagementType : EngagementType;
      materialityAmount : Float;
      auditStartDate : Time.Time;
      auditEndDate : Time.Time;
      owner : Principal;
      finalized : Bool;
      createdAt : Time.Time;
      updatedAt : Time.Time;
    };

    public func compare(engagement1 : Engagement, engagement2 : Engagement) : Order.Order {
      Nat.compare(engagement1.id, engagement2.id);
    };
  };

  let engagements = Map.empty<EngagementId, Engagement.Engagement>();
  var nextEngagementId = 1;

  module Section {
    public type Section = {
      id : SectionId;
      name : Text;
      engagementId : EngagementId;
      isCustom : Bool;
      formula : Text;
      createdAt : Time.Time;
      updatedAt : Time.Time;
    };

    public func compare(section1 : Section, section2 : Section) : Order.Order {
      Nat.compare(section1.id, section2.id);
    };
  };

  let sections = Map.empty<SectionId, Section.Section>();
  var nextSectionId = 1;

  module Workpaper {
    public type Workpaper = {
      id : WorkpaperId;
      sectionId : SectionId;
      auditObjective : Text;
      proceduresPerformed : Text;
      sampleDetails : Text;
      evidenceDescription : Text;
      riskRating : RiskLevel;
      findings : Text;
      conclusion : Text;
      documentIds : [Text];
      generalLedgerTotal : Float;
      trialBalanceTotal : Float;
      createdAt : Time.Time;
      updatedAt : Time.Time;
    };

    public func compare(workpaper1 : Workpaper, workpaper2 : Workpaper) : Order.Order {
      Nat.compare(workpaper1.id, workpaper2.id);
    };
  };

  let workpapers = Map.empty<WorkpaperId, Workpaper.Workpaper>();
  var nextWorkpaperId = 1;

  module Issue {
    public type Issue = {
      id : IssueId;
      engagementId : EngagementId;
      description : Text;
      monetaryImpact : Float;
      riskLevel : RiskLevel;
      managementResponse : Text;
      status : IssueStatus;
      recommendations : Text;
      owner : Principal;
      createdAt : Time.Time;
      updatedAt : Time.Time;
    };

    public func compare(issue1 : Issue, issue2 : Issue) : Order.Order {
      Nat.compare(issue1.id, issue2.id);
    };
  };

  let issues = Map.empty<IssueId, Issue.Issue>();
  var nextIssueId = 1;

  module Document {
    public type Document = {
      id : Text;
      name : Text;
      docType : DocumentType;
      size : Nat;
      storageLocation : Storage.ExternalBlob;
      engagementId : EngagementId;
      createdAt : Time.Time;
    };

    public func compare(document1 : Document, document2 : Document) : Order.Order {
      Text.compare(document1.id, document2.id);
    };
  };

  let documents = Map.empty<Text, Document.Document>();

  module OpeningBalanceTest {
    public type OpeningBalanceTest = {
      id : OpeningBalanceTestId;
      engagementId : EngagementId;
      accountName : Text;
      priorYearClosingBalance : Float;
      currentYearOpeningBalance : Float;
      notes : Text;
      owner : Principal;
      createdAt : Time.Time;
      updatedAt : Time.Time;
    };

    public func compare(a : OpeningBalanceTest, b : OpeningBalanceTest) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  let openingBalanceTests = Map.empty<OpeningBalanceTestId, OpeningBalanceTest.OpeningBalanceTest>();
  var nextOpeningBalanceTestId = 1;

  type AuthenticationInput = {
    email : Text;
    password : Text;
  };

  public type Section = Section.Section;
  public type Engagement = Engagement.Engagement;
  public type Workpaper = Workpaper.Workpaper;
  public type Issue = Issue.Issue;
  public type Document = Document.Document;
  public type OpeningBalanceTest = OpeningBalanceTest.OpeningBalanceTest;
  public type UserProfile = {
    email : Text;
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  func verifyEngagementOwnership(caller : Principal, engagementId : EngagementId) : Bool {
    switch (engagements.get(engagementId)) {
      case (?engagement) {
        engagement.owner == caller or AccessControl.isAdmin(accessControlState, caller);
      };
      case (null) { false };
    };
  };

  func getEngagementOwnerBySection(sectionId : SectionId) : ?Principal {
    switch (sections.get(sectionId)) {
      case (?section) {
        switch (engagements.get(section.engagementId)) {
          case (?engagement) { ?engagement.owner };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  func getEngagementOwnerByWorkpaper(workpaperId : WorkpaperId) : ?Principal {
    switch (workpapers.get(workpaperId)) {
      case (?workpaper) {
        getEngagementOwnerBySection(workpaper.sectionId);
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getEngagements() : async [Engagement] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view engagements");
    };

    let userEngagements = engagements.values().toArray().filter(
      func(engagement : Engagement) : Bool {
        engagement.owner == caller or AccessControl.isAdmin(accessControlState, caller);
      },
    );
    userEngagements.sort();
  };

  public query ({ caller }) func getEngagementDetails(engagementId : EngagementId) : async Engagement {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access engagements");
    };

    switch (engagements.get(engagementId)) {
      case (?engagement) {
        if (engagement.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own engagements");
        };
        engagement;
      };
      case (null) {
        Runtime.trap("Engagement not found");
      };
    };
  };

  public shared ({ caller }) func saveEngagement(engagement : Engagement, _sections : [Section], _workpapers : [Workpaper], _issues : [Issue]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create engagements");
    };

    let finalEngagement : Engagement = {
      id = nextEngagementId;
      clientName = engagement.clientName;
      financialYear = engagement.financialYear;
      engagementType = engagement.engagementType;
      materialityAmount = engagement.materialityAmount;
      auditStartDate = engagement.auditStartDate;
      auditEndDate = engagement.auditEndDate;
      owner = caller;
      finalized = engagement.finalized;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    engagements.add(nextEngagementId, finalEngagement);
    nextEngagementId += 1;
  };

  public shared ({ caller }) func updateEngagement(engagementId : EngagementId, engagement : Engagement) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update engagements");
    };

    switch (engagements.get(engagementId)) {
      case (?existingEngagement) {
        if (existingEngagement.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own engagements");
        };
        let updatedEngagement : Engagement = {
          id = engagementId;
          clientName = engagement.clientName;
          financialYear = engagement.financialYear;
          engagementType = engagement.engagementType;
          materialityAmount = engagement.materialityAmount;
          auditStartDate = engagement.auditStartDate;
          auditEndDate = engagement.auditEndDate;
          owner = existingEngagement.owner;
          finalized = engagement.finalized;
          createdAt = existingEngagement.createdAt;
          updatedAt = Time.now();
        };
        engagements.add(engagementId, updatedEngagement);
      };
      case (null) {
        Runtime.trap("Engagement not found");
      };
    };
  };

  public shared ({ caller }) func deleteEngagement(engagementId : EngagementId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete engagements");
    };

    switch (engagements.get(engagementId)) {
      case (?engagement) {
        if (engagement.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own engagements");
        };
        engagements.remove(engagementId);
      };
      case (null) {
        Runtime.trap("Engagement not found");
      };
    };
  };

  public query ({ caller }) func getSections(engagementId : EngagementId) : async [Section] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sections");
    };

    if (not verifyEngagementOwnership(caller, engagementId)) {
      Runtime.trap("Unauthorized: Can only view sections of your own engagements");
    };

    let engagementSections = sections.values().toArray().filter(
      func(section : Section) : Bool {
        section.engagementId == engagementId;
      },
    );
    engagementSections.sort();
  };

  public shared ({ caller }) func createSection(section : Section) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sections");
    };

    if (not verifyEngagementOwnership(caller, section.engagementId)) {
      Runtime.trap("Unauthorized: Can only create sections for your own engagements");
    };

    let finalSection : Section = {
      id = nextSectionId;
      name = section.name;
      engagementId = section.engagementId;
      isCustom = section.isCustom;
      formula = section.formula;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    sections.add(nextSectionId, finalSection);
    nextSectionId += 1;
  };

  public shared ({ caller }) func updateSection(sectionId : SectionId, updatedFields : { formula : Text }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sections");
    };

    switch (sections.get(sectionId)) {
      case (?existingSection) {
        if (not verifyEngagementOwnership(caller, existingSection.engagementId)) {
          Runtime.trap("Unauthorized: Can only update sections from your own engagements");
        };

        let updatedSection : Section = {
          id = sectionId;
          name = existingSection.name;
          engagementId = existingSection.engagementId;
          isCustom = existingSection.isCustom;
          formula = updatedFields.formula;
          createdAt = existingSection.createdAt;
          updatedAt = Time.now();
        };
        sections.add(sectionId, updatedSection);
      };
      case (null) {
        Runtime.trap("Section not found");
      };
    };
  };

  public shared ({ caller }) func deleteSection(sectionId : SectionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete sections");
    };

    switch (sections.get(sectionId)) {
      case (?section) {
        if (not verifyEngagementOwnership(caller, section.engagementId)) {
          Runtime.trap("Unauthorized: Can only delete sections from your own engagements");
        };
        sections.remove(sectionId);
      };
      case (null) { Runtime.trap("Section not found") };
    };
  };

  public query ({ caller }) func getWorkpapers(sectionId : SectionId) : async [Workpaper] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view workpapers");
    };

    switch (getEngagementOwnerBySection(sectionId)) {
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view workpapers from your own engagements");
        };
      };
      case (null) {
        Runtime.trap("Section not found");
      };
    };

    let sectionWorkpapers = workpapers.values().toArray().filter(
      func(workpaper : Workpaper) : Bool {
        workpaper.sectionId == sectionId;
      },
    );
    sectionWorkpapers.sort();
  };

  public shared ({ caller }) func saveWorkpaper(workpaper : Workpaper) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create workpapers");
    };

    switch (getEngagementOwnerBySection(workpaper.sectionId)) {
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only create workpapers for your own engagements");
        };
      };
      case (null) {
        Runtime.trap("Section not found");
      };
    };

    let finalWorkpaper : Workpaper = {
      id = nextWorkpaperId;
      sectionId = workpaper.sectionId;
      auditObjective = workpaper.auditObjective;
      proceduresPerformed = workpaper.proceduresPerformed;
      sampleDetails = workpaper.sampleDetails;
      evidenceDescription = workpaper.evidenceDescription;
      riskRating = workpaper.riskRating;
      findings = workpaper.findings;
      conclusion = workpaper.conclusion;
      documentIds = workpaper.documentIds;
      generalLedgerTotal = workpaper.generalLedgerTotal;
      trialBalanceTotal = workpaper.trialBalanceTotal;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    workpapers.add(nextWorkpaperId, finalWorkpaper);
    nextWorkpaperId += 1;
  };

  public shared ({ caller }) func updateWorkpaper(workpaperId : WorkpaperId, workpaper : Workpaper) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update workpapers");
    };

    switch (workpapers.get(workpaperId)) {
      case (?existingWorkpaper) {
        switch (getEngagementOwnerByWorkpaper(workpaperId)) {
          case (?owner) {
            if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only update workpapers from your own engagements");
            };
          };
          case (null) {
            Runtime.trap("Workpaper engagement not found");
          };
        };

        let updatedWorkpaper : Workpaper = {
          id = workpaperId;
          sectionId = existingWorkpaper.sectionId;
          auditObjective = workpaper.auditObjective;
          proceduresPerformed = workpaper.proceduresPerformed;
          sampleDetails = workpaper.sampleDetails;
          evidenceDescription = workpaper.evidenceDescription;
          riskRating = workpaper.riskRating;
          findings = workpaper.findings;
          conclusion = workpaper.conclusion;
          documentIds = workpaper.documentIds;
          generalLedgerTotal = workpaper.generalLedgerTotal;
          trialBalanceTotal = workpaper.trialBalanceTotal;
          createdAt = existingWorkpaper.createdAt;
          updatedAt = Time.now();
        };
        workpapers.add(workpaperId, updatedWorkpaper);
      };
      case (null) {
        Runtime.trap("Workpaper not found");
      };
    };
  };

  public query ({ caller }) func getIssues(engagementId : ?EngagementId) : async [Issue] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view issues");
    };

    let filteredIssues = switch (engagementId) {
      case (?id) {
        if (not verifyEngagementOwnership(caller, id)) {
          Runtime.trap("Unauthorized: Can only view issues from your own engagements");
        };
        issues.values().toArray().filter(
          func(issue : Issue) : Bool {
            issue.engagementId == id;
          },
        );
      };
      case (null) {
        issues.values().toArray().filter(
          func(issue : Issue) : Bool {
            verifyEngagementOwnership(caller, issue.engagementId);
          },
        );
      };
    };
    filteredIssues.sort();
  };

  public shared ({ caller }) func saveIssue(issue : Issue) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create issues");
    };

    if (not verifyEngagementOwnership(caller, issue.engagementId)) {
      Runtime.trap("Unauthorized: Can only create issues for your own engagements");
    };

    let finalIssue : Issue = {
      id = nextIssueId;
      engagementId = issue.engagementId;
      description = issue.description;
      monetaryImpact = issue.monetaryImpact;
      riskLevel = issue.riskLevel;
      managementResponse = issue.managementResponse;
      status = issue.status;
      recommendations = issue.recommendations;
      owner = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    issues.add(nextIssueId, finalIssue);
    nextIssueId += 1;
  };

  public shared ({ caller }) func updateIssue(issueId : IssueId, issue : Issue) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update issues");
    };

    switch (issues.get(issueId)) {
      case (?existingIssue) {
        if (not verifyEngagementOwnership(caller, existingIssue.engagementId)) {
          Runtime.trap("Unauthorized: Can only update issues from your own engagements");
        };

        let updatedIssue : Issue = {
          id = issueId;
          engagementId = existingIssue.engagementId;
          description = issue.description;
          monetaryImpact = issue.monetaryImpact;
          riskLevel = issue.riskLevel;
          managementResponse = issue.managementResponse;
          status = issue.status;
          recommendations = issue.recommendations;
          owner = existingIssue.owner;
          createdAt = existingIssue.createdAt;
          updatedAt = Time.now();
        };
        issues.add(issueId, updatedIssue);
      };
      case (null) {
        Runtime.trap("Issue not found");
      };
    };
  };

  public shared ({ caller }) func deleteIssue(issueId : IssueId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete issues");
    };

    switch (issues.get(issueId)) {
      case (?issue) {
        if (not verifyEngagementOwnership(caller, issue.engagementId)) {
          Runtime.trap("Unauthorized: Can only delete issues from your own engagements");
        };
        issues.remove(issueId);
      };
      case (null) { Runtime.trap("Issue not found") };
    };
  };

  public shared ({ caller }) func saveDocument(document : Document) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload documents");
    };

    if (not verifyEngagementOwnership(caller, document.engagementId)) {
      Runtime.trap("Unauthorized: Can only upload documents to your own engagements");
    };

    documents.add(document.id, document);
  };

  public query ({ caller }) func getDocument(documentId : Text) : async Document {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view documents");
    };

    switch (documents.get(documentId)) {
      case (?document) {
        if (not verifyEngagementOwnership(caller, document.engagementId)) {
          Runtime.trap("Unauthorized: Can only view documents from your own engagements");
        };
        document;
      };
      case (null) { Runtime.trap("Document not found") };
    };
  };

  public query ({ caller }) func getOpeningBalanceTests(engagementId : EngagementId) : async [OpeningBalanceTest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view opening balance tests");
    };

    if (not verifyEngagementOwnership(caller, engagementId)) {
      Runtime.trap("Unauthorized: Can only view tests of your own engagements");
    };

    let engagementTests = openingBalanceTests.values().toArray().filter(
      func(test : OpeningBalanceTest) : Bool {
        test.engagementId == engagementId;
      },
    );
    engagementTests.sort();
  };

  public shared ({ caller }) func saveOpeningBalanceTest(test : OpeningBalanceTest) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create opening balance tests");
    };

    if (not verifyEngagementOwnership(caller, test.engagementId)) {
      Runtime.trap("Unauthorized: Can only create tests for your own engagements");
    };

    let finalTest : OpeningBalanceTest = {
      id = nextOpeningBalanceTestId;
      engagementId = test.engagementId;
      accountName = test.accountName;
      priorYearClosingBalance = test.priorYearClosingBalance;
      currentYearOpeningBalance = test.currentYearOpeningBalance;
      notes = test.notes;
      owner = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    openingBalanceTests.add(nextOpeningBalanceTestId, finalTest);
    nextOpeningBalanceTestId += 1;
  };

  public shared ({ caller }) func updateOpeningBalanceTest(testId : OpeningBalanceTestId, test : OpeningBalanceTest) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update opening balance tests");
    };

    switch (openingBalanceTests.get(testId)) {
      case (?existingTest) {
        if (not verifyEngagementOwnership(caller, existingTest.engagementId)) {
          Runtime.trap("Unauthorized: Can only update your own opening balance tests");
        };

        let updatedTest : OpeningBalanceTest = {
          id = testId;
          engagementId = existingTest.engagementId;
          accountName = test.accountName;
          priorYearClosingBalance = test.priorYearClosingBalance;
          currentYearOpeningBalance = test.currentYearOpeningBalance;
          notes = test.notes;
          owner = existingTest.owner;
          createdAt = existingTest.createdAt;
          updatedAt = Time.now();
        };
        openingBalanceTests.add(testId, updatedTest);
      };
      case (null) {
        Runtime.trap("Opening balance test not found");
      };
    };
  };

  public shared ({ caller }) func deleteOpeningBalanceTest(testId : OpeningBalanceTestId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete opening balance tests");
    };

    switch (openingBalanceTests.get(testId)) {
      case (?test) {
        if (not verifyEngagementOwnership(caller, test.engagementId)) {
          Runtime.trap("Unauthorized: Can only delete your own opening balance tests");
        };
        openingBalanceTests.remove(testId);
      };
      case (null) { Runtime.trap("Opening balance test not found") };
    };
  };

  public query ({ caller }) func getDashboardData() : async {
    totalEngagements : Nat;
    openIssues : Nat;
    highRiskIssues : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard data");
    };

    let userEngagements = engagements.values().toArray().filter(
      func(engagement : Engagement) : Bool {
        engagement.owner == caller or AccessControl.isAdmin(accessControlState, caller);
      },
    );

    let userIssues = issues.values().toArray().filter(
      func(issue : Issue) : Bool {
        verifyEngagementOwnership(caller, issue.engagementId);
      },
    );

    let openIssuesCount = userIssues.filter(
      func(issue : Issue) : Bool {
        switch (issue.status) {
          case (#open) { true };
          case (#closed) { false };
        };
      },
    ).size();

    let highRiskIssuesCount = userIssues.filter(
      func(issue : Issue) : Bool {
        switch (issue.riskLevel) {
          case (#high) { true };
          case (_) { false };
        };
      },
    ).size();

    {
      totalEngagements = userEngagements.size();
      openIssues = openIssuesCount;
      highRiskIssues = highRiskIssuesCount;
    };
  };

  public query ({ caller }) func generateReport(engagementId : EngagementId) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate reports");
    };

    switch (engagements.get(engagementId)) {
      case (?engagement) {
        if (engagement.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only generate reports for your own engagements");
        };
        "Audit Report for " # engagement.clientName;
      };
      case (null) {
        Runtime.trap("Engagement not found");
      };
    };
  };

  public shared ({ caller }) func registerUser(authData : AuthenticationInput) : async () {
    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    switch (currentRole) {
      case (#user) {
        Runtime.trap("You are already registered as a user.");
      };
      case (#admin) {
        Runtime.trap("You are already registered as an admin.");
      };
      case (#guest) {
        if (authData.email == "" or authData.password == "") {
          Runtime.trap("Invalid credentials. Email and password cannot be empty.");
        };
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };
    };
  };
};
