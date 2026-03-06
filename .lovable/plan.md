

## Fix: Remove CT1 Logo from Customer-Facing Estimates and Invoices

### Problem
When estimates are sent to customers, the public estimate page falls back to the CT1 logo when a contractor hasn't uploaded their own logo. Customers should only see their contractor's branding, not CT1 branding in the header.

### What Changes

**File: `src/pages/PublicEstimate.tsx`**

1. **Remove the CT1 logo import** (line 13) -- the `ct1PoweredLogo` import is used in two places: the header fallback and the "Powered by CT1" footer. The footer usage is intentional branding, so the import stays but the header fallback changes.

2. **Update the header logo fallback** (line 217) -- Instead of falling back to the CT1 logo when the contractor has no logo, use a `Building2` icon (same pattern as `PublicInvoice.tsx`):
   - Change: `const displayLogo = contractor?.logo_url || ct1PoweredLogo;`
   - To: `const displayLogo = contractor?.logo_url;`

3. **Update the header logo rendering** (around lines 231-240) -- Add a conditional: if `displayLogo` exists, show the contractor's logo image; otherwise show a generic `Building2` icon in a styled circle, matching the invoice page pattern.

### What Stays
- The **"Powered by CT1"** footer branding at the bottom of estimates remains unchanged (this is the platform branding standard).
- The **PublicInvoice.tsx** page already handles this correctly with the `Building2` fallback icon -- no changes needed there.
- The **estimate PDF preview/download** components already use only the contractor's `logo_url` with no CT1 fallback -- no changes needed.

### Technical Details
- Only 1 file modified: `src/pages/PublicEstimate.tsx`
- ~10 lines changed total
- Pattern mirrors the existing `PublicInvoice.tsx` implementation (lines 142-154)
