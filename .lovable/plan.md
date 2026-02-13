
## Fix Customer Portal Branding and SMS Errors

### Problem 1: Invoice Page Shows CT1 Branding Instead of Contractor's

When a customer clicks "Pay Now" in the portal, they land on `/invoice/:token` which currently:
- Hardcodes CT1 brand colors (red `#D50A22` and navy `#1e3a5f`) instead of using the contractor's brand colors
- Falls back to the CT1 logo instead of the contractor's logo
- Says "Secure payment powered by Clover" (should not mention any third party)
- Says "This invoice was sent via CT1 Business Suite" in the footer
- The backend function (`get-public-invoice`) queries the wrong column names from the profiles table (`business_name` instead of `company_name`, `company_logo_url` instead of `logo_url`, `business_phone` instead of `phone`), so contractor data never loads correctly

**Root cause**: Column name mismatch in the edge function AND hardcoded CT1 branding in the frontend.

### Problem 2: SMS Fails When Sending Portal Link

The "Send via SMS" button calls the `send-meeting-sms` edge function with `{ to, message }` but that function expects meeting-specific parameters (`meetingId`, `recipientPhone`, `recipientName`, `meetingTitle`, `meetingDate`, `meetingTime`). The params don't match, so the SMS always fails.

---

### Fix Plan

#### 1. Fix `get-public-invoice` Edge Function
**File**: `supabase/functions/get-public-invoice/index.ts`

Update the profile query to use correct column names:
- `business_name` -> `company_name`
- `company_logo_url` -> `logo_url`
- `business_phone` -> `phone`
- Also fetch `brand_primary_color`, `brand_secondary_color`, `brand_accent_color`, `business_address`, `city`, `state`, `zip_code`, `website_url`, `license_number`, `contact_name`, `business_email`

Map the response to include all branding fields so the frontend can use them.

#### 2. Fix `PublicInvoice.tsx` Branding
**File**: `src/pages/PublicInvoice.tsx`

- Remove the `ct1Logo` import entirely
- Use contractor's `brand_primary_color`, `brand_secondary_color`, `brand_accent_color` from the API response (with neutral fallbacks like slate/navy if not set)
- Use contractor's `logo_url` (with a generic Building2 icon fallback, no CT1 logo)
- Show contractor's company name, not "Invoice"
- Remove "Secure payment powered by Clover" text
- Replace "sent via CT1 Business Suite" footer with contractor's contact info (phone, email, address)
- Use contractor brand colors for gradient backgrounds and buttons

#### 3. Fix Portal SMS Sending
**File**: `src/components/contractor/crm/GeneratePortalLinkDialog.tsx`

The `send-meeting-sms` function is designed specifically for meeting confirmations. Instead of trying to reuse it with wrong params, create a dedicated lightweight edge function `send-portal-sms` that accepts `{ to, message }` and sends a simple SMS using the contractor's provisioned Twilio number.

**New file**: `supabase/functions/send-portal-sms/index.ts`
- Accepts `{ to, message }` in the request body
- Authenticates the caller
- Looks up the contractor's Twilio number from `phone_numbers` table
- Sends the SMS via Twilio API
- Returns success/error

Update `GeneratePortalLinkDialog.tsx` to call `send-portal-sms` instead of `send-meeting-sms`.

---

### Technical Details

**Files to create:**
- `supabase/functions/send-portal-sms/index.ts`

**Files to modify:**
- `supabase/functions/get-public-invoice/index.ts` -- Fix column names in profile query, add brand color fields
- `src/pages/PublicInvoice.tsx` -- Remove CT1 branding, use contractor's colors/logo/info dynamically
- `src/components/contractor/crm/GeneratePortalLinkDialog.tsx` -- Switch from `send-meeting-sms` to `send-portal-sms`
