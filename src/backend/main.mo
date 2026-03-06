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

  type EngagementType = { #internal; #external };
  type RiskLevel = { #low; #medium; #high };
  type DocumentType = { #pdf; #image };
  type IssueStatus = { #open; #closed };

  module Engagement {
    public type Engagement = {
      id : EngagementId; clientName : Text; financialYear : Nat;
      engagementType : EngagementType; materialityAmount : Float;
      auditStartDate : Time.Time; auditEndDate : Time.Time;
      owner : Principal; finalized : Bool;
      createdAt : Time.Time; updatedAt : Time.Time;
    };
    public func compare(a : Engagement, b : Engagement) : Order.Order {
      Nat.compare(a.id, b.id)
    };
  };
  let engagements = Map.empty<EngagementId, Engagement.Engagement>();
  var nextEngagementId = 1;

  module Section {
    public type Section = {
      id : SectionId; name : Text; engagementId : EngagementId;
      isCustom : Bool; formula : Text;
      createdAt : Time.Time; updatedAt : Time.Time;
    };
    public func compare(a : Section, b : Section) : Order.Order {
      Nat.compare(a.id, b.id)
    };
  };
  let sections = Map.empty<SectionId, Section.Section>();
  var nextSectionId = 1;

  module Workpaper {
    public type Workpaper = {
      id : WorkpaperId; sectionId : SectionId;
      auditObjective : Text; proceduresPerformed : Text;
      sampleDetails : Text; evidenceDescription : Text;
      riskRating : RiskLevel; findings : Text; conclusion : Text;
      documentIds : [Text]; generalLedgerTotal : Float; trialBalanceTotal : Float;
      createdAt : Time.Time; updatedAt : Time.Time;
    };
    public func compare(a : Workpaper, b : Workpaper) : Order.Order {
      Nat.compare(a.id, b.id)
    };
  };
  let workpapers = Map.empty<WorkpaperId, Workpaper.Workpaper>();
  var nextWorkpaperId = 1;

  module Issue {
    public type Issue = {
      id : IssueId; engagementId : EngagementId; description : Text;
      monetaryImpact : Float; riskLevel : RiskLevel;
      managementResponse : Text; status : IssueStatus;
      recommendations : Text; owner : Principal;
      createdAt : Time.Time; updatedAt : Time.Time;
    };
    public func compare(a : Issue, b : Issue) : Order.Order {
      Nat.compare(a.id, b.id)
    };
  };
  let issues = Map.empty<IssueId, Issue.Issue>();
  var nextIssueId = 1;

  module Document {
    public type Document = {
      id : Text; name : Text; docType : DocumentType; size : Nat;
      storageLocation : Storage.ExternalBlob;
      engagementId : EngagementId; createdAt : Time.Time;
    };
    public func compare(a : Document, b : Document) : Order.Order {
      Text.compare(a.id, b.id)
    };
  };
  let documents = Map.empty<Text, Document.Document>();

  module OpeningBalanceTest {
    public type OpeningBalanceTest = {
      id : OpeningBalanceTestId; engagementId : EngagementId;
      accountName : Text; priorYearClosingBalance : Float;
      currentYearOpeningBalance : Float; notes : Text;
      owner : Principal; createdAt : Time.Time; updatedAt : Time.Time;
    };
    public func compare(a : OpeningBalanceTest, b : OpeningBalanceTest) : Order.Order {
      Nat.compare(a.id, b.id)
    };
  };
  let openingBalanceTests = Map.empty<OpeningBalanceTestId, OpeningBalanceTest.OpeningBalanceTest>();
  var nextOpeningBalanceTestId = 1;

  type AuthenticationInput = { email : Text; password : Text };

  public type Section = Section.Section;
  public type Engagement = Engagement.Engagement;
  public type Workpaper = Workpaper.Workpaper;
  public type Issue = Issue.Issue;
  public type Document = Document.Document;
  public type OpeningBalanceTest = OpeningBalanceTest.OpeningBalanceTest;
  public type UserProfile = { email : Text; name : Text };

  let userProfiles = Map.empty<Principal, UserProfile>();

  func verifyEngagementOwnership(caller : Principal, engagementId : EngagementId) : Bool {
    switch (engagements.get(engagementId)) {
      case (?e) { e.owner == caller or AccessControl.isAdmin(accessControlState, caller) };
      case (null) { false };
    }
  };

  func getEngagementOwnerBySection(sectionId : SectionId) : ?Principal {
    switch (sections.get(sectionId)) {
      case (?s) {
        switch (engagements.get(s.engagementId)) {
          case (?e) { ?e.owner };
          case (null) { null };
        }
      };
      case (null) { null };
    }
  };

  func getEngagementOwnerByWorkpaper(workpaperId : WorkpaperId) : ?Principal {
    switch (workpapers.get(workpaperId)) {
      case (?w) { getEngagementOwnerBySection(w.sectionId) };
      case (null) { null };
    }
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    userProfiles.get(caller)
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
    userProfiles.get(user)
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    userProfiles.add(caller, profile)
  };

  public query ({ caller }) func getEngagements() : async [Engagement] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    let userEngagements = engagements.values().toArray().filter(
      func(e : Engagement) : Bool { e.owner == caller or AccessControl.isAdmin(accessControlState, caller) }
    );
    userEngagements.sort()
  };

  public query ({ caller }) func getEngagementDetails(engagementId : EngagementId) : async Engagement {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (engagements.get(engagementId)) {
      case (?e) {
        if (e.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
        e
      };
      case (null) { Runtime.trap("Engagement not found") };
    }
  };

  public shared ({ caller }) func saveEngagement(engagement : Engagement, inputSections : [Section], _workpapers : [Workpaper], _issues : [Issue]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    let finalEngagement : Engagement = {
      id = nextEngagementId; clientName = engagement.clientName;
      financialYear = engagement.financialYear; engagementType = engagement.engagementType;
      materialityAmount = engagement.materialityAmount;
      auditStartDate = engagement.auditStartDate; auditEndDate = engagement.auditEndDate;
      owner = caller; finalized = engagement.finalized;
      createdAt = Time.now(); updatedAt = Time.now();
    };
    engagements.add(nextEngagementId, finalEngagement);
    var currentSectionId = nextSectionId;
    for (section in inputSections.vals()) {
      let persistedSection : Section = {
        id = currentSectionId; engagementId = nextEngagementId;
        name = section.name; isCustom = section.isCustom; formula = section.formula;
        createdAt = Time.now(); updatedAt = Time.now();
      };
      sections.add(currentSectionId, persistedSection);
      currentSectionId += 1;
    };
    nextSectionId := currentSectionId;
    nextEngagementId += 1;
  };

  public shared ({ caller }) func updateEngagement(engagementId : EngagementId, engagement : Engagement) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (engagements.get(engagementId)) {
      case (?e) {
        if (e.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
        engagements.add(engagementId, {
          id = engagementId; clientName = engagement.clientName;
          financialYear = engagement.financialYear; engagementType = engagement.engagementType;
          materialityAmount = engagement.materialityAmount;
          auditStartDate = engagement.auditStartDate; auditEndDate = engagement.auditEndDate;
          owner = e.owner; finalized = engagement.finalized;
          createdAt = e.createdAt; updatedAt = Time.now();
        });
      };
      case (null) { Runtime.trap("Engagement not found") };
    }
  };

  public shared ({ caller }) func deleteEngagement(engagementId : EngagementId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (engagements.get(engagementId)) {
      case (?e) {
        if (e.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
        engagements.remove(engagementId);
      };
      case (null) { Runtime.trap("Engagement not found") };
    }
  };

  public query ({ caller }) func getSections(engagementId : EngagementId) : async [Section] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    if (not verifyEngagementOwnership(caller, engagementId)) Runtime.trap("Unauthorized");
    let engagementSections = sections.values().toArray().filter(
      func(s : Section) : Bool { s.engagementId == engagementId }
    );
    engagementSections.sort()
  };

  public shared ({ caller }) func createSection(section : Section) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    if (not verifyEngagementOwnership(caller, section.engagementId)) Runtime.trap("Unauthorized");
    sections.add(nextSectionId, {
      id = nextSectionId; name = section.name; engagementId = section.engagementId;
      isCustom = section.isCustom; formula = section.formula;
      createdAt = Time.now(); updatedAt = Time.now();
    });
    nextSectionId += 1;
  };

  public shared ({ caller }) func updateSection(sectionId : SectionId, updatedFields : { formula : Text }) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (sections.get(sectionId)) {
      case (?s) {
        if (not verifyEngagementOwnership(caller, s.engagementId)) Runtime.trap("Unauthorized");
        sections.add(sectionId, {
          id = sectionId; name = s.name; engagementId = s.engagementId;
          isCustom = s.isCustom; formula = updatedFields.formula;
          createdAt = s.createdAt; updatedAt = Time.now();
        });
      };
      case (null) { Runtime.trap("Section not found") };
    }
  };

  public shared ({ caller }) func deleteSection(sectionId : SectionId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (sections.get(sectionId)) {
      case (?s) {
        if (not verifyEngagementOwnership(caller, s.engagementId)) Runtime.trap("Unauthorized");
        sections.remove(sectionId);
      };
      case (null) { Runtime.trap("Section not found") };
    }
  };

  public query ({ caller }) func getWorkpapers(sectionId : SectionId) : async [Workpaper] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (getEngagementOwnerBySection(sectionId)) {
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
      };
      case (null) { Runtime.trap("Section not found") };
    };
    let sectionWorkpapers = workpapers.values().toArray().filter(
      func(w : Workpaper) : Bool { w.sectionId == sectionId }
    );
    sectionWorkpapers.sort()
  };

  public shared ({ caller }) func saveWorkpaper(workpaper : Workpaper) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (getEngagementOwnerBySection(workpaper.sectionId)) {
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
      };
      case (null) { Runtime.trap("Section not found") };
    };
    workpapers.add(nextWorkpaperId, {
      id = nextWorkpaperId; sectionId = workpaper.sectionId;
      auditObjective = workpaper.auditObjective; proceduresPerformed = workpaper.proceduresPerformed;
      sampleDetails = workpaper.sampleDetails; evidenceDescription = workpaper.evidenceDescription;
      riskRating = workpaper.riskRating; findings = workpaper.findings; conclusion = workpaper.conclusion;
      documentIds = workpaper.documentIds;
      generalLedgerTotal = workpaper.generalLedgerTotal; trialBalanceTotal = workpaper.trialBalanceTotal;
      createdAt = Time.now(); updatedAt = Time.now();
    });
    nextWorkpaperId += 1;
  };

  public shared ({ caller }) func updateWorkpaper(workpaperId : WorkpaperId, workpaper : Workpaper) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (workpapers.get(workpaperId)) {
      case (?existing) {
        switch (getEngagementOwnerByWorkpaper(workpaperId)) {
          case (?owner) {
            if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
          };
          case (null) { Runtime.trap("Workpaper engagement not found") };
        };
        workpapers.add(workpaperId, {
          id = workpaperId; sectionId = existing.sectionId;
          auditObjective = workpaper.auditObjective; proceduresPerformed = workpaper.proceduresPerformed;
          sampleDetails = workpaper.sampleDetails; evidenceDescription = workpaper.evidenceDescription;
          riskRating = workpaper.riskRating; findings = workpaper.findings; conclusion = workpaper.conclusion;
          documentIds = workpaper.documentIds;
          generalLedgerTotal = workpaper.generalLedgerTotal; trialBalanceTotal = workpaper.trialBalanceTotal;
          createdAt = existing.createdAt; updatedAt = Time.now();
        });
      };
      case (null) { Runtime.trap("Workpaper not found") };
    }
  };

  public query ({ caller }) func getIssues(engagementId : ?EngagementId) : async [Issue] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    let filteredIssues = switch (engagementId) {
      case (?id) {
        if (not verifyEngagementOwnership(caller, id)) Runtime.trap("Unauthorized");
        issues.values().toArray().filter(func(i : Issue) : Bool { i.engagementId == id });
      };
      case (null) {
        issues.values().toArray().filter(func(i : Issue) : Bool { verifyEngagementOwnership(caller, i.engagementId) });
      };
    };
    filteredIssues.sort()
  };

  public shared ({ caller }) func saveIssue(issue : Issue) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    if (not verifyEngagementOwnership(caller, issue.engagementId)) Runtime.trap("Unauthorized");
    issues.add(nextIssueId, {
      id = nextIssueId; engagementId = issue.engagementId; description = issue.description;
      monetaryImpact = issue.monetaryImpact; riskLevel = issue.riskLevel;
      managementResponse = issue.managementResponse; status = issue.status;
      recommendations = issue.recommendations; owner = caller;
      createdAt = Time.now(); updatedAt = Time.now();
    });
    nextIssueId += 1;
  };

  public shared ({ caller }) func updateIssue(issueId : IssueId, issue : Issue) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (issues.get(issueId)) {
      case (?existing) {
        if (not verifyEngagementOwnership(caller, existing.engagementId)) Runtime.trap("Unauthorized");
        issues.add(issueId, {
          id = issueId; engagementId = existing.engagementId; description = issue.description;
          monetaryImpact = issue.monetaryImpact; riskLevel = issue.riskLevel;
          managementResponse = issue.managementResponse; status = issue.status;
          recommendations = issue.recommendations; owner = existing.owner;
          createdAt = existing.createdAt; updatedAt = Time.now();
        });
      };
      case (null) { Runtime.trap("Issue not found") };
    }
  };

  public shared ({ caller }) func deleteIssue(issueId : IssueId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (issues.get(issueId)) {
      case (?i) {
        if (not verifyEngagementOwnership(caller, i.engagementId)) Runtime.trap("Unauthorized");
        issues.remove(issueId);
      };
      case (null) { Runtime.trap("Issue not found") };
    }
  };

  public shared ({ caller }) func saveDocument(document : Document) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    if (not verifyEngagementOwnership(caller, document.engagementId)) Runtime.trap("Unauthorized");
    documents.add(document.id, document);
  };

  public query ({ caller }) func getDocument(documentId : Text) : async Document {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (documents.get(documentId)) {
      case (?d) {
        if (not verifyEngagementOwnership(caller, d.engagementId)) Runtime.trap("Unauthorized");
        d
      };
      case (null) { Runtime.trap("Document not found") };
    }
  };

  public query ({ caller }) func getOpeningBalanceTests(engagementId : EngagementId) : async [OpeningBalanceTest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    if (not verifyEngagementOwnership(caller, engagementId)) Runtime.trap("Unauthorized");
    let engagementTests = openingBalanceTests.values().toArray().filter(
      func(t : OpeningBalanceTest) : Bool { t.engagementId == engagementId }
    );
    engagementTests.sort()
  };

  public shared ({ caller }) func saveOpeningBalanceTest(test : OpeningBalanceTest) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    if (not verifyEngagementOwnership(caller, test.engagementId)) Runtime.trap("Unauthorized");
    openingBalanceTests.add(nextOpeningBalanceTestId, {
      id = nextOpeningBalanceTestId; engagementId = test.engagementId;
      accountName = test.accountName; priorYearClosingBalance = test.priorYearClosingBalance;
      currentYearOpeningBalance = test.currentYearOpeningBalance; notes = test.notes;
      owner = caller; createdAt = Time.now(); updatedAt = Time.now();
    });
    nextOpeningBalanceTestId += 1;
  };

  public shared ({ caller }) func updateOpeningBalanceTest(testId : OpeningBalanceTestId, test : OpeningBalanceTest) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (openingBalanceTests.get(testId)) {
      case (?existing) {
        if (not verifyEngagementOwnership(caller, existing.engagementId)) Runtime.trap("Unauthorized");
        openingBalanceTests.add(testId, {
          id = testId; engagementId = existing.engagementId;
          accountName = test.accountName; priorYearClosingBalance = test.priorYearClosingBalance;
          currentYearOpeningBalance = test.currentYearOpeningBalance; notes = test.notes;
          owner = existing.owner; createdAt = existing.createdAt; updatedAt = Time.now();
        });
      };
      case (null) { Runtime.trap("Opening balance test not found") };
    }
  };

  public shared ({ caller }) func deleteOpeningBalanceTest(testId : OpeningBalanceTestId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (openingBalanceTests.get(testId)) {
      case (?t) {
        if (not verifyEngagementOwnership(caller, t.engagementId)) Runtime.trap("Unauthorized");
        openingBalanceTests.remove(testId);
      };
      case (null) { Runtime.trap("Opening balance test not found") };
    }
  };

  public query ({ caller }) func getDashboardData() : async {
    totalEngagements : Nat; openIssues : Nat; highRiskIssues : Nat;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    let userEngagements = engagements.values().toArray().filter(
      func(e : Engagement) : Bool { e.owner == caller or AccessControl.isAdmin(accessControlState, caller) }
    );
    let userIssues = issues.values().toArray().filter(
      func(i : Issue) : Bool { verifyEngagementOwnership(caller, i.engagementId) }
    );
    let openCount = userIssues.filter(func(i : Issue) : Bool { switch (i.status) { case (#open) true; case (#closed) false } }).size();
    let highCount = userIssues.filter(func(i : Issue) : Bool { switch (i.riskLevel) { case (#high) true; case (_) false } }).size();
    { totalEngagements = userEngagements.size(); openIssues = openCount; highRiskIssues = highCount }
  };

  public query ({ caller }) func generateReport(engagementId : EngagementId) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) Runtime.trap("Unauthorized");
    switch (engagements.get(engagementId)) {
      case (?e) {
        if (e.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
        "Audit Report for " # e.clientName
      };
      case (null) { Runtime.trap("Engagement not found") };
    }
  };

  public shared ({ caller }) func registerUser(authData : AuthenticationInput) : async () {
    switch (AccessControl.getUserRole(accessControlState, caller)) {
      case (#user) { Runtime.trap("Already registered as user") };
      case (#admin) { Runtime.trap("Already registered as admin") };
      case (#guest) {
        if (authData.email == "" or authData.password == "") Runtime.trap("Invalid credentials");
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };
    }
  };
};
