# Audit Manager

## Current State
A full-stack audit management app with:
- Internet Identity login
- Engagement management (create, edit, delete)
- Sections/Account Heads per engagement (custom, no pre-seeded defaults)
- Workpapers per section with GL/TB reconciliation
- Issues log with tracking fields stored in localStorage
- Opening Balance Tests
- Materiality & Client Profile (localStorage)
- AI Summary generator
- Report export (HTML, CSV, RTF)
- Theme switcher (4 themes)
- Rich text editor for notes

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Fix backend `.sort()` calls: all 5 array `.sort()` calls lack comparator functions, causing runtime traps when creating or loading engagements. Each must use the module-level `compare` function.

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend with all 5 `.sort()` calls fixed to use proper comparators:
   - `userEngagements.sort(Engagement.compare)`
   - `engagementSections.sort(Section.compare)`
   - `sectionWorkpapers.sort(Workpaper.compare)`
   - `filteredIssues.sort(Issue.compare)`
   - `engagementTests.sort(OpeningBalanceTest.compare)`
2. Keep all other backend logic identical.
3. No frontend changes needed.
