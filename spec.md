# AuditFlow - Profile Settings

## Current State
The app has a `ProfileSetupModal` shown on first login to collect name and email. The header has a logout button, theme picker, and share button. There is no way to view or edit profile after initial setup. Backend supports `getCallerUserProfile` and `saveCallerUserProfile`.

## Requested Changes (Diff)

### Add
- `ProfileSettingsModal` component: a dialog to view and edit profile name and email with save/cancel actions.
- A "Profile" entry in the header user area (accessible via a user avatar/initials button or dropdown) that opens the profile settings modal.

### Modify
- `AppLayout.tsx`: add a user avatar/initials button in the header that opens the profile settings modal. Can be integrated into the existing header controls area.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `ProfileSettingsModal.tsx` component with name and email fields, pre-populated from `useGetCallerUserProfile`, and save via `useSaveCallerUserProfile`.
2. Update `AppLayout.tsx` to add a user avatar button (shows initials from profile) that triggers the profile settings modal. Add it to the header next to the existing controls.
3. Add profile settings link in mobile menu as well.
