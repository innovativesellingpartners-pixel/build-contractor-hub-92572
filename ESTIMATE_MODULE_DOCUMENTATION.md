# CT1 Enhanced Estimate Module - Documentation

## Overview
The CT1 Estimate Module has been completely rebuilt to support professional, detailed estimate and proposal documents with comprehensive sections for scope of work, line-item pricing, terms, and digital signatures.

## Database Changes

### New Fields Added to `estimates` Table:

#### Header Fields
- `date_issued` - Timestamp when estimate was created
- `prepared_by` - Name of person who prepared the estimate
- `project_name` - Name of the project
- `project_address` - Project location address
- `referred_by` - Referral source
- `client_phone` - Client phone number

#### Scope of Work Fields
- `scope_objective` - Overall objective of the project (text)
- `scope_key_deliverables` - Array of key deliverables (jsonb)
- `scope_exclusions` - Array of exclusions (jsonb)
- `scope_timeline` - Project timeline description

#### Financial Summary Fields
- `subtotal` - Sum of all line items
- `tax_rate` - Tax percentage
- `tax_amount` - Calculated tax amount
- `permit_fee` - Permit/surcharge fees
- `grand_total` - Final total amount
- `required_deposit` - Deposit amount (default 30%)
- `balance_due` - Remaining balance

#### Terms and Conditions Fields
- `terms_validity` - Estimate validity period
- `terms_payment_schedule` - Payment schedule details
- `terms_change_orders` - Change order policy
- `terms_insurance` - Insurance information
- `terms_warranty_years` - Warranty period (default 2 years)

#### Signature Fields
- `client_printed_name` - Client's printed name
- `client_acceptance_date` - Date client accepted
- `contractor_printed_name` - Contractor's printed name
- `contractor_acceptance_date` - Date contractor signed

#### Enhanced Line Items Structure
Line items (stored as jsonb) now support:
```json
{
  "itemNumber": "1.1",
  "description": "Item description",
  "quantity": 10,
  "unit": "SF",
  "unitPrice": 25.00,
  "totalPrice": 250.00,
  "included": true
}
```

## New Components Created

### 1. `EnhancedEstimateForm` (`src/components/contractor/crm/EnhancedEstimateForm.tsx`)
**Purpose**: Comprehensive multi-tab form for creating/editing estimates

**Features**:
- 5 organized tabs: Header, Scope, Line Items, Financial, Terms
- Dynamic line item management (add, edit, remove, duplicate)
- Key deliverables and exclusions lists
- Real-time financial calculations
- Auto-save to draft or send immediately
- Form validation with Zod schema

**Usage**:
```tsx
<EnhancedEstimateForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialData={existingEstimate}
/>
```

### 2. `PublicEstimate` Page (`src/pages/PublicEstimate.tsx`)
**Purpose**: Customer-facing public estimate view (no login required)

**Route**: `/p/estimate/:token`

**Sections Displayed**:
1. Document & Customer Information (two-column layout)
2. Scope of Work (objectives, deliverables, exclusions, timeline)
3. Detailed Line-Item Pricing (table with financial summary)
4. Terms, Conditions, and Legal Acceptance
5. Client Authorization (signature fields)

**Features**:
- Clean, professional layout
- Automatic view tracking
- Stripe payment link integration
- Mobile responsive
- Print-friendly design

## Updated Components

### `useEstimates` Hook (`src/hooks/useEstimates.ts`)
**Changes**:
- Extended `Estimate` interface with all new fields
- Extended `EstimateLineItem` interface for enhanced line item support
- Updated create/update mutations to handle new fields
- Backward compatible with existing estimates

## Routes

### Public Routes (No Authentication Required)
- `/p/estimate/:token` - Customer-facing estimate view
- `/estimate/:token` - Legacy public estimate route (maintained for compatibility)

### Authenticated Routes
- Estimate form is accessed within the CRM dashboard's Estimates section

## Database Indexes

### New Indexes Added:
- `idx_estimates_public_token` - Speeds up public token lookups

## RLS Policies

### New Policy:
- "Anyone can view estimates by public token" - Allows public access to estimates via their unique token

## API Endpoints Required (Future Implementation)

The following edge functions should be created to complete the module:

### 1. `generate-estimate-pdf`
**Purpose**: Generate professional PDF from estimate data
**Input**: Estimate ID
**Output**: PDF URL
**Sections to Include**:
- All 5 sections matching the public view layout
- Contractor branding/logo
- Digital signatures
- Payment instructions

### 2. `send-estimate-email`
**Purpose**: Email estimate to client
**Input**: Estimate ID, contractor info
**Email Should Include**:
- PDF attachment
- "View & Accept Estimate" button (links to `/p/estimate/:token`)
- "Pay Deposit" button (links to Stripe payment)
- Professional email template

### 3. `create-estimate-payment-link`
**Purpose**: Generate Stripe payment link for estimate deposit
**Input**: Estimate ID
**Output**: Stripe payment link URL
**Actions**:
- Create Stripe checkout session
- Set amount to `required_deposit`
- Include estimate metadata
- Store `stripe_payment_link` in estimates table

## Testing Instructions

### 1. Create a New Estimate
1. Navigate to CRM Dashboard
2. Go to "Estimates" section
3. Click "New Estimate"
4. Fill out the form across all tabs:
   - **Header Tab**: Project name, client info, prepared by
   - **Scope Tab**: Add objectives, deliverables, exclusions, timeline
   - **Line Items Tab**: Add multiple line items with descriptions, quantities, units, prices
   - **Financial Tab**: Set tax rate and permit fees, review calculations
   - **Terms Tab**: Review/customize terms and conditions
