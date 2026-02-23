

# Fix: Portal Email "Failed to Send"

## Root Cause

The `send-portal-email` edge function passes the `to` value directly to Resend without cleaning it. If the email contains spaces, commas, or other formatting issues, Resend rejects it with a validation error. The edge function logs confirm this:

> "Invalid `to` field. The email address needs to follow the `email@example.com` format."

## Fix

**File: `supabase/functions/send-portal-email/index.ts`**

Apply the same email parsing pattern already used in `send-estimate`:
- Split the `to` string by commas/semicolons
- Trim whitespace from each address
- Filter out empty strings
- Pass the cleaned array to Resend

This is a one-line change in the email sending section, replacing `to: [to]` with the parsed array.

