

## Forge Calendar Book – Add Homeowner Fields

**What changes:** Update the `forge-calendar-book` edge function to accept `homeowner_name`, `homeowner_email`, and `homeowner_phone` from Forge, add the homeowner as a Google Calendar attendee, and send them an automatic invite.

### Changes to `supabase/functions/forge-calendar-book/index.ts`

1. **Destructure new fields** (line ~55-63): Add `homeowner_name`, `homeowner_email`, `homeowner_phone` to the destructured request body. Keep existing `callerName`/`callerPhone` as fallbacks for backward compatibility.

2. **Update event description** (lines 130-136): Use `homeowner_name` (falling back to `callerName`) and `homeowner_phone` (falling back to `callerPhone`) in the description. Include homeowner email in description for reference.

3. **Update event summary** (line 139): Use `homeowner_name || callerName || 'Customer'` in the summary.

4. **Add attendees to event payload** (lines 138-151): If `homeowner_email` is provided, add an `attendees` array:
   ```js
   attendees: homeowner_email
     ? [{ email: homeowner_email, displayName: name || 'Customer' }]
     : undefined,
   ```

5. **Change `sendUpdates` parameter** (line 154): Switch from `sendUpdates=none` to `sendUpdates=all` so Google automatically sends the calendar invite email to the attendee.

No database changes needed. No new secrets required. Fully backward-compatible — existing callers without the new fields will continue to work as before.