5. Click "Save Draft" or "Save & Send"

### 2. View Draft Estimate
1. Return to Estimates list
2. Click on a draft estimate
3. Verify all data displays correctly
4. Edit and update fields

### 3. Test Public View
1. Get the public token from the estimate record
2. Navigate to `/p/estimate/{token}` in a new incognito window
3. Verify all 5 sections display:
   - Document & Customer Information
   - Scope of Work
   - Detailed Line-Item Pricing
   - Terms and Conditions
   - Client Authorization
4. Check mobile responsiveness
5. Verify view is tracked in `estimate_views` table

### 4. Test Calculations
1. Add multiple line items with different quantities and prices
2. Verify subtotal calculates correctly
3. Set tax rate (e.g., 8.5%) and verify tax amount
4. Add permit fee
5. Verify grand total = subtotal + tax + permit fee
6. Verify required deposit = 30% of grand total
7. Verify balance due = grand total - required deposit

### 5. Test Deliverables/Exclusions Lists
1. Add multiple deliverables using the input field
2. Verify each appears as a list item
3. Remove items and verify they disappear
4. Repeat for exclusions list

### 6. Test Data Persistence
1. Create an estimate and save as draft
2. Close the form
3. Reopen the estimate
4. Verify all fields, line items, lists are preserved

## Status Values

The `status` field now supports:
- `draft` - Being edited, not sent
- `pending` - Sent, awaiting response (use `sent` or `pending`)
- `sent` - Sent to client
- `accepted` - Client accepted
- `sold` - Converted to job
- `rejected` - Client rejected
- `lost` - Opportunity lost
- `cancelled` - Cancelled by contractor

## Financial Calculations

All financial calculations are automatic:

```
subtotal = sum of all line items (quantity × unitPrice)
taxAmount = subtotal × (taxRate / 100)
grandTotal = subtotal + taxAmount + permitFee
requiredDeposit = grandTotal × 0.30 (30%)
balanceDue = grandTotal - requiredDeposit
```

## Stripe Integration Points

### Payment Link Generation (To Be Implemented)
When an estimate is sent:
1. Create Stripe checkout session for `required_deposit` amount
2. Store payment link in `stripe_payment_link` field
3. Include link in email and on public estimate page

### Payment Webhook Handling (To Be Implemented)
On successful payment:
1. Update estimate status to `accepted`
2. Record `paid_at` timestamp
3. Update `payment_amount` and `payment_method`
4. Optionally create job from estimate

## Migration Notes

### Backward Compatibility
- All new fields are nullable/optional
- Existing estimates will continue to work
- Legacy fields (like `trade_type`, `project_description`) are preserved
- Line items support both old and new formats

### Data Migration Recommendations
For existing estimates, consider running a script to:
1. Set `date_issued` to `created_at` if null
2. Set `project_name` to `title` if null
3. Populate default terms if null
4. Calculate financial fields from `line_items` if null

## Security Considerations

### Public Access
- Public token must be UUID (secure, non-guessable)
- No authentication required for public estimate view
- Track all views in `estimate_views` table
- Consider adding expiration logic based on `valid_until` date

### Contractor Access
- All estimate modifications require authentication
- RLS policies enforce user_id matching
- Admin users have full access across all contractors

## Future Enhancements

### Phase 2 Features
1. Digital signature capture on public page
2. Client acceptance workflow
3. Email notifications on view/acceptance
4. Version history tracking
5. Template system for common estimates
6. Multi-currency support
7. Discount/markup fields
8. Attachment uploads (photos, drawings)
9. Comparison view for multiple estimates
10. Analytics dashboard (conversion rates, average values)

### Phase 3 Features
1. Interactive line item selection (client can customize)
2. Real-time collaboration
3. Estimate cloning and templates
4. Integration with accounting module
5. Automatic job creation on acceptance
6. E-signature integration (DocuSign, HelloSign)
7. Payment plan options
8. Multi-language support

## Files Modified

### Created:
- `src/components/contractor/crm/EnhancedEstimateForm.tsx`
- `src/pages/PublicEstimate.tsx`
- `ESTIMATE_MODULE_DOCUMENTATION.md`

### Modified:
- `src/hooks/useEstimates.ts` - Extended interfaces and CRUD operations
- `src/App.tsx` - Added public estimate route
- Database migration - Added 30+ new fields to estimates table

## Support and Troubleshooting

### Common Issues

**Issue**: Public estimate shows 404
- **Solution**: Verify `public_token` exists in database and matches URL

**Issue**: Calculations don't update
- **Solution**: Check that line items have `quantity` and `unitPrice` set

**Issue**: Form doesn't save
- **Solution**: Check browser console for validation errors, ensure required fields are filled

**Issue**: Old estimates missing new fields
- **Solution**: This is expected. New fields are optional and will be null for old estimates

### Debug Mode
To enable detailed logging, check browser console for:
- Form validation errors
- API request/response data
- Calculation breakdowns

## Summary

The enhanced estimate module provides:
✅ Professional 5-section estimate document structure
✅ Comprehensive line-item pricing with auto-calculations
✅ Scope of work with deliverables and exclusions
✅ Terms and conditions with digital signatures
✅ Customer-facing public view
✅ Mobile-responsive design
✅ Stripe payment integration ready
✅ PDF generation ready
✅ Email sending ready
✅ Full backward compatibility

The module is production-ready for basic estimate creation and viewing. Phase 2 features (PDF generation, email sending, Stripe checkout) require edge function implementation.
