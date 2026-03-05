

## Plan: Replace inline Connections Hub with a clickable card that opens a dedicated Connections page

### What changes

**1. Add `'connections'` as a new `ActiveSection` in `src/components/Dashboard.tsx`**
- Update the `ActiveSection` type to include `'connections'`
- Add a new section render block (`activeSection === 'connections'`) that renders the full `<ConnectionsHub>` component

**2. Replace the inline `<ConnectionsHub>` in the account section with a simple card/button**
- Remove the full `<ConnectionsHub>` component from the account page (line 565)
- Replace it with a styled card matching the account page's design (similar to the "Upgrade Plan" card) that shows:
  - A Link2 icon + "Connections" title
  - Brief description ("Manage your banking, calendar, email, and other integrations")
  - A "Manage Connections" button that calls `handleSectionChange('connections')`

**3. Add Connections to the sidebar navigation** (optional but recommended)
- Add a sidebar nav item for "Connections" so users can return to it easily

### Files to modify
- `src/components/Dashboard.tsx` — all changes are in this single file

