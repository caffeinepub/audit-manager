# Audit Manager

## Current State
Each Account Head (section) has a WorkpaperPage with fields for GL/TB reconciliation, audit assertions, notes, and findings. There is no concept of individual tasks per section.

## Requested Changes (Diff)

### Add
- A "Audit Tasks" sub-section table inside each Account Head (WorkpaperPage), positioned below the existing panels.
- Each task row has: Task Description (text), Status (editable select: Not Started / In Progress / Completed / N/A), and a delete button.
- An "Add Task" button to append a new row.
- Tasks are stored in localStorage keyed by sectionId, so they persist between sessions without a backend change.
- Visual status badges with distinct colours for each status value.

### Modify
- WorkpaperPage.tsx: add AuditTasksTable component at the bottom of the page.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `SectionTasksTable` component in `src/frontend/src/components/SectionTasksTable.tsx`.
   - Local state: array of tasks `{ id, description, status }` initialised from localStorage.
   - On change/add/delete, update localStorage under key `section-tasks-<sectionId>`.
   - Status options: Not Started | In Progress | Completed | N/A.
   - Status badge colours match the app theme.
2. Import and render `SectionTasksTable` at the bottom of `WorkpaperPage.tsx`, passing the `sectionId`.
3. Validate, lint, build.
